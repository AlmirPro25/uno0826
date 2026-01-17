import oci
import os

# Config
config = oci.config.from_file(os.path.expanduser("~/.oci/config"))
compartment_id = config["tenancy"]
network_client = oci.core.VirtualNetworkClient(config)

print("🔍 Buscando VCNs...")
vcns = network_client.list_vcns(compartment_id=compartment_id, lifecycle_state="AVAILABLE").data

if not vcns:
    print("❌ Nenhuma VCN encontrada!")
    exit(1)

for vcn in vcns:
    print(f"\n📦 VCN: {vcn.display_name} ({vcn.id})")
    
    # Pegar Security Lists da VCN
    security_lists = network_client.list_security_lists(compartment_id=compartment_id, vcn_id=vcn.id).data
    
    for sl in security_lists:
        print(f"   🛡️ Security List: {sl.display_name}")
        
        # Verificar se porta 80 já está aberta
        has_80 = any(
            r.tcp_options and r.tcp_options.destination_port_range and 
            r.tcp_options.destination_port_range.min <= 80 <= r.tcp_options.destination_port_range.max
            for r in sl.ingress_security_rules if r.protocol == "6"
        )
        
        has_443 = any(
            r.tcp_options and r.tcp_options.destination_port_range and 
            r.tcp_options.destination_port_range.min <= 443 <= r.tcp_options.destination_port_range.max
            for r in sl.ingress_security_rules if r.protocol == "6"
        )
        
        if has_80 and has_443:
            print(f"      ✅ Portas 80 e 443 já abertas!")
            continue
            
        print(f"      🔧 Abrindo portas 80 e 443...")
        
        # Copiar regras existentes e adicionar novas
        new_rules = list(sl.ingress_security_rules)
        
        if not has_80:
            new_rules.append(oci.core.models.IngressSecurityRule(
                protocol="6",
                source="0.0.0.0/0",
                tcp_options=oci.core.models.TcpOptions(
                    destination_port_range=oci.core.models.PortRange(min=80, max=80)
                )
            ))
            
        if not has_443:
            new_rules.append(oci.core.models.IngressSecurityRule(
                protocol="6",
                source="0.0.0.0/0",
                tcp_options=oci.core.models.TcpOptions(
                    destination_port_range=oci.core.models.PortRange(min=443, max=443)
                )
            ))
        
        network_client.update_security_list(
            sl.id,
            oci.core.models.UpdateSecurityListDetails(ingress_security_rules=new_rules)
        )
        print(f"      ✅ Portas abertas com sucesso!")

print("\n🚀 Concluído! Teste: curl http://64.181.175.25/health")
