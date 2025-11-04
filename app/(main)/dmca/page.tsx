'use client';

import Link from 'next/link';

export default function DMCAPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">DMCA Copyright Policy</h1>
        <p className="text-gray-400 text-sm mt-1">Digital Millennium Copyright Act Notice</p>
      </div>

      {/* Important Notice */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 mb-8">
        <h3 className="text-white font-semibold mb-2">Our Commitment</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          RisqueMega respects the intellectual property rights of others and expects our users to do the same.
          We respond to notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act (DMCA).
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {/* Copyright Infringement */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Copyright Infringement Notification</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement
              and is accessible on this website, you may notify our copyright agent as set forth below.
            </p>
            <p className="text-gray-400">
              For your complaint to be valid under the DMCA, you must provide the following information in writing:
            </p>
          </div>
        </section>

        {/* Required Information */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Required Information
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-gray-300 font-medium mb-1">1. Electronic or Physical Signature</h3>
              <p className="text-gray-400 text-sm">
                An electronic or physical signature of the person authorized to act on behalf of the copyright owner.
              </p>
            </div>

            <div>
              <h3 className="text-gray-300 font-medium mb-1">2. Description of Copyrighted Work</h3>
              <p className="text-gray-400 text-sm">
                A description of the copyrighted work that you claim has been infringed.
              </p>
            </div>

            <div>
              <h3 className="text-gray-300 font-medium mb-1">3. Location of Infringing Material</h3>
              <p className="text-gray-400 text-sm">
                A description of where the material that you claim is infringing is located on our website
                (preferably including specific URL(s)).
              </p>
            </div>

            <div>
              <h3 className="text-gray-300 font-medium mb-1">4. Contact Information</h3>
              <p className="text-gray-400 text-sm">
                Your address, telephone number, and email address.
              </p>
            </div>

            <div>
              <h3 className="text-gray-300 font-medium mb-1">5. Good Faith Statement</h3>
              <p className="text-gray-400 text-sm">
                A statement that you have a good faith belief that the disputed use is not authorized by the
                copyright owner, its agent, or the law.
              </p>
            </div>

            <div>
              <h3 className="text-gray-300 font-medium mb-1">6. Accuracy Statement</h3>
              <p className="text-gray-400 text-sm">
                A statement, made under penalty of perjury, that the above information in your notice is accurate
                and that you are the copyright owner or authorized to act on the copyright owner's behalf.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Submit DMCA Notice
          </h2>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              Our designated Copyright Agent to receive notifications of claimed infringement can be reached as follows:
            </p>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-[80px]">Email:</span>
                  <a href="mailto:dmca@leakybabes.com" className="text-gray-300 hover:text-white transition">
                    dmca@leakybabes.com
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-[80px]">Subject:</span>
                  <span className="text-gray-300">DMCA Takedown Request</span>
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-sm">
              Please allow 2-5 business days for an email response. Note that emailing your complaint to other parties
              will not expedite your request and may result in a delayed response.
            </p>
          </div>
        </section>

        {/* Counter-Notification */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Counter-Notification</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              If you believe that your content was removed by mistake or misidentification, you may file a counter-notification
              with our Copyright Agent using the contact information provided above.
            </p>
            <p className="text-gray-400">
              Your counter-notification must include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 ml-4">
              <li>Your physical or electronic signature</li>
              <li>Identification of the content that has been removed and its location before removal</li>
              <li>A statement under penalty of perjury that you have a good faith belief the content was removed by mistake</li>
              <li>Your name, address, telephone number, and email address</li>
              <li>A statement that you consent to jurisdiction of the federal court in your district</li>
            </ul>
          </div>
        </section>

        {/* Repeat Infringer Policy */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Repeat Infringer Policy</h2>
          <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              In accordance with the DMCA and other applicable laws, we have adopted a policy of terminating,
              in appropriate circumstances and at our sole discretion, accounts of users who are deemed to be repeat infringers.
            </p>
            <p className="text-gray-400">
              We may also, at our sole discretion, limit access to the website and/or terminate the accounts of any users
              who infringe any intellectual property rights of others, whether or not there is any repeat infringement.
            </p>
          </div>
        </section>

        {/* False Claims Warning */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Warning About False Claims</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-2">
            Please be aware that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents
            that material or activity is infringing may be subject to liability.
          </p>
          <p className="text-gray-400 text-sm">
            Do not make false claims. You may be liable for damages (including costs and attorneys' fees) if you
            materially misrepresent that content is infringing your copyright.
          </p>
        </section>
      </div>

      {/* Footer Links */}
      <div className="mt-12 pt-8 border-t border-gray-800 text-center">
        <p className="text-gray-400 text-sm mb-4">
          Need help with a DMCA notice?
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/help" className="text-gray-300 hover:text-white transition">
            Help Center
          </Link>
          <Link href="/terms" className="text-gray-300 hover:text-white transition">
            Terms of Service
          </Link>
          <a href="mailto:dmca@leakybabes.com" className="text-gray-300 hover:text-white transition">
            Contact DMCA Agent
          </a>
        </div>
      </div>
    </div>
  );
}
