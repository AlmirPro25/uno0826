import paramiko

HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"
REMOTE_PATH = "/home/ubuntu/backend"

# Novo domínio foda com HTTPS via Cloudflare
DOMAIN = "api.prostqs.com.br"
REDIRECT_URI = f"https://{DOMAIN}/api/v1/federation/google/callback"
ALLOWED_ORIGINS = "https://prostqs.com.br,https://www.prostqs.com.br,http://localhost:3000"

def final_sync():
    try:
        print(f"🚀 Sincronizando backend com {DOMAIN}...")
        key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=HOST, username=USER, pkey=key)
        
        # Comandos de atualização
        commands = [
            f"sed -i 's|^GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI={REDIRECT_URI}|' {REMOTE_PATH}/.env",
            f"sed -i 's|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS={ALLOWED_ORIGINS}|' {REMOTE_PATH}/.env",
            # Garantir que o servidor saiba que está atrás de um proxy
            f"echo 'TRUSTED_PROXIES=0.0.0.0/0' >> {REMOTE_PATH}/.env"
        ]
        
        for cmd in commands:
            client.exec_command(cmd)
            
        print("🔄 Reiniciando backend...")
        client.exec_command("docker restart uno-api")
        
        print(f"\n✅ BACKEND PRONTO EM: https://{DOMAIN}")
        client.close()
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    final_sync()
