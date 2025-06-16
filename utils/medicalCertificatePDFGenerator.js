import jsPDF from 'jspdf';
import { formatDate } from './dateUtils';

export const generateMedicalCertificatePDF = async (certificate, patient, autoDownload = true) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Add decorative border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  pdf.setLineWidth(0.5);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

  let yPosition = 35;

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MEDICAL / FITNESS CERTIFICATE', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Certificate number and date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`No.: MC${Date.now().toString().slice(-6)}`, margin, yPosition);
  pdf.text(`Date: ${formatDate(certificate.issuedDate)}`, pageWidth - margin - 40, yPosition);
  
  yPosition += 15;

  // Patient basic info
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  // Name line
  pdf.text('Name', margin, yPosition);
  pdf.line(margin + 15, yPosition, pageWidth - margin, yPosition);
  pdf.text(certificate.patientName, margin + 20, yPosition - 2);
  
  yPosition += 10;

  // Age, Sex, Height, Weight line
  const basicInfoY = yPosition;
  pdf.text('Age', margin, basicInfoY);
  pdf.line(margin + 10, basicInfoY, margin + 35, basicInfoY);
  pdf.text(certificate.age, margin + 15, basicInfoY - 2);

  pdf.text('Sex', margin + 45, basicInfoY);
  pdf.line(margin + 55, basicInfoY, margin + 80, basicInfoY);
  pdf.text(certificate.sex, margin + 60, basicInfoY - 2);

  pdf.text('Height', margin + 90, basicInfoY);
  pdf.line(margin + 105, basicInfoY, margin + 130, basicInfoY);
  pdf.text(certificate.height || '', margin + 110, basicInfoY - 2);

  pdf.text('Weight', margin + 140, basicInfoY);
  pdf.line(margin + 155, basicInfoY, pageWidth - margin, basicInfoY);
  pdf.text(certificate.weight || '', margin + 160, basicInfoY - 2);

  yPosition += 15;

  // General Examination
  pdf.setFont('helvetica', 'bold');
  pdf.text('General Examination', margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  
  // Identification Marks
  pdf.text('Identification Marks', margin, yPosition);
  pdf.line(margin + 45, yPosition, pageWidth - margin, yPosition);
  pdf.text(certificate.identificationMarks || '', margin + 50, yPosition - 2);
  yPosition += 8;

  // Build
  pdf.text('Built', margin, yPosition);
  pdf.line(margin + 15, yPosition, pageWidth - margin, yPosition);
  pdf.text(certificate.build || '', margin + 20, yPosition - 2);
  yPosition += 8;

  // Color of Eyes and Skin
  pdf.text('Colour of Eyes', margin, yPosition);
  pdf.line(margin + 35, yPosition, margin + 80, yPosition);
  pdf.text(certificate.colourOfEyes || '', margin + 40, yPosition - 2);

  pdf.text('Colour of Skin', margin + 90, yPosition);
  pdf.line(margin + 125, yPosition, pageWidth - margin, yPosition);
  pdf.text(certificate.colourOfSkin || '', margin + 130, yPosition - 2);
  yPosition += 8;

  // Pulse, BP, Vision
  pdf.text('Pulse', margin, yPosition);
  pdf.line(margin + 15, yPosition, margin + 60, yPosition);
  pdf.text(certificate.pulse || '', margin + 20, yPosition - 2);

  pdf.text('BP', margin + 70, yPosition);
  pdf.line(margin + 80, yPosition, margin + 120, yPosition);
  pdf.text(certificate.bp || '', margin + 85, yPosition - 2);

  pdf.text('Vision', margin + 130, yPosition);
  pdf.line(margin + 145, yPosition, pageWidth - margin, yPosition);
  pdf.text(certificate.vision || '', margin + 150, yPosition - 2);
  yPosition += 15;

  // Respiratory system
  pdf.setFont('helvetica', 'bold');
  pdf.text('Respiratory system', margin, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.text('Chest Measurement - Insp :', margin, yPosition);
  pdf.text(certificate.chestMeasurementInsp || '', margin + 60, yPosition);
  pdf.text('Exp :', margin + 100, yPosition);
  pdf.text(certificate.chestMeasurementExp || '', margin + 115, yPosition);
  yPosition += 8;

  pdf.text('Lungs', margin, yPosition);
  pdf.line(margin + 15, yPosition, pageWidth - margin, yPosition);
  pdf.text(certificate.lungs || '', margin + 20, yPosition - 2);
  yPosition += 8;

  pdf.text('Cardiovascular system', margin, yPosition);
  pdf.line(margin + 50, yPosition, pageWidth - margin, yPosition);
  pdf.text(certificate.cardiovascularSystem || '', margin + 55, yPosition - 2);
  yPosition += 15;

  // Gastrointestinal system
  pdf.setFont('helvetica', 'bold');
  pdf.text('Gastrointestinal system', margin, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.text('Liver', margin, yPosition);
  pdf.line(margin + 15, yPosition, margin + 80, yPosition);
  pdf.text(certificate.liver || '', margin + 20, yPosition - 2);

  pdf.text('Spleen', margin + 90, yPosition);
  pdf.line(margin + 105, yPosition, pageWidth - margin, yPosition);
  pdf.text(certificate.spleen || '', margin + 110, yPosition - 2);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Urinary system', margin, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.text('Urine', margin, yPosition);
  pdf.line(margin + 15, yPosition, pageWidth - margin, yPosition);
  pdf.text(certificate.urine || '', margin + 20, yPosition - 2);
  yPosition += 15;

  // Remarks
  pdf.setFont('helvetica', 'bold');
  pdf.text('Remarks', margin, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  if (certificate.remarks) {
    const remarkLines = pdf.splitTextToSize(certificate.remarks, contentWidth - 20);
    pdf.text(remarkLines, margin, yPosition);
    yPosition += remarkLines.length * 5 + 10;
  } else {
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
  }

  // Certification statement
  const certificationText = `This is to certify that I have examined Mr / Ms ${certificate.patientName} and find him / her medically ${certificate.fitnessStatus === 'fit' ? 'Fit' : 'Unfit'} ${certificate.certificateFor ? `for ${certificate.certificateFor}` : ''}.`;
  const certLines = pdf.splitTextToSize(certificationText, contentWidth - 20);
  pdf.text(certLines, margin, yPosition);
  yPosition += certLines.length * 5 + 20;

  // Doctor signature
  pdf.setFont('helvetica', 'bold');
  pdf.text('Dr. Prashant Kisanrao Nikam', pageWidth - margin - 60, yPosition);
  yPosition += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Chaitnya Hospital & X Ray Clinic', pageWidth - margin - 60, yPosition);
  yPosition += 4;
  pdf.text('Adgaon, Dist. Nashik.', pageWidth - margin - 60, yPosition);
  yPosition += 4;
  pdf.text('Reg. No. I-34621-A', pageWidth - margin - 60, yPosition);

  pdf.text('Dr. Sign & Stamp', margin, yPosition - 15);
  pdf.text('Reg. No. :', margin, yPosition - 10);

  // Generate blob
  const pdfBlob = pdf.output('blob');

  // Remove automatic logging here since it's handled when certificate is created
  // Activity logging should only happen when certificate is actually saved, not when PDF is generated

  if (autoDownload) {
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-certificate-${certificate.patientName}-${formatDate(certificate.issuedDate)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return pdfBlob;
};
