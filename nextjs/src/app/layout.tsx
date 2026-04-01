import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Next.js InsForge Starter",
  description: "A starter template for building Next.js apps with InsForge auth and data flows.",
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
