import paramiko
import os
import secrets

# Config
HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"
LOCAL_BINARY = r"d:\DEV\Desktop\UNO-main\UNO-main\backend\prost-qs-linux"
REMOTE_PATH = "/home/ubuntu/backend"

def deploy():
    try:
        print(f"🚀 Conectando a {HOST}...")
        key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=HOST, username=USER, pkey=key)
        
        sftp = client.open_sftp()
        try: sftp.mkdir(REMOTE_PATH)
        except: pass

        print("📤 Enviando binário e configs...")
        sftp.put(LOCAL_BINARY, f"{REMOTE_PATH}/prost-qs-linux")
        
        def gen_secret(): return secrets.token_urlsafe(32)
        
        env_content = f"""
JWT_SECRET={gen_secret()}
AES_SECRET_KEY={gen_secret()[:32]}
SECRETS_MASTER_KEY={gen_secret()[:32]}
SERVER_PORT=8080
GIN_MODE=release
DATABASE_URL=postgresql://neondb_owner:npg_7nZxI8FpSgYy@ep-morning-rain-ackv38c5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
ALLOWED_ORIGINS=https://prostqs.com.br,https://www.prostqs.com.br,http://localhost:3000
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://api.prostqs.com.br/api/v1/federation/google/callback
FRONTEND_URL=https://prostqs.com.br
"""
        with open("temp_env_prod", "w") as f: f.write(env_content.strip())
        sftp.put("temp_env_prod", f"{REMOTE_PATH}/.env")
        
        sftp.close()

        # 3. Rodar na VM mapeando porta 80 para 8080 do container
        cmds = [
            f"cd {REMOTE_PATH} && docker build -t uno-backend-lite .",
            "docker stop uno-api || true",
            "docker rm uno-api || true",
            f"docker run -d --name uno-api -p 80:8080 -v {REMOTE_PATH}/.env:/app/.env -v {REMOTE_PATH}/data:/app/data --restart always uno-backend-lite"
        ]
        
        for cmd in cmds:
            print(f"⚙️ Executando: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.channel.recv_exit_status()
            
        print(f"\n🎉 DEPLOY DE PRODUÇÃO CONCLUÍDO!")
        print(f"🔗 API: https://api.prostqs.com.br")
        client.close()
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__": deploy()
