"""
🌐 Browser Automation Module
Controle de navegadores web usando Playwright + Gemini Vision
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path

from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Playwright

logger = logging.getLogger('BrowserAutomation')


class BrowserAutomation:
    """Automação de navegadores web com Playwright"""
    
    def __init__(self):
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.tabs: List[Page] = []
        self.current_tab_index = 0
        
        logger.info("🌐 Browser Automation inicializado")
    
    async def start(self, headless: bool = False) -> Dict[str, Any]:
        """Inicia o navegador Chromium"""
        try:
            if self.browser:
                return {'status': 'already_running', 'message': 'Navegador já está aberto'}
            
            logger.info("🚀 Iniciando Chromium...")
            
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=headless,
                args=[
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled'
                ]
            )
            
            # Cria contexto com viewport grande
            self.context = await self.browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            
            # Cria primeira página
            self.page = await self.context.new_page()
            self.tabs = [self.page]
            self.current_tab_index = 0
            
            logger.info("✅ Chromium iniciado com sucesso")
            
            return {
                'status': 'ok',
                'message': 'Navegador aberto',
                'headless': headless
            }
        
        except Exception as e:
            logger.error(f"❌ Erro ao iniciar navegador: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    async def close(self) -> Dict[str, Any]:
        """Fecha o navegador"""
        try:
            if not self.browser:
                return {'status': 'not_running', 'message': 'Navegador não está aberto'}
            
            logger.info("🔒 Fechando navegador...")
            
            await self.browser.close()
            await self.playwright.stop()
            
            self.browser = None
            self.context = None
            self.page = None
            self.tabs = []
            self.playwright = None
            
            logger.info("✅ Navegador fechado")
            
            return {'status': 'ok', 'message': 'Navegador fechado'}
        
        except Exception as e:
            logger.error(f"❌ Erro ao fechar navegador: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _ensure_browser(self):
        """Garante que o navegador está aberto"""
        if not self.browser or not self.page:
            raise Exception("Navegador não está aberto. Use browser_open primeiro.")
    
    async def goto(self, url: str, wait_until: str = 'domcontentloaded') -> Dict[str, Any]:
        """Navega para URL"""
        try:
            self._ensure_browser()
            
            logger.info(f"🌐 Navegando para: {url}")
            
            # Adiciona https:// se não tiver protocolo
            if not url.startswith(('http://', 'https://')):
                url = f'https://{url}'
            
            response = await self.page.goto(url, wait_until=wait_until, timeout=30000)
            
            # Aguarda um pouco para página estabilizar
            await asyncio.sleep(0.5)
            
            title = await self.page.title()
            current_url = self.page.url
            
            logger.info(f"✅ Página carregada: {title}")
            
            return {
                'status': 'ok',
                'url': current_url,
                'title': title,
                'status_code': response.status if response else None
            }
        
        except Exception as e:
            logger.error(f"❌ Erro ao navegar: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    async def back(self) -> Dict[str, Any]:
        """Volta para página anterior"""
        try:
            self._ensure_browser()
            await self.page.go_back(wait_until='domcontentloaded')
            return {'status': 'ok', 'url': self.page.url}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def forward(self) -> Dict[str, Any]:
        """Avança para próxima página"""
        try:
            self._ensure_browser()
            await self.page.go_forward(wait_until='domcontentloaded')
            return {'status': 'ok', 'url': self.page.url}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def refresh(self) -> Dict[str, Any]:
        """Atualiza página atual"""
        try:
            self._ensure_browser()
            await self.page.reload(wait_until='domcontentloaded')
            return {'status': 'ok', 'url': self.page.url}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def click(self, selector: str, timeout: int = 5000) -> Dict[str, Any]:
        """Clica em elemento"""
        try:
            self._ensure_browser()
            
            logger.info(f"🖱️ Clicando em: {selector}")
            
            # Aguarda elemento estar visível
            await self.page.wait_for_selector(selector, state='visible', timeout=timeout)
            
            # Clica
            await self.page.click(selector)
            
            # Aguarda navegação se houver
            await asyncio.sleep(0.3)
            
            logger.info(f"✅ Clicado em: {selector}")
            
            return {'status': 'ok', 'selector': selector}
        
        except Exception as e:
            logger.error(f"❌ Erro ao clicar: {str(e)}")
            return {'status': 'error', 'message': str(e), 'selector': selector}
    
    async def type_text(self, selector: str, text: str, delay: int = 50) -> Dict[str, Any]:
        """Digita texto em campo"""
        try:
            self._ensure_browser()
            
            logger.info(f"⌨️ Digitando em: {selector}")
            
            # Aguarda campo estar visível
            await self.page.wait_for_selector(selector, state='visible', timeout=5000)
            
            # Limpa campo primeiro
            await self.page.fill(selector, '')
            
            # Digita com delay natural
            await self.page.type(selector, text, delay=delay)
            
            logger.info(f"✅ Texto digitado: {text[:50]}...")
            
            return {'status': 'ok', 'selector': selector, 'text': text}
        
        except Exception as e:
            logger.error(f"❌ Erro ao digitar: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    async def press_key(self, key: str) -> Dict[str, Any]:
        """Pressiona tecla"""
        try:
            self._ensure_browser()
            await self.page.keyboard.press(key)
            return {'status': 'ok', 'key': key}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def screenshot(self, filename: Optional[str] = None, full_page: bool = False) -> Dict[str, Any]:
        """Captura screenshot da página"""
        try:
            self._ensure_browser()
            
            if not filename:
                filename = f'browser_screenshot_{int(asyncio.get_event_loop().time())}.png'
            
            logger.info(f"📸 Capturando screenshot: {filename}")
            
            await self.page.screenshot(
                path=filename,
                full_page=full_page
            )
            
            logger.info(f"✅ Screenshot salvo: {filename}")
            
            return {
                'status': 'ok',
                'filename': filename,
                'full_page': full_page
            }
        
        except Exception as e:
            logger.error(f"❌ Erro ao capturar screenshot: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    async def get_text(self, selector: str) -> Dict[str, Any]:
        """Extrai texto de elemento"""
        try:
            self._ensure_browser()
            
            await self.page.wait_for_selector(selector, timeout=5000)
            text = await self.page.text_content(selector)
            
            return {'status': 'ok', 'text': text, 'selector': selector}
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def get_attribute(self, selector: str, attribute: str) -> Dict[str, Any]:
        """Extrai atributo de elemento"""
        try:
            self._ensure_browser()
            
            await self.page.wait_for_selector(selector, timeout=5000)
            value = await self.page.get_attribute(selector, attribute)
            
            return {'status': 'ok', 'value': value, 'selector': selector, 'attribute': attribute}
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def wait_for(self, selector: str, timeout: int = 10000) -> Dict[str, Any]:
        """Aguarda elemento aparecer"""
        try:
            self._ensure_browser()
            
            logger.info(f"⏳ Aguardando: {selector}")
            
            await self.page.wait_for_selector(selector, state='visible', timeout=timeout)
            
            logger.info(f"✅ Elemento encontrado: {selector}")
            
            return {'status': 'ok', 'selector': selector}
        
        except Exception as e:
            logger.error(f"❌ Timeout aguardando: {selector}")
            return {'status': 'error', 'message': str(e)}
    
    async def scroll_to(self, selector: str) -> Dict[str, Any]:
        """Rola até elemento"""
        try:
            self._ensure_browser()
            
            await self.page.wait_for_selector(selector, timeout=5000)
            await self.page.locator(selector).scroll_into_view_if_needed()
            
            return {'status': 'ok', 'selector': selector}
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def hover(self, selector: str) -> Dict[str, Any]:
        """Hover sobre elemento"""
        try:
            self._ensure_browser()
            
            await self.page.wait_for_selector(selector, state='visible', timeout=5000)
            await self.page.hover(selector)
            
            return {'status': 'ok', 'selector': selector}
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def select_option(self, selector: str, value: str) -> Dict[str, Any]:
        """Seleciona opção em dropdown"""
        try:
            self._ensure_browser()
            
            await self.page.wait_for_selector(selector, timeout=5000)
            await self.page.select_option(selector, value)
            
            return {'status': 'ok', 'selector': selector, 'value': value}
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def check(self, selector: str) -> Dict[str, Any]:
        """Marca checkbox"""
        try:
            self._ensure_browser()
            
            await self.page.wait_for_selector(selector, timeout=5000)
            await self.page.check(selector)
            
            return {'status': 'ok', 'selector': selector}
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def uncheck(self, selector: str) -> Dict[str, Any]:
        """Desmarca checkbox"""
        try:
            self._ensure_browser()
            
            await self.page.wait_for_selector(selector, timeout=5000)
            await self.page.uncheck(selector)
            
            return {'status': 'ok', 'selector': selector}
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def new_tab(self, url: Optional[str] = None) -> Dict[str, Any]:
        """Abre nova aba"""
        try:
            self._ensure_browser()
            
            logger.info("📑 Abrindo nova aba")
            
            new_page = await self.context.new_page()
            self.tabs.append(new_page)
            self.page = new_page
            self.current_tab_index = len(self.tabs) - 1
            
            if url:
                await self.goto(url)
            
            logger.info(f"✅ Nova aba aberta (total: {len(self.tabs)})")
            
            return {
                'status': 'ok',
                'tab_index': self.current_tab_index,
                'total_tabs': len(self.tabs)
            }
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def switch_tab(self, index: int) -> Dict[str, Any]:
        """Troca para aba específica"""
        try:
            self._ensure_browser()
            
            if index < 0 or index >= len(self.tabs):
                return {'status': 'error', 'message': f'Índice inválido. Abas disponíveis: 0-{len(self.tabs)-1}'}
            
            self.page = self.tabs[index]
            self.current_tab_index = index
            
            await self.page.bring_to_front()
            
            return {
                'status': 'ok',
                'tab_index': index,
                'url': self.page.url,
                'title': await self.page.title()
            }
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def close_tab(self) -> Dict[str, Any]:
        """Fecha aba atual"""
        try:
            self._ensure_browser()
            
            if len(self.tabs) <= 1:
                return {'status': 'error', 'message': 'Não é possível fechar a última aba'}
            
            await self.page.close()
            self.tabs.pop(self.current_tab_index)
            
            # Volta para primeira aba
            self.current_tab_index = 0
            self.page = self.tabs[0]
            
            return {
                'status': 'ok',
                'remaining_tabs': len(self.tabs)
            }
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def get_page_info(self) -> Dict[str, Any]:
        """Retorna informações da página atual"""
        try:
            self._ensure_browser()
            
            return {
                'status': 'ok',
                'url': self.page.url,
                'title': await self.page.title(),
                'tab_index': self.current_tab_index,
                'total_tabs': len(self.tabs)
            }
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def evaluate(self, script: str) -> Dict[str, Any]:
        """Executa JavaScript na página"""
        try:
            self._ensure_browser()
            
            result = await self.page.evaluate(script)
            
            return {'status': 'ok', 'result': result}
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def fill_form(self, form_data: Dict[str, str]) -> Dict[str, Any]:
        """Preenche formulário com múltiplos campos"""
        try:
            self._ensure_browser()
            
            logger.info(f"📝 Preenchendo formulário com {len(form_data)} campos")
            
            filled = []
            errors = []
            
            for selector, value in form_data.items():
                try:
                    await self.page.wait_for_selector(selector, timeout=3000)
                    await self.page.fill(selector, value)
                    filled.append(selector)
                    logger.info(f"  ✅ {selector}: {value[:30]}...")
                except Exception as e:
                    errors.append({'selector': selector, 'error': str(e)})
                    logger.error(f"  ❌ {selector}: {str(e)}")
            
            return {
                'status': 'ok' if len(errors) == 0 else 'partial',
                'filled': filled,
                'errors': errors
            }
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def extract_links(self) -> Dict[str, Any]:
        """Extrai todos os links da página"""
        try:
            self._ensure_browser()
            
            links = await self.page.evaluate('''() => {
                return Array.from(document.querySelectorAll('a[href]')).map(a => ({
                    text: a.textContent.trim(),
                    href: a.href
                }));
            }''')
            
            return {'status': 'ok', 'links': links, 'count': len(links)}
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    async def pdf(self, filename: Optional[str] = None) -> Dict[str, Any]:
        """Exporta página como PDF"""
        try:
            self._ensure_browser()
            
            if not filename:
                filename = f'page_{int(asyncio.get_event_loop().time())}.pdf'
            
            logger.info(f"📄 Exportando PDF: {filename}")
            
            await self.page.pdf(path=filename)
            
            logger.info(f"✅ PDF salvo: {filename}")
            
            return {'status': 'ok', 'filename': filename}
        
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
