"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DAIA - Testes do Servidor                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

Execute: python test_server.py
"""

import asyncio
import httpx
import json

BASE_URL = "http://localhost:8765"


async def test_health():
    """Testa endpoint de health check."""
    print("\n🔍 Testando /health...")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        assert response.status_code == 200
        print("   ✅ Health check OK!")


async def test_learn():
    """Testa endpoint de aprendizado."""
    print("\n🔍 Testando /learn...")
    
    test_data = {
        "code": """<!DOCTYPE html>
<html>
<head>
    <title>Dashboard de Vendas</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white p-8">
    <h1 class="text-3xl font-bold mb-6">Dashboard de Vendas</h1>
    <div class="grid grid-cols-3 gap-4">
        <div class="bg-slate-800 p-4 rounded-lg">
            <h2 class="text-lg text-slate-400">Total de Vendas</h2>
            <p class="text-2xl font-bold text-green-400">R$ 125.430,00</p>
        </div>
        <div class="bg-slate-800 p-4 rounded-lg">
            <h2 class="text-lg text-slate-400">Pedidos</h2>
            <p class="text-2xl font-bold text-sky-400">1.234</p>
        </div>
        <div class="bg-slate-800 p-4 rounded-lg">
            <h2 class="text-lg text-slate-400">Clientes</h2>
            <p class="text-2xl font-bold text-purple-400">567</p>
        </div>
    </div>
</body>
</html>""",
        "prompt": "Crie um dashboard de vendas moderno com cards de métricas",
        "category": "dashboard",
        "score": 90,
        "metadata": {
            "model": "gemini-2.5-flash",
            "source": "test"
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/learn",
            json=test_data,
            timeout=30.0
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        assert response.status_code == 200
        print("   ✅ Learn OK!")
        return response.json()


async def test_search(prompt: str = "dashboard de vendas"):
    """Testa endpoint de busca."""
    print(f"\n🔍 Testando /search com prompt: '{prompt}'...")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/search",
            json={"prompt": prompt, "limit": 5},
            timeout=10.0
        )
        print(f"   Status: {response.status_code}")
        results = response.json()
        print(f"   Encontrados: {len(results)} templates")
        for r in results:
            print(f"   - {r['id']}: {r['similarity']:.2%} similar")
        assert response.status_code == 200
        print("   ✅ Search OK!")
        return results


async def test_stats():
    """Testa endpoint de estatísticas."""
    print("\n🔍 Testando /stats...")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/stats")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        assert response.status_code == 200
        print("   ✅ Stats OK!")


async def test_templates():
    """Testa endpoint de listagem de templates."""
    print("\n🔍 Testando /templates...")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/templates?limit=10")
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Total: {data['total']} templates")
        assert response.status_code == 200
        print("   ✅ Templates OK!")


async def main():
    """Executa todos os testes."""
    print("=" * 60)
    print("🧠 DAIA - Testes do Servidor")
    print("=" * 60)
    
    try:
        # Verifica se servidor está rodando
        async with httpx.AsyncClient() as client:
            try:
                await client.get(f"{BASE_URL}/", timeout=5.0)
            except httpx.ConnectError:
                print("\n❌ Servidor não está rodando!")
                print("   Execute: python server.py")
                return
        
        # Executa testes
        await test_health()
        await test_learn()
        await test_search()
        await test_stats()
        await test_templates()
        
        print("\n" + "=" * 60)
        print("✅ Todos os testes passaram!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ Teste falhou: {e}")
    except Exception as e:
        print(f"\n❌ Erro: {e}")


if __name__ == "__main__":
    asyncio.run(main())
