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

        print("📤 Enviando binário Linux...")
        sftp.put(LOCAL_BINARY, f"{REMOTE_PATH}/prost-qs-linux")
        
        # Gerar .env com segredos e URLs corretas
        def gen_secret(): return secrets.token_urlsafe(32)[:32]
        
        env_content = f"""
JWT_SECRET={gen_secret()}
AES_SECRET_KEY={gen_secret()}
SECRETS_MASTER_KEY={gen_secret()}
SERVER_PORT=8080
GIN_MODE=release
SQLITE_DB_PATH=/app/data/prostqs.db
ALLOWED_ORIGINS=http://{HOST},http://localhost:3000
DEBUG_MODE=true
FRONTEND_URL=http://{HOST}
"""
        with open("temp_env", "w") as f: f.write(env_content)
        sftp.put("temp_env", f"{REMOTE_PATH}/.env")
        if os.path.exists("temp_env"): os.remove("temp_env")
        
        # Criar Dockerfile simples na VM
        dockerfile_content = """
FROM alpine:latest
RUN apk add --no-cache ca-certificates libc6-compat
WORKDIR /app
COPY prost-qs-linux .
COPY .env .
RUN chmod +x prost-qs-linux
RUN mkdir -p /app/data
EXPOSE 8080
ENTRYPOINT ["./prost-qs-linux"]
"""
        with open("temp_dockerfile", "w") as f: f.write(dockerfile_content)
        sftp.put("temp_dockerfile", f"{REMOTE_PATH}/Dockerfile")
        if os.path.exists("temp_dockerfile"): os.remove("temp_dockerfile")
        
        sftp.close()
        print("✅ Arquivos enviados!")

        # 3. Rodar na VM
        cmds = [
            f"cd {REMOTE_PATH} && docker build -t uno-backend-lite .",
            "docker stop uno-api || true",
            "docker rm uno-api || true",
            f"docker run -d --name uno-api -p 8080:8080 -v {REMOTE_PATH}/data:/app/data --restart always uno-backend-lite"
        ]
        
        for cmd in cmds:
            print(f"⚙️ Executando: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.channel.recv_exit_status()
            
        print(f"\n🎉 DEPLOY FINAL CONCLUÍDO!")
        print(f"🔗 API: http://{HOST}:8080")
        client.close()
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__": deploy()
