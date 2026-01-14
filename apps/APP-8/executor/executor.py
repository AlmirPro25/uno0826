import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

import pyautogui
import websockets
from dotenv import load_dotenv
from cryptography.fernet import Fernet

# Importa módulo de automação de navegador
from browser_automation import BrowserAutomation

# Configuração de segurança do pyautogui
pyautogui.FAILSAFE = True  # Mover mouse para canto superior esquerdo para parar
pyautogui.PAUSE = 0.1  # Pausa entre comandos

# Carrega variáveis de ambiente
load_dotenv()

# Configuração de logging (UTF-8 para suportar emojis)
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.getenv('LOG_FILE', 'executor.log'), encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('GeminiExecutor')

# Configura stdout para UTF-8 no Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


class EmergencyStop(Exception):
    """Exceção para parada de emergência"""
    pass


class GeminiExecutor:
    def __init__(self):
        self.maestro_url = os.getenv('MAESTRO_WS_URL', 'ws://localhost:8081')
        self.auth_token = os.getenv('AUTH_TOKEN', '')
        self.running = True
        self.last_action_time = time.time()
        self.timeout = int(os.getenv('AUTO_TIMEOUT_SECONDS', '300'))
        
        # Configurações de automação
        pyautogui.PAUSE = float(os.getenv('MOUSE_SPEED', '0.5'))
        
        # Inicializa módulo de navegação web
        self.browser = BrowserAutomation()
        
        logger.info("🎮 Gemini Executor inicializado")
        logger.info(f"📡 Conectando ao Maestro em: {self.maestro_url}")
        logger.info("🌐 Módulo de navegação web carregado")
    
    def check_timeout(self):
        """Verifica timeout de inatividade"""
        if time.time() - self.last_action_time > self.timeout:
            logger.warning("⏰ Timeout de inatividade atingido")
            raise EmergencyStop("Timeout de inatividade")
    
    def log_action(self, action: str, params: Dict[str, Any]):
        """Registra ação executada"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            'timestamp': timestamp,
            'action': action,
            'params': params
        }
        logger.info(f"🎯 Ação: {action} | Params: {params}")
        
        # Salva em arquivo de auditoria
        with open('executor_audit.log', 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
    
    async def execute_move(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Move o mouse para coordenadas com validação"""
        x = int(params.get('x', 0))
        y = int(params.get('y', 0))
        duration = float(params.get('duration', 0.5))
        
        # Valida coordenadas
        screen_width, screen_height = pyautogui.size()
        x = max(0, min(x, screen_width - 1))
        y = max(0, min(y, screen_height - 1))
        
        # Move com tweening suave
        pyautogui.moveTo(x, y, duration=duration, tween=pyautogui.easeInOutQuad)
        
        # Aguarda estabilizar
        await asyncio.sleep(0.1)
        
        # Verifica se chegou
        final_pos = pyautogui.position()
        success = abs(final_pos.x - x) < 5 and abs(final_pos.y - y) < 5
        
        self.log_action('move', {'x': x, 'y': y, 'success': success})
        
        return {
            'status': 'ok' if success else 'partial',
            'requested': {'x': x, 'y': y},
            'actual': {'x': final_pos.x, 'y': final_pos.y}
        }
    
    async def execute_click(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Clica o mouse com precisão"""
        button = params.get('button', 'left')
        clicks = int(params.get('clicks', 1))
        x = params.get('x')
        y = params.get('y')
        
        # Se coordenadas fornecidas, move primeiro
        if x is not None and y is not None:
            x = int(x)
            y = int(y)
            
            # Move para posição
            pyautogui.moveTo(x, y, duration=0.3, tween=pyautogui.easeInOutQuad)
            await asyncio.sleep(0.1)
        
        # Clica
        pyautogui.click(clicks=clicks, button=button)
        await asyncio.sleep(0.1)
        
        position = pyautogui.position()
        self.log_action('click', {
            'button': button,
            'clicks': clicks,
            'position': {'x': position.x, 'y': position.y}
        })
        
        return {
            'status': 'ok',
            'button': button,
            'clicks': clicks,
            'position': {'x': position.x, 'y': position.y}
        }
    
    async def execute_type(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Digita texto"""
        text = params.get('text', '')
        interval = float(os.getenv('TYPING_INTERVAL', '0.05'))
        
        # Usa write() para suportar qualquer caractere (URLs, etc)
        pyautogui.write(text, interval=interval)
        self.log_action('type', {'text': text[:50] + '...' if len(text) > 50 else text})
        
        return {'status': 'ok', 'length': len(text)}
    
    async def execute_press(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Pressiona tecla especial"""
        key = params.get('key', '')
        presses = params.get('presses', 1)
        
        pyautogui.press(key, presses=presses)
        self.log_action('press', {'key': key, 'presses': presses})
        
        return {'status': 'ok', 'key': key}
    
    async def execute_hotkey(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Executa combinação de teclas"""
        keys = params.get('keys', [])
        
        pyautogui.hotkey(*keys)
        self.log_action('hotkey', {'keys': keys})
        
        return {'status': 'ok', 'keys': keys}
    
    async def execute_screenshot(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Captura screenshot"""
        filename = params.get('filename', f'screenshot_{int(time.time())}.png')
        region = params.get('region')  # (x, y, width, height)
        
        screenshot = pyautogui.screenshot(region=region)
        screenshot.save(filename)
        
        self.log_action('screenshot', {'filename': filename})
        
        return {'status': 'ok', 'filename': filename, 'size': screenshot.size}
    
    async def execute_scroll(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Rola a página"""
        amount = params.get('amount', 0)
        x = params.get('x')
        y = params.get('y')
        
        if x is not None and y is not None:
            pyautogui.scroll(amount, x=x, y=y)
        else:
            pyautogui.scroll(amount)
        
        self.log_action('scroll', {'amount': amount})
        
        return {'status': 'ok', 'amount': amount}
    
    async def execute_drag(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Arrasta o mouse (clica, segura e move)"""
        x = int(params.get('x', 0))
        y = int(params.get('y', 0))
        duration = float(params.get('duration', 0.5))
        button = params.get('button', 'left')
        absolute = params.get('absolute', False)  # Se True, x/y são absolutos, senão relativos
        
        start_pos = pyautogui.position()
        
        if absolute:
            # Coordenadas absolutas - move para posição específica
            pyautogui.dragTo(x, y, duration=duration, button=button, tween=pyautogui.easeInOutQuad)
        else:
            # Coordenadas relativas - move a partir da posição atual
            pyautogui.drag(x, y, duration=duration, button=button, tween=pyautogui.easeInOutQuad)
        
        await asyncio.sleep(0.1)
        
        end_pos = pyautogui.position()
        self.log_action('drag', {
            'from': {'x': start_pos.x, 'y': start_pos.y},
            'to': {'x': end_pos.x, 'y': end_pos.y}
        })
        
        return {
            'status': 'ok',
            'start': {'x': start_pos.x, 'y': start_pos.y},
            'end': {'x': end_pos.x, 'y': end_pos.y}
        }
    
    async def execute_mouse_down(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Pressiona botão do mouse (sem soltar)"""
        button = params.get('button', 'left')
        x = params.get('x')
        y = params.get('y')
        
        if x is not None and y is not None:
            pyautogui.moveTo(int(x), int(y), duration=0.2)
            await asyncio.sleep(0.05)
        
        pyautogui.mouseDown(button=button)
        self.log_action('mouse_down', {'button': button})
        
        return {'status': 'ok', 'button': button}
    
    async def execute_mouse_up(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Solta botão do mouse"""
        button = params.get('button', 'left')
        
        pyautogui.mouseUp(button=button)
        self.log_action('mouse_up', {'button': button})
        
        return {'status': 'ok', 'button': button}
    
    async def execute_move_relative(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Move mouse relativamente à posição atual"""
        dx = int(params.get('dx', 0))
        dy = int(params.get('dy', 0))
        duration = float(params.get('duration', 0.3))
        
        start_pos = pyautogui.position()
        pyautogui.move(dx, dy, duration=duration, tween=pyautogui.easeInOutQuad)
        await asyncio.sleep(0.05)
        
        end_pos = pyautogui.position()
        self.log_action('move_relative', {'dx': dx, 'dy': dy})
        
        return {
            'status': 'ok',
            'start': {'x': start_pos.x, 'y': start_pos.y},
            'end': {'x': end_pos.x, 'y': end_pos.y}
        }
    
    async def execute_double_click(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Duplo clique"""
        x = params.get('x')
        y = params.get('y')
        
        if x is not None and y is not None:
            pyautogui.moveTo(int(x), int(y), duration=0.2)
            await asyncio.sleep(0.05)
        
        pyautogui.doubleClick()
        await asyncio.sleep(0.1)
        
        self.log_action('double_click', {})
        return {'status': 'ok'}
    
    async def execute_right_click(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Clique direito"""
        x = params.get('x')
        y = params.get('y')
        
        if x is not None and y is not None:
            pyautogui.moveTo(int(x), int(y), duration=0.2)
            await asyncio.sleep(0.05)
        
        pyautogui.rightClick()
        await asyncio.sleep(0.1)
        
        self.log_action('right_click', {})
        return {'status': 'ok'}

    async def get_screen_info(self) -> Dict[str, Any]:
        """Retorna informações da tela"""
        size = pyautogui.size()
        position = pyautogui.position()
        
        return {
            'status': 'ok',
            'screen': {'width': size.width, 'height': size.height},
            'mouse': {'x': position.x, 'y': position.y}
        }
    
    async def execute_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """Executa comando recebido do Maestro"""
        action = command.get('action', '')
        params = command.get('params', {})
        
        self.last_action_time = time.time()
        
        try:
            # ========== AÇÕES DE DESKTOP (pyautogui) ==========
            
            # Ações básicas
            if action == 'move':
                return await self.execute_move(params)
            elif action == 'click':
                return await self.execute_click(params)
            elif action == 'type':
                return await self.execute_type(params)
            elif action == 'press':
                return await self.execute_press(params)
            elif action == 'hotkey':
                return await self.execute_hotkey(params)
            elif action == 'screenshot':
                return await self.execute_screenshot(params)
            elif action == 'scroll':
                return await self.execute_scroll(params)
            elif action == 'drag':
                return await self.execute_drag(params)
            
            # Ações avançadas de mouse
            elif action == 'mouse_down':
                return await self.execute_mouse_down(params)
            elif action == 'mouse_up':
                return await self.execute_mouse_up(params)
            elif action == 'move_relative':
                return await self.execute_move_relative(params)
            elif action == 'double_click':
                return await self.execute_double_click(params)
            elif action == 'right_click':
                return await self.execute_right_click(params)
            
            # Informações
            elif action == 'screen_info':
                return await self.get_screen_info()
            
            # ========== AÇÕES DE NAVEGAÇÃO WEB (Playwright) ==========
            
            # Controle do navegador
            elif action == 'browser_open':
                headless = params.get('headless', False)
                return await self.browser.start(headless)
            elif action == 'browser_close':
                return await self.browser.close()
            elif action == 'browser_goto':
                return await self.browser.goto(params.get('url', ''))
            elif action == 'browser_back':
                return await self.browser.back()
            elif action == 'browser_forward':
                return await self.browser.forward()
            elif action == 'browser_refresh':
                return await self.browser.refresh()
            
            # Interação com elementos
            elif action == 'browser_click':
                return await self.browser.click(params.get('selector', ''))
            elif action == 'browser_type':
                return await self.browser.type_text(
                    params.get('selector', ''),
                    params.get('text', '')
                )
            elif action == 'browser_press':
                return await self.browser.press_key(params.get('key', ''))
            elif action == 'browser_select':
                return await self.browser.select_option(
                    params.get('selector', ''),
                    params.get('value', '')
                )
            elif action == 'browser_check':
                return await self.browser.check(params.get('selector', ''))
            elif action == 'browser_uncheck':
                return await self.browser.uncheck(params.get('selector', ''))
            
            # Extração de dados
            elif action == 'browser_get_text':
                return await self.browser.get_text(params.get('selector', ''))
            elif action == 'browser_get_attribute':
                return await self.browser.get_attribute(
                    params.get('selector', ''),
                    params.get('attribute', '')
                )
            elif action == 'browser_screenshot':
                return await self.browser.screenshot(
                    params.get('filename'),
                    params.get('full_page', False)
                )
            elif action == 'browser_pdf':
                return await self.browser.pdf(params.get('filename'))
            elif action == 'browser_extract_links':
                return await self.browser.extract_links()
            
            # Navegação avançada
            elif action == 'browser_wait_for':
                return await self.browser.wait_for(
                    params.get('selector', ''),
                    params.get('timeout', 10000)
                )
            elif action == 'browser_scroll_to':
                return await self.browser.scroll_to(params.get('selector', ''))
            elif action == 'browser_hover':
                return await self.browser.hover(params.get('selector', ''))
            elif action == 'browser_new_tab':
                return await self.browser.new_tab(params.get('url'))
            elif action == 'browser_switch_tab':
                return await self.browser.switch_tab(params.get('index', 0))
            elif action == 'browser_close_tab':
                return await self.browser.close_tab()
            elif action == 'browser_info':
                return await self.browser.get_page_info()
            elif action == 'browser_fill_form':
                return await self.browser.fill_form(params.get('data', {}))
            elif action == 'browser_evaluate':
                return await self.browser.evaluate(params.get('script', ''))
            
            # Controle
            elif action == 'stop':
                logger.warning("🛑 Comando de parada recebido")
                self.running = False
                # Fecha navegador se estiver aberto
                if self.browser.browser:
                    await self.browser.close()
                return {'status': 'stopped'}
            
            else:
                logger.warning(f"⚠️ Ação desconhecida: {action}")
                return {'status': 'error', 'message': f'Ação desconhecida: {action}'}
        
        except Exception as e:
            logger.error(f"❌ Erro ao executar {action}: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    async def run(self):
        """Loop principal do executor"""
        logger.info("🚀 Iniciando Gemini Executor...")
        
        while self.running:
            try:
                async with websockets.connect(
                    self.maestro_url,
                    extra_headers={'Authorization': f'Bearer {self.auth_token}'}
                ) as websocket:
                    logger.info("✅ Conectado ao Maestro!")
                    
                    # Envia mensagem de inicialização
                    await websocket.send(json.dumps({
                        'type': 'init',
                        'executor': 'ready',
                        'screen': pyautogui.size()._asdict()
                    }))
                    
                    while self.running:
                        try:
                            # Verifica timeout
                            self.check_timeout()
                            
                            # Aguarda comando
                            message = await asyncio.wait_for(
                                websocket.recv(),
                                timeout=5.0
                            )
                            
                            command = json.loads(message)
                            logger.debug(f"📨 Comando recebido: {command.get('action')}")
                            
                            # Extrai commandId se existir (para WebSocket direto do frontend)
                            command_id = command.get('commandId')
                            
                            # Executa comando
                            result = await self.execute_command(command)
                            
                            # Adiciona commandId na resposta se existir
                            if command_id:
                                result['commandId'] = command_id
                            
                            # Envia resultado
                            await websocket.send(json.dumps(result))
                        
                        except asyncio.TimeoutError:
                            # Timeout normal, continua aguardando
                            continue
                        except EmergencyStop as e:
                            logger.error(f"🚨 PARADA DE EMERGÊNCIA: {str(e)}")
                            await websocket.send(json.dumps({
                                'status': 'emergency_stop',
                                'reason': str(e)
                            }))
                            self.running = False
                            break
            
            except websockets.exceptions.ConnectionClosed:
                logger.warning("⚠️ Conexão fechada. Reconectando em 5s...")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"❌ Erro na conexão: {str(e)}")
                await asyncio.sleep(5)
        
        logger.info("👋 Gemini Executor finalizado")


def main():
    """Função principal"""
    print("""
    ╔═══════════════════════════════════════════════╗
    ║       🎮 GEMINI EXECUTOR v1.0                 ║
    ║   Automação física coordenada pelo Maestro    ║
    ╚═══════════════════════════════════════════════╝
    """)
    
    executor = GeminiExecutor()
    
    try:
        asyncio.run(executor.run())
    except KeyboardInterrupt:
        logger.info("⚠️ Interrompido pelo usuário")
    except Exception as e:
        logger.error(f"❌ Erro fatal: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
