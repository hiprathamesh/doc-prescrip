import jsPDF from 'jspdf';
import { formatDate, formatDateTime } from './dateUtils';
import { storage } from './storage';

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

  let yPosition = 15; // Reduced from 20

  // Header Section
  // Hospital Logo (placeholder - left side)
  // REPLACE THIS SECTION WITH BASE64 LOGO:
  const logoBase64 = 'data:image/png;base64,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';
  pdf.addImage(logoBase64, 'PNG', margin, yPosition, 50, 20);
  
  // Current placeholder (remove when adding real logo):

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
    
    yPosition += 10; // Reduced spacing
  }

  // Lab Tests Section (Single line with commas)
  if (prescription.labResults && prescription.labResults.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Laboratory Tests', margin, yPosition); // Removed uppercase
    yPosition += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const labTests = prescription.labResults.map((lab, index) => {
      let testText = lab.testName;
      if (lab.remarks) {
        testText += ` (${lab.remarks})`;
      }
      return testText;
    });
    
    const labTestsText = labTests.join(', ');
    const labLines = pdf.splitTextToSize(labTestsText, contentWidth);
    pdf.text(labLines, margin, yPosition);
    yPosition += labLines.length * 4 + 8;
  }

  // Patient Advice (Single line with commas) - Removed Doctor's Notes
  if (prescription.advice) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient Advice', margin, yPosition); // Removed uppercase
    yPosition += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const advice = prescription.advice.split('\n').filter(adv => adv.trim()).join(', ');
    const adviceLines = pdf.splitTextToSize(advice, contentWidth);
    pdf.text(adviceLines, margin, yPosition);
    yPosition += adviceLines.length * 4 + 8;
  }

  // Follow-up Information
  if (prescription.followUpDate) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Follow-up Appointment', margin, yPosition); // Removed uppercase
    yPosition += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Next visit scheduled for: ${formatDate(prescription.followUpDate)}`, margin, yPosition);
    yPosition += 10;
  }

  // Footer Section
  const footerY = pageHeight - 20; // Reduced footer margin
  
  // Footer divider with lighter color instead of opacity
  pdf.setDrawColor(220, 220, 220); // Light gray instead of opacity
  pdf.setLineWidth(0.15);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  // Computer generated notice
  pdf.setFontSize(7); // Slightly increased from 6
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('This document is computer generated and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });

  // Medical disclaimers as paragraph (increased font size, no bullets)
  pdf.setFontSize(8); // Increased from 6
  pdf.setFont('helvetica', 'normal');
  const disclaimerText = 'Medications may have associated side effects. Please read instructions carefully. In case symptoms worsen or persist, please visit immediately. Complete the full course of medication as prescribed. Keep this prescription for future reference.';
  
  let disclaimerY = footerY + 4;
  const disclaimerLines = pdf.splitTextToSize(disclaimerText, contentWidth);
  pdf.text(disclaimerLines, pageWidth / 2, disclaimerY, { align: 'center' });
  disclaimerY += disclaimerLines.length * 3;

  // Hospital contact info
  pdf.setTextColor(80, 80, 80);
  pdf.text('Chaitanya Hospital & X Ray Clinic, Adgaon, Dist. Nashik | Phone: +91-9422765758', pageWidth / 2, disclaimerY + 2, { align: 'center' });

  if (autoDownload) {
    pdf.save(`prescription-${patient.name}-${formatDate(prescription.visitDate)}.pdf`);
  }

  return pdf.output('blob');
};

// Helper function to format medication timing
const formatMedicationTiming = (timing) => {
  if (!timing) return '1-0-1-0';
  
  const morning = timing.morning ? '1' : '0';
  const afternoon = timing.afternoon ? '1' : '0';
  const evening = timing.evening ? '1' : '0';
  const night = timing.night ? '1' : '0';
  
  return `${morning}-${afternoon}-${evening}-${night}`;
};