import paramiko

HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"
REMOTE_PATH = "/home/ubuntu/backend"

# Agora usando o truque do nip.io para o Google aceitar
NIP_DOMAIN = f"{HOST}.nip.io"
REDIRECT_URI = f"http://{NIP_DOMAIN}:8080/api/v1/federation/google/callback"

def update_to_nip():
    try:
        print(f"🚀 Atualizando Redirect URI para {REDIRECT_URI}...")
        key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=HOST, username=USER, pkey=key)
        
        # Atualizar o .env
        cmd = f"sed -i 's|^GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI={REDIRECT_URI}|' {REMOTE_PATH}/.env"
        client.exec_command(cmd)
        
        # Reiniciar
        client.exec_command("docker restart uno-api")
        
        print("\n✅ BACKEND ATUALIZADO COM NIP.IO!")
        client.close()
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    update_to_nip()
