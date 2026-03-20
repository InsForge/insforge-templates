'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Plus,
  CheckCircle,
} from 'lucide-react';
import { ACTIVITY_TYPES, FOLLOW_UP_PRIORITIES } from '@/lib/constants';
import { format } from 'date-fns';
import type { Lead, LeadActivity, LeadFollowUp } from '@/lib/types';

export function LeadDetail({
  lead,
  activities: initialActivities,
  followUps: initialFollowUps,
}: {
  lead: Lead;
  activities: LeadActivity[];
  followUps: LeadFollowUp[];
}) {
  const router = useRouter();
  const [activities, setActivities] = useState(initialActivities);
  const [followUps, setFollowUps] = useState(initialFollowUps);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);

  async function addActivity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.get('type'),
          subject: form.get('subject'),
          description: form.get('description') || undefined,
          activity_date: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      const activity = await res.json();
      setActivities([activity, ...activities]);
      setShowActivityForm(false);
      toast.success('Activity added');
    } catch {
      toast.error('Failed to add activity');
    }
  }

  async function addFollowUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/leads/${lead.id}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          due_date: form.get('due_date'),
          priority: form.get('priority'),
          description: form.get('description'),
        }),
      });
      if (!res.ok) throw new Error();
      const followUp = await res.json();
      setFollowUps([...followUps, followUp]);
      setShowFollowUpForm(false);
      toast.success('Follow-up created');
    } catch {
      toast.error('Failed to create follow-up');
    }
  }

  async function completeFollowUp(followUpId: string) {
    try {
      const res = await fetch(`/api/leads/${lead.id}/follow-ups`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpId }),
      });
      if (!res.ok) throw new Error();
      setFollowUps(followUps.map((f) =>
        f.id === followUpId ? { ...f, status: 'completed' as const, completed_at: new Date().toISOString() } : f,
      ));
      toast.success('Follow-up completed');
    } catch {
      toast.error('Failed to complete follow-up');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{lead.contact_name}</h1>
          <p className="text-muted-foreground">{lead.company_name}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={lead.status === 'qualified' ? 'default' : 'secondary'}>
            {lead.status}
          </Badge>
          {lead.current_stage && <Badge variant="outline">{lead.current_stage.name}</Badge>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {lead.contact_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{lead.contact_email}</span>
              </div>
            )}
            {lead.contact_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{lead.contact_phone}</span>
              </div>
            )}
            {lead.contact_title && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{lead.contact_title}</span>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{lead.website}</span>
              </div>
            )}
            {lead.industry && <p className="text-muted-foreground">Industry: {lead.industry}</p>}
            {lead.source && <p className="text-muted-foreground">Source: {lead.source.name}</p>}
            {lead.notes && (
              <div className="mt-4 rounded-md bg-muted p-3">
                <p className="whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Activities</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowActivityForm(!showActivityForm)}>
              <Plus className="mr-1 h-3 w-3" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {showActivityForm && (
              <form onSubmit={addActivity} className="mb-4 space-y-3 rounded-md border p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Type</Label>
                    <Select name="type" required>
                      <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input name="subject" required />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea name="description" rows={2} />
                </div>
                <Button type="submit" size="sm">Save Activity</Button>
              </form>
            )}

            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activities yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-start justify-between rounded-md border p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{a.type}</Badge>
                        <span className="font-medium">{a.subject}</span>
                      </div>
                      {a.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(a.activity_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow-Ups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Follow-Ups</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowFollowUpForm(!showFollowUpForm)}>
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {showFollowUpForm && (
            <form onSubmit={addFollowUp} className="mb-4 space-y-3 rounded-md border p-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Due Date</Label>
                  <Input name="due_date" type="datetime-local" required />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FOLLOW_UP_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" required rows={2} />
              </div>
              <Button type="submit" size="sm">Create Follow-Up</Button>
            </form>
          )}

          {followUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
          ) : (
            <div className="space-y-2">
              {followUps.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-center justify-between rounded-md border p-3 ${
                    f.status === 'completed' ? 'opacity-60' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium">{f.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Due: {format(new Date(f.due_date), 'MMM d, yyyy HH:mm')}</span>
                      <Badge variant={f.priority === 'high' ? 'destructive' : 'secondary'}>
                        {f.priority}
                      </Badge>
                      <Badge variant={f.status === 'completed' ? 'default' : 'outline'}>
                        {f.status}
                      </Badge>
                    </div>
                  </div>
                  {f.status === 'pending' && (
                    <Button size="sm" variant="ghost" onClick={() => completeFollowUp(f.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
