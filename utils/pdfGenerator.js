import jsPDF from 'jspdf';
import { formatDate } from './dateUtils';

export const generatePDF = async (prescription, patient) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  let yPosition = 20;

  // Header
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.text('Dr. Prashant Nikam', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text('BAMS (College Name)', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 8;
  pdf.text('Chaitanya Hospital, Deola | Phone: +91-9422765758', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 15;

  // Patient Information
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text('Patient Information', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(11);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Name: ${patient.name}`, 20, yPosition);
  pdf.text(`Age: ${patient.age} years`, 120, yPosition);
  
  yPosition += 8;
  pdf.text(`Gender: ${patient.gender}`, 20, yPosition);
  pdf.text(`Phone: ${patient.phone}`, 120, yPosition);
  
  yPosition += 8;
  pdf.text(`Date: ${formatDate(prescription.visitDate)}`, 20, yPosition);
  pdf.text(`Patient ID: ${patient.id}`, 120, yPosition);
  
  yPosition += 15;

  // Symptoms
  if (prescription.symptoms.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Symptoms:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    prescription.symptoms.forEach(symptom => {
      pdf.text(`• ${symptom.name} (${symptom.severity}) - ${symptom.duration}`, 25, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Diagnosis
  if (prescription.diagnosis.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Diagnosis:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    prescription.diagnosis.forEach(diag => {
      pdf.text(`• ${diag.name}`, 25, yPosition);
      if (diag.description) {
        yPosition += 6;
        pdf.text(`  ${diag.description}`, 30, yPosition);
      }
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Medications
  if (prescription.medications.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Medications:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    prescription.medications.forEach((med, index) => {
      const timing = med.timing.replace('_', ' ');
      pdf.text(`${index + 1}. ${med.name}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`   Dosage: ${med.dosage} | ${timing} | ${med.frequency}`, 30, yPosition);
      if (med.duration) {
        yPosition += 6;
        pdf.text(`   Duration: ${med.duration}`, 30, yPosition);
      }
      yPosition += 8;
    });
    yPosition += 5;
  }

  // Lab Results
  if (prescription.labResults.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Lab Results:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    prescription.labResults.forEach(lab => {
      pdf.text(`• ${lab.testName}: ${lab.result}`, 25, yPosition);
      if (lab.normalRange) {
        pdf.text(`(Normal: ${lab.normalRange})`, 120, yPosition);
      }
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Advice
  if (prescription.advice) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Advice:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const adviceLines = pdf.splitTextToSize(prescription.advice, pageWidth - 50);
    pdf.text(adviceLines, 25, yPosition);
    yPosition += adviceLines.length * 6 + 10;
  }

  // Follow-up
  if (prescription.followUpDate) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Next Visit: ${formatDate(prescription.followUpDate)}`, 20, yPosition);
    yPosition += 15;
  }

  // Footer
  yPosition = pdf.internal.pageSize.height - 30;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text('This is a computer generated prescription.', pageWidth / 2, yPosition, { align: 'center' });

  // Save the PDF
  const pdfBlob = pdf.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prescription-${patient.name}-${formatDate(prescription.visitDate)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return pdfBlob;
};