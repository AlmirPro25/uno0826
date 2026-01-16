import oci
import json
import os

# Configuração
config_path = os.path.expanduser("~/.oci/config")
config = oci.config.from_file(config_path)

# Clients
identity = oci.identity.IdentityClient(config)
network = oci.core.VirtualNetworkClient(config)

# 1. Obter Compartment ID (do arquivo config)
compartment_id = config["tenancy"]
print(f"Compartment ID: {compartment_id}")

# 2. Listar Availability Domains
print("\n[Availability Domains]")
ads = identity.list_availability_domains(compartment_id).data
for ad in ads:
    print(f"- {ad.name} (ID: {ad.id})")

# 3. Listar VCNs
print("\n[Virtual Cloud Networks]")
vcns = network.list_vcns(compartment_id).data
if not vcns:
    print("Nenhuma VCN encontrada!")
else:
    for vcn in vcns:
        print(f"- {vcn.display_name} (ID: {vcn.id})")
        # Listar Subnets dessa VCN
        subnets = network.list_subnets(compartment_id, vcn_id=vcn.id).data
        for subnet in subnets:
            type_str = "Public" if not subnet.prohibit_public_ip_on_vnic else "Private"
            print(f"  > Subnet: {subnet.display_name} ({type_str}) - ID: {subnet.id}")

# 4. Image search (Ubuntu 22.04 ARM)
print("\n[Buscando Imagem Ubuntu 22.04 aarch64]")
compute = oci.core.ComputeClient(config)
images = compute.list_images(
    compartment_id, 
    operating_system="Canonical Ubuntu", 
    operating_system_version="22.04",
    shape="VM.Standard.A1.Flex",
    sort_by="TIMECREATED",
    sort_order="DESC"
).data

found_image = None
for img in images:
    # Filtrar por ARM (aarch64)
    if "aarch64" in img.display_name.lower() or "arm" in img.display_name.lower():
        print(f"- Encontrada: {img.display_name}")
        print(f"  ID: {img.id}")
        found_image = img.id
        break

if found_image:
    print(f"\n✅ IMAGEM SELECIONADA: {found_image}")
else:
    print("❌ Nenhuma imagem Ubuntu ARM encontrada.")
