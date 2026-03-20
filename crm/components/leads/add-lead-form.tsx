'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LeadSource, LeadStage } from '@/lib/types';

export function AddLeadForm({
  sources,
  stages,
}: {
  sources: LeadSource[];
  stages: LeadStage[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      company_name: form.get('company_name'),
      contact_name: form.get('contact_name'),
      contact_email: form.get('contact_email') || undefined,
      contact_phone: form.get('contact_phone') || undefined,
      contact_title: form.get('contact_title') || undefined,
      industry: form.get('industry') || undefined,
      website: form.get('website') || undefined,
      source_id: form.get('source_id'),
      current_stage_id: form.get('current_stage_id') || stages[0]?.id,
      notes: form.get('notes') || undefined,
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to create lead');

      toast.success('Lead created');
      router.push('/leads');
      router.refresh();
    } catch {
      toast.error('Failed to create lead');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input id="contact_name" name="contact_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" name="company_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input id="contact_email" name="contact_email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Phone</Label>
              <Input id="contact_phone" name="contact_phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_title">Title</Label>
              <Input id="contact_title" name="contact_title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" name="industry" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_id">Source *</Label>
              <Select name="source_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_stage_id">Stage</Label>
              <Select name="current_stage_id" defaultValue={stages[0]?.id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Lead'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
