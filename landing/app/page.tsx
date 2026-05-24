import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Hero } from '@/components/sections/hero';
import { LogoCloud } from '@/components/sections/logo-cloud';
import { Features } from '@/components/sections/features';
import { HowItWorks } from '@/components/sections/how-it-works';
import { Pricing } from '@/components/sections/pricing';
import { Testimonials } from '@/components/sections/testimonials';
import { Faq } from '@/components/sections/faq';
import { WaitlistCta } from '@/components/sections/waitlist-cta';

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <LogoCloud />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <Faq />
        <WaitlistCta />
      </main>
      <SiteFooter />
    </>
  );
}
