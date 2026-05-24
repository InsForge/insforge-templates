import { howItWorks } from '@/lib/content';

export function HowItWorks() {
  return (
    <section className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {howItWorks.heading}
          </h2>
        </div>
        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {howItWorks.steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-medium tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
