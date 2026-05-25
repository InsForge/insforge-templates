import Link from 'next/link';
import { FileText } from 'lucide-react';

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <BackgroundDecor />

      <div className="relative z-10 w-full max-w-md space-y-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:opacity-80"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <FileText className="size-4" />
          </div>
          AI PDF Chatbot
        </Link>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm backdrop-blur sm:p-8">
          {children}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by{' '}
          <a
            href="https://insforge.dev"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            InsForge
          </a>{' '}
          · pgvector RAG · streaming citations
        </p>
      </div>
    </div>
  );
}

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Soft radial accents */}
      <div className="absolute -top-32 -left-32 size-[28rem] rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 size-[32rem] rounded-full bg-primary/10 blur-3xl" />

      {/* Floating "document chunk" cards — paper aesthetic for the product */}
      <FloatingPage
        className="absolute top-[8%] left-[6%] hidden rotate-[-6deg] xl:block"
        title="annual-report.pdf"
        page={4}
        markers={['[1]']}
      />
      <FloatingPage
        className="absolute top-[18%] right-[7%] hidden rotate-[5deg] xl:block"
        title="paper.pdf"
        page={12}
        markers={['[2]']}
        accent
      />
      <FloatingPage
        className="absolute bottom-[10%] left-[10%] hidden rotate-[3deg] xl:block"
        title="contract.pdf"
        page={2}
        markers={['[3]', '[4]']}
      />
      <FloatingPage
        className="absolute bottom-[14%] right-[12%] hidden rotate-[-4deg] xl:block"
        title="research.pdf"
        page={8}
        markers={['[5]']}
        accent
      />
    </div>
  );
}

function FloatingPage({
  className,
  title,
  page,
  markers,
  accent = false,
}: {
  className?: string;
  title: string;
  page: number;
  markers: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={`${className} w-52 rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-sm`}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
        <FileText className="size-3" />
        <span className="truncate">{title}</span>
        <span className="ml-auto">p.{page}</span>
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-muted" />
        <div className="h-1.5 w-[85%] rounded-full bg-muted" />
        <div className="h-1.5 w-[92%] rounded-full bg-muted" />
        <div className={`h-1.5 w-[70%] rounded-full ${accent ? 'bg-accent/60' : 'bg-muted'}`} />
      </div>
      <div className="mt-2 flex gap-1">
        {markers.map((m) => (
          <span
            key={m}
            className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent"
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
