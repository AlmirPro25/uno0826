/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                  ║
 * ║  ██████╗ ██████╗ ███████╗    ██████╗  ██████╗  ██████╗███████╗                                   ║
 * ║  ██╔══██╗██╔══██╗██╔════╝    ██╔══██╗██╔═══██╗██╔════╝██╔════╝                                   ║
 * ║  ██████╔╝██║  ██║█████╗      ██║  ██║██║   ██║██║     ███████╗                                   ║
 * ║  ██╔═══╝ ██║  ██║██╔══╝      ██║  ██║██║   ██║██║     ╚════██║                                   ║
 * ║  ██║     ██████╔╝██║         ██████╔╝╚██████╔╝╚██████╗███████║                                   ║
 * ║  ╚═╝     ╚═════╝ ╚═╝         ╚═════╝  ╚═════╝  ╚═════╝╚══════╝                                   ║
 * ║                                                                                                  ║
 * ║  PDF & DOCUMENTS SUPREME MASTER - Professional Document Generation                              ║
 * ║  React-PDF, PDFKit, Puppeteer, Invoices, Reports, Certificates                                  ║
 * ║                                                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

export const PDF_DOCUMENTS_MANIFEST = `
# 📄 PDF & DOCUMENTS SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- PDF, Document, Documento, Geração de PDF
- React-PDF, PDFKit, Puppeteer PDF, Playwright PDF
- Invoice, Fatura, Relatório, Report, Certificate
- Template, Geração de documentos, Document Generation
- jsPDF, pdfmake, html2pdf, pdf-lib
- Nota Fiscal, Boleto, Contrato, Receipt
- Print, Impressão, Page Break, Pagination

## FILOSOFIA
> "Documentos profissionais são a interface entre sistemas e humanos. Cada pixel importa."

### Princípios Invioláveis
1. **Server-Side Generation** - PDFs grandes devem ser gerados no servidor
2. **Template Reusability** - Crie componentes reutilizáveis
3. **Print-First Design** - Otimize para impressão (margins, page breaks)
4. **Accessibility** - PDFs devem ser acessíveis (tagged PDF)
5. **Performance** - Use streaming para PDFs grandes
6. **Internationalization** - Suporte a múltiplos idiomas e formatos

## ARQUITETURA DE GERAÇÃO DE PDFs

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PDF GENERATION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        DATA LAYER                                    │   │
│  │  [Database] → [API] → [Data Transformation] → [Template Data]       │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     TEMPLATE ENGINE                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │ React-PDF   │  │   HTML      │  │  PDFKit     │                  │   │
│  │  │ Components  │  │  Templates  │  │   Direct    │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     PDF RENDERER                                     │   │
│  │  [React-PDF] [Puppeteer/Playwright] [PDFKit] [pdf-lib]              │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     OUTPUT                                           │   │
│  │  [Buffer] → [Stream] → [File] → [S3/Storage] → [Email/Download]     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## COMPARATIVO DE SOLUÇÕES

| Solução | Tipo | Melhor Para | Complexidade | Performance |
|---------|------|-------------|--------------|-------------|
| @react-pdf/renderer | React Components | PDFs complexos, layouts | Média | Boa |
| Puppeteer/Playwright | HTML → PDF | Qualquer HTML/CSS | Baixa | Média |
| PDFKit | Programático | Server-side, streaming | Alta | Excelente |
| pdf-lib | Manipulação | Editar PDFs existentes | Média | Excelente |
| jsPDF | Browser | PDFs simples, client-side | Baixa | Boa |
| pdfmake | Declarativo | Tabelas, layouts simples | Baixa | Boa |

## REACT-PDF (Recomendado para React)

\`\`\`typescript
// lib/pdf/invoice-template.tsx
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer';

// Registrar fontes customizadas
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
  ],
});

// Estilos profissionais
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 40,
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 9,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  col: {
    flex: 1,
  },
  colSmall: {
    width: 60,
    textAlign: 'right',
  },
  colMedium: {
    width: 80,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#1a1a1a',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#999',
  },
});

// Tipos
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  number: string;
  date: string;
  dueDate: string;
  customer: {
    name: string;
    email: string;
    address: string;
    taxId?: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
    logo?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
}

// Componente de Invoice
export const InvoiceDocument = ({ invoice }: { invoice: InvoiceData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        {invoice.company.logo && (
          <Image src={invoice.company.logo} style={styles.logo} />
        )}
        <View style={styles.companyInfo}>
          <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{invoice.company.name}</Text>
          <Text>{invoice.company.address}</Text>
          <Text>{invoice.company.phone}</Text>
          <Text>{invoice.company.email}</Text>
          <Text>CNPJ: {invoice.company.taxId}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>FATURA #{invoice.number}</Text>

      {/* Invoice Info */}
      <View style={{ flexDirection: 'row', marginBottom: 30 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Faturar Para</Text>
          <Text style={{ fontWeight: 'bold' }}>{invoice.customer.name}</Text>
          <Text>{invoice.customer.email}</Text>
          <Text>{invoice.customer.address}</Text>
          {invoice.customer.taxId && <Text>CPF/CNPJ: {invoice.customer.taxId}</Text>}
        </View>
        <View style={{ width: 150 }}>
          <Text style={styles.sectionTitle}>Detalhes</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>Data:</Text>
            <Text>{invoice.date}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>Vencimento:</Text>
            <Text>{invoice.dueDate}</Text>
          </View>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.section}>
        <View style={styles.tableHeader}>
          <Text style={styles.col}>Descrição</Text>
          <Text style={styles.colSmall}>Qtd</Text>
          <Text style={styles.colMedium}>Preço Unit.</Text>
          <Text style={styles.colMedium}>Total</Text>
        </View>
        
        {invoice.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.col}>{item.description}</Text>
            <Text style={styles.colSmall}>{item.quantity}</Text>
            <Text style={styles.colMedium}>
              {formatCurrency(item.unitPrice)}
            </Text>
            <Text style={styles.colMedium}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={{ alignItems: 'flex-end', marginTop: 20 }}>
        <View style={{ width: 200 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text>Impostos ({invoice.taxRate}%):</Text>
            <Text>{formatCurrency(invoice.tax)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={{ marginTop: 40 }}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <Text style={{ fontSize: 9, color: '#666' }}>{invoice.notes}</Text>
        </View>
      )}

      {/* Payment Terms */}
      {invoice.paymentTerms && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Condições de Pagamento</Text>
          <Text style={{ fontSize: 9, color: '#666' }}>{invoice.paymentTerms}</Text>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        Este documento foi gerado eletronicamente e é válido sem assinatura.
      </Text>
      
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => \`\${pageNumber} / \${totalPages}\`}
        fixed
      />
    </Page>
  </Document>
);

// Helper
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// API para gerar PDF
export async function generateInvoicePDF(invoice: InvoiceData): Promise<Blob> {
  return await pdf(<InvoiceDocument invoice={invoice} />).toBlob();
}

// Server-side (Node.js)
export async function generateInvoicePDFBuffer(invoice: InvoiceData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  return await renderToBuffer(<InvoiceDocument invoice={invoice} />);
}
\`\`\`

## PUPPETEER/PLAYWRIGHT (HTML → PDF)

\`\`\`typescript
// lib/pdf/html-to-pdf.ts
import puppeteer, { Browser, Page } from 'puppeteer';

// Pool de browsers para performance
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }
  return browserInstance;
}

interface PDFOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  landscape?: boolean;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
  printBackground?: boolean;
  scale?: number;
}

export async function htmlToPDF(
  html: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Configurar viewport para consistência
    await page.setViewport({ width: 1200, height: 800 });
    
    // Carregar HTML
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000,
    });
    
    // Aguardar fontes carregarem
    await page.evaluateHandle('document.fonts.ready');
    
    // Gerar PDF
    const pdf = await page.pdf({
      format: options.format || 'A4',
      landscape: options.landscape || false,
      printBackground: options.printBackground ?? true,
      margin: options.margin || {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || \`
        <div style="font-size: 10px; text-align: center; width: 100%;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      \`,
      scale: options.scale || 1,
    });
    
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

// Template HTML profissional
export function createInvoiceHTML(invoice: InvoiceData): string {
  return \`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #333;
          line-height: 1.5;
        }
        
        .invoice {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        
        .logo {
          max-width: 150px;
          height: auto;
        }
        
        .company-info {
          text-align: right;
          font-size: 11px;
          color: #666;
        }
        
        .title {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 30px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        
        .section-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e5e5e5;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #666;
        }
        
        td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .text-right {
          text-align: right;
        }
        
        .totals {
          display: flex;
          justify-content: flex-end;
        }
        
        .totals-table {
          width: 250px;
        }
        
        .totals-table td {
          padding: 8px 0;
        }
        
        .total-row {
          font-size: 16px;
          font-weight: 700;
          border-top: 2px solid #1a1a1a;
        }
        
        .total-value {
          color: #2563eb;
        }
        
        .notes {
          margin-top: 40px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .footer {
          margin-top: 60px;
          text-align: center;
          font-size: 10px;
          color: #999;
        }
        
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .invoice { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <img src="\${invoice.company.logo}" alt="Logo" class="logo">
          <div class="company-info">
            <strong>\${invoice.company.name}</strong><br>
            \${invoice.company.address}<br>
            \${invoice.company.phone}<br>
            \${invoice.company.email}<br>
            CNPJ: \${invoice.company.taxId}
          </div>
        </div>
        
        <h1 class="title">FATURA #\${invoice.number}</h1>
        
        <div class="info-grid">
          <div>
            <div class="section-title">Faturar Para</div>
            <strong>\${invoice.customer.name}</strong><br>
            \${invoice.customer.email}<br>
            \${invoice.customer.address}
          </div>
          <div>
            <div class="section-title">Detalhes</div>
            <table class="totals-table">
              <tr><td>Data:</td><td class="text-right">\${invoice.date}</td></tr>
              <tr><td>Vencimento:</td><td class="text-right">\${invoice.dueDate}</td></tr>
            </table>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th class="text-right">Qtd</th>
              <th class="text-right">Preço Unit.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            \${invoice.items.map(item => \`
              <tr>
                <td>\${item.description}</td>
                <td class="text-right">\${item.quantity}</td>
                <td class="text-right">\${formatCurrency(item.unitPrice)}</td>
                <td class="text-right">\${formatCurrency(item.total)}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">\${formatCurrency(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td>Impostos (\${invoice.taxRate}%):</td>
              <td class="text-right">\${formatCurrency(invoice.tax)}</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL:</td>
              <td class="text-right total-value">\${formatCurrency(invoice.total)}</td>
            </tr>
          </table>
        </div>
        
        \${invoice.notes ? \`
          <div class="notes">
            <div class="section-title">Observações</div>
            <p>\${invoice.notes}</p>
          </div>
        \` : ''}
        
        <div class="footer">
          Este documento foi gerado eletronicamente e é válido sem assinatura.
        </div>
      </div>
    </body>
    </html>
  \`;
}

// API Route (Next.js)
export async function POST(request: Request) {
  const invoice = await request.json();
  const html = createInvoiceHTML(invoice);
  const pdf = await htmlToPDF(html, {
    displayHeaderFooter: true,
  });
  
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': \`attachment; filename="invoice-\${invoice.number}.pdf"\`,
    },
  });
}
\`\`\`

## PDFKIT (Server-side streaming)

\`\`\`typescript
// lib/pdf/pdfkit-generator.ts
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export async function createInvoicePDFKit(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: \`Invoice \${invoice.number}\`,
        Author: invoice.company.name,
        Subject: 'Invoice',
        CreationDate: new Date(),
      },
    });
    
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    // Header
    if (invoice.company.logo) {
      doc.image(invoice.company.logo, 50, 45, { width: 100 });
    }
    
    doc
      .fontSize(10)
      .text(invoice.company.name, 400, 50, { align: 'right' })
      .text(invoice.company.address, { align: 'right' })
      .text(invoice.company.phone, { align: 'right' })
      .text(invoice.company.email, { align: 'right' });
    
    // Title
    doc
      .moveDown(3)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(\`FATURA #\${invoice.number}\`, 50);
    
    // Customer info
    doc
      .moveDown()
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Faturar Para:')
      .font('Helvetica')
      .text(invoice.customer.name)
      .text(invoice.customer.email)
      .text(invoice.customer.address);
    
    // Table header
    const tableTop = 300;
    doc
      .font('Helvetica-Bold')
      .text('Descrição', 50, tableTop)
      .text('Qtd', 300, tableTop, { width: 50, align: 'right' })
      .text('Preço', 370, tableTop, { width: 80, align: 'right' })
      .text('Total', 470, tableTop, { width: 80, align: 'right' });
    
    // Table rows
    let y = tableTop + 25;
    doc.font('Helvetica');
    
    invoice.items.forEach((item) => {
      doc
        .text(item.description, 50, y)
        .text(item.quantity.toString(), 300, y, { width: 50, align: 'right' })
        .text(formatCurrency(item.unitPrice), 370, y, { width: 80, align: 'right' })
        .text(formatCurrency(item.total), 470, y, { width: 80, align: 'right' });
      
      y += 25;
      
      // Page break if needed
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
    
    // Totals
    y += 20;
    doc
      .text('Subtotal:', 370, y, { width: 80, align: 'right' })
      .text(formatCurrency(invoice.subtotal), 470, y, { width: 80, align: 'right' });
    
    y += 20;
    doc
      .text(\`Impostos (\${invoice.taxRate}%):\`, 370, y, { width: 80, align: 'right' })
      .text(formatCurrency(invoice.tax), 470, y, { width: 80, align: 'right' });
    
    y += 25;
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('TOTAL:', 370, y, { width: 80, align: 'right' })
      .fillColor('#2563eb')
      .text(formatCurrency(invoice.total), 470, y, { width: 80, align: 'right' });
    
    // Footer
    doc
      .fillColor('#999')
      .fontSize(8)
      .text(
        'Este documento foi gerado eletronicamente e é válido sem assinatura.',
        50,
        750,
        { align: 'center' }
      );
    
    doc.end();
  });
}

// Streaming para arquivos grandes
export function createLargeReportStream(data: any[]): Readable {
  const doc = new PDFDocument();
  
  // Processar dados em chunks
  let index = 0;
  const processChunk = () => {
    while (index < data.length) {
      const item = data[index];
      doc.text(\`Item \${index + 1}: \${item.name}\`);
      index++;
      
      // Yield para não bloquear
      if (index % 100 === 0) {
        setImmediate(processChunk);
        return;
      }
    }
    doc.end();
  };
  
  processChunk();
  return doc;
}
\`\`\`

## PDF-LIB (Manipulação de PDFs existentes)

\`\`\`typescript
// lib/pdf/pdf-manipulation.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Adicionar marca d'água
export async function addWatermark(
  pdfBytes: Uint8Array,
  text: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const pages = pdfDoc.getPages();
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    
    page.drawText(text, {
      x: width / 2 - 100,
      y: height / 2,
      size: 50,
      font: helveticaFont,
      color: rgb(0.9, 0.9, 0.9),
      rotate: { angle: 45, type: 'degrees' },
      opacity: 0.3,
    });
  }
  
  return pdfDoc.save();
}

// Mesclar PDFs
export async function mergePDFs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const pdfBytes of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return mergedPdf.save();
}

// Extrair páginas
export async function extractPages(
  pdfBytes: Uint8Array,
  pageNumbers: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();
  
  const pages = await newDoc.copyPages(srcDoc, pageNumbers.map(n => n - 1));
  pages.forEach((page) => newDoc.addPage(page));
  
  return newDoc.save();
}

// Preencher formulário PDF
export async function fillPDFForm(
  pdfBytes: Uint8Array,
  formData: Record<string, string>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  
  for (const [fieldName, value] of Object.entries(formData)) {
    try {
      const field = form.getTextField(fieldName);
      field.setText(value);
    } catch (e) {
      console.warn(\`Field \${fieldName} not found\`);
    }
  }
  
  form.flatten(); // Torna campos não-editáveis
  return pdfDoc.save();
}
\`\`\`

## CHECKLIST COMPLETO

### Geração
- [ ] Fontes embutidas no PDF?
- [ ] Imagens otimizadas e comprimidas?
- [ ] Paginação automática funcionando?
- [ ] Headers/footers em todas as páginas?
- [ ] Page breaks em locais apropriados?
- [ ] Geração assíncrona para PDFs grandes?

### Performance
- [ ] Pool de browsers para Puppeteer?
- [ ] Streaming para arquivos grandes?
- [ ] Cache de templates?
- [ ] Timeout configurado?

### Qualidade
- [ ] Resolução adequada para impressão (300 DPI)?
- [ ] Cores CMYK para impressão profissional?
- [ ] Margens adequadas para encadernação?
- [ ] Metadados do documento preenchidos?

### Acessibilidade
- [ ] PDF tagged para screen readers?
- [ ] Ordem de leitura correta?
- [ ] Alt text em imagens?
- [ ] Contraste adequado?

## ANTI-PATTERNS

❌ **NUNCA** gere PDFs grandes no browser (use server-side)
❌ **NUNCA** bloqueie a thread principal com geração síncrona
❌ **NUNCA** ignore encoding de caracteres especiais
❌ **NUNCA** use imagens não otimizadas (aumenta tamanho)
❌ **NUNCA** esqueça de fechar o browser do Puppeteer
❌ **NUNCA** confie em CSS print sem testar
❌ **NUNCA** ignore page breaks em tabelas longas
❌ **NUNCA** hardcode textos (use i18n)

## RECURSOS

- React-PDF: https://react-pdf.org/
- PDFKit: http://pdfkit.org/
- pdf-lib: https://pdf-lib.js.org/
- Puppeteer: https://pptr.dev/
- Playwright: https://playwright.dev/
`;

export default PDF_DOCUMENTS_MANIFEST;
