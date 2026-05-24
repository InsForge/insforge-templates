import { features } from '@/lib/content';

export function Features() {
  return (
    <section id="features" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {features.heading}
          </h2>
          <p className="mt-3 text-muted-foreground">{features.subhead}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/20 hover:shadow-lg"
              >
                <div className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-foreground">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-medium tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
