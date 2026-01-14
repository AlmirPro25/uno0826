# 🌐 Exemplos de Navegação Web

## 🎯 Comandos Prontos para Testar

### Exemplo 1: Pesquisa Simples no Google

```python
# Via Python (executor)
await browser.start()
await browser.goto('https://google.com')
await browser.type_text('textarea[name="q"]', 'Python Playwright')
await browser.press_key('Enter')
await browser.screenshot('resultado_pesquisa.png')
```

```javascript
// Via API (JavaScript)
await fetch('http://localhost:3001/api/browser/open', { method: 'POST' });
await fetch('http://localhost:3001/api/browser/navigate', {
  method: 'POST',
  body: JSON.stringify({ url: 'https://google.com' })
});
await fetch('http://localhost:3001/api/browser/type', {
  method: 'POST',
  body: JSON.stringify({ selector: 'textarea[name="q"]', text: 'Python Playwright' })
});
await fetch('http://localhost:3001/api/browser/press', {
  method: 'POST',
  body: JSON.stringify({ key: 'Enter' })
});
```

```
# Via Chat (Linguagem Natural)
"Pesquisar Python Playwright no Google"
```

---

### Exemplo 2: Navegar em Múltiplos Sites

```python
# Abre navegador
await browser.start()

# Visita GitHub
await browser.goto('https://github.com')
await browser.screenshot('github.png')

# Nova aba para YouTube
await browser.new_tab('https://youtube.com')
await browser.screenshot('youtube.png')

# Nova aba para Stack Overflow
await browser.new_tab('https://stackoverflow.com')
await browser.screenshot('stackoverflow.png')

# Volta para primeira aba
await browser.switch_tab(0)
```

---

### Exemplo 3: Extrair Dados de Página

```python
# Navega para Hacker News
await browser.goto('https://news.ycombinator.com')

# Extrai todos os links
links = await browser.extract_links()
print(f"Encontrados {links['count']} links")

# Extrai título da página
title = await browser.get_text('.hnname a')
print(f"Título: {title['text']}")

# Captura screenshot
await browser.screenshot('hackernews.png', full_page=True)

# Exporta como PDF
await browser.pdf('hackernews.pdf')
```

---

### Exemplo 4: Preencher Formulário de Contato

```python
# Navega para página com formulário
await browser.goto('https://exemplo.com/contato')

# Preenche formulário
await browser.fill_form({
    '#nome': 'João Silva',
    '#email': 'joao@email.com',
    '#telefone': '11999999999',
    '#assunto': 'Dúvida sobre produto',
    '#mensagem': 'Gostaria de mais informações sobre o produto X'
})

# Aguarda um pouco
await asyncio.sleep(1)

# Clica no botão de enviar
await browser.click('button[type="submit"]')

# Aguarda confirmação
await browser.wait_for('.mensagem-sucesso', timeout=10000)

# Captura evidência
await browser.screenshot('formulario_enviado.png')
```

---

### Exemplo 5: Login Automatizado

```python
# Navega para página de login
await browser.goto('https://sistema.com/login')

# Preenche credenciais
await browser.type_text('#username', 'meu_usuario')
await browser.type_text('#password', 'minha_senha')

# Clica em login
await browser.click('button#login-btn')

# Aguarda dashboard carregar
await browser.wait_for('.dashboard', timeout=10000)

# Confirma login bem-sucedido
info = await browser.get_page_info()
print(f"Logado! URL: {info['url']}")
```

---

### Exemplo 6: Comparar Preços

```python
sites = [
    'https://loja1.com/produto',
    'https://loja2.com/produto',
    'https://loja3.com/produto'
]

precos = []

for site in sites:
    # Navega para site
    await browser.goto(site)
    
    # Aguarda preço carregar
    await browser.wait_for('.preco', timeout=5000)
    
    # Extrai preço
    preco = await browser.get_text('.preco')
    precos.append({
        'site': site,
        'preco': preco['text']
    })
    
    # Captura screenshot
    await browser.screenshot(f'preco_{len(precos)}.png')

# Ordena por preço
precos_ordenados = sorted(precos, key=lambda x: float(x['preco'].replace('R$', '').replace(',', '.')))
print("Melhor preço:", precos_ordenados[0])
```

---

### Exemplo 7: Baixar Arquivo

```python
# Navega para página de downloads
await browser.goto('https://site.com/downloads')

# Clica no botão de download
await browser.click('a.download-btn')

# Aguarda download iniciar
await asyncio.sleep(2)

# Verifica se arquivo foi baixado
# (arquivo vai para pasta Downloads do sistema)
print("Download iniciado!")
```

---

### Exemplo 8: Scroll e Captura de Página Longa

```python
# Navega para página longa
await browser.goto('https://site.com/artigo-longo')

# Rola até o final da página
await browser.evaluate('''
    window.scrollTo(0, document.body.scrollHeight);
''')

# Aguarda carregar conteúdo lazy-load
await asyncio.sleep(2)

# Captura página completa
await browser.screenshot('pagina_completa.png', full_page=True)
```

---

### Exemplo 9: Interação com Dropdown

```python
# Navega para formulário
await browser.goto('https://site.com/formulario')

# Seleciona país
await browser.select_option('#pais', 'Brasil')

# Seleciona estado
await browser.select_option('#estado', 'SP')

# Seleciona cidade
await browser.select_option('#cidade', 'São Paulo')

# Marca checkbox de aceite
await browser.check('#aceito-termos')

# Envia formulário
await browser.click('button[type="submit"]')
```

---

### Exemplo 10: Executar JavaScript Customizado

```python
# Navega para página
await browser.goto('https://site.com')

# Executa JavaScript para modificar página
await browser.evaluate('''
    // Muda cor de fundo
    document.body.style.backgroundColor = 'lightblue';
    
    // Adiciona texto
    const div = document.createElement('div');
    div.textContent = 'Modificado por automação!';
    div.style.fontSize = '24px';
    document.body.prepend(div);
''')

# Captura resultado
await browser.screenshot('pagina_modificada.png')

# Extrai dados com JavaScript
dados = await browser.evaluate('''
    () => {
        return {
            titulo: document.title,
            links: document.querySelectorAll('a').length,
            imagens: document.querySelectorAll('img').length
        };
    }
''')
print(dados)
```

---

## 🎯 Comandos em Linguagem Natural

Use estes comandos no chat do sistema:

```
✅ "Abra o Chrome"
✅ "Vá para google.com"
✅ "Pesquisar Python tutorial"
✅ "Abrir youtube.com"
✅ "Ir para github.com"
✅ "Pesquisar Playwright no Google"
✅ "Abra o Chrome e pesquise por 'Python Playwright tutorial'"
```

---

## 🔧 Seletores CSS Úteis

```css
/* Campos de formulário */
input[type="text"]
input[type="email"]
input[type="password"]
textarea
select

/* Botões */
button
button[type="submit"]
.btn-primary
#login-btn

/* Links */
a
a[href="/contato"]
a:has-text("Saiba mais")

/* Classes e IDs */
.classe
#id
.classe-1.classe-2

/* Atributos */
[name="username"]
[data-id="123"]
[aria-label="Fechar"]

/* Hierarquia */
form input[type="email"]
.container > .item
div.card .title

/* Pseudo-seletores */
button:first-child
li:nth-child(2)
a:last-of-type
```

---

## 🎨 Dicas de Uso

### 1. Sempre aguarde elementos carregarem
```python
await browser.wait_for('.elemento', timeout=5000)
await browser.click('.elemento')
```

### 2. Use screenshots para debug
```python
await browser.screenshot('antes.png')
await browser.click('.botao')
await browser.screenshot('depois.png')
```

### 3. Combine com visão computacional
```python
# Captura tela
await browser.screenshot('tela.png')

# Analisa com Gemini Vision
analise = await vision_service.analyzeScreen('encontre o botão de login')

# Clica no elemento identificado
await browser.click(analise['selector'])
```

### 4. Trate erros graciosamente
```python
try:
    await browser.click('.botao-opcional')
except:
    print("Botão não encontrado, continuando...")
```

### 5. Use delays quando necessário
```python
await browser.click('.botao')
await asyncio.sleep(1)  # Aguarda 1 segundo
await browser.type_text('#campo', 'texto')
```

---

## 🚀 Fluxo Completo de Automação

```python
async def automacao_completa():
    """Exemplo de automação completa"""
    
    # 1. Inicia navegador
    print("🚀 Iniciando navegador...")
    await browser.start(headless=False)
    
    # 2. Navega para site
    print("🌐 Navegando para site...")
    await browser.goto('https://exemplo.com')
    
    # 3. Faz login
    print("🔐 Fazendo login...")
    await browser.type_text('#username', 'usuario')
    await browser.type_text('#password', 'senha')
    await browser.click('#login-btn')
    await browser.wait_for('.dashboard')
    
    # 4. Navega para seção
    print("📂 Navegando para relatórios...")
    await browser.click('a[href="/relatorios"]')
    await browser.wait_for('.relatorios-lista')
    
    # 5. Extrai dados
    print("📊 Extraindo dados...")
    links = await browser.extract_links()
    
    # 6. Captura evidências
    print("📸 Capturando evidências...")
    await browser.screenshot('relatorios.png')
    await browser.pdf('relatorios.pdf')
    
    # 7. Faz logout
    print("👋 Fazendo logout...")
    await browser.click('#logout-btn')
    
    # 8. Fecha navegador
    print("🔒 Fechando navegador...")
    await browser.close()
    
    print("✅ Automação concluída!")

# Executa
asyncio.run(automacao_completa())
```

---

**Pronto para automatizar!** 🎉
