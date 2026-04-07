import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase/client';
import type { AppSession } from '../../../types';

let inFlightSessionRequest: Promise<AppSession | null> | null = null;

function getDisplayName(user: User) {
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Workspace principal';
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export const authService = {
  async getSessionUser(): Promise<AppSession | null> {
    if (inFlightSessionRequest) {
      return inFlightSessionRequest;
    }

    const sessionFn = (async () => {
      // Use getUser() which validates against the Supabase server without
      // competing for the internal SDK refresh lock that getSession() uses.
      // This prevents the deadlock when called during onAuthStateChange.
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return null;
      }

      return buildAppSession(data.user);
    })();

    inFlightSessionRequest = sessionFn;

    try {
      return await inFlightSessionRequest;
    } finally {
      inFlightSessionRequest = null;
    }
  },

  async login() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  },

  async logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  },
};

// Exported so AppProviders.SessionSync can build the app session using
// the User object already supplied by the onAuthStateChange event,
// without calling getSession() or getUser() again (avoids the SDK mutex).
export async function buildAppSession(user: User): Promise<AppSession> {
  const profile = await ensureProfile(user);
  await acceptPendingInvitations(user);
  let membership = await fetchMembership(user.id);

  if (!membership) {
    membership = await bootstrapWorkspace(user);
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    },
    profile: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
    },
    membership: {
      organizationId: membership.organization_id,
      role: membership.role,
    },
    activeOrganization: {
      id: membership.organizations.id,
      name: membership.organizations.name,
      slug: membership.organizations.slug,
    },
    permissions: {
      canManageOrganization: membership.role === 'owner' || membership.role === 'admin',
      canEditContent: membership.role === 'owner' || membership.role === 'admin' || membership.role === 'editor',
      canViewAuditLog: membership.role === 'owner' || membership.role === 'admin',
    },
  } satisfies AppSession;
}

async function ensureProfile(user: User) {
  const payload = {
    id: user.id,
    email: user.email ?? null,
    full_name: getDisplayName(user),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('id, email, full_name')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function fetchMembership(userId: string) {
  const { data, error } = await supabase
    .from('organization_members')
    .select(
      'organization_id, role, organizations!organization_members_organization_id_fkey ( id, name, slug )',
    )
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const organization = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;

  return {
    organization_id: data.organization_id,
    role: data.role as 'owner' | 'admin' | 'editor' | 'viewer',
    organizations: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
  };
}

async function acceptPendingInvitations(user: User) {
  if (!user.email) {
    return;
  }

  const normalizedEmail = user.email.toLowerCase();
  const { data: invites, error } = await supabase
    .from('organization_invitations')
    .select('id, organization_id, role')
    .eq('email', normalizedEmail)
    .is('accepted_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error) {
    throw error;
  }

  for (const invite of invites ?? []) {
    const { error: membershipError } = await supabase.from('organization_members').upsert(
      {
        organization_id: invite.organization_id,
        user_id: user.id,
        role: invite.role,
      },
      { onConflict: 'organization_id,user_id' },
    );

    if (membershipError) {
      throw membershipError;
    }

    const { error: acceptError } = await supabase
      .from('organization_invitations')
      .update({
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    if (acceptError) {
      throw acceptError;
    }
  }
}

async function bootstrapWorkspace(user: User) {
  const baseName = getDisplayName(user);
  const slug = `${toSlug(baseName) || 'workspace'}-${user.id.slice(0, 8)}`;
  let organization: { id: string; name: string; slug: string } | null = null;

  const { data: insertedOrganization, error: organizationError } = await supabase
    .from('organizations')
    .insert({
      name: `${baseName} Workspace`,
      slug,
      created_by: user.id,
    })
    .select('id, name, slug')
    .single();

  if (organizationError) {
    if (organizationError.code !== '23505') {
      throw organizationError;
    }

    const { data: existingOrganization, error: existingOrganizationError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (existingOrganizationError) {
      throw existingOrganizationError;
    }

    organization = existingOrganization;
  } else {
    organization = insertedOrganization;
  }

  const { error: membershipError } = await supabase.from('organization_members').upsert(
    {
      organization_id: organization.id,
      user_id: user.id,
      role: 'owner',
    },
    { onConflict: 'organization_id,user_id' },
  );

  if (membershipError) {
    throw membershipError;
  }

  return {
    organization_id: organization.id,
    role: 'owner' as const,
    organizations: organization,
  };
}
