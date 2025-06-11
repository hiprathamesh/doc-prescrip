export const sendWhatsApp = async (phoneNumber, message) => {
  // Format phone number (remove any non-digits and add country code if needed)
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  
  // Open WhatsApp in new tab
  window.open(whatsappUrl, '_blank');
};

export const generateWhatsAppMessage = (patientName, visitDate) => {
  return `Hello ${patientName},

Your prescription from your visit on ${visitDate} is ready. Please find the attached prescription document.

If you have any questions, please feel free to contact us.

Best regards,
Dr. Prashant Nikam`;
};

export const generateBillWhatsAppMessage = (patientName, billDate, amount, isPaid) => {
  return `Hello ${patientName},

Your bill for the consultation on ${billDate} is ready.

Amount: ₹${amount}
Status: ${isPaid ? 'Paid' : 'Pending'}

Thank you for visiting us.

Best regards,
Dr. Prashant Nikam`;
};