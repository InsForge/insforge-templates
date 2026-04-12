import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "To Do List",
  description: "A simple to-do list app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
