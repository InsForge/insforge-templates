import { getAccessToken } from '@/lib/auth-cookies';
import { getLeadStages, getLeadsByStage } from '@/lib/queries';
import { LeadPipeline } from '@/components/leads/lead-pipeline';

export default async function PipelinePage() {
  const token = await getAccessToken();
  const [stages, leads] = await Promise.all([
    getLeadStages(token),
    getLeadsByStage(token),
  ]);

  return <LeadPipeline initialStages={stages} initialLeads={leads} />;
}
