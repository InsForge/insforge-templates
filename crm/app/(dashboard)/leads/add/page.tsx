import { getAccessToken } from '@/lib/auth-cookies';
import { getLeadSources, getLeadStages } from '@/lib/queries';
import { AddLeadForm } from '@/components/leads/add-lead-form';

export default async function AddLeadPage() {
  const token = await getAccessToken();
  const [sources, stages] = await Promise.all([
    getLeadSources(token),
    getLeadStages(token),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Lead</h1>
      <AddLeadForm sources={sources} stages={stages} />
    </div>
  );
}
