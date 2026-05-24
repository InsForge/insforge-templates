import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Compass,
  Plug,
  Repeat,
  Shield,
  Zap,
} from 'lucide-react';

export const brand = {
  name: 'Acme',
  tagline: 'Analytics for modern product teams',
  description:
    'A focused analytics platform built for teams that need clear answers, not more dashboards.',
};

export const nav = {
  links: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  signIn: { label: 'Sign in', href: '/sign-in' },
  cta: { label: 'Request access', href: '#waitlist' },
};

export const hero = {
  badge: 'Now in public beta',
  headline: 'Product analytics that get out of the way.',
  subhead:
    'Acme delivers the metrics product teams rely on — engagement, retention, and revenue — in a single, opinionated workspace. No SQL required.',
  primaryCta: { label: 'Request access', href: '#waitlist' },
  secondaryCta: { label: 'View live demo', href: '#features' },
};

export const logoCloud = {
  heading: 'Trusted by teams shipping with Acme',
  logos: [
    { name: 'GitHub', src: '/logos/github.svg' },
    { name: 'Vercel', src: '/logos/vercel.svg' },
    { name: 'Stripe', src: '/logos/stripe.svg' },
    { name: 'Linear', src: '/logos/linear.svg' },
    { name: 'Notion', src: '/logos/notion.svg' },
    { name: 'Figma', src: '/logos/figma.svg' },
  ],
};

export type Feature = { icon: LucideIcon; title: string; body: string };

export const features: { heading: string; subhead: string; items: Feature[] } = {
  heading: 'Everything a product team needs. Nothing it does not.',
  subhead: 'Six focused capabilities, designed to answer the questions you actually ask.',
  items: [
    {
      icon: BarChart3,
      title: 'Real-time dashboards',
      body: 'Monitor active users, conversions, and revenue with sub-second updates.',
    },
    {
      icon: Compass,
      title: 'Funnel analysis',
      body: 'Identify drop-off across any flow, with cohort comparison built in.',
    },
    {
      icon: Repeat,
      title: 'Retention reports',
      body: 'Cohorts auto-grouped by acquisition week — no manual setup required.',
    },
    {
      icon: Shield,
      title: 'Privacy by design',
      body: 'No third-party trackers. GDPR and CCPA ready out of the box.',
    },
    {
      icon: Plug,
      title: 'SDKs for every stack',
      body: 'First-class libraries for React, Next.js, Swift, Kotlin, and a lightweight script tag.',
    },
    {
      icon: Zap,
      title: 'Five-minute setup',
      body: 'Connect your application and start collecting events in under five minutes.',
    },
  ],
};

export const howItWorks = {
  heading: 'From install to insight in three steps.',
  steps: [
    {
      title: 'Connect',
      body: 'Install the SDK or add a single script tag. Data collection begins immediately.',
    },
    {
      title: 'Explore',
      body: 'Open pre-built dashboards for retention, funnels, and revenue analysis.',
    },
    {
      title: 'Decide',
      body: 'Receive weekly digests and anomaly alerts so the team stays informed.',
    },
  ],
};

export type PricingTier = {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  pitch: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
};

export const pricing: { heading: string; subhead: string; tiers: PricingTier[] } = {
  heading: 'Pricing that scales with the team, not against it.',
  subhead: 'Start free. Upgrade when the data is paying for itself.',
  tiers: [
    {
      id: 'free',
      name: 'Free',
      monthly: 0,
      yearly: 0,
      pitch: 'For evaluation and side projects',
      features: ['10k events / mo', '30-day retention', '1 project', 'Community support'],
      cta: { label: 'Start free', href: '#waitlist' },
    },
    {
      id: 'pro',
      name: 'Pro',
      monthly: 19,
      yearly: 15,
      pitch: 'For growing products',
      features: [
        '1M events / mo',
        '12-month retention',
        'Unlimited projects',
        'Email digests',
        'Priority support',
      ],
      cta: { label: 'Start trial', href: '#waitlist' },
      highlighted: true,
    },
    {
      id: 'team',
      name: 'Team',
      monthly: 79,
      yearly: 65,
      pitch: 'For product teams',
      features: [
        '10M events / mo',
        'Unlimited retention',
        'SSO',
        'Audit logs',
        '99.9% SLA',
      ],
      cta: { label: 'Contact sales', href: 'mailto:sales@example.com' },
    },
  ],
};

export type Testimonial = { quote: string; name: string; title: string };

export const testimonials: { heading: string; items: Testimonial[] } = {
  heading: 'Loved by teams that ship.',
  items: [
    {
      quote:
        'Acme replaced three legacy tools and our team finally agrees on the numbers.',
      name: 'Maya Rao',
      title: 'Head of Product, Quill',
    },
    {
      quote:
        'The clarity is the feature. Our standups are shorter and our decisions are sharper.',
      name: 'Tomás Beck',
      title: 'Founder, Beck Labs',
    },
    {
      quote:
        'We attribute two of last quarter’s wins directly to insights surfaced by Acme.',
      name: 'Lena Park',
      title: 'CEO, Folio',
    },
  ],
};

export const faq = {
  heading: 'Frequently asked questions.',
  items: [
    {
      q: 'How does Acme compare to Mixpanel or Amplitude?',
      a: 'Acme focuses on the core questions product teams ask daily. It does not aim to replace your data warehouse — it replaces the dashboards your team actually opens.',
    },
    {
      q: 'How is customer data handled?',
      a: 'Customer data remains within your project, encrypted at rest. We do not sell, share, or use customer data to train models.',
    },
    {
      q: 'Is there a free plan?',
      a: 'Yes. Up to 10,000 events per month, with no credit card required.',
    },
    {
      q: 'Do you offer self-hosting?',
      a: 'Self-hosting is on the roadmap. The hosted version is recommended for most teams.',
    },
    {
      q: 'Is Acme GDPR and CCPA compliant?',
      a: 'Acme does not use third-party cookies, anonymizes IP addresses, and provides a DPA on request.',
    },
    {
      q: 'How long does setup take?',
      a: 'Typically under five minutes — one script tag or `npm install @acme/sdk`.',
    },
  ],
};

export const waitlistCta = {
  heading: 'Get early access.',
  subhead:
    'Join the waitlist. We are onboarding new teams every week and will reach out when it is your turn.',
  placeholder: 'you@company.com',
  buttonLabel: 'Request access',
};

export const footer = {
  groups: [
    {
      heading: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Changelog', href: '#' },
        { label: 'Roadmap', href: '#' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press kit', href: '#' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Docs', href: '#' },
        { label: 'API', href: '#' },
        { label: 'Status', href: '#' },
        { label: 'Community', href: '#' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Security', href: '#' },
        { label: 'DPA', href: '#' },
      ],
    },
  ],
  social: [
    { label: 'X', href: 'https://x.com' },
    { label: 'GitHub', href: 'https://github.com' },
    { label: 'Discord', href: 'https://discord.com' },
  ],
};
