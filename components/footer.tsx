'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'ja', name: '日本語' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ru', name: 'Русский' },
  { code: 'sv', name: 'Svenska' },
  { code: 'hu', name: 'Magyar' },
  { code: 'cs', name: 'Čeština' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'ro', name: 'Română' },
];

export function Footer() {
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    localStorage.setItem('language', code);
    setIsLanguageModalOpen(false);
    // Trigger language change event
    window.dispatchEvent(new CustomEvent('languageChange', { detail: code }));
  };

  return (
    <>
      <footer className="border-t border-gray-800 mt-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-3 text-gray-500 text-xs">
            <button
              onClick={() => setIsLanguageModalOpen(true)}
              className="hover:text-gray-300 transition"
            >
              Language
            </button>
            <span className="text-gray-700">-</span>
            <Link href="/faq" className="hover:text-gray-300 transition">
              FAQ
            </Link>
            <span className="text-gray-700">-</span>
            <Link href="/terms" className="hover:text-gray-300 transition">
              Terms
            </Link>
            <span className="text-gray-700">-</span>
            <Link href="/dmca" className="hover:text-gray-300 transition">
              DMCA/Abuse
            </Link>
            <span className="text-gray-700">-</span>
            <Link href="/feedback" className="hover:text-gray-300 transition">
              Feedback
            </Link>
            <span className="text-gray-700">-</span>
            <Link href="/help" className="hover:text-gray-300 transition">
              Help
            </Link>
          </div>
        </div>
      </footer>

      {/* Language Selection Modal */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-2xl font-semibold text-white">Language</h2>
              <button
                onClick={() => setIsLanguageModalOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Language List */}
            <div className="overflow-y-auto max-h-[calc(80vh-100px)] scrollbar-thin">
              <div className="p-4">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition mb-2 ${
                      selectedLanguage === language.code
                        ? 'bg-pink-600 text-white'
                        : 'text-pink-400 hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-xl font-medium">{language.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
