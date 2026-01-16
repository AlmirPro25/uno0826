import paramiko
import os

HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"
REMOTE_PATH = "/home/ubuntu/backend"

# Novas credenciais (substitua pelos valores reais)
CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"
CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET"
REDIRECT_URI = f"http://{HOST}:8080/api/v1/federation/google/callback"
FRONTEND_URL = "https://prostqs.com.br"

def update_oauth():
    try:
        print(f"🚀 Enviando novas credenciais do Google para a VM...")
        key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=HOST, username=USER, pkey=key)
        
        # Comandos para atualizar o .env via sed (ninja mode)
        # Se não existir a linha, ele adiciona no final.
        commands = [
            f"sed -i 's|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID={CLIENT_ID}|' {REMOTE_PATH}/.env || echo 'GOOGLE_CLIENT_ID={CLIENT_ID}' >> {REMOTE_PATH}/.env",
            f"sed -i 's|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET={CLIENT_SECRET}|' {REMOTE_PATH}/.env || echo 'GOOGLE_CLIENT_SECRET={CLIENT_SECRET}' >> {REMOTE_PATH}/.env",
            f"sed -i 's|^GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI={REDIRECT_URI}|' {REMOTE_PATH}/.env || echo 'GOOGLE_REDIRECT_URI={REDIRECT_URI}' >> {REMOTE_PATH}/.env",
            f"sed -i 's|^FRONTEND_URL=.*|FRONTEND_URL={FRONTEND_URL}|' {REMOTE_PATH}/.env || echo 'FRONTEND_URL={FRONTEND_URL}' >> {REMOTE_PATH}/.env"
        ]
        
        for cmd in commands:
            client.exec_command(cmd)
            
        # Reiniciar o serviço
        print("🔄 Reiniciando backend para aplicar o Google OAuth...")
        client.exec_command("docker restart uno-api")
        
        print("\n✅ GOOGLE OAUTH CONFIGURADO!")
        print(f"🔗 Redirect URI configurado: {REDIRECT_URI}")
        client.close()
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    update_oauth()
