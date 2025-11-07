import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './nprogress.css';
import { Toaster } from '@/components/ui/sonner';
import { LoadingBar } from '@/components/loading-bar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RisqueMega',
  description: 'The best platform adult content',
  icons: {
    icon: '/images/happy.svg',
    shortcut: '/images/happy.svg',
    apple: '/images/happy.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* DNS Prefetch for external domains */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Preconnect to API domains for faster requests */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} bg-black`}>
        <LoadingBar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
