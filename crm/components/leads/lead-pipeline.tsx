'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
  type DropResult,
} from '@hello-pangea/dnd';
import { Search, RefreshCw, List, Plus } from 'lucide-react';
import Link from 'next/link';
import type { LeadStage } from '@/lib/types';

interface PipelineLead {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email?: string;
  status: string;
  current_stage_id: string;
  current_stage?: { name: string; order_index?: number };
}

interface PipelineStage extends LeadStage {
  leads: PipelineLead[];
}

export function LeadPipeline({
  initialStages,
  initialLeads,
}: {
  initialStages: LeadStage[];
  initialLeads: PipelineLead[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Group leads by stage
  const stagesWithLeads: PipelineStage[] = initialStages.map((stage) => ({
    ...stage,
    leads: initialLeads.filter((l) => l.current_stage_id === stage.id),
  }));

  const [stages, setStages] = useState(stagesWithLeads);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceStageId = result.source.droppableId;
    const destStageId = result.destination.droppableId;
    if (sourceStageId === destStageId) return;

    const leadId = result.draggableId;

    // Optimistic update
    const newStages = stages.map((s) => ({ ...s, leads: [...s.leads] }));
    const sourceStage = newStages.find((s) => s.id === sourceStageId);
    const destStage = newStages.find((s) => s.id === destStageId);

    if (sourceStage && destStage) {
      const [lead] = sourceStage.leads.splice(result.source.index, 1);
      lead.current_stage_id = destStageId;
      destStage.leads.splice(result.destination.index, 0, lead);
      setStages(newStages);
    }

    try {
      const res = await fetch(`/api/leads/${leadId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStageId: destStageId }),
      });

      if (!res.ok) throw new Error();
      toast.success('Lead stage updated');
    } catch {
      toast.error('Failed to update stage');
      router.refresh();
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filterLeads = (leads: PipelineLead[]) => {
    if (!searchTerm) return leads;
    const term = searchTerm.toLowerCase();
    return leads.filter(
      (l) =>
        l.company_name.toLowerCase().includes(term) ||
        l.contact_name.toLowerCase().includes(term),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <Button variant="ghost" size="sm" onClick={() => router.push('/leads')}>
            <List className="mr-2 h-4 w-4" />
            List View
          </Button>
        </div>
        <Link href="/leads/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const filteredLeads = filterLeads(stage.leads);
            return (
              <div key={stage.id} className="w-72 flex-none">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>{stage.name}</span>
                      <Badge variant="secondary">{filteredLeads.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Droppable droppableId={stage.id}>
                      {(provided: DroppableProvided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="min-h-[200px] space-y-2"
                        >
                          {filteredLeads.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided: DraggableProvided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                                  onClick={(e) => {
                                    if (e.defaultPrevented) return;
                                    router.push(`/leads/${lead.id}`);
                                  }}
                                >
                                  <div className="font-medium">{lead.company_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {lead.contact_name}
                                  </div>
                                  <Badge
                                    variant={lead.status === 'qualified' ? 'default' : 'secondary'}
                                    className="mt-2"
                                  >
                                    {lead.status}
                                  </Badge>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
