import jsPDF from 'jspdf';
import { formatDate, formatDateTime } from './dateUtils';

export const generateBillPDF = async (bill, patient) => {
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

  // Bill Title
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.text('MEDICAL BILL', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Bill Information
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Bill Information', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(11);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Bill ID: ${bill.id}`, 20, yPosition);
  pdf.text(`Date: ${formatDate(bill.createdAt)}`, 120, yPosition);
  
  yPosition += 8;
  pdf.text(`Time: ${formatDateTime(bill.createdAt)}`, 20, yPosition);
  pdf.text(`Status: ${bill.isPaid ? 'PAID' : 'PENDING'}`, 120, yPosition);
  
  yPosition += 15;

  // Patient Information
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Patient Information', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(11);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Name: ${patient.name}`, 20, yPosition);
  pdf.text(`Patient ID: ${patient.id}`, 120, yPosition);
  
  yPosition += 8;
  pdf.text(`Age: ${patient.age} years`, 20, yPosition);
  pdf.text(`Phone: ${patient.phone}`, 120, yPosition);
  
  yPosition += 20;

  // Bill Details Table
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Bill Details', 20, yPosition);
  yPosition += 10;

  // Table Header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, yPosition, pageWidth - 40, 10, 'F');
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'bold');
  pdf.text('Description', 25, yPosition + 7);
  pdf.text('Amount (₹)', pageWidth - 50, yPosition + 7);
  yPosition += 15;

  // Table Content
  pdf.setFont(undefined, 'normal');
  pdf.text(bill.description, 25, yPosition);
  pdf.text(bill.amount.toString(), pageWidth - 50, yPosition);
  yPosition += 10;

  // Total Line
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  // Total Amount
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text('Total Amount: ₹' + bill.amount, pageWidth - 80, yPosition);
  yPosition += 20;

  // Payment Status
  if (bill.isPaid && bill.paidAt) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 150, 0);
    pdf.text('PAYMENT RECEIVED', 20, yPosition);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;
    pdf.text(`Payment Date: ${formatDateTime(bill.paidAt)}`, 20, yPosition);
    yPosition += 15;
  } else {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(200, 0, 0);
    pdf.text('PAYMENT PENDING', 20, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 15;
  }

  // Footer
  yPosition = pdf.internal.pageSize.height - 40;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text('Thank you for choosing our medical services.', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;
  pdf.text('This is a computer generated bill.', pageWidth / 2, yPosition, { align: 'center' });

  // Return blob instead of auto-downloading
  return pdf.output('blob');
};
