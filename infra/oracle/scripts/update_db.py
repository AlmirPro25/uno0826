import paramiko
import os

HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"
REMOTE_PATH = "/home/ubuntu/backend"

def set_database_url(url):
    try:
        print(f"🚀 Atualizando DATABASE_URL na VM...")
        key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=HOST, username=USER, pkey=key)
        
        # Comando para substituir ou adicionar a DATABASE_URL no .env
        # Usando sed para ser ninja
        cmd = f"sed -i 's|^DATABASE_URL=.*|DATABASE_URL={url}|' {REMOTE_PATH}/.env || echo 'DATABASE_URL={url}' >> {REMOTE_PATH}/.env"
        
        client.exec_command(cmd)
        
        # Reiniciar container para aplicar
        print("🔄 Reiniciando backend para aplicar novo banco...")
        client.exec_command("docker restart uno-api")
        
        print("✅ Configuração aplicada!")
        client.close()
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    # Se você me der a URL agora, eu coloco aqui:
    db_url = "postgresql://user:pass@host:5432/db?sslmode=require" 
    print(f"Para trocar o banco, rode: py -3 update_db.py 'SUA_URL_AQUI'")
    
    import sys
    if len(sys.argv) > 1:
        set_database_url(sys.argv[1])
