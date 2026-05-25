import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Activity, BookOpen, HelpCircle, Mail, Search } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/_authenticated/help-center/')({
  component: HelpCenter,
})

type Faq = { q: string; a: string }

const FAQS: Faq[] = [
  {
    q: 'How do I switch between workspaces?',
    a: 'Use the workspace switcher in the top-left of the sidebar to jump between workspaces you belong to. Your selection is remembered for next time.',
  },
  {
    q: 'How do I invite a new member to my workspace?',
    a: 'Open Settings, then Members, and click Invite. Enter the email address and choose a role. The invitee will get an email with a sign-up link tied to your workspace.',
  },
  {
    q: 'How do I configure integrations like Slack or GitHub?',
    a: 'Head to Settings, then Integrations. Each integration has a Connect button that walks you through OAuth. You can disconnect or rotate credentials at any time from the same screen.',
  },
  {
    q: 'How do I change the theme or appearance?',
    a: 'Use the theme toggle in the top bar to switch between light, dark, and system. Per-user font and density preferences live under Settings, then Appearance.',
  },
  {
    q: 'How does realtime chat work?',
    a: 'Conversations stream over an InsForge realtime channel scoped to each chat. Messages are delivered instantly to everyone subscribed to that channel, and history is persisted in the database for late joiners.',
  },
  {
    q: 'Where is my data stored?',
    a: 'All application data lives in your InsForge project: rows in PostgreSQL, files in Storage buckets, and auth state managed by the InsForge SDK. You can export at any time using the InsForge CLI.',
  },
  {
    q: 'How do I deploy this dashboard to production?',
    a: 'Run npm run build to produce a static bundle in dist/. Deploy it to any static host (Vercel, Netlify, Cloudflare Pages, or InsForge Hosting) and point your environment variables at your production InsForge project.',
  },
  {
    q: 'How do I contact support?',
    a: 'Email support@insforge.dev with your project ID and a description of the issue. For urgent outages, check the status page first to see whether the problem is already being tracked.',
  },
]

function HelpCenter() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FAQS
    return FAQS.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Help Center</h2>
        <p className="text-sm text-muted-foreground">Find answers and get in touch.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Frequently asked questions</CardTitle>
          </div>
          <CardDescription>Search the most common questions about the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for an answer..."
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No results for "{query}". Try a different search term or contact support below.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filtered.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Still need help?</CardTitle>
          <CardDescription>
            Reach out directly or browse our resources for deeper documentation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <a
              href="mailto:support@insforge.dev"
              className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Email support</div>
                <div className="text-xs text-muted-foreground">support@insforge.dev</div>
              </div>
            </a>
            <a
              href="https://docs.insforge.dev"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <BookOpen className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Open documentation</div>
                <div className="text-xs text-muted-foreground">Guides and API reference</div>
              </div>
            </a>
            <a
              href="https://status.insforge.dev"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Activity className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Status</div>
                <div className="text-xs text-muted-foreground">Check current system status</div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
