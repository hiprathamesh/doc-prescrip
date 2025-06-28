import jsPDF from 'jspdf';
import { formatDate } from './dateUtils';
import { storage } from './storage';

export const generateMedicalCertificatePDF = async (certificate, patient, autoDownload = true) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Get current doctor details for multi-tenancy
  const currentDoctor = storage.getDoctorContext();
  const doctorName = currentDoctor?.name || 'Dr. Prashant Kisanrao Nikam';
  const doctorDegree = currentDoctor?.degree || 'BAMS (College Name)';
  const doctorRegNumber = currentDoctor?.registrationNumber || 'Reg. No: I-34621-A';
  const hospitalName = currentDoctor?.hospitalName || 'Chaitnya Hospital & X Ray Clinic';
  const hospitalAddress = currentDoctor?.hospitalAddress || 'Adgaon, Dist. Nashik.';

  // Get hospital logo for current doctor
  let hospitalLogo = null;
  try {
    if (currentDoctor?.doctorId) {
      const logoData = await storage.getHospitalLogo(currentDoctor.doctorId);
      if (logoData && logoData.base64) {
        hospitalLogo = logoData.base64;
      }
    }
  } catch (error) {
    console.warn('Could not load hospital logo:', error);
  }

  // Add decorative border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.5);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  pdf.setLineWidth(0.3);
  pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);

  let yPosition = 25;

  // Header Section
  // Hospital Logo (left side)
  if (hospitalLogo) {
    try {
      const imageFormat = hospitalLogo.split(';')[0].split('/')[1].toUpperCase();
      const validFormats = ['PNG', 'JPEG', 'JPG', 'WEBP'];
      const format = validFormats.includes(imageFormat) ? imageFormat : 'PNG';
      
      pdf.addImage(hospitalLogo, format, margin, yPosition, 50, 20);
    } catch (error) {
      console.warn('Could not add hospital logo to PDF:', error);
      // Add placeholder text if logo fails to load
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition, 50, 20, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.text('HOSPITAL LOGO', margin + 25, yPosition + 12, { align: 'center' });
    }
  } else {
    // Fallback: Show hospital name as placeholder
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, 50, 20, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text('HOSPITAL LOGO', margin + 25, yPosition + 12, { align: 'center' });
  }

  // Doctor Details (right side)
  const doctorDetailsX = pageWidth - margin - 80;
  pdf.setTextColor(0, 0, 0);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(doctorName, doctorDetailsX, yPosition + 5);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(doctorDegree, doctorDetailsX, yPosition + 12);
  
  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);
  pdf.text(doctorRegNumber, doctorDetailsX, yPosition + 18);

  yPosition += 35;

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
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

  // Footer Section
  const footerY = pageHeight - 35;
  
  // Doctor signature
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(doctorName, pageWidth - margin - 60, footerY);
  yPosition += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(hospitalName, pageWidth - margin - 60, footerY + 5);
  pdf.text(hospitalAddress, pageWidth - margin - 60, footerY + 10);
  pdf.text(doctorRegNumber, pageWidth - margin - 60, footerY + 15);

  // Footer disclaimers
  pdf.setFontSize(6);
  pdf.setTextColor(100, 100, 100);
  pdf.text('This certificate is computer generated and legally valid.', pageWidth / 2, pageHeight - 15, { align: 'center' });

  if (autoDownload) {
    pdf.save(`medical-certificate-${certificate.patientName}-${formatDate(certificate.issuedDate)}.pdf`);
  }

  return pdf.output('blob');
};
