export interface AuthViewer {
  isAuthenticated: boolean;
  id: string | null;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified';
export type ActivityType = 'email' | 'call' | 'meeting' | 'note' | 'task';
export type FollowUpPriority = 'low' | 'medium' | 'high';
export type FollowUpStatus = 'pending' | 'completed' | 'overdue';

export interface Client {
  id: string;
  name: string;
  client_code: string;
  address?: string;
  postal_code?: string;
  country_code?: string;
  is_active: boolean;
  is_deleted: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface LeadSource {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  user_id: string;
}

export interface LeadStage {
  id: string;
  name: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  user_id: string;
}

export interface Lead {
  id: string;
  company_name: string;
  industry?: string;
  website?: string;
  contact_name: string;
  contact_title?: string;
  contact_email?: string;
  contact_phone?: string;
  source_id: string;
  current_stage_id: string;
  status: LeadStatus;
  score: number;
  notes?: string;
  tags?: string[];
  is_converted: boolean;
  converted_to_client_id?: string;
  converted_at?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  source?: { name: string };
  current_stage?: { name: string };
}

export interface LeadStageHistory {
  id: string;
  lead_id: string;
  from_stage_id?: string;
  to_stage_id: string;
  changed_by: string;
  changed_at: string;
  time_in_previous_stage?: string;
  notes?: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  activity_date: string;
  duration_minutes?: number;
  status?: string;
  user_id: string;
  created_at: string;
}

export interface LeadDocument {
  id: string;
  lead_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  user_id: string;
  created_at: string;
}

export interface LeadFollowUp {
  id: string;
  lead_id: string;
  due_date: string;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  description: string;
  completed_at?: string;
  user_id: string;
  created_at: string;
}

export interface LeadConversion {
  id: string;
  lead_id: string;
  client_id: string;
  converted_at: string;
  converted_by: string;
  deal_value?: number;
  conversion_notes?: string;
  user_id: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client_id: string;
  currency?: string;
  start_date?: string;
  end_date?: string;
  deal_status: string;
  billable: boolean;
  note?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}
