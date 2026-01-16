import paramiko

HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"

cmds = [
    "sudo pkill -f 'docker build'",
    "docker stop uno-api || true",
    "docker rm uno-api || true",
    "docker system prune -f" # Clean up failed build cache bits
]

try:
    key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=HOST, username=USER, pkey=key)
    
    for cmd in cmds:
        print(f"Exec: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        stdout.channel.recv_exit_status()
    
    print("✅ VM Limpa!")
    client.close()
except Exception as e:
    print(f"Erro: {e}")
