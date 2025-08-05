'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import usePageTitle from '../../hooks/usePageTitle';

export default function TermsOfService() {
  usePageTitle('Terms of Service');
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Terms of Service</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="prose max-w-none dark:prose-invert">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  By accessing and using Doc Prescrip ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
                  If you do not agree to these Terms, you may not use the Service. These Terms apply to all users of the Service, 
                  including healthcare professionals, medical practitioners, and their authorized staff.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Description of Service</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Doc Prescrip is a comprehensive medical practice management system designed to help healthcare professionals 
                  manage patient records, create prescriptions, generate medical certificates, track billing, and streamline 
                  their practice operations. The Service includes but is not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>Patient record management and medical history tracking</li>
                  <li>Digital prescription creation and management</li>
                  <li>Medical certificate generation</li>
                  <li>Billing and payment tracking</li>
                  <li>Appointment scheduling and follow-up management</li>
                  <li>Prescription templates and medical data organization</li>
                  <li>PDF generation and sharing capabilities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">3. User Eligibility and Registration</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  To use Doc Prescrip, you must be:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>A licensed medical practitioner or healthcare professional</li>
                  <li>Authorized staff working under the supervision of a licensed medical practitioner</li>
                  <li>At least 18 years of age</li>
                  <li>Legally capable of entering into binding agreements</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You agree to provide accurate, current, and complete information during registration and to update 
                  such information to keep it accurate, current, and complete.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">4. Professional Responsibility</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  As a healthcare professional using this Service, you acknowledge and agree that:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>You are solely responsible for all medical decisions and prescriptions made through the Service</li>
                  <li>You must comply with all applicable medical regulations and professional standards</li>
                  <li>You will verify all patient information and medical data before making treatment decisions</li>
                  <li>You will maintain appropriate professional licensing and certifications</li>
                  <li>You will follow all applicable laws regarding patient privacy and medical record keeping</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">5. Data Security and Privacy</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We take data security seriously and implement appropriate technical and organizational measures to protect 
                  your data and patient information. However, you acknowledge that:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>You are responsible for maintaining the confidentiality of your login credentials</li>
                  <li>You must log out of your account when finished using the Service</li>
                  <li>You should not share your account access with unauthorized individuals</li>
                  <li>You must report any suspected security breaches immediately</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">6. Acceptable Use</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-4">
                  <li>Use the Service for any illegal or unauthorized purpose</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                  <li>Attempt to gain unauthorized access to any portion of the Service</li>
                  <li>Use the Service to transmit any harmful or malicious code</li>
                  <li>Share patient data with unauthorized third parties</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">7. Intellectual Property</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Service and its original content, features, and functionality are owned by Doc Prescrip and are protected 
                  by international copyright, trademark, patent, trade secret, and other intellectual property laws. 
                  You retain ownership of the medical data and patient information you input into the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DOC PRESCRIP SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER 
                  INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You acknowledge that the Service is a tool to assist in medical practice management and that all medical 
                  decisions remain your professional responsibility.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">9. Indemnification</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You agree to indemnify, defend, and hold harmless Doc Prescrip and its officers, directors, employees, 
                  and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or 
                  in any way connected with your use of the Service or violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">10. Termination</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice or 
                  liability, for any reason, including breach of these Terms. Upon termination, your right to use the 
                  Service will cease immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">11. Changes to Terms</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will 
                  provide at least 30 days' notice prior to any new terms taking effect. Your continued use of the Service 
                  after such modifications constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">12. Governing Law</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of India, without regard to 
                  its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive 
                  jurisdiction of the courts located in Maharashtra, India.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">13. Contact Information</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  If you have any questions about these Terms of Service, please contact us through the application's 
                  support channels or feedback system.
                </p>
              </section>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                By using Doc Prescrip, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}