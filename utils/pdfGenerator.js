import jsPDF from 'jspdf';
import { formatDate, formatDateTime } from './dateUtils';
import { storage } from './storage';

// Add missing formatMedicationTiming function
const formatMedicationTiming = (timing) => {
  if (!timing) return '1-0-1-0'; // Default pattern
  
  const morning = timing.morning ? '1' : '0';
  const afternoon = timing.afternoon ? '1' : '0';
  const evening = timing.evening ? '1' : '0';
  const night = timing.night ? '1' : '0';
  
  return `${morning}-${afternoon}-${evening}-${night}`;
};

export const generatePDF = async (prescription, patient, autoDownload = true) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10; // Reduced from 15 to 10
  const contentWidth = pageWidth - 2 * margin;

  // Get current doctor details for multi-tenancy
  const currentDoctor = storage.getDoctorContext();
  const doctorName = currentDoctor?.name || 'Dr. Prashant Kisanrao Nikam';
  
  // Extract doctor details from storage or use defaults
  let doctorDegree = currentDoctor?.degree || 'BAMS (College Name)';
  let doctorRegNumber = currentDoctor?.registrationNumber || 'Reg. No: I-34621-A';
  
  // Format registration number to include "Reg. No:" prefix if not already present
  if (doctorRegNumber && !doctorRegNumber.toLowerCase().includes('reg')) {
    doctorRegNumber = `Reg. No: ${doctorRegNumber}`;
  }

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

  let yPosition = 15; // Reduced from 20

  // Header Section
  // Hospital Logo - left side
  if (hospitalLogo) {
    try {
      // Extract image format from base64 data URL
      const imageFormat = hospitalLogo.split(';')[0].split('/')[1].toUpperCase();
      const validFormats = ['PNG', 'JPEG', 'JPG', 'WEBP', 'AVIF'];
      const format = validFormats.includes(imageFormat) ? imageFormat : 'PNG';
      
      pdf.addImage(hospitalLogo, format, margin, yPosition, 50, 20);
    } catch (error) {
      console.warn('Could not add hospital logo to PDF:', error);
      // Add placeholder text if logo fails to load
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(currentDoctor?.hospitalName || 'Hospital Logo', margin, yPosition + 10);
    }
  } else {
    // Fallback: Show hospital name as text
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(currentDoctor?.hospitalName || 'Hospital Logo', margin, yPosition + 10);
  }
  
  // Doctor Details (right side - right aligned)
  const doctorDetailsX = pageWidth - margin;
  pdf.setTextColor(0, 0, 0);
  
  // Doctor Name (right aligned)
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(doctorName, doctorDetailsX, yPosition + 5, { align: 'right' });
  
  // Doctor Degree (right aligned)
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(doctorDegree, doctorDetailsX, yPosition + 12, { align: 'right' });
  
  // Registration Number (right aligned)
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text(doctorRegNumber, doctorDetailsX, yPosition + 18, { align: 'right' });

  yPosition += 30;

  // Horizontal Divider with lighter color instead of opacity
  pdf.setDrawColor(220, 220, 220); // Light gray instead of opacity
  pdf.setLineWidth(0.15);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 12; // Reduced spacing

  // Patient Information Section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Patient Information', margin, yPosition); // Removed uppercase
  
  yPosition += 8;
  
  // Patient details in two columns
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const leftCol = margin;
  const rightCol = margin + contentWidth / 2;
  
  pdf.text(`Name: ${patient.name}`, leftCol, yPosition);
  pdf.text(`Age: ${patient.age} years`, rightCol, yPosition);
  yPosition += 6;
  
  pdf.text(`Phone: ${patient.phone}`, leftCol, yPosition);
  pdf.text(`Date: ${formatDate(prescription.visitDate)}`, rightCol, yPosition);
  yPosition += 6;
  
  pdf.text(`Gender: ${patient.gender}`, leftCol, yPosition);
  pdf.text(`ID: ${patient.id}`, rightCol, yPosition);
  
  yPosition += 12; // Reduced spacing

  // Symptoms and Diagnosis Section (Two Columns)
  const hasSymptoms = prescription.symptoms && prescription.symptoms.length > 0;
  const hasDiagnosis = prescription.diagnosis && prescription.diagnosis.length > 0;
  
  if (hasSymptoms || hasDiagnosis) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    
    // Column headers
    if (hasSymptoms) {
      pdf.text('Symptoms', leftCol, yPosition);
    }
    if (hasDiagnosis) {
      pdf.text('Diagnosis', rightCol, yPosition);
    }
    yPosition += 8;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Get max length for proper spacing
    const maxItems = Math.max(
      hasSymptoms ? prescription.symptoms.length : 0,
      hasDiagnosis ? prescription.diagnosis.length : 0
    );
    
    for (let i = 0; i < maxItems; i++) {
      let lineHeight = 5;
      
      // Symptoms column
      if (hasSymptoms && i < prescription.symptoms.length) {
        const symptom = prescription.symptoms[i];
        const symptomText = `${i + 1}. ${symptom.name}`;
        pdf.text(symptomText, leftCol, yPosition);
        
        if (symptom.severity || symptom.duration) {
          const details = [];
          if (symptom.severity) details.push(`Severity: ${symptom.severity}`);
          if (symptom.duration) details.push(`Duration: ${symptom.duration}`);
          
          pdf.setTextColor(80, 80, 80);
          pdf.text(`(${details.join(', ')})`, leftCol + 5, yPosition + 4);
          pdf.setTextColor(0, 0, 0);
          lineHeight = 8;
        }
      }
      
      // Diagnosis column
      if (hasDiagnosis && i < prescription.diagnosis.length) {
        const diag = prescription.diagnosis[i];
        const diagText = `${i + 1}. ${diag.name}`;
        pdf.text(diagText, rightCol, yPosition);
        
        if (diag.description) {
          pdf.setTextColor(80, 80, 80);
          const descLines = pdf.splitTextToSize(diag.description, (contentWidth / 2) - 10);
          pdf.text(descLines, rightCol + 5, yPosition + 4);
          pdf.setTextColor(0, 0, 0);
          lineHeight = Math.max(lineHeight, 4 + descLines.length * 4);
        }
      }
      
      yPosition += lineHeight;
    }
    yPosition += 8;
  }

  // Medications Section (Table format)
  if (prescription.medications && prescription.medications.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Medications', margin, yPosition); // Removed uppercase
    yPosition += 8;

    // Table headers
    const tableStartY = yPosition;
    const colWidths = [60, 30, 25, 25, 30];
    const headers = ['Medicine', 'Dosage', 'Timing', 'Duration', 'Instructions'];
    
    // Header background
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, yPosition - 2, contentWidth, 8, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    let xPos = margin + 2;
    headers.forEach((header, index) => {
      pdf.text(header, xPos, yPosition + 3);
      xPos += colWidths[index];
    });
    
    yPosition += 8;
    
    // Table content
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    prescription.medications.forEach((med, index) => {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Alternating row colors
      if (index % 2 === 1) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPosition - 2, contentWidth, 6, 'F');
      }
      
      xPos = margin + 2;
      
      // Medicine name
      const medName = pdf.splitTextToSize(med.name, colWidths[0] - 4);
      pdf.text(medName, xPos, yPosition + 2);
      xPos += colWidths[0];
      
      // Dosage
      pdf.text(med.dosage || '', xPos, yPosition + 2);
      xPos += colWidths[1];
      
      // Timing
      const timing = formatMedicationTiming(med.timing);
      pdf.text(timing, xPos, yPosition + 2);
      xPos += colWidths[2];
      
      // Duration
      pdf.text(med.duration || '', xPos, yPosition + 2);
      xPos += colWidths[3];
      
      // Instructions
      const instructions = [];
      if (med.mealTiming) {
        const mealText = med.mealTiming === 'before_meal' ? 'Before meal' : 
                        med.mealTiming === 'after_meal' ? 'After meal' : 'With meal';
        instructions.push(mealText);
      }
      if (med.remarks) instructions.push(med.remarks);
      
      const instText = pdf.splitTextToSize(instructions.join(', '), colWidths[4] - 4);
      pdf.text(instText, xPos, yPosition + 2);
      
      yPosition += Math.max(6, medName.length * 3, instText.length * 3);
    });
    
    // Table border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.1);
    pdf.rect(margin, tableStartY - 2, contentWidth, yPosition - tableStartY + 2);
    
    // Vertical lines
    xPos = margin;
    colWidths.forEach((width, index) => {
      if (index < colWidths.length - 1) {
        xPos += width;
        pdf.line(xPos, tableStartY - 2, xPos, yPosition);
      }
    });
    
    yPosition += 15;
  }

  // Additional sections can be added here (lab tests, advice, etc.)
  if (prescription.labResults && prescription.labResults.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Lab Tests', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    prescription.labResults.forEach((test, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`${index + 1}. ${test.testName}`, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 10;
  }

  // Doctor's advice
  if (prescription.advice) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Advice', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const adviceLines = pdf.splitTextToSize(prescription.advice, contentWidth);
    pdf.text(adviceLines, margin, yPosition);
    yPosition += adviceLines.length * 4 + 10;
  }

  // Footer
  const footerY = pageHeight - 25;
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.1);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('This prescription is computer generated and legally valid.', pageWidth / 2, footerY, { align: 'center' });

  if (autoDownload) {
    pdf.save(`prescription-${patient.name}-${formatDate(prescription.visitDate)}.pdf`);
  }

  return pdf.output('blob');
};