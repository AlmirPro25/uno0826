import oci
import os
import sys

config = oci.config.from_file(os.path.expanduser("~/.oci/config"))
compute = oci.core.ComputeClient(config)
network = oci.core.VirtualNetworkClient(config)

instance_id = "ocid1.instance.oc1.sa-saopaulo-1.antxeljrvuwq3cycuccqpkxbh3tvjsjojrljyxeqff2zhmq2mok6sktsdltq"

print(f"🔍 Buscando IP da VM {instance_id[-6:]}...")

vnics = compute.list_vnic_attachments(config["tenancy"], instance_id=instance_id).data
if vnics:
    vnic_id = vnics[0].vnic_id
    vnic = network.get_vnic(vnic_id).data
    print("\n" + "="*40)
    print(f"🎉 SUCESSO! SUA VM ESTÁ PRONTA!")
    print(f"🌐 IP PÚBLICO: {vnic.public_ip}")
    print(f"👤 Usuário: ubuntu")
    print("="*40)
    
    print("\n📝 COMANDO PARA ACESSAR:")
    print(f"ssh -i \"C:\\Users\\almir\\.ssh\\oracle_vm_key\" ubuntu@{vnic.public_ip}")
else:
    print("VNIC ainda não anexada. Tente novamente em alguns segundos.")
