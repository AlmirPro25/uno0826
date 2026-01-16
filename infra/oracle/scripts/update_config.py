import os

# Caminho do config
config_path = os.path.expanduser("~/.oci/config")

# Fingerprint obtido da imagem
fingerprint = "6d:64:65:6b:ad:01:81:2a:2f:85:14:cd:0d:4d:d5:a9"

# Ler o arquivo
with open(config_path, 'r') as f:
    content = f.read()

# Substituir o fingerprint
new_content = content.replace("fingerprint=FINGERPRINT_AQUI", f"fingerprint={fingerprint}")

# Salvar
with open(config_path, 'w') as f:
    f.write(new_content)

print(f"[OK] Config atualizado com fingerprint: {fingerprint}")
