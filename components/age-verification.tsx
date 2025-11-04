'use client';

import { useState, useEffect } from 'react';

const AGE_VERIFIED_KEY = 'leakybabes_age_verified';
const AGE_VERIFIED_VALUE = 'confirmed';

export function AgeVerification() {
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check verification status from multiple sources for robustness
    const checkVerification = () => {
      try {
        // Check localStorage
        const localStorageVerified = localStorage.getItem(AGE_VERIFIED_KEY) === AGE_VERIFIED_VALUE;

        // Check sessionStorage as backup
        const sessionStorageVerified = sessionStorage.getItem(AGE_VERIFIED_KEY) === AGE_VERIFIED_VALUE;

        // Check cookie as third backup
        const cookieVerified = document.cookie.split(';').some(item =>
          item.trim().startsWith(`${AGE_VERIFIED_KEY}=${AGE_VERIFIED_VALUE}`)
        );

        const isVerified = localStorageVerified || sessionStorageVerified || cookieVerified;

        setShowVerification(!isVerified);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking age verification:', error);
        // If there's an error, show verification to be safe
        setShowVerification(true);
        setIsLoading(false);
      }
    };

    checkVerification();
  }, []);

  const handleEnter = () => {
    try {
      // Store in localStorage
      localStorage.setItem(AGE_VERIFIED_KEY, AGE_VERIFIED_VALUE);

      // Store in sessionStorage as backup
      sessionStorage.setItem(AGE_VERIFIED_KEY, AGE_VERIFIED_VALUE);

      // Store in cookie (expires in 30 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      document.cookie = `${AGE_VERIFIED_KEY}=${AGE_VERIFIED_VALUE}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

      setShowVerification(false);
    } catch (error) {
      console.error('Error saving age verification:', error);
      setShowVerification(false);
    }
  };

  // Show loading or nothing while checking
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Don't show if verified
  if (!showVerification) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      {/* Background Image - optimized and local */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/age-verify-bg-optimized.jpg)',
          filter: 'brightness(0.7)',
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-md mx-auto">
        {/* Logo */}
        <h1 className="text-5xl md:text-6xl font-bold mb-8">
          <span className="text-white">leaky</span>
          <span className="text-pink-500">babes</span>
        </h1>

        {/* Description */}
        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
          This site is an adult community that contains sexually explicit material. You must be 18 years old or over to enter.
        </p>

        {/* Enter Button */}
        <button
          onClick={handleEnter}
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold text-lg px-8 py-3 rounded transition-colors duration-200 uppercase tracking-wide shadow-lg"
        >
          I AM 18 OR OLDER - ENTER
        </button>
      </div>
    </div>
  );
}
