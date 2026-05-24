import { WaitlistForm } from '@/components/waitlist-form';
import { waitlistCta } from '@/lib/content';

export function WaitlistCta() {
  return (
    <section id="waitlist" className="border-b border-border py-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {waitlistCta.heading}
        </h2>
        <p className="max-w-xl text-pretty text-muted-foreground">{waitlistCta.subhead}</p>
        <WaitlistForm
          source="cta-section"
          placeholder={waitlistCta.placeholder}
          buttonLabel={waitlistCta.buttonLabel}
        />
      </div>
    </section>
  );
}
