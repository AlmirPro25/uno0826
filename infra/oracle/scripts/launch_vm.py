import oci
import os
import sys

# Config
config = oci.config.from_file(os.path.expanduser("~/.oci/config"))
compartment_id = config["tenancy"]
compute_client = oci.core.ComputeClient(config)

# IDs Fixos (AMD)
IMAGE_ID = "ocid1.image.oc1.sa-saopaulo-1.aaaaaaaa7o26pe5ralsbk47mb4oo2to2bnurab4mh2wzj2fcteyyvyveijxq"
AVAILABILITY_DOMAIN = "SyID:SA-SAOPAULO-1-AD-1"
SHAPE = "VM.Standard.E2.1.Micro"

# SSH Key Path
ssh_key_path = os.path.expanduser("~/.ssh/oracle_vm_key")
ssh_pub_path = ssh_key_path + ".pub"

# 1. Garantir chave SSH
if not os.path.exists(ssh_pub_path):
    print("🔑 Gerando chave SSH...")
    if not os.path.exists(os.path.dirname(ssh_key_path)):
        os.makedirs(os.path.dirname(ssh_key_path))
    
    # Gerar via os.system de um jeito que funcione no Windows
    # Se falhar o ssh-keygen, usamos Python cryptography se necessário, mas vamos tentar simplificado
    cmd = f'ssh-keygen -t rsa -b 4096 -f "{ssh_key_path}" -N ""'
    # No windows as vezes precisa de cuidado com aspas, mas vamos assumir que o usuario tem ssh-keygen
    # Se nao tiver, vamos gerar dummy com python? Melhor nao, ssh precisa de formato openssh
    
    # Alternativa pythonica para SSH Key
    from cryptography.hazmat.primitives import serialization as crypto_serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.backends import default_backend

    key = rsa.generate_private_key(
        backend=default_backend(),
        public_exponent=65537,
        key_size=4096
    )
    private_key = key.private_bytes(
        crypto_serialization.Encoding.PEM,
        crypto_serialization.PrivateFormat.TraditionalOpenSSL,
        crypto_serialization.NoEncryption()
    )
    public_key = key.public_key().public_bytes(
        crypto_serialization.Encoding.OpenSSH,
        crypto_serialization.PublicFormat.OpenSSH
    )
    
    with open(ssh_key_path, "wb") as f:
        f.write(private_key)
    with open(ssh_pub_path, "wb") as f:
        f.write(public_key)
    print("✅ Chave SSH gerada via Python!")

# Ler chave pública
with open(ssh_pub_path, "r") as f:
    ssh_public_key = f.read().strip()

# Ler Subnet ID
try:
    with open("subnet_id.txt", "r") as f:
        subnet_id = f.read().strip()
except:
    print("❌ Subnet ID não encontrado. Rode o create_infra.py primeiro.")
    sys.exit(1)

print(f"🚀 Lançando instância {SHAPE}...")
print(f"   Imagem: Ubuntu 22.04 AMD64")
print(f"   CPU: 1 OCPU | RAM: 1 GB")

launch_details = oci.core.models.LaunchInstanceDetails(
    display_name="uno-backend",
    compartment_id=compartment_id,
    availability_domain=AVAILABILITY_DOMAIN,
    shape=SHAPE,
    shape_config=None, # E2.1.Micro tem shape fixo, não usa config flex
    image_id=IMAGE_ID,
    subnet_id=subnet_id,
    metadata={
        "ssh_authorized_keys": ssh_public_key
    }
)

try:
    response = compute_client.launch_instance(launch_details)
    instance = response.data
    print(f"\n✅ SUCESSO! VM CRIADA!")
    print(f"   Nome: {instance.display_name}")
    print(f"   ID: {instance.id}")
    print(f"   Estado Inicial: {instance.lifecycle_state}")
    print(f"\n⏳ Aguardando IP Público (pode levar 1-2 minutos)...")
    
    # Esperar IP
    import time
    time.sleep(10)
    for _ in range(20):
        inst = compute_client.get_instance(instance.id).data
        if inst.lifecycle_state == "RUNNING":
            # Listar VNICs para pegar IP
            vnic_attachments = compute_client.list_vnic_attachments(compartment_id, instance_id=inst.id).data
            if vnic_attachments:
                vnic_id = vnic_attachments[0].vnic_id
                vnic = network_client.get_vnic(vnic_id).data
                print("\n" + "="*40)
                print(f"🎉 INSTÂNCIA ONLINE!")
                print(f"🌐 IP PÚBLICO: {vnic.public_ip}")
                print(f"👤 Usuário: ubuntu")
                print(f"🔑 Chave SSH: {ssh_key_path}")
                print("="*40)
                
                # Salvar info de conexão
                with open("vm_info.txt", "w") as f:
                    f.write(f"ssh -i {ssh_key_path} ubuntu@{vnic.public_ip}")
                break
        else:
            print(f"   Status: {inst.lifecycle_state}...")
        time.sleep(10)

except oci.exceptions.ServiceError as e:
    print(f"\n❌ Erro ao criar VM: {e.message}")
    if "Out of host capacity" in str(e):
        print("⚠️  A região está sem capacidade para ARM A1.Flex no momento.")
        print("   Tente mudar para E2.1.Micro (AMD) editando o script.")

