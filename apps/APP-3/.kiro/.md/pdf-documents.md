# 📄 PDF & Documents Supreme Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- PDF, Documento, Document Generation
- React-PDF, PDFKit, Puppeteer PDF
- Invoice, Relatório, Report, Certificate
- jsPDF, pdf-lib, pdfmake

## FILOSOFIA
> "Documentos são a interface entre sistemas e humanos."

## STACK RECOMENDADA
| Caso | Solução |
|------|---------|
| React Components → PDF | @react-pdf/renderer |
| HTML → PDF | Puppeteer |
| Programático Node | PDFKit |
| Browser-side | jsPDF, pdf-lib |

## BOAS PRÁTICAS
- Use templates reutilizáveis
- Otimize para impressão (margins, page breaks)
- Suporte A4 e Letter
- Inclua metadados (autor, título)
- Gere em background para PDFs grandes

## ANTI-PATTERNS
❌ **NUNCA** gere PDFs síncronos em requests
❌ **NUNCA** ignore encoding de fontes
❌ **NUNCA** esqueça page breaks em tabelas longas
