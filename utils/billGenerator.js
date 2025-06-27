import jsPDF from 'jspdf';
import { formatDate, formatDateTime } from './dateUtils';

export const generateBillPDF = async (bill, patient) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;
  let yPosition = 20;

  // Header Section
  // Hospital Logo (placeholder - left side)
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition, 50, 20, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(120, 120, 120);
  pdf.text('HOSPITAL LOGO', margin + 25, yPosition + 12, { align: 'center' });

  // Doctor Details (right side)
  const doctorDetailsX = pageWidth - margin - 80;
  pdf.setTextColor(0, 0, 0);
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Dr. Prashant Nikam', doctorDetailsX, yPosition + 5);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('BAMS (College Name)', doctorDetailsX, yPosition + 12);
  
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text('Chaitanya Hospital, Deola', doctorDetailsX, yPosition + 18);

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
