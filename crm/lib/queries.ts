import { UPLOAD_BUCKET } from '@/lib/constants';
import { createInsforgeServerClient, getInsforgeServerClient } from '@/lib/insforge';

type InsforgeClient = ReturnType<typeof createInsforgeServerClient>;

function getInsforge(accessToken?: string | null): InsforgeClient {
  if (accessToken) {
    return createInsforgeServerClient({ accessToken });
  }
  return getInsforgeServerClient();
}

function assertNoDatabaseError(
  error: { message?: string } | null,
  fallbackMessage: string,
) {
  if (error) {
    throw new Error(error.message ?? fallbackMessage);
  }
}

// ============================================================
// Clients
// ============================================================

export async function getClients(
  accessToken?: string | null,
  page?: number,
  itemsPerPage?: number,
) {
  const insforge = getInsforge(accessToken);
  let query = insforge.database
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (page !== undefined && itemsPerPage !== undefined) {
    const start = (page - 1) * itemsPerPage;
    query = query.range(start, start + itemsPerPage - 1);
  }

  const { data, error, count } = await query;
  assertNoDatabaseError(error, 'Unable to load clients.');
  return { clients: data ?? [], count: count ?? 0 };
}

export async function getClientById(id: string, accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  assertNoDatabaseError(error, 'Unable to load client.');
  return data;
}

export async function addClient(
  clientData: { name: string; client_code: string; address?: string; postal_code?: string; country_code?: string; user_id: string },
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('clients')
    .insert([clientData])
    .select();

  assertNoDatabaseError(error, 'Unable to create client.');
  return data?.[0] ?? null;
}

export async function updateClient(
  id: string,
  clientData: Record<string, unknown>,
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('clients')
    .update(clientData)
    .eq('id', id)
    .select();

  assertNoDatabaseError(error, 'Unable to update client.');
  return data?.[0] ?? null;
}

// ============================================================
// Lead Sources
// ============================================================

export async function getLeadSources(accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('lead_sources')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  assertNoDatabaseError(error, 'Unable to load lead sources.');
  return data ?? [];
}

// ============================================================
// Lead Stages
// ============================================================

export async function getLeadStages(accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('lead_stages')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  assertNoDatabaseError(error, 'Unable to load lead stages.');
  return data ?? [];
}

// ============================================================
// Leads
// ============================================================

export async function getLeads(
  accessToken?: string | null,
  page?: number,
  itemsPerPage?: number,
) {
  const insforge = getInsforge(accessToken);
  let query = insforge.database
    .from('leads')
    .select('*, source:source_id(name), current_stage:current_stage_id(name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (page !== undefined && itemsPerPage !== undefined) {
    const start = (page - 1) * itemsPerPage;
    query = query.range(start, start + itemsPerPage - 1);
  }

  const { data, error, count } = await query;
  assertNoDatabaseError(error, 'Unable to load leads.');
  return { leads: data ?? [], count: count ?? 0 };
}

export async function getLead(id: string, accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('leads')
    .select('*, source:source_id(name), current_stage:current_stage_id(name)')
    .eq('id', id)
    .maybeSingle();

  assertNoDatabaseError(error, 'Unable to load lead.');
  return data;
}

export async function addLead(
  leadData: {
    company_name: string;
    contact_name: string;
    source_id: string;
    current_stage_id: string;
    user_id: string;
    industry?: string;
    website?: string;
    contact_title?: string;
    contact_email?: string;
    contact_phone?: string;
    status?: string;
    notes?: string;
  },
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('leads')
    .insert([leadData])
    .select();

  assertNoDatabaseError(error, 'Unable to create lead.');
  return data?.[0] ?? null;
}

export async function updateLead(
  id: string,
  leadData: Record<string, unknown>,
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('leads')
    .update(leadData)
    .eq('id', id)
    .select();

  assertNoDatabaseError(error, 'Unable to update lead.');
  return data?.[0] ?? null;
}

export async function getLeadsByStage(accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('leads')
    .select('*, source:source_id(name), current_stage:current_stage_id(name, order_index)')
    .eq('is_converted', false)
    .order('created_at', { ascending: false });

  assertNoDatabaseError(error, 'Unable to load pipeline leads.');
  return data ?? [];
}

export async function updateLeadStage(
  leadId: string,
  toStageId: string,
  userId: string,
  notes?: string,
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);
  const { error } = await insforge.database.rpc('update_lead_stage', {
    p_lead_id: leadId,
    p_to_stage_id: toStageId,
    p_user_id: userId,
    p_notes: notes ?? null,
  });

  assertNoDatabaseError(error, 'Unable to update lead stage.');
}

// ============================================================
// Lead Activities
// ============================================================

export async function getLeadActivities(leadId: string, accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('activity_date', { ascending: false });

  assertNoDatabaseError(error, 'Unable to load activities.');
  return data ?? [];
}

export async function addLeadActivity(
  activityData: {
    lead_id: string;
    type: string;
    subject: string;
    description?: string;
    activity_date: string;
    duration_minutes?: number;
    status?: string;
    user_id: string;
  },
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('lead_activities')
    .insert([activityData])
    .select();

  assertNoDatabaseError(error, 'Unable to create activity.');
  return data?.[0] ?? null;
}

// ============================================================
// Lead Documents
// ============================================================

export async function getLeadDocuments(leadId: string, accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('lead_documents')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  assertNoDatabaseError(error, 'Unable to load documents.');
  return data ?? [];
}

export async function addLeadDocument(
  file: { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> },
  leadId: string,
  userId: string,
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);
  const filePath = `leads/${leadId}/${Date.now()}-${file.name}`;

  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await insforge.storage
    .from(UPLOAD_BUCKET)
    .upload(filePath, buffer, { contentType: file.type });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = insforge.storage
    .from(UPLOAD_BUCKET)
    .getPublicUrl(filePath);

  const { data, error } = await insforge.database
    .from('lead_documents')
    .insert([{
      lead_id: leadId,
      name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      user_id: userId,
    }])
    .select();

  assertNoDatabaseError(error, 'Unable to save document record.');
  return data?.[0] ?? null;
}

export async function deleteLeadDocument(
  documentId: string,
  filePath: string,
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);

  await insforge.storage.from(UPLOAD_BUCKET).remove([filePath]);

  const { error } = await insforge.database
    .from('lead_documents')
    .delete()
    .eq('id', documentId);

  assertNoDatabaseError(error, 'Unable to delete document.');
}

// ============================================================
// Lead Follow-Ups
// ============================================================

export async function getLeadFollowUps(leadId: string, accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('lead_follow_ups')
    .select('*')
    .eq('lead_id', leadId)
    .order('due_date', { ascending: true });

  assertNoDatabaseError(error, 'Unable to load follow-ups.');
  return data ?? [];
}

export async function addLeadFollowUp(
  followUpData: {
    lead_id: string;
    due_date: string;
    priority: string;
    description: string;
    user_id: string;
  },
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('lead_follow_ups')
    .insert([{ ...followUpData, status: 'pending' }])
    .select();

  assertNoDatabaseError(error, 'Unable to create follow-up.');
  return data?.[0] ?? null;
}

export async function completeFollowUp(id: string, accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { error } = await insforge.database
    .from('lead_follow_ups')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id);

  assertNoDatabaseError(error, 'Unable to complete follow-up.');
}

// ============================================================
// Lead Conversion
// ============================================================

export async function convertLeadToClient(
  leadId: string,
  clientData: { name: string; client_code: string; user_id: string },
  dealValue?: number,
  notes?: string,
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);

  // Create client
  const { data: clientResult, error: clientError } = await insforge.database
    .from('clients')
    .insert([clientData])
    .select();

  assertNoDatabaseError(clientError, 'Unable to create client from lead.');
  const client = clientResult?.[0];
  if (!client) throw new Error('Client creation returned no data.');

  // Record conversion
  const { error: convError } = await insforge.database
    .from('lead_conversions')
    .insert([{
      lead_id: leadId,
      client_id: client.id,
      converted_by: clientData.user_id,
      deal_value: dealValue ?? null,
      conversion_notes: notes ?? null,
      user_id: clientData.user_id,
    }]);

  assertNoDatabaseError(convError, 'Unable to record conversion.');

  // Mark lead as converted
  const { error: leadError } = await insforge.database
    .from('leads')
    .update({
      is_converted: true,
      converted_to_client_id: client.id,
      converted_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  assertNoDatabaseError(leadError, 'Unable to update lead status.');

  return client;
}

// ============================================================
// Projects
// ============================================================

export async function getProjects(
  accessToken?: string | null,
  page?: number,
  itemsPerPage?: number,
) {
  const insforge = getInsforge(accessToken);
  let query = insforge.database
    .from('projects')
    .select('*, client:client_id(*)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (page !== undefined && itemsPerPage !== undefined) {
    const start = (page - 1) * itemsPerPage;
    query = query.range(start, start + itemsPerPage - 1);
  }

  const { data, error, count } = await query;
  assertNoDatabaseError(error, 'Unable to load projects.');
  return { projects: data ?? [], count: count ?? 0 };
}

export async function getProject(id: string, accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('projects')
    .select('*, client:client_id(*)')
    .eq('id', id)
    .maybeSingle();

  assertNoDatabaseError(error, 'Unable to load project.');
  return data;
}

export async function addProject(
  projectData: {
    code: string;
    name: string;
    client_id: string;
    user_id: string;
    currency?: string;
    start_date?: string;
    end_date?: string;
    deal_status?: string;
    billable?: boolean;
    note?: string;
  },
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('projects')
    .insert([projectData])
    .select();

  assertNoDatabaseError(error, 'Unable to create project.');
  return data?.[0] ?? null;
}

export async function updateProject(
  id: string,
  projectData: Record<string, unknown>,
  accessToken?: string | null,
) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('projects')
    .update(projectData)
    .eq('id', id)
    .select();

  assertNoDatabaseError(error, 'Unable to update project.');
  return data?.[0] ?? null;
}

// ============================================================
// Seed defaults
// ============================================================

export async function seedDefaults(userId: string, accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { error } = await insforge.database.rpc('seed_crm_defaults', {
    p_user_id: userId,
  });

  assertNoDatabaseError(error, 'Unable to seed default data.');
}
