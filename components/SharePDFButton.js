'use client'
import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Share2, Loader2 } from 'lucide-react'
import { storage } from '../utils/storage'
import { toast } from 'sonner'

export default function SharePDFButton({ 
  pdfUrl, 
  filename, 
  phone, 
  disabled, 
  type, 
  patientName, 
  visitDate, 
  billDate, 
  amount, 
  isPaid, 
  certificateDate, 
  certificateFor,
  className,
  variant = 'button', // 'button' or 'dropdown'
  onShare,
  customText, // Add customText prop
  // Add these props for regeneration
  prescription,
  patient,
  bill
}) {
  const { data: session, status } = useSession()
  const [isUploading, setIsUploading] = useState(false)

  const generateMessage = () => {
    // Get current doctor context
    const currentDoctor = storage.getDoctorContext();
    const doctorName = currentDoctor?.name || 'Dr. Prashant Nikam';
    
    if (type === 'prescription') {
      return `Hello ${patientName},

Your prescription for the consultation on ${visitDate} is ready.

Please find your prescription attached.

Thank you for visiting us.

Best regards,
${doctorName}`
    } else if (type === 'bill') {
      return `Hello ${patientName},

Your bill for the consultation on ${billDate} is ready.

Amount: ₹${amount}
Status: ${isPaid ? 'Paid' : 'Pending'}

Please find your bill attached.

Thank you for visiting us.

Best regards,
${doctorName}`
    } else if (type === 'certificate') {
      return `Hello ${patientName},

Your medical certificate dated ${certificateDate} is ready.

Certificate Purpose: ${certificateFor}

Please find your certificate attached.

Thank you for visiting us.

Best regards,
${doctorName}`
    }
    return `Hello ${patientName}, your document is ready.`
  }

  const handleClick = async () => {
    if (status === 'loading') {
      alert('Please wait, checking authentication...')
      return
    }

    if (!session) {
      try {
        await signIn('google', { 
          callbackUrl: window.location.href,
          redirect: false 
        })
      } catch (error) {
        console.error('Sign in error:', error)
        alert('Failed to sign in. Please try again.')
      }
      return
    }

    // Check if session has authentication error
    if (session.error === "RefreshAccessTokenError") {
      alert('Your session has expired. Please sign in again.')
      signIn('google', { callbackUrl: window.location.href })
      return
    }

    setIsUploading(true)

    try {
      let validPdfUrl = pdfUrl

      // If no PDF URL or we suspect it might be invalid, try to regenerate
      if (!validPdfUrl || validPdfUrl.startsWith('blob:')) {
        if (type === 'prescription' && prescription && patient) {
          validPdfUrl = await storage.regeneratePDFIfNeeded(prescription, patient, 'prescription')
        } else if (type === 'bill' && bill && patient) {
          validPdfUrl = await storage.regeneratePDFIfNeeded(bill, patient, 'bill')
        }
      }

      if (!validPdfUrl) {
        alert('PDF is not available. Please try regenerating the document.')
        return
      }

      // Convert blob URL to blob
      const response = await fetch(validPdfUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch PDF')
      }
      
      const blob = await response.blob()
      
      // Create FormData to send the file
      const formData = new FormData()
      formData.append('file', blob, filename)
      formData.append('filename', filename)

      const res = await fetch('/api/upload-to-drive', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      
      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid, trigger re-authentication
          alert('Your Google authentication has expired. Please sign in again.')
          signIn('google', { callbackUrl: window.location.href })
          return
        }
        throw new Error(data.error || 'Upload failed')
      }
      
      if (data.link) {
        const message = generateMessage()
        const whatsappMessage = `${message}\n\nDocument link: ${data.link}`
        const encoded = encodeURIComponent(whatsappMessage)
        const phoneNumber = phone.replace(/\D/g, '') // Remove non-digits
        const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`
        
        window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank')
        
        toast.success('Document Shared', {
          description: `${type === 'prescription' ? 'Prescription' : type === 'bill' ? 'Bill' : 'Certificate'} shared via WhatsApp successfully`
        });
        
        // Call onShare callback if provided (for dropdown variant)
        if (onShare) {
          onShare()
        }
      } else {
        throw new Error('No link received from Google Drive')
      }
    } catch (error) {
      console.error('Error sharing PDF:', error)
      if (error.message.includes('Unauthorized') || error.message.includes('authentication')) {
        toast.warning('Authentication Required', {
          description: 'Please sign in with Google to share documents'
        });
        signIn('google', { callbackUrl: window.location.href })
      } else {
        toast.error('Share Failed', {
          description: `Failed to share PDF: ${error.message}`
        });
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Dropdown variant styling
  if (variant === 'dropdown') {
    return (
      <button 
        onClick={handleClick}
        disabled={disabled || status === 'loading'}
        className={className || "w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center space-x-2"}
      >
        <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span>{status === 'loading' ? 'Loading...' : (customText || 'Share PDF')}</span>
      </button>
    )
  }

  // Default button variant styling
  return (
    <button 
      onClick={handleClick}
      disabled={disabled || status === 'loading' || isUploading}
      className={className || "flex items-center space-x-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white dark:text-gray-900 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm cursor-pointer"}
    >
      {isUploading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      <span>
        {isUploading ? 'Uploading...' : status === 'loading' ? 'Loading...' : 'Share'}
      </span>
    </button>
  )
}
