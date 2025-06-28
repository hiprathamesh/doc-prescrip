import jsPDF from 'jspdf';
import { formatDate, formatDateTime } from './dateUtils';
import { storage } from './storage';

export const generateBillPDF = async (bill, patient) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;
  let yPosition = 20;

  // Get current doctor context
  const doctorContext = storage.getDoctorContext();
  const doctorName = doctorContext?.name || 'Dr. Prashant Nikam';
  const doctorDegree = doctorContext?.degree || 'BAMS (College Name)';
  const hospitalName = doctorContext?.hospitalName || 'Chaitanya Hospital';
  const hospitalAddress = doctorContext?.hospitalAddress || 'Deola';

  // Get hospital logo for current doctor
  let hospitalLogo = null;
  try {
    if (doctorContext?.doctorId) {
      const logoData = await storage.getHospitalLogo(doctorContext.doctorId);
      if (logoData && logoData.base64) {
        hospitalLogo = logoData.base64;
      }
    }
  } catch (error) {
    console.warn('Could not load hospital logo:', error);
  }

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
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(doctorName, doctorDetailsX, yPosition + 5);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(doctorDegree, doctorDetailsX, yPosition + 12);
  
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`${hospitalName}, ${hospitalAddress}`, doctorDetailsX, yPosition + 18);

  yPosition += 30;

  // Horizontal Divider
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.15);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 15;

  // Bill Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('MEDICAL BILL', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Bill Information
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bill Information', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Bill ID: ${bill.billId}`, 20, yPosition);
  pdf.text(`Date: ${formatDate(bill.createdAt)}`, 120, yPosition);
  
  yPosition += 8;
  pdf.text(`Time: ${formatDateTime(bill.createdAt)}`, 20, yPosition);
  pdf.text(`Status: ${bill.isPaid ? 'PAID' : 'PENDING'}`, 120, yPosition);
  
  yPosition += 15;

  // Patient Information
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Patient Information', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${patient.name}`, 20, yPosition);
  pdf.text(`Patient ID: ${patient.id}`, 120, yPosition);
  
  yPosition += 8;
  pdf.text(`Age: ${patient.age} years`, 20, yPosition);
  pdf.text(`Phone: ${patient.phone}`, 120, yPosition);
  
  yPosition += 20;

  // Bill Details Table
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bill Details', 20, yPosition);
  yPosition += 10;

  // Table Header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, yPosition, pageWidth - 40, 10, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Description', 25, yPosition + 7);
  pdf.text('Amount (₹)', pageWidth - 50, yPosition + 7);
  yPosition += 15;

  // Table Content
  pdf.setFont('helvetica', 'normal');
  pdf.text(bill.description, 25, yPosition);
  pdf.text(bill.amount.toString(), pageWidth - 50, yPosition);
  yPosition += 10;

  // Total Line
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  // Total Amount
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Amount: ₹' + bill.amount, pageWidth - 80, yPosition);
  yPosition += 20;

  // Payment Status
  if (bill.isPaid && bill.paidAt) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 150, 0);
    pdf.text('PAYMENT RECEIVED', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;
    pdf.text(`Payment Date: ${formatDateTime(bill.paidAt)}`, 20, yPosition);
    yPosition += 15;
  } else {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(200, 0, 0);
    pdf.text('PAYMENT PENDING', 20, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 15;
  }

  // Footer
  const footerY = pageHeight - 30;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.15);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setFontSize(6);
  pdf.setTextColor(100, 100, 100);
  pdf.text('This is a computer generated bill and does not require signature.', pageWidth / 2, footerY, { align: 'center' });
  
  pdf.setFontSize(6);
  pdf.text('Thank you for choosing our medical services.', pageWidth / 2, footerY + 4, { align: 'center' });

  // Return blob instead of auto-downloading
  return pdf.output('blob');
};
