import oci
import os
import hashlib
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

# Caminhos
config_path = os.path.expanduser("~/.oci/config")
key_path = os.path.expanduser("~/.oci/oci_api_key.pem")

# Ler config
with open(config_path, 'r') as f:
    print("--- CONTEÚDO DO CONFIG ---")
    print(f.read())
    print("--------------------------")

# Calcular fingerprint da chave local
try:
    with open(key_path, "rb") as f:
        private_key = serialization.load_pem_private_key(
            f.read(),
            password=None,
            backend=default_backend()
        )
        
    # Extrair pública da privada
    public_key = private_key.public_key()
    der_public = public_key.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    # MD5 Fingerprint (Oracle usa padrão MD5 do DER da chave pública)
    md5_fingerprint = hashlib.md5(der_public).hexdigest()
    # Format: xx:xx:xx...
    formatted_fp = ':'.join(md5_fingerprint[i:i+2] for i in range(0, len(md5_fingerprint), 2))
    
    print(f"\n✅ Fingerprint calculado da chave local: {formatted_fp}")
    
except Exception as e:
    print(f"\n❌ Erro ao ler chave: {e}")
