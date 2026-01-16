import paramiko

HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"

cmds = [
    "sudo fallocate -l 2G /swapfile",
    "sudo chmod 600 /swapfile",
    "sudo mkswap /swapfile",
    "sudo swapon /swapfile",
    "echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab"
]

def run():
    print("🚀 Ativando 2GB de Swap...")
    try:
        key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=HOST, username=USER, pkey=key)
        
        for cmd in cmds:
            print(f"Exec: {cmd}")
            client.exec_command(cmd) # Executa fire-and-forget ou espera
            # Vamos esperar pra garantir
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.channel.recv_exit_status()
            
        print("✅ Swap ativado!")
        client.close()
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    run()
