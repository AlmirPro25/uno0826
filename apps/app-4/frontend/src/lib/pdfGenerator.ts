import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Prescription, PrescriptionMedication } from '@/api/prescriptions';
import { MedicalCertificate, certificateTypeLabels } from '@/api/certificates';

// Helper to add header to PDF
const addHeader = (doc: jsPDF, title: string) => {
  // Logo/Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('MediSync', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Sistema de Telemedicina', 105, 27, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);
  
  // Document title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, 105, 45, { align: 'center' });
};

// Helper to add footer
const addFooter = (doc: jsPDF, docId: number) => {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Documento digital emitido pelo sistema MediSync', 105, pageHeight - 18, { align: 'center' });
  doc.text(`ID: #${docId} | Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 105, pageHeight - 13, { align: 'center' });
};

// Generate Prescription PDF
export const generatePrescriptionPDF = (prescription: Prescription): void => {
  const doc = new jsPDF();
  
  addHeader(doc, 'RECEITA MÉDICA');
  
  let y = 55;
  
  // Patient and Doctor info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Paciente:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.patient?.fullName || 'N/A', 50, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Médico:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.doctor?.fullName || 'N/A', 50, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(prescription.issuedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), 50, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Válida até:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(prescription.validUntil), 'dd/MM/yyyy'), 50, y);
  
  // Diagnosis
  if (prescription.diagnosis) {
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Diagnóstico:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(prescription.diagnosis, 20, y);
  }
  
  // Medications
  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDICAMENTOS PRESCRITOS', 20, y);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  y += 3;
  doc.line(20, y, 190, y);
  
  let medications: PrescriptionMedication[] = [];
  try {
    medications = JSON.parse(prescription.medications);
  } catch {
    medications = [];
  }
  
  doc.setFontSize(10);
  medications.forEach((med, index) => {
    y += 10;
    
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 30;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${med.name} - ${med.dosage}`, 25, y);
    
    doc.setFont('helvetica', 'normal');
    const details: string[] = [];
    if (med.frequency) details.push(`Frequência: ${med.frequency}`);
    if (med.duration) details.push(`Duração: ${med.duration}`);
    if (med.quantity) details.push(`Quantidade: ${med.quantity}`);
    
    if (details.length > 0) {
      y += 5;
      doc.text(details.join(' | '), 30, y);
    }
    
    if (med.instructions) {
      y += 5;
      doc.setTextColor(80, 80, 80);
      doc.text(`Instruções: ${med.instructions}`, 30, y);
      doc.setTextColor(0, 0, 0);
    }
  });
  
  // General Instructions
  if (prescription.instructions) {
    y += 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Instruções Gerais:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    
    const lines = doc.splitTextToSize(prescription.instructions, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5;
  }
  
  // Notes
  if (prescription.notes) {
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text(`Observações: ${prescription.notes}`, 20, y);
  }
  
  addFooter(doc, prescription.id);
  
  // Save
  doc.save(`receita_${prescription.id}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

// Generate Medical Certificate PDF
export const generateCertificatePDF = (certificate: MedicalCertificate): void => {
  const doc = new jsPDF();
  
  addHeader(doc, certificateTypeLabels[certificate.type]?.toUpperCase() || 'ATESTADO MÉDICO');
  
  let y = 60;
  
  // Main content box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, y - 5, 170, 80, 3, 3, 'FD');
  
  // Certificate text
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  y += 5;
  doc.text('Atesto para os devidos fins que o(a) paciente:', 25, y);
  
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(certificate.patient?.fullName || 'N/A', 25, y);
  
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const startDate = format(new Date(certificate.startDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const endDate = format(new Date(certificate.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  if (certificate.type === 'absence') {
    doc.text(`Compareceu a esta consulta médica no dia ${startDate}.`, 25, y);
  } else if (certificate.type === 'medical_leave') {
    doc.text(`Necessita de afastamento de suas atividades por ${certificate.days} dia(s),`, 25, y);
    y += 6;
    doc.text(`no período de ${startDate} a ${endDate}.`, 25, y);
  } else {
    doc.text(`Encontra-se apto(a) para exercer suas atividades.`, 25, y);
  }
  
  if (certificate.reason) {
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Motivo:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(certificate.reason, 50, y);
  }
  
  if (certificate.cid) {
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('CID-10:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(certificate.cid, 50, y);
  }
  
  // Outside the box
  y = 155;
  
  if (certificate.restrictions) {
    doc.setFont('helvetica', 'bold');
    doc.text('Restrições:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(certificate.restrictions, 20, y);
    y += 12;
  }
  
  if (certificate.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    const lines = doc.splitTextToSize(certificate.notes, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 10;
  }
  
  // Doctor signature area
  y = 210;
  doc.setDrawColor(0, 0, 0);
  doc.line(55, y, 155, y);
  
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.doctor?.fullName || 'Médico Responsável', 105, y, { align: 'center' });
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Médico(a) Responsável', 105, y, { align: 'center' });
  
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(format(new Date(certificate.issuedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), 105, y, { align: 'center' });
  
  addFooter(doc, certificate.id);
  
  // Save
  doc.save(`atestado_${certificate.id}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};


// Medical Record interface
interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: number;
  diagnosis: string;
  notes: string;
  createdAt: string;
  patient?: { fullName: string };
  doctor?: { fullName: string };
}

// Generate Medical Record PDF
export const generateMedicalRecordPDF = (record: MedicalRecord): void => {
  const doc = new jsPDF();
  
  addHeader(doc, 'PRONTUÁRIO MÉDICO');
  
  let y = 55;
  
  // Patient info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Paciente:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(record.patient?.fullName || 'N/A', 55, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Médico:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(record.doctor?.fullName || 'N/A', 55, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(record.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }), 55, y);
  
  // Separator
  y += 12;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
  
  // Diagnosis
  y += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DIAGNÓSTICO', 20, y);
  
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  if (record.diagnosis) {
    const diagLines = doc.splitTextToSize(record.diagnosis, 170);
    doc.text(diagLines, 20, y);
    y += diagLines.length * 6;
  } else {
    doc.setTextColor(100, 100, 100);
    doc.text('Nenhum diagnóstico registrado.', 20, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
  }
  
  // Notes
  y += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVAÇÕES', 20, y);
  
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  if (record.notes) {
    const notesLines = doc.splitTextToSize(record.notes, 170);
    doc.text(notesLines, 20, y);
    y += notesLines.length * 6;
  } else {
    doc.setTextColor(100, 100, 100);
    doc.text('Nenhuma observação registrada.', 20, y);
    doc.setTextColor(0, 0, 0);
  }
  
  // Confidentiality notice
  y = 230;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Este documento contém informações confidenciais protegidas por sigilo médico.', 105, y, { align: 'center' });
  
  addFooter(doc, record.id);
  
  // Save
  doc.save(`prontuario_${record.id}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

// Generate Patient History PDF (multiple records)
export const generatePatientHistoryPDF = (patientName: string, records: MedicalRecord[]): void => {
  const doc = new jsPDF();
  
  addHeader(doc, 'HISTÓRICO MÉDICO');
  
  let y = 55;
  
  // Patient info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Paciente:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(patientName, 50, y);
  
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Total de registros:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(records.length), 65, y);
  
  // Separator
  y += 10;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
  
  // Records
  records.forEach((record, index) => {
    y += 12;
    
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 30;
    }
    
    // Record header
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(20, y - 5, 170, 8, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Registro #${index + 1} - ${format(new Date(record.createdAt), 'dd/MM/yyyy HH:mm')}`, 25, y);
    
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Médico: ${record.doctor?.fullName || 'N/A'}`, 25, y);
    
    if (record.diagnosis) {
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnóstico:', 25, y);
      doc.setFont('helvetica', 'normal');
      const diagLines = doc.splitTextToSize(record.diagnosis, 160);
      y += 5;
      doc.text(diagLines, 25, y);
      y += diagLines.length * 4;
    }
    
    if (record.notes) {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', 25, y);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(record.notes, 160);
      y += 5;
      doc.text(notesLines, 25, y);
      y += notesLines.length * 4;
    }
    
    y += 5;
  });
  
  // Confidentiality notice
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Este documento contém informações confidenciais protegidas por sigilo médico.', 105, pageHeight - 30, { align: 'center' });
  
  addFooter(doc, 0);
  
  // Save
  doc.save(`historico_${patientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
