'use client';

import { FileText, Shield, AlertTriangle, Scale } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
       
        <div>
          <h1 className="text-2xl font-semibold text-white">Terms of Service</h1>
          <p className="text-gray-400 text-sm mt-1">Last updated: January 2025</p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div>
            <h3 className="text-white font-semibold mb-2">Important Notice</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              By accessing or using RisqueMega, you agree to be bound by these Terms of Service.
              If you do not agree with any part of these terms, you must not use this website.
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {/* Age Restriction */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            1. Age Restriction
          </h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              You must be at least 18 years of age to access this website. By using this service, you represent and warrant that you are of legal age in your jurisdiction to view adult content.
            </p>
            <p className="text-gray-400">
              We reserve the right to request proof of age at any time. Failure to provide such verification may result in immediate termination of your account.
            </p>
          </div>
        </section>

        {/* User Conduct */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">2. User Conduct</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 ml-4">
              <li>Upload, post, or transmit any content that is illegal, harmful, or violates any laws</li>
              <li>Harass, abuse, or harm other users of the platform</li>
              <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation</li>
              <li>Attempt to gain unauthorized access to any portion of the website or any systems</li>
              <li>Use automated means to access the website without our express written permission</li>
              <li>Share your account credentials with any third party</li>
            </ul>
          </div>
        </section>

        {/* Content Ownership */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">3. Content Ownership & Rights</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              All content on RisqueMega, including but not limited to text, graphics, logos, images, and videos, is the property of RisqueMega or its content suppliers and is protected by copyright laws.
            </p>
            <p className="text-gray-400">
              Users may not reproduce, distribute, modify, or create derivative works from any content on this website without explicit permission from the copyright holder.
            </p>
          </div>
        </section>

        {/* VIP Membership */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">4. VIP Membership</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              VIP memberships are provided on a subscription basis. By purchasing a VIP membership, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 ml-4">
              <li>Pay all applicable fees as described at the time of purchase</li>
              <li>Understand that fees are non-refundable except as required by law</li>
              <li>Acknowledge that benefits are subject to change with reasonable notice</li>
              <li>Accept that membership may be terminated for violation of these terms</li>
            </ul>
          </div>
        </section>

        {/* Privacy & Data */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">5. Privacy & Data Collection</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              Your privacy is important to us. We collect and process personal data in accordance with our Privacy Policy. By using this website, you consent to such processing and warrant that all data provided is accurate.
            </p>
            <p className="text-gray-400">
              We implement reasonable security measures to protect your information, but cannot guarantee absolute security.
            </p>
          </div>
        </section>

        {/* Disclaimer of Warranties */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">6. Disclaimer of Warranties</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              This website is provided "as is" without warranties of any kind, either express or implied. We do not warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 ml-4">
              <li>The service will be uninterrupted, timely, secure, or error-free</li>
              <li>The results obtained from using the service will be accurate or reliable</li>
              <li>Any errors in the software will be corrected</li>
            </ul>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              To the fullest extent permitted by law, RisqueMega shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
            </p>
          </div>
        </section>

        {/* Modifications to Terms */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">8. Modifications to Terms</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of the website after any changes constitutes acceptance of the new terms.
            </p>
          </div>
        </section>

        {/* Termination */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">9. Termination</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              We reserve the right to terminate or suspend your account and access to the website at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
            </p>
          </div>
        </section>

        {/* Governing Law */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            10. Governing Law
          </h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.
            </p>
          </div>
        </section>
      </div>

      {/* Footer Links */}
      
    </div>
  );
}
