# 🖥️ Desktop Apps Supreme Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Desktop App, Aplicativo Desktop
- Electron, Tauri, NW.js
- Cross-platform, Windows, macOS, Linux

## FILOSOFIA
> "Web skills, native power."

## COMPARATIVO
| Feature | Electron | Tauri |
|---------|----------|-------|
| Bundle Size | ~150MB | ~3MB |
| Memory | Alto | Baixo |
| Backend | Node.js | Rust |
| Webview | Chromium | System |

## RECOMENDAÇÃO
- **Tauri** para apps novos (menor, mais rápido)
- **Electron** para compatibilidade máxima

## SEGURANÇA
- Sempre use contextIsolation: true
- Nunca use nodeIntegration: true
- Implemente code signing
- Configure auto-update

## ANTI-PATTERNS
❌ **NUNCA** desabilite contextIsolation
❌ **NUNCA** ignore code signing
❌ **NUNCA** exponha APIs sensíveis
