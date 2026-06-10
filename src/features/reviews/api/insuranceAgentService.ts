import { supabase } from '../../../lib/supabase/client';

export interface InsuranceAgent {
  id: string;
  organizationId: string;
  fullName: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

function normalizeAgent(row: any): InsuranceAgent {
  return {
    id: row.id,
    organizationId: row.organization_id,
    fullName: row.full_name,
    code: row.code ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    notes: row.notes ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export const insuranceAgentService = {
  async listAgents(organizationId: string): Promise<InsuranceAgent[]> {
    const { data, error } = await supabase
      .from('insurance_agents')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .is('archived_at', null)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(normalizeAgent);
  },

  async searchAgents(
    organizationId: string,
    search: string,
    options: { limit?: number } = {},
  ): Promise<InsuranceAgent[]> {
    const limit = options.limit ?? 10;
    let query = supabase
      .from('insurance_agents')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .is('archived_at', null)
      .limit(limit);

    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query.order('full_name', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(normalizeAgent);
  },

  async createAgent(
    organizationId: string,
    actorId: string,
    payload: { fullName: string; code?: string; email?: string; phone?: string; notes?: string },
  ): Promise<InsuranceAgent> {
    const { data, error } = await supabase
      .from('insurance_agents')
      .insert({
        organization_id: organizationId,
        full_name: payload.fullName,
        code: payload.code || null,
        email: payload.email || null,
        phone: payload.phone || null,
        notes: payload.notes || null,
        created_by: actorId,
      })
      .select('*')
      .single();

    if (error) throw error;
    return normalizeAgent(data);
  },

  async updateAgent(
    organizationId: string,
    agentId: string,
    payload: Partial<{ fullName: string; code: string; email: string; phone: string; notes: string; isActive: boolean }>,
  ): Promise<void> {
    const update: Record<string, unknown> = {};
    if (payload.fullName !== undefined) update.full_name = payload.fullName;
    if (payload.code !== undefined) update.code = payload.code;
    if (payload.email !== undefined) update.email = payload.email;
    if (payload.phone !== undefined) update.phone = payload.phone;
    if (payload.notes !== undefined) update.notes = payload.notes;
    if (payload.isActive !== undefined) update.is_active = payload.isActive;

    const { error } = await supabase
      .from('insurance_agents')
      .update(update)
      .eq('id', agentId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  async deleteAgent(organizationId: string, agentId: string): Promise<void> {
    const { error } = await supabase
      .from('insurance_agents')
      .update({ archived_at: new Date().toISOString(), is_active: false })
      .eq('id', agentId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },
};
