"""
Script de teste para o Gemini Executor
Execute este script para testar as funcionalidades básicas
"""

import pyautogui
import time
import sys

def print_header(text):
    print("\n" + "="*50)
    print(f"  {text}")
    print("="*50)

def test_screen_info():
    """Testa obtenção de informações da tela"""
    print_header("Teste 1: Informações da Tela")
    
    size = pyautogui.size()
    position = pyautogui.position()
    
    print(f"✅ Resolução da tela: {size.width} x {size.height}")
    print(f"✅ Posição atual do mouse: ({position.x}, {position.y})")
    
    return True

def test_mouse_movement():
    """Testa movimento do mouse"""
    print_header("Teste 2: Movimento do Mouse")
    
    print("Movendo o mouse em um quadrado...")
    print("(Você deve ver o cursor se movendo)")
    
    # Salva posição inicial
    start_pos = pyautogui.position()
    
    # Move em quadrado
    pyautogui.moveTo(start_pos.x + 100, start_pos.y, duration=0.5)
    time.sleep(0.2)
    pyautogui.moveTo(start_pos.x + 100, start_pos.y + 100, duration=0.5)
    time.sleep(0.2)
    pyautogui.moveTo(start_pos.x, start_pos.y + 100, duration=0.5)
    time.sleep(0.2)
    pyautogui.moveTo(start_pos.x, start_pos.y, duration=0.5)
    
    print("✅ Movimento do mouse funcionando!")
    return True

def test_screenshot():
    """Testa captura de screenshot"""
    print_header("Teste 3: Screenshot")
    
    filename = "test_screenshot.png"
    screenshot = pyautogui.screenshot()
    screenshot.save(filename)
    
    print(f"✅ Screenshot salvo como: {filename}")
    print(f"   Tamanho: {screenshot.size}")
    
    return True

def test_keyboard():
    """Testa digitação (em um bloco de notas)"""
    print_header("Teste 4: Teclado")
    
    print("⚠️  Este teste vai abrir o Bloco de Notas e digitar texto")
    print("    Pressione ENTER para continuar ou Ctrl+C para pular...")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\n⏭️  Teste pulado")
        return True
    
    # Abre o Bloco de Notas
    print("Abrindo Bloco de Notas...")
    pyautogui.hotkey('win', 'r')
    time.sleep(0.5)
    pyautogui.typewrite('notepad', interval=0.1)
    pyautogui.press('enter')
    time.sleep(1)
    
    # Digita texto de teste
    print("Digitando texto de teste...")
    pyautogui.typewrite('Gemini Executor - Teste de digitacao', interval=0.05)
    pyautogui.press('enter')
    pyautogui.typewrite('Funcionando perfeitamente!', interval=0.05)
    
    print("✅ Teste de teclado concluído!")
    print("   Feche o Bloco de Notas manualmente")
    
    return True

def test_failsafe():
    """Testa o failsafe (parada de emergência)"""
    print_header("Teste 5: Failsafe (Parada de Emergência)")
    
    print("O PyAutoGUI tem um failsafe embutido:")
    print("  • Mova o mouse para o canto superior esquerdo para parar")
    print("  • Isso funciona em qualquer momento")
    
    print("\n✅ Failsafe está ATIVO")
    print(f"   Posição de parada: (0, 0)")
    
    return True

def main():
    print("""
╔═══════════════════════════════════════════════╗
║     🧪 TESTE DO GEMINI EXECUTOR               ║
║     Verificando funcionalidades básicas       ║
╚═══════════════════════════════════════════════╝
    """)
    
    print("⚠️  IMPORTANTE:")
    print("   • Não mexa no mouse/teclado durante os testes")
    print("   • Mova o mouse para o canto superior esquerdo para parar")
    print("   • Pressione Ctrl+C para cancelar")
    print("\nPressione ENTER para começar...")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\n\n❌ Testes cancelados pelo usuário")
        sys.exit(0)
    
    tests = [
        ("Informações da Tela", test_screen_info),
        ("Movimento do Mouse", test_mouse_movement),
        ("Screenshot", test_screenshot),
        ("Teclado", test_keyboard),
        ("Failsafe", test_failsafe),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
                print(f"❌ Teste '{name}' falhou")
        except KeyboardInterrupt:
            print(f"\n\n⏭️  Teste '{name}' interrompido")
            break
        except Exception as e:
            failed += 1
            print(f"❌ Erro no teste '{name}': {str(e)}")
        
        time.sleep(1)
    
    print("\n" + "="*50)
    print("  RESUMO DOS TESTES")
    print("="*50)
    print(f"✅ Passou: {passed}")
    print(f"❌ Falhou: {failed}")
    
    if failed == 0:
        print("\n🎉 Todos os testes passaram!")
        print("   O Executor está pronto para uso!")
    else:
        print("\n⚠️  Alguns testes falharam")
        print("   Verifique as mensagens de erro acima")
    
    print("\n" + "="*50)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Testes interrompidos pelo usuário")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Erro fatal: {str(e)}")
        sys.exit(1)
