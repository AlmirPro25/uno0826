import paramiko

HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"

def run_cmd(client, cmd):
    print(f"Executando: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    if exit_status == 0:
        print("✅ Sucesso")
    else:
        print(f"❌ Erro: {stderr.read().decode()}")

try:
    print(f"\n🔌 Conectando a {HOST}...")
    key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=HOST, username=USER, pkey=key)
    
    # Comandos para liberar portas no IPTables da Oracle
    cmds = [
        # Liberar 80, 443, 8080
        "sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT",
        "sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT",
        "sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT",
        # Salvar (tenta netfilter-persistent se existir, senão avisa)
        "sudo netfilter-persistent save || echo 'netfilter-persistent não instalado, regras resetarão ao reiniciar'"
    ]
    
    for cmd in cmds:
        run_cmd(client, cmd)
        
    client.close()
    print("\n🔥 Firewall liberado!")

except Exception as e:
    print(f"Erro: {e}")
