import React from 'react';
import { Button } from '@/components/ui/shadcn/Button';
import { Printer, Download } from 'lucide-react';

interface PrintButtonProps {
    contentId: string;
    title?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
    contentId,
    title = 'Documento',
    variant = 'outline',
    size = 'default',
    className,
}) => {
    const handlePrint = () => {
        const content = document.getElementById(contentId);
        if (!content) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        padding: 40px;
                        max-width: 800px;
                        margin: 0 auto;
                        color: #1a1a1a;
                    }
                    h1, h2, h3 { color: #0066cc; }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #0066cc;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .logo { font-size: 24px; font-weight: bold; color: #0066cc; }
                    .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
                    .label { font-weight: 600; color: #666; }
                    .value { color: #1a1a1a; }
                    .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">🏥 MediSync</div>
                    <p>Sistema de Telemedicina</p>
                </div>
                ${content.innerHTML}
                <div class="footer">
                    <p>Documento gerado pelo MediSync em ${new Date().toLocaleString('pt-BR')}</p>
                    <p>Este documento é válido apenas com assinatura digital do médico responsável.</p>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <Button variant={variant} size={size} onClick={handlePrint} className={className}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
        </Button>
    );
};

// Download as HTML file
interface DownloadButtonProps {
    contentId: string;
    filename?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

export const DownloadHtmlButton: React.FC<DownloadButtonProps> = ({
    contentId,
    filename = 'documento',
    variant = 'outline',
    size = 'default',
    className,
}) => {
    const handleDownload = () => {
        const content = document.getElementById(contentId);
        if (!content) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${filename}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1, h2, h3 { color: #0066cc; }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Button variant={variant} size={size} onClick={handleDownload} className={className}>
            <Download className="w-4 h-4 mr-2" />
            Baixar
        </Button>
    );
};
