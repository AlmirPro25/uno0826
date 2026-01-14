# 💻 CLI Development Supreme Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- CLI, Command Line, Terminal App
- Commander, Yargs, Inquirer, Oclif
- npx, global package, bin script
- Interactive prompts, Progress bars

## FILOSOFIA
> "Uma boa CLI é invisível - faz o trabalho sem atrapalhar."

## STACK RECOMENDADA
| Necessidade | Ferramenta |
|-------------|------------|
| Parsing args | Commander.js, Yargs |
| Prompts interativos | Inquirer, Prompts |
| Output bonito | Chalk, Ora, Boxen |
| Framework completo | Oclif |

## BOAS PRÁTICAS
- Suporte --help e --version
- Use exit codes corretos (0 sucesso, 1+ erro)
- Implemente --quiet e --verbose
- Suporte stdin/stdout para pipes
- Valide inputs com mensagens claras

## ANTI-PATTERNS
❌ **NUNCA** ignore exit codes
❌ **NUNCA** faça output sem formatação
❌ **NUNCA** bloqueie sem feedback de progresso
