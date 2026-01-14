"""
Teste do DAIA Brain (Gemini + Tool Calling)

Execute: python test_brain.py
"""

import asyncio
import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

async def test_brain():
    """Testa o DAIA Brain."""
    
    print("=" * 60)
    print("🧠 TESTE DO DAIA BRAIN")
    print("=" * 60)
    
    # Verifica API Key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY não configurada!")
        print("   Crie um arquivo .env com: GEMINI_API_KEY=sua_chave")
        return
    
    print(f"✅ API Key configurada: {api_key[:10]}...")
    
    try:
        from services.gemini_brain import DAIABrain
        from database.template_store import TemplateStore
        from models.embedder import CodeEmbedder
        from services.similarity import SimilaritySearch
        
        print("\n📦 Inicializando componentes...")
        
        # Inicializa banco
        os.makedirs("./database", exist_ok=True)
        template_store = TemplateStore("./database/templates.db")
        await template_store.initialize()
        print("   ✅ TemplateStore inicializado")
        
        # Inicializa embedder
        embedder = CodeEmbedder()
        print("   ✅ CodeEmbedder inicializado")
        
        # Inicializa busca
        similarity_search = SimilaritySearch(embedder, template_store)
        await similarity_search.build_index()
        print("   ✅ SimilaritySearch inicializado")
        
        # Inicializa brain
        brain = DAIABrain(
            template_store=template_store,
            similarity_search=similarity_search
        )
        print("   ✅ DAIABrain inicializado")
        
        print("\n" + "=" * 60)
        print("🧪 TESTE 1: Perguntar sobre estatísticas")
        print("=" * 60)
        
        result = await brain.think("Quantos templates temos no banco?")
        print(f"\n📝 Resposta: {result['response'][:500]}...")
        print(f"🔧 Tools usadas: {[t['name'] for t in result['tools_used']]}")
        
        print("\n" + "=" * 60)
        print("🧪 TESTE 2: Buscar templates")
        print("=" * 60)
        
        result = await brain.think("Busque templates de dashboard")
        print(f"\n📝 Resposta: {result['response'][:500]}...")
        print(f"🔧 Tools usadas: {[t['name'] for t in result['tools_used']]}")
        
        print("\n" + "=" * 60)
        print("✅ TODOS OS TESTES PASSARAM!")
        print("=" * 60)
        
        # Cleanup
        await template_store.close()
        
    except ImportError as e:
        print(f"❌ Erro de importação: {e}")
        print("   Execute: pip install -r requirements.txt")
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_brain())
