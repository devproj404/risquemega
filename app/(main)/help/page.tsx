'use client';

import { LifeBuoy, Mail, MessageCircle, BookOpen, Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">

          <h1 className="text-2xl font-semibold text-white">Help Center</h1>
        </div>
      </div>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {/* FAQ */}
        <Link
          href="/faq"
          className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
        >
          <div className="flex items-start gap-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <BookOpen className="w-6 h-6 text-gray-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2 group-hover:text-gray-300 transition">
                Frequently Asked Questions
              </h3>
              <p className="text-gray-400 text-sm">
                Find quick answers to common questions about using the platform
              </p>
            </div>
          </div>
        </Link>


       

        {/* Contact Support */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <MessageCircle className="w-6 h-6 text-gray-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">Contact Support</h3>
              <p className="text-gray-400 text-sm">
                Get in touch with our support team for assistance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Help Topics */}
      

      {/* Contact Support Box */}
      <div className="mt-8 text-center bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Need More Help?</h2>
        <p className="text-gray-400 mb-6">
          Our support team is here to help you with any questions or issues.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@leakybabes.com"
            className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
          <Link
            href="/faq"
            className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
          >
            <BookOpen className="w-4 h-4" />
            View FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}
