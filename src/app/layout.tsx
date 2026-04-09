import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'SAVEMI Ministry',
  description: 'Sabbath Vesper Ministry sharing repose, renewal, and restoration through reflective worship.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <Navbar />
        <main className="flex-1">
          <div className="site-container py-6 sm:py-8">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
