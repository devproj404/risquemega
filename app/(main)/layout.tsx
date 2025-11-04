import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AgeVerification } from '@/components/age-verification';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AgeVerification />
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
