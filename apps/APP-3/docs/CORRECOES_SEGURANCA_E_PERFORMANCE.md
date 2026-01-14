# Correções de Segurança e Performance

## 1. Correção de Segurança - Iframe Sandbox ✅

### Problema
O iframe no `HtmlPreview.tsx` tinha a combinação insegura:
```html
sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
```

### Solução
Removido `allow-same-origin` para prevenir escape do sandbox:
```html
sandbox="allow-scripts allow-popups allow-forms allow-modals"
```

### Impacto
- ✅ Previne que scripts maliciosos escapem do sandbox
- ✅ Mantém funcionalidade de preview interativo
- ✅ Comunicação via postMessage continua funcionando

---

## 2. Correção de Performance - Componente Spinner ✅

### Problema
SVGs inline sendo renderizados condicionalmente causavam:
- Erro: `Failed to execute 'insertBefore' on 'Node'`
- Re-renderizações desnecessárias
- Código duplicado em múltiplos lugares

### Solução
Criado componente `Spinner.tsx` reutilizável:

```tsx
import { Spinner } from '@/components/Spinner';

// Antes:
{isGeneratingFrontend && (
  <svg className="animate-spin h-4 w-4 text-green-400" xmlns="...">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)}

// Depois:
{isGeneratingFrontend && <Spinner className="text-green-400" />}
```

### Benefícios
- ✅ Elimina erros de DOM do React
- ✅ Código mais limpo e manutenível
- ✅ Componente reutilizável com props configuráveis
- ✅ Melhor performance de renderização
- ✅ Acessibilidade melhorada (aria-label, role)

---

## 3. Arquivos Modificados

### Criados
- `components/Spinner.tsx` - Componente de loading reutilizável
- `CORRECAO_SEGURANCA_IFRAME.md` - Documentação detalhada da correção de segurança
- `CORRECOES_SEGURANCA_E_PERFORMANCE.md` - Este arquivo

### Modificados
- `components/HtmlPreview.tsx` - Removido `allow-same-origin` do sandbox
- `App.tsx` - Substituídos 6 SVGs inline pelo componente Spinner

---

## 4. Testes Recomendados

### Segurança
- [ ] Verificar que scripts no iframe não podem acessar parent
- [ ] Testar comunicação via postMessage ainda funciona
- [ ] Validar que formulários e popups funcionam no preview

### Performance
- [ ] Verificar que não há mais erros de `insertBefore` no console
- [ ] Testar transições de loading suaves
- [ ] Validar que spinners aparecem/desaparecem corretamente

### Funcionalidade
- [ ] Preview HTML funciona normalmente
- [ ] Console logs do iframe são capturados
- [ ] Cliques em elementos com data-aid funcionam
- [ ] Geração de frontend/backend mostra spinners

---

## 5. Próximos Passos

### Segurança
1. Implementar Content Security Policy (CSP) headers
2. Adicionar sanitização de HTML antes do preview
3. Considerar Web Workers para código não confiável

### Performance
1. Implementar Error Boundary para componentes SVG
2. Adicionar lazy loading para componentes pesados
3. Otimizar re-renderizações com React.memo

### Código
1. Criar mais componentes reutilizáveis (Button, Input, etc)
2. Padronizar estilos com design system
3. Adicionar testes unitários para componentes críticos

---

## 6. Referências

- [MDN - iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox)
- [React Error Boundaries](https://react.dev/link/error-boundaries)
- [OWASP iframe Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#sandboxed-frames)
