"""
🧪 Teste do Módulo de Navegação Web
Valida instalação e funcionalidade do Playwright
"""

import asyncio
import sys
from browser_automation import BrowserAutomation


async def test_browser():
    """Testa funcionalidades básicas do navegador"""
    
    print("=" * 60)
    print("🧪 TESTE DO MÓDULO DE NAVEGAÇÃO WEB")
    print("=" * 60)
    
    browser = BrowserAutomation()
    
    try:
        # Teste 1: Abrir navegador
        print("\n[1/7] 🚀 Abrindo navegador...")
        result = await browser.start(headless=False)
        if result['status'] == 'ok':
            print("✅ Navegador aberto com sucesso")
        else:
            print(f"❌ Erro: {result.get('message')}")
            return False
        
        await asyncio.sleep(1)
        
        # Teste 2: Navegar para Google
        print("\n[2/7] 🌐 Navegando para Google...")
        result = await browser.goto('https://google.com')
        if result['status'] == 'ok':
            print(f"✅ Página carregada: {result['title']}")
        else:
            print(f"❌ Erro: {result.get('message')}")
            return False
        
        await asyncio.sleep(2)
        
        # Teste 3: Digitar no campo de busca
        print("\n[3/7] ⌨️ Digitando no campo de busca...")
        result = await browser.type_text('textarea[name="q"]', 'Playwright Python')
        if result['status'] == 'ok':
            print("✅ Texto digitado com sucesso")
        else:
            print(f"❌ Erro: {result.get('message')}")
        
        await asyncio.sleep(1)
        
        # Teste 4: Pressionar Enter
        print("\n[4/7] ⏎ Pressionando Enter...")
        result = await browser.press_key('Enter')
        if result['status'] == 'ok':
            print("✅ Tecla pressionada")
        else:
            print(f"❌ Erro: {result.get('message')}")
        
        await asyncio.sleep(3)
        
        # Teste 5: Capturar screenshot
        print("\n[5/7] 📸 Capturando screenshot...")
        result = await browser.screenshot('test_screenshot.png')
        if result['status'] == 'ok':
            print(f"✅ Screenshot salvo: {result['filename']}")
        else:
            print(f"❌ Erro: {result.get('message')}")
        
        # Teste 6: Obter informações da página
        print("\n[6/7] ℹ️ Obtendo informações da página...")
        result = await browser.get_page_info()
        if result['status'] == 'ok':
            print(f"✅ URL: {result['url']}")
            print(f"✅ Título: {result['title']}")
        else:
            print(f"❌ Erro: {result.get('message')}")
        
        # Teste 7: Fechar navegador
        print("\n[7/7] 🔒 Fechando navegador...")
        result = await browser.close()
        if result['status'] == 'ok':
            print("✅ Navegador fechado com sucesso")
        else:
            print(f"❌ Erro: {result.get('message')}")
        
        print("\n" + "=" * 60)
        print("✅ TODOS OS TESTES PASSARAM!")
        print("=" * 60)
        print("\n🎉 Módulo de navegação web está funcionando perfeitamente!")
        print("📝 Próximo passo: Inicie o executor.py e teste via API\n")
        
        return True
    
    except Exception as e:
        print(f"\n❌ ERRO CRÍTICO: {str(e)}")
        print("\n💡 Dicas:")
        print("  1. Certifique-se de que instalou: pip install playwright")
        print("  2. Instale o Chromium: playwright install chromium")
        print("  3. Verifique se não há outro navegador bloqueando\n")
        
        # Tenta fechar navegador se estiver aberto
        try:
            await browser.close()
        except:
            pass
        
        return False


async def test_installation():
    """Testa se Playwright está instalado corretamente"""
    
    print("\n🔍 Verificando instalação do Playwright...")
    
    try:
        from playwright.async_api import async_playwright
        print("✅ Playwright importado com sucesso")
        
        # Tenta iniciar playwright
        playwright = await async_playwright().start()
        print("✅ Playwright iniciado")
        
        # Verifica se Chromium está instalado
        try:
            browser = await playwright.chromium.launch(headless=True)
            print("✅ Chromium encontrado e funcional")
            await browser.close()
        except Exception as e:
            print(f"❌ Chromium não encontrado: {str(e)}")
            print("💡 Execute: playwright install chromium")
            return False
        
        await playwright.stop()
        print("✅ Instalação verificada com sucesso!\n")
        return True
    
    except ImportError:
        print("❌ Playwright não está instalado")
        print("💡 Execute: pip install playwright")
        return False
    except Exception as e:
        print(f"❌ Erro ao verificar instalação: {str(e)}")
        return False


async def main():
    """Função principal"""
    
    print("""
    ╔═══════════════════════════════════════════════════════╗
    ║  🧪 TESTE DO MÓDULO DE NAVEGAÇÃO WEB                  ║
    ║  Playwright + Chromium + Gemini Executor              ║
    ╚═══════════════════════════════════════════════════════╝
    """)
    
    # Verifica instalação
    if not await test_installation():
        print("\n❌ Instalação incompleta. Corrija os erros acima e tente novamente.\n")
        sys.exit(1)
    
    # Executa testes
    success = await test_browser()
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️ Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro fatal: {str(e)}")
        sys.exit(1)
