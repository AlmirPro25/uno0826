# Tema Dark/Light - MediSync

## 🎨 Implementação de Tema

O MediSync agora possui suporte completo para tema claro e escuro, com o estilo elegante do Gemini (preto sofisticado).

## 🌓 Características

### Tema Claro
- Fundo branco limpo
- Texto escuro para melhor legibilidade
- Cores vibrantes e acessíveis
- Ideal para uso durante o dia

### Tema Escuro (Gemini Style)
- Fundo preto elegante (#101010)
- Texto branco suave
- Cards com fundo cinza escuro (#1a1a1a)
- Reduz fadiga ocular à noite
- Estilo similar ao Google Gemini

## 🔄 Como Usar

### Alternar Tema
1. Clique no ícone de sol/lua no canto superior direito
2. O tema será alternado instantaneamente
3. A preferência é salva automaticamente

### Localização do Botão
- **Desktop**: Canto inferior esquerdo da sidebar
- **Mobile**: Canto superior direito do header

## 🛠️ Tecnologia

- **next-themes**: Gerenciamento de tema
- **Tailwind CSS**: Estilização responsiva
- **CSS Variables**: Cores dinâmicas

## 📝 Cores do Tema

### Tema Claro
```
Background: #FFFFFF (branco)
Foreground: #0A0A0A (preto)
Primary: #4A9EFF (azul)
Card: #FFFFFF
Border: #E5E5E5
```

### Tema Escuro
```
Background: #101010 (preto elegante)
Foreground: #FAFAFA (branco suave)
Primary: #4A9EFF (azul)
Card: #1A1A1A (cinza escuro)
Border: #333333
```

## 🎯 Componentes Afetados

Todos os componentes suportam tema automático:
- ✅ Buttons
- ✅ Cards
- ✅ Inputs
- ✅ Alerts
- ✅ Dialogs
- ✅ Sidebar
- ✅ Backgrounds
- ✅ Borders
- ✅ Text

## 💾 Persistência

A preferência de tema é salva em:
- **localStorage**: Para persistência entre sessões
- **System preference**: Detecta preferência do SO automaticamente

## 🔧 Customização

Para customizar as cores, edite `frontend/src/styles/globals.css`:

```css
:root {
  /* Tema claro */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.6%;
  /* ... mais cores */
}

.dark {
  /* Tema escuro */
  --background: 0 0% 6.3%;
  --foreground: 0 0% 98%;
  /* ... mais cores */
}
```

## 📱 Responsividade

O tema funciona perfeitamente em:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile
- ✅ Diferentes navegadores

## ⚡ Performance

- Transições suaves (300ms)
- Sem flash de conteúdo
- Carregamento rápido
- Otimizado para produção

## 🎨 Paleta de Cores

### Primária
- Light: #4A9EFF (azul vibrante)
- Dark: #4A9EFF (mesmo azul)

### Secundária
- Light: #2D3E50 (cinza escuro)
- Dark: #4A5568 (cinza claro)

### Destrutiva
- Light: #EF4444 (vermelho)
- Dark: #EF4444 (vermelho)

## 🌙 Modo Automático

Se nenhuma preferência for definida, o tema segue:
1. Preferência do navegador
2. Preferência do SO
3. Padrão: Tema escuro

## 📚 Referências

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Google Gemini Design](https://gemini.google.com)

## ✨ Dicas

- Use o tema escuro à noite para melhor conforto visual
- O tema claro é ideal para ambientes bem iluminados
- A transição é suave e não causa desconforto
- Todos os elementos mantêm acessibilidade em ambos os temas
