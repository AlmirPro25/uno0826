import paramiko
import time

# Configurações de Conexão
HOST = "64.181.175.25"
USER = "ubuntu"
KEY_FILE = r"C:\Users\almir\.ssh\oracle_vm_key"

def run_ssh_command(command, description):
    print(f"\n🚀 {description}...")
    try:
        # Configurar chave SSH
        key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=HOST, username=USER, pkey=key)
        
        # Executar comando
        stdin, stdout, stderr = client.exec_command(command)
        
        # Mostrar saída em tempo real se possível, ou esperar finalizar
        exit_status = stdout.channel.recv_exit_status()
        
        output = stdout.read().decode().strip()
        error = stderr.read().decode().strip()
        
        if exit_status == 0:
            print(f"✅ Sucesso!")
            if output:
                print(f"   {output[:200]}..." if len(output) > 200 else f"   {output}")
        else:
            print(f"❌ Erro (Exit {exit_status}):")
            print(error)
        
        client.close()
        return exit_status
        
    except Exception as e:
        print(f"❌ Falha na conexão: {e}")
        return 1

# Comandos de Instalação do Docker
commands = [
    ("sudo apt-get update", "Atualizando pacotes"),
    ("sudo apt-get install -y ca-certificates curl gnupg", "Instalando dependências"),
    ("sudo install -m 0755 -d /etc/apt/keyrings", "Criando keyring"),
    ("curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes", "Baixando chave GPG do Docker"),
    ("sudo chmod a+r /etc/apt/keyrings/docker.gpg", "Ajustando permissões"),
    ("echo \
    \"deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    \"$(. /etc/os-release && echo \"$VERSION_CODENAME\")\" stable\" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null", "Adicionando repositório do Docker"),
    ("sudo apt-get update", "Atualizando repositório"),
    ("sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin", "Instalando Docker Engine"),
    ("sudo usermod -aG docker ubuntu", "Adicionando usuário ao grupo Docker"),
    ("docker --version", "Verificando versão do Docker")
]

# Executar
print(f"🔌 Conectando a {HOST}...")
for cmd, desc in commands:
    if run_ssh_command(cmd, desc) != 0:
        print("⚠️ Parando setup devido a erro.")
        break

print("\n🎉 Setup Finalizado! (Talvez precise reconectar para o grupo docker funcionar)")
