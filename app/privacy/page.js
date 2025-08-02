'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Privacy Policy</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="prose max-w-none dark:prose-invert">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Introduction</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Doc Prescrip ("we," "us," or "our") is committed to protecting the privacy and security of your personal 
                  information and patient data. This Privacy Policy explains how we collect, use, disclose, and safeguard 
                  your information when you use our medical practice management system ("Service"). This policy applies to 
                  all users of our Service, including healthcare professionals and their authorized staff.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We understand the sensitive nature of medical data and are committed to maintaining the highest standards 
                  of data protection and privacy in accordance with applicable healthcare regulations and data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Information We Collect</h2>
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">2.1 Healthcare Professional Information</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  When you register for our Service, we collect:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>Personal identification information (name, email address, phone number)</li>
                  <li>Professional credentials (medical license number, degree, registration details)</li>
                  <li>Hospital or clinic information (name, address, contact details)</li>
                  <li>Authentication information (passwords, access keys)</li>
                  <li>Profile information and preferences</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">2.2 Patient Information</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  As part of your medical practice management, our Service processes:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>Patient demographics (name, age, gender, contact information)</li>
                  <li>Medical history and health records</li>
                  <li>Prescription data and medication information</li>
                  <li>Diagnostic information and test results</li>
                  <li>Billing and payment information</li>
                  <li>Appointment and follow-up data</li>
                  <li>Medical certificates and related documentation</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">2.3 Technical Information</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We automatically collect certain technical information, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>Device information (type, operating system, browser)</li>
                  <li>Usage data (features used, time spent, activity logs)</li>
                  <li>IP addresses and location information</li>
                  <li>Session information and authentication logs</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>Providing and maintaining the medical practice management services</li>
                  <li>Enabling prescription creation, patient record management, and billing functions</li>
                  <li>Generating medical certificates and other required documentation</li>
                  <li>Facilitating appointment scheduling and follow-up management</li>
                  <li>Ensuring data security and preventing unauthorized access</li>
                  <li>Improving our Service through usage analysis and feedback</li>
                  <li>Providing customer support and technical assistance</li>
                  <li>Complying with legal and regulatory requirements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">4. Data Storage and Security</h2>
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">4.1 Local Storage</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Our Service primarily uses local storage on your device to ensure data privacy and reduce external data 
                  transmission. This means that most of your patient data and practice information is stored locally on 
                  your computer or device, giving you direct control over your data.
                </p>

                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">4.2 Security Measures</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We implement comprehensive security measures to protect your information:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>Encryption of sensitive data both in transit and at rest</li>
                  <li>Secure authentication protocols and access controls</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Limited access to data on a need-to-know basis</li>
                  <li>Secure backup and recovery procedures</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">4.3 Data Retention</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We retain your information only as long as necessary to provide our services and comply with legal 
                  obligations. Since most data is stored locally, you have control over data retention periods in 
                  accordance with your professional and legal requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">5. Information Sharing and Disclosure</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We do not sell, trade, or otherwise transfer your personal information or patient data to third parties. 
                  We may disclose information only in the following limited circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations or court orders</li>
                  <li>To protect our rights, property, or safety, or that of others</li>
                  <li>In connection with a business transfer or merger (with appropriate safeguards)</li>
                  <li>To authorized service providers who assist in Service delivery (under strict confidentiality agreements)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">6. Your Rights and Choices</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You have the following rights regarding your information:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li><strong>Access:</strong> Request access to your personal information we hold</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service provider</li>
                  <li><strong>Restriction:</strong> Request restriction of processing under certain circumstances</li>
                  <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing where applicable</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">7. HIPAA and Healthcare Compliance</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  While our Service is designed to support healthcare professionals in maintaining patient confidentiality 
                  and data security, you remain responsible for ensuring compliance with applicable healthcare regulations, 
                  including but not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>Health Insurance Portability and Accountability Act (HIPAA) where applicable</li>
                  <li>Local healthcare data protection regulations</li>
                  <li>Medical licensing board requirements</li>
                  <li>Patient consent requirements for data processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">8. International Data Transfers</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Since our Service primarily uses local storage, international data transfers are minimal. However, 
                  certain Service features may involve data processing in different jurisdictions. When such transfers 
                  occur, we ensure appropriate safeguards are in place to protect your information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">9. Children's Privacy</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Our Service is not intended for use by children under 18 years of age. We do not knowingly collect 
                  personal information from children under 18. If we become aware that we have collected personal 
                  information from a child under 18, we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">10. Data Breach Notification</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  In the unlikely event of a data security incident that may compromise your information, we will:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>Investigate the incident promptly and thoroughly</li>
                  <li>Take immediate steps to contain and mitigate the breach</li>
                  <li>Notify affected users within 72 hours when feasible</li>
                  <li>Provide clear information about the nature and scope of the incident</li>
                  <li>Offer guidance on protective measures you can take</li>
                  <li>Comply with all applicable breach notification requirements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">11. Third-Party Services</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Our Service may integrate with third-party services (such as Google authentication, PDF generation services, 
                  or communication platforms). These third-party services have their own privacy policies, and we encourage 
                  you to review them. We are not responsible for the privacy practices of these third-party services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">12. Updates to This Privacy Policy</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We may update this Privacy Policy from time to time to reflect changes in our practices, technology, 
                  legal requirements, or other factors. We will notify you of any material changes by:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>Posting the updated policy on our Service</li>
                  <li>Sending you a notification through the Service</li>
                  <li>Providing at least 30 days' notice for material changes</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Your continued use of the Service after such modifications constitutes acceptance of the updated Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">13. Contact Us</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                  please contact us through:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>The application's support and feedback system</li>
                  <li>The help section within the Service</li>
                  <li>Our customer support channels</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We are committed to addressing your privacy concerns and will respond to your inquiries in a timely manner.
                </p>
              </section>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                By using Doc Prescrip, you acknowledge that you have read, understood, and agree to this Privacy Policy. 
                We are committed to protecting your privacy and maintaining the security of your medical practice data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}