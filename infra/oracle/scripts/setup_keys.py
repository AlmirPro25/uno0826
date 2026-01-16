import os
import shutil
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

# Caminhos
user_home = os.path.expanduser("~")
oci_dir = os.path.join(user_home, ".oci")
key_file = os.path.join(oci_dir, "oci_api_key.pem")
pub_file = os.path.join(oci_dir, "oci_api_key_public.pem")
config_file = os.path.join(oci_dir, "config")

# Criar diretório .oci
if not os.path.exists(oci_dir):
    os.makedirs(oci_dir)
    print(f"[OK] Diretório criado: {oci_dir}")

# Gerar chaves
print("[...] Gerando chaves RSA 2048...")
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

# Salvar chave privada
pem_private = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.TraditionalOpenSSL,
    encryption_algorithm=serialization.NoEncryption()
)

with open(key_file, "wb") as f:
    f.write(pem_private)
os.chmod(key_file, 0o600)

# Salvar chave pública
public_key = private_key.public_key()
pem_public = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

with open(pub_file, "wb") as f:
    f.write(pem_public)

print("[OK] Chaves geradas com sucesso!")
print(f"    Privada: {key_file}")
print(f"    Pública: {pub_file}")

# Mostrar chave pública
print("\n" + "="*50)
print("COPIE A CHAVE PÚBLICA ABAIXO E ADICIONE NA ORACLE CLOUD:")
print("="*50)
print(pem_public.decode('utf-8'))
print("="*50 + "\n")

# Criar config template
config_content = f"""[DEFAULT]
user=ocid1.user.oc1..aaaaaaaa7myh2ct5jswbcphesifdi7sk7g34pftbxhxotkdnw3wve4wx476q
fingerprint=FINGERPRINT_AQUI
tenancy=ocid1.tenancy.oc1..aaaaaaaaeak2g7unxk6sxl4dbamn67bdvv3gqyqvkmd5dcusfqezjx3fa42q
region=sa-saopaulo-1
key_file={key_file.replace(os.sep, '/')}
"""

with open(config_file, "w") as f:
    f.write(config_content)

print(f"[OK] Arquivo de config criado em: {config_file}")
print("OBS: Você precisará editar este arquivo com o FINGERPRINT após adicionar a chave no console.")
