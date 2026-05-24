import Avatar from 'boring-avatars';
import { testimonials } from '@/lib/content';

export function Testimonials() {
  return (
    <section className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {testimonials.heading}
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.items.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Avatar
                name={t.name}
                size={40}
                variant="beam"
                colors={['#0a0a0a', '#404040', '#737373', '#a3a3a3', '#e5e5e5']}
              />
              <blockquote className="text-sm leading-relaxed text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-auto">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.title}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
