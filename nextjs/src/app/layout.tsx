import type { Metadata } from 'next';
import './globals.css';

const themeInitScript = `
(() => {
  try {
    const storageKey = "insforge-theme";
    const savedTheme = localStorage.getItem(storageKey) || "system";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolvedTheme = savedTheme === "system"
      ? (prefersDark ? "dark" : "light")
      : savedTheme;

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  } catch {}
})();
`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
