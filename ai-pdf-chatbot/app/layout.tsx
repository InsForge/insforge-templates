import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

// One env var drives every absolute URL in the metadata (canonical, OG
// image, sitemap). Template users get correct tags on their own domain
// automatically because NEXT_PUBLIC_BETTER_AUTH_URL is already required
// for auth to work.
const SITE_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? 'http://localhost:3000';

const TITLE = 'AI Notebook — chat, mindmap & podcast your PDFs';
const DESCRIPTION =
  'An open-source thinking partner for your PDFs: RAG chat with inline citations, auto-generated mindmaps, spaced-repetition flashcards, and podcast-style audio overviews. Self-hosted.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · AI Notebook',
  },
  description: DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'AI Notebook',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

// schema.org SoftwareApplication: one of the strongest signals AI
// engines use to understand and cite a product.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Notebook',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: DESCRIPTION,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  sameAs: ['https://github.com/InsForge/insforge-templates'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
