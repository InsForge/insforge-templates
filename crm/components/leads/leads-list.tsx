'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  unqualified: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email?: string;
  status: string;
  created_at: string;
  source?: { name: string };
  current_stage?: { name: string };
}

export function LeadsList({
  initialLeads,
  initialCount,
}: {
  initialLeads: Lead[];
  initialCount: number;
}) {
  const [leads] = useState(initialLeads);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">{initialCount} total leads</p>
        </div>
        <Link href="/leads/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No leads yet. Create your first lead to get started.
            </div>
          ) : (
            <div className="divide-y">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-accent"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{lead.contact_name}</p>
                    <p className="text-sm text-muted-foreground">{lead.company_name}</p>
                    {lead.contact_email && (
                      <p className="text-xs text-muted-foreground">{lead.contact_email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    {lead.current_stage && (
                      <Badge variant="outline">{lead.current_stage.name}</Badge>
                    )}
                    <Badge className={statusColors[lead.status] ?? ''} variant="secondary">
                      {lead.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
