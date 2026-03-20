import { notFound } from 'next/navigation';
import { getAccessToken } from '@/lib/auth-cookies';
import { getLead, getLeadActivities, getLeadFollowUps } from '@/lib/queries';
import { LeadDetail } from '@/components/leads/lead-detail';

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getAccessToken();

  const [lead, activities, followUps] = await Promise.all([
    getLead(id, token),
    getLeadActivities(id, token),
    getLeadFollowUps(id, token),
  ]);

  if (!lead) notFound();

  return <LeadDetail lead={lead} activities={activities} followUps={followUps} />;
}
