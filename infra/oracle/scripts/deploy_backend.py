import paramiko
import os
import zipfile
import time

# Config
HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"
LOCAL_BACKEND_PATH = r"d:\DEV\Desktop\UNO-main\UNO-main\backend"
REMOTE_PATH = "/home/ubuntu/backend"
ZIP_NAME = "backend.zip"

def create_zip(source_dir, output_filename):
    print(f"📦 Compactando código de {source_dir}...")
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Ignorar pastas de build e git
            if '.git' in dirs: dirs.remove('.git')
            if 'bin' in dirs: dirs.remove('bin')
            if 'coverage' in dirs: dirs.remove('coverage')
            
            for file in files:
                # Ignorar arquivos binários grandes locais
                if file.endswith('.exe'): continue
                
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, start=source_dir)
                zipf.write(file_path, arcname)
    print(f"✅ Zip criado: {output_filename} ({os.path.getsize(output_filename)/1024:.2f} KB)")

def deploy():
    # 1. Zipar
    create_zip(LOCAL_BACKEND_PATH, ZIP_NAME)
    
    # 2. Conectar e Enviar
    try:
        print(f"\n🚀 Conectando a {HOST}...")
        key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=HOST, username=USER, pkey=key)
        
        sftp = client.open_sftp()
        
        # Criar diretório remoto se não existir
        try:
            sftp.mkdir(REMOTE_PATH)
        except IOError:
            pass # Já existe

        print("📤 Enviando arquivo zip...")
        sftp.put(ZIP_NAME, f"/home/ubuntu/{ZIP_NAME}")
        
        # Gerar .env
        import secrets
        
        def gen_secret(n_bytes=32):
            return secrets.token_urlsafe(n_bytes)[:n_bytes] # Simple way
            
        def gen_hex(n_bytes=32):
             return secrets.token_hex(n_bytes)[:n_bytes] # For 32 bytes exactly if needed

        env_content = f"""
JWT_SECRET={gen_secret(32)}
AES_SECRET_KEY={gen_secret(32)}
SECRETS_MASTER_KEY={gen_secret(32)}
SERVER_PORT=8080
GIN_MODE=release
SQLITE_DB_PATH=/app/data/prostqs.db
ALLOWED_ORIGINS=*
DEBUG_MODE=true
"""
        with open("temp_env", "w") as f:
            f.write(env_content)
            
        print("📤 Enviando arquivo .env gerado...")
        sftp.put("temp_env", f"{REMOTE_PATH}/.env")
        sftp.close()
        print("✅ Upload concluído!")
        
        if os.path.exists("temp_env"): os.remove("temp_env")

        # 3. Descompactar e Buildar
        commands = [
            # Instalar unzip se não tiver
            "sudo apt-get install -y unzip",
            # Limpar antigo (exceto o .env que acabamos de subir, oops)
            # Vamos mover o .env criado para tmp e depois mover de volta
            f"mv {REMOTE_PATH}/.env /tmp/.env_bak || true",
            f"rm -rf {REMOTE_PATH}",
            f"mkdir -p {REMOTE_PATH}",
            # Descompactar
            f"unzip -o /home/ubuntu/{ZIP_NAME} -d {REMOTE_PATH}",
            # Restaurar .env
            f"mv /tmp/.env_bak {REMOTE_PATH}/.env",
            # Criar pasta de dados no host com permissão total para o docker
            f"mkdir -p {REMOTE_PATH}/data && chmod 777 {REMOTE_PATH}/data",
            # Build Imagem Docker
            f"cd {REMOTE_PATH} && docker build -t uno-backend .",
            # Rodar Container (ajustar portas se necessário, assumindo 8080)
            # Para o container antigo se existir
            "docker stop uno-api || true",
            "docker rm uno-api || true",
            # Rodar novo
            f"docker run -d --name uno-api -p 8080:8080 -v {REMOTE_PATH}/.env:/app/.env -v {REMOTE_PATH}/data:/app/data --restart always uno-backend"
        ]
        
        for cmd in commands:
            print(f"\n⚙️  Executando: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            exit_status = stdout.channel.recv_exit_status()
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            
            if exit_status != 0:
                print(f"❌ Erro: {err}")
            else:
                if out: print(f"   {out[:200]}...")
                
        print("\n🎉 DEPLOY CONCLUÍDO!")
        print(f"🔗 API deve estar rodando em: http://{HOST}:8080")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Falha no deploy: {e}")

if __name__ == "__main__":
    deploy()
