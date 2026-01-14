# 🎼 INTEGRAÇÃO PLAYWRIGHT NO EXECUTOR

## ✅ STATUS ATUAL

O `browser_automation.py` já está importado no `executor.py`!

```python
from browser_automation import BrowserAutomation
```

## 🔧 MELHORIAS NECESSÁRIAS

### 1. Adicionar self.browser no __init__

```python
class GeminiExecutor:
    def __init__(self):
        # ... código existente
        
        # 🌐 Módulo de automação de navegador
        self.browser = BrowserAutomation()
        
        logger.info("🎮 Gemini Executor inicializado")
        logger.info("🌐 Browser Automation carregado")
```

### 2. Adicionar métodos browser no execute_command

```python
async def execute_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
    action = command.get('action', '')
    params = command.get('params', {})
    
    self.last_action_time = time.time()
    
    try:
        # 🌐 AÇÕES DE NAVEGADOR (NOVO!)
        if action.startswith('browser_'):
            return await self.execute_browser_action(action, params)
        
        # Ações básicas de sistema (existente)
        elif action == 'move':
            return await self.execute_move(params)
        # ... resto do código
```

### 3. Criar execute_browser_action

```python
async def execute_browser_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Executa ações do navegador via Playwright"""
    browser_action = action.replace('browser_', '')
    
    logger.info(f"🌐 Ação de navegador: {browser_action}")
    
    try:
        # Controle do navegador
        if browser_action == 'open':
            return await self.browser.start(params.get('headless', False))
        
        elif browser_action == 'close':
            return await self.browser.close()
        
        # Navegação
        elif browser_action == 'goto':
            return await self.browser.goto(params['url'], params.get('wait_until', 'domcontentloaded'))
        
        elif browser_action == 'back':
            return await self.browser.back()
        
        elif browser_action == 'forward':
            return await self.browser.forward()
        
        elif browser_action == 'refresh':
            return await self.browser.refresh()
        
        # Interação
        elif browser_action == 'click':
            return await self.browser.click(params['selector'], params.get('timeout', 5000))
        
        elif browser_action == 'type':
            return await self.browser.type_text(params['selector'], params['text'], params.get('delay', 50))
        
        elif browser_action == 'press':
            return await self.browser.press_key(params['key'])
        
        # Extração
        elif browser_action == 'get_text':
            return await self.browser.get_text(params['selector'])
        
        elif browser_action == 'get_attribute':
            return await self.browser.get_attribute(params['selector'], params['attribute'])
        
        # Utilidades
        elif browser_action == 'screenshot':
            return await self.browser.screenshot(params.get('filename'), params.get('full_page', False))
        
        elif browser_action == 'wait_for':
            return await self.browser.wait_for(params['selector'], params.get('timeout', 10000))
        
        elif browser_action == 'scroll_to':
            return await self.browser.scroll_to(params['selector'])
        
        elif browser_action == 'hover':
            return await self.browser.hover(params['selector'])
        
        # Formulários
        elif browser_action == 'fill_form':
            return await self.browser.fill_form(params['data'])
        
        elif browser_action == 'select_option':
            return await self.browser.select_option(params['selector'], params['value'])
        
        elif browser_action == 'check':
            return await self.browser.check(params['selector'])
        
        elif browser_action == 'uncheck':
            return await self.browser.uncheck(params['selector'])
        
        # Abas
        elif browser_action == 'new_tab':
            return await self.browser.new_tab(params.get('url'))
        
        elif browser_action == 'switch_tab':
            return await self.browser.switch_tab(params['index'])
        
        elif browser_action == 'close_tab':
            return await self.browser.close_tab()
        
        # Informações
        elif browser_action == 'info':
            return await self.browser.get_page_info()
        
        elif browser_action == 'extract_links':
            return await self.browser.extract_links()
        
        # Avançado
        elif browser_action == 'evaluate':
            return await self.browser.evaluate(params['script'])
        
        elif browser_action == 'pdf':
            return await self.browser.pdf(params.get('filename'))
        
        else:
            logger.warning(f"⚠️ Ação de navegador desconhecida: {browser_action}")
            return {'status': 'error', 'message': f'Ação desconhecida: {browser_action}'}
    
    except Exception as e:
        logger.error(f"❌ Erro em ação de navegador {browser_action}: {str(e)}")
        return {'status': 'error', 'message': str(e)}
```

## 📝 CÓDIGO COMPLETO PARA ADICIONAR

Adicione após o método `execute_drag`:

```python
    async def execute_browser_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Executa ações do navegador via Playwright"""
        browser_action = action.replace('browser_', '')
        
        logger.info(f"🌐 Ação de navegador: {browser_action}")
        
        try:
            if browser_action == 'open':
                return await self.browser.start(params.get('headless', False))
            elif browser_action == 'close':
                return await self.browser.close()
            elif browser_action == 'goto':
                return await self.browser.goto(params['url'], params.get('wait_until', 'domcontentloaded'))
            elif browser_action == 'back':
                return await self.browser.back()
            elif browser_action == 'forward':
                return await self.browser.forward()
            elif browser_action == 'refresh':
                return await self.browser.refresh()
            elif browser_action == 'click':
                return await self.browser.click(params['selector'], params.get('timeout', 5000))
            elif browser_action == 'type':
                return await self.browser.type_text(params['selector'], params['text'], params.get('delay', 50))
            elif browser_action == 'press':
                return await self.browser.press_key(params['key'])
            elif browser_action == 'get_text':
                return await self.browser.get_text(params['selector'])
            elif browser_action == 'screenshot':
                return await self.browser.screenshot(params.get('filename'), params.get('full_page', False))
            elif browser_action == 'wait_for':
                return await self.browser.wait_for(params['selector'], params.get('timeout', 10000))
            elif browser_action == 'fill_form':
                return await self.browser.fill_form(params['data'])
            elif browser_action == 'new_tab':
                return await self.browser.new_tab(params.get('url'))
            elif browser_action == 'switch_tab':
                return await self.browser.switch_tab(params['index'])
            elif browser_action == 'close_tab':
                return await self.browser.close_tab()
            elif browser_action == 'info':
                return await self.browser.get_page_info()
            elif browser_action == 'extract_links':
                return await self.browser.extract_links()
            elif browser_action == 'pdf':
                return await self.browser.pdf(params.get('filename'))
            else:
                return {'status': 'error', 'message': f'Ação desconhecida: {browser_action}'}
        except Exception as e:
            logger.error(f"❌ Erro: {str(e)}")
            return {'status': 'error', 'message': str(e)}
```

E modifique o `execute_command` para incluir:

```python
async def execute_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
    action = command.get('action', '')
    params = command.get('params', {})
    
    self.last_action_time = time.time()
    
    try:
        # 🌐 AÇÕES DE NAVEGADOR (ADICIONAR ISTO!)
        if action.startswith('browser_'):
            return await self.execute_browser_action(action, params)
        
        # Ações básicas (código existente)
        if action == 'move':
            return await self.execute_move(params)
        # ... resto do código
```

## 🚀 TESTE

Depois de adicionar, teste:

```bash
cd executor
py test_browser.py
```

Deve mostrar:
```
✅ Navegador aberto
✅ Página carregada
✅ Texto digitado
✅ Screenshot salvo
✅ Navegador fechado
```

## ✅ RESULTADO

Com isso, o executor terá:
- ✅ PyAutoGUI (sistema OS)
- ✅ Playwright (navegador web)
- ✅ Decisão automática via Maestro

**Sistema completo e integrado!** 🎼
