import { supabase } from '../../../lib/supabase/client';
import type { ActivityLogEntry, OrganizationInvitationData, OrganizationMemberData } from '../../../types';

function normalizeMember(row: any): OrganizationMemberData {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    invitedBy: row.invited_by ?? null,
    fullName: row.profile?.full_name ?? null,
    email: row.profile?.email ?? null,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? null,
  };
}

function normalizeInvitation(row: any): OrganizationInvitationData {
  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    role: row.role,
    invitedBy: row.invited_by ?? null,
    invitedByName: row.inviter?.full_name ?? row.inviter?.email ?? null,
    token: row.token,
    acceptedAt: row.accepted_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at,
  };
}

function normalizeAuditEntry(row: any): ActivityLogEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    actorId: row.actor_id ?? null,
    actorName: row.actor?.full_name ?? row.actor?.email ?? null,
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
  };
}

export const teamService = {
  async listMembers(organizationId: string): Promise<OrganizationMemberData[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*, profile:user_id(full_name, email)')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeMember);
  },

  async listInvitations(organizationId: string): Promise<OrganizationInvitationData[]> {
    const { data, error } = await supabase
      .from('organization_invitations')
      .select('*, inviter:invited_by(full_name, email)')
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeInvitation);
  },

  async inviteMember(
    organizationId: string,
    actorId: string,
    payload: { email: string; role: 'admin' | 'editor' | 'viewer' },
  ) {
    const email = payload.email.trim().toLowerCase();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    console.log('[TeamService] Inviting member:', { organizationId, email, role: payload.role, invited_by: actorId });

    if (!organizationId) throw new Error('Missing organizationId');
    if (!actorId) throw new Error('Missing actorId');

    const { error } = await supabase.from('organization_invitations').insert({
      organization_id: organizationId,
      email,
      role: payload.role,
      invited_by: actorId,
      token,
      expires_at: expiresAt,
    });

    if (error) {
      console.error('[TeamService] Error inserting invitation:', error);
      throw error;
    }

    return token;
  },

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    role: 'admin' | 'editor' | 'viewer',
  ) {
    const { error } = await supabase
      .from('organization_members')
      .update({
        role,
      })
      .eq('organization_id', organizationId)
      .eq('id', memberId);

    if (error) {
      throw error;
    }
  },

  async revokeInvitation(organizationId: string, invitationId: string) {
    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', invitationId);

    if (error) {
      throw error;
    }
  },

  async listAuditLog(organizationId: string): Promise<ActivityLogEntry[]> {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*, actor:actor_id(full_name, email)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeAuditEntry);
  },
};
