import oci
import os
import sys
import time

# Config
config = oci.config.from_file(os.path.expanduser("~/.oci/config"))
compartment_id = config["tenancy"]
network_client = oci.core.VirtualNetworkClient(config)
compute_client = oci.core.ComputeClient(config)
identity_client = oci.identity.IdentityClient(config)

VCN_NAME = "uno-vcn"
SUBNET_NAME = "uno-public-subnet"
CIDR_BLOCK = "10.0.0.0/16"
SUBNET_CIDR = "10.0.1.0/24"

print("[1/5] 🌐 Criando VCN...")
vcn = network_client.create_vcn(
    oci.core.models.CreateVcnDetails(
        cidr_block=CIDR_BLOCK,
        display_name=VCN_NAME,
        compartment_id=compartment_id
    )
).data
print(f"✅ VCN criada: {vcn.id}")

print("\n[2/5] 🚪 Criando Internet Gateway...")
ig = network_client.create_internet_gateway(
    oci.core.models.CreateInternetGatewayDetails(
        compartment_id=compartment_id,
        vcn_id=vcn.id,
        is_enabled=True,
        display_name="uno-ig"
    )
).data
print(f"✅ Internet Gateway criado: {ig.id}")

print("\n[3/5] 🛣️ Configurando Route Table...")
# Pegar Default Route Table
route_table_id = vcn.default_route_table_id
network_client.update_route_table(
    route_table_id,
    oci.core.models.UpdateRouteTableDetails(
        route_rules=[
            oci.core.models.RouteRule(
                destination="0.0.0.0/0",
                destination_type="CIDR_BLOCK",
                network_entity_id=ig.id
            )
        ]
    )
)
print("✅ Rota padrão (0.0.0.0/0) configurada.")

print("\n[4/5] 🛡️ Configurando Security List (Abrindo Portas)...")
security_list_id = vcn.default_security_list_id
# Regras de Ingress (Ports 22, 80, 443, 3000-8080)
ingress_rules = [
    # SSH
    oci.core.models.IngressSecurityRule(protocol="6", source="0.0.0.0/0", tcp_options=oci.core.models.TcpOptions(destination_port_range=oci.core.models.PortRange(min=22, max=22))),
    # HTTP
    oci.core.models.IngressSecurityRule(protocol="6", source="0.0.0.0/0", tcp_options=oci.core.models.TcpOptions(destination_port_range=oci.core.models.PortRange(min=80, max=80))),
    # HTTPS
    oci.core.models.IngressSecurityRule(protocol="6", source="0.0.0.0/0", tcp_options=oci.core.models.TcpOptions(destination_port_range=oci.core.models.PortRange(min=443, max=443))),
    # Backend Apps
    oci.core.models.IngressSecurityRule(protocol="6", source="0.0.0.0/0", tcp_options=oci.core.models.TcpOptions(destination_port_range=oci.core.models.PortRange(min=3000, max=8080)))
]

network_client.update_security_list(
    security_list_id,
    oci.core.models.UpdateSecurityListDetails(
        ingress_security_rules=ingress_rules
    )
)
print("✅ Portas 22, 80, 443 e 3000-8080 abertas!")

print("\n[5/5] 🕸️ Criando Subnet Pública...")
subnet = network_client.create_subnet(
    oci.core.models.CreateSubnetDetails(
        compartment_id=compartment_id,
        availability_domain=None, # Regional Subnet
        vcn_id=vcn.id,
        cidr_block=SUBNET_CIDR,
        display_name=SUBNET_NAME,
        route_table_id=route_table_id,
        security_list_ids=[security_list_id]
    )
).data
print(f"✅ Subnet criada: {subnet.id}")

print("\n🚀 INFRAESTRUTURA DE REDE PRONTA!")
# Salvar ID da subnet para uso posterior
with open("subnet_id.txt", "w") as f:
    f.write(subnet.id)
print(f"ID da Subnet salvo em subnet_id.txt")
