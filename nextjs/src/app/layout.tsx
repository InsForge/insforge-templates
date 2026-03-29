import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'testnextjs',
  description: 'Created with Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
