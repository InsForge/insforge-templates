import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { Toaster } from 'sonner';
import { STORE_DESCRIPTION, STORE_NAME } from '@/lib/constants';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cormorant',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: STORE_NAME,
  description: STORE_DESCRIPTION,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${manrope.variable} ${cormorant.variable} bg-background font-sans text-foreground`}
      >
        {children}
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}
