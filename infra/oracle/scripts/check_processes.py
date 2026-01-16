import paramiko

HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"

try:
    key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=HOST, username=USER, pkey=key)
    
    stdin, stdout, stderr = client.exec_command("ps aux | grep docker")
    print(stdout.read().decode())
    
    client.close()
except Exception as e:
    print(f"Erro: {e}")
