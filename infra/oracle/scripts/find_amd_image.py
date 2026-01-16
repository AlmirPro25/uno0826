import oci
import os

config = oci.config.from_file(os.path.expanduser("~/.oci/config"))
compartment_id = config["tenancy"]
compute = oci.core.ComputeClient(config)

print("[Buscando Imagem Ubuntu 22.04 AMD64]")
images = compute.list_images(
    compartment_id, 
    operating_system="Canonical Ubuntu", 
    operating_system_version="22.04",
    shape="VM.Standard.E2.1.Micro",
    sort_by="TIMECREATED",
    sort_order="DESC"
).data

for img in images:
    print(f"- {img.display_name}")
    print(f"  ID: {img.id}")
    break # Pega a primeira (mais recente)
