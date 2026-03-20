import { getAccessToken } from '@/lib/auth-cookies';
import { getLeads } from '@/lib/queries';
import { LeadsList } from '@/components/leads/leads-list';

export default async function LeadsPage() {
  const token = await getAccessToken();
  const { leads, count } = await getLeads(token, 1, 25);

  return <LeadsList initialLeads={leads} initialCount={count} />;
}
