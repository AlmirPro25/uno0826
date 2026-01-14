import { TriageReport } from '@/api/triage';

interface TriageReportPDFProps {
    report: TriageReport;
}

export function generateTriagePDF(report: TriageReport): void {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Por favor, permita pop-ups para gerar o PDF');
        return;
    }

    const priorityColor = getPriorityColor(report.priority);
    const priorityBg = getPriorityBg(report.priority);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório de Triagem - MediSync</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #0891b2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #0891b2;
        }
        .logo span {
            color: #1e40af;
        }
        .report-date {
            text-align: right;
            color: #6b7280;
            font-size: 14px;
        }
        .priority-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            color: white;
            background-color: ${priorityColor};
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 25px;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 10px;
            border-left: 4px solid #0891b2;
        }
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        .section-content {
            font-size: 16px;
            color: #1f2937;
        }
        .diagnosis-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        .diagnosis-item {
            background-color: #e0f2fe;
            color: #0369a1;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 13px;
            font-weight: 500;
        }
        .warning-box {
            background-color: ${priorityBg};
            border: 1px solid ${priorityColor};
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .warning-title {
            font-weight: bold;
            color: ${priorityColor};
            margin-bottom: 10px;
        }
        .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
        }
        .info-item {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
        }
        .info-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
        }
        .disclaimer {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 10px;
            padding: 15px;
            margin-top: 25px;
            font-size: 13px;
            color: #92400e;
        }
        @media print {
            body {
                padding: 20px;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Medi<span>Sync</span></div>
        <div class="report-date">
            <strong>Relatório de Triagem</strong><br>
            ${new Date(report.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
        </div>
    </div>

    <div class="priority-badge">${report.priority}</div>

    <div class="patient-info">
        <div class="info-item">
            <div class="info-label">Especialidade Recomendada</div>
            <div class="info-value">${report.recommended_specialty}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">${getStatusLabel(report.status)}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Queixa Principal</div>
        <div class="section-content">${report.patient_complaint}</div>
    </div>

    <div class="section">
        <div class="section-title">História da Doença Atual</div>
        <div class="section-content">${report.history_of_present_illness || 'Não informado'}</div>
    </div>

    ${report.vital_signs_note ? `
    <div class="section">
        <div class="section-title">Observações de Sinais Vitais</div>
        <div class="section-content">${report.vital_signs_note}</div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Hipóteses Diagnósticas</div>
        <div class="diagnosis-list">
            ${parseDiagnosis(report.suspected_diagnosis).map(d => `<span class="diagnosis-item">${d}</span>`).join('')}
        </div>
    </div>

    <div class="warning-box">
        <div class="warning-title">Justificativa da Classificação</div>
        <div class="section-content">${report.reasoning}</div>
    </div>

    <div class="disclaimer">
        <strong>⚠️ AVISO IMPORTANTE:</strong> Este relatório foi gerado por um sistema de inteligência artificial 
        e serve apenas como ferramenta de apoio à decisão clínica. A avaliação final e conduta devem ser 
        determinadas por um profissional de saúde qualificado. Em caso de emergência, procure atendimento 
        médico imediatamente.
    </div>

    <div class="footer">
        <p>MediSync - Sistema de Triagem Inteligente</p>
        <p>Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
        <p>ID do Relatório: #${report.id}</p>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

function parseDiagnosis(diagnosis: string | string[]): string[] {
    if (!diagnosis) return [];
    if (Array.isArray(diagnosis)) return diagnosis;
    try {
        const parsed = JSON.parse(diagnosis);
        return Array.isArray(parsed) ? parsed : [diagnosis];
    } catch {
        return [diagnosis];
    }
}

function getPriorityColor(priority: string): string {
    if (priority.includes('Vermelho')) return '#dc2626';
    if (priority.includes('Laranja')) return '#ea580c';
    if (priority.includes('Amarelo')) return '#ca8a04';
    if (priority.includes('Verde')) return '#16a34a';
    return '#2563eb';
}

function getPriorityBg(priority: string): string {
    if (priority.includes('Vermelho')) return '#fef2f2';
    if (priority.includes('Laranja')) return '#fff7ed';
    if (priority.includes('Amarelo')) return '#fefce8';
    if (priority.includes('Verde')) return '#f0fdf4';
    return '#eff6ff';
}

function getStatusLabel(status: string): string {
    switch (status) {
        case 'pending': return 'Pendente';
        case 'accepted': return 'Aceito';
        case 'reviewed': return 'Revisado';
        case 'completed': return 'Concluído';
        default: return status;
    }
}

// Button component for triggering PDF generation
export function TriageReportPDFButton({ report }: TriageReportPDFProps) {
    return (
        <button
            onClick={() => generateTriagePDF(report)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF
        </button>
    );
}
