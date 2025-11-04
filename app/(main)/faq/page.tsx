'use client';

import { HelpCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is RisqueMega?',
    answer: 'RisqueMega is a platform for discovering and sharing adult content. Browse through various categories, save your favorites, and explore trending posts from verified creators.',
  },
  {
    question: 'How do I browse content?',
    answer: 'You can browse content by visiting the Explorer page from the home screen. Use the category filters to find specific content types, or browse by Hot and New tabs to discover trending and latest posts.',
  },
  {
    question: 'What are categories?',
    answer: 'Categories help organize content by type (Straight, Gay, Trans, Hentai, Lesbian, etc.). Click on any category to see all posts tagged with that category. Posts can have multiple categories.',
  },
  {
    question: 'How do I save posts?',
    answer: 'Click the bookmark icon on any post to save it to your Saved collection. You can access all your saved posts from the navigation menu.',
  },
  {
    question: 'How do I like a post?',
    answer: 'Click the heart icon on any post to like it. All your liked posts will appear in the Likes section accessible from the navigation menu.',
  },
  {
    question: 'What does the verification badge mean?',
    answer: 'A verification badge indicates that the content creator or actress has been verified by our platform. This helps ensure authenticity and quality.',
  },
  {
    question: 'How do I search for specific content?',
    answer: 'Use the search icon in the navigation bar to search for posts by title, description, or tags. You can also filter by categories to narrow down results.',
  },
  {
    question: 'What are tags?',
    answer: 'Tags are keywords that describe the content of a post. They help you find specific types of content more easily. Click on any tag to see similar posts.',
  },
  {
    question: 'Can I upload content?',
    answer: 'Content uploads are managed by administrators to ensure quality and compliance. If you\'re interested in becoming a content partner, please contact support.',
  },
  {
    question: 'How does the VIP membership work?',
    answer: 'VIP membership gives you access to exclusive content, early access to new posts, ad-free browsing, and additional features. Visit the VIP page to learn more about membership benefits.',
  },
  {
    question: 'Is my browsing private?',
    answer: 'Yes, your browsing activity is private. We do not share your viewing history or preferences with third parties. Your saved and liked posts are only visible to you.',
  },
  {
    question: 'How do I report inappropriate content?',
    answer: 'If you encounter content that violates our guidelines, use the report button on the post. Our moderation team reviews all reports within 24 hours.',
  },
  {
    question: 'What is the Feed feature?',
    answer: 'The Feed shows personalized content recommendations based on your interests and browsing history. It helps you discover new posts that match your preferences.',
  },
  {
    question: 'How do I change my account settings?',
    answer: 'Click the Settings icon in the navigation bar to access your account settings. Here you can update your profile, change preferences, and manage notifications.',
  },
  {
    question: 'What are creators?',
    answer: 'Creators are tagged in posts to help you find content from specific sources. Click on a creator tag to see all their content.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <HelpCircle className="w-6 h-6 text-gray-300" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Frequently Asked Questions</h1>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleQuestion(index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800/30 transition"
            >
              <span className="text-white font-medium pr-4">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 pt-2">
                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Still have questions */}
      <div className="mt-12 text-center bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
        <h2 className="text-xl font-semibold text-white mb-2">Still have questions?</h2>
        <p className="text-gray-400 mb-4">
          Can't find the answer you're looking for? Please visit our Help page.
        </p>
        <a
          href="/help"
          className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
        >
          <HelpCircle className="w-4 h-4" />
          Visit Help Center
        </a>
      </div>
    </div>
  );
}
