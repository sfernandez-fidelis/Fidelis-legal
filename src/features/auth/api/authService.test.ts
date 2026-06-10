import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const auth = {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  };

  return {
    auth,
    from: vi.fn(),
    supabase: {
      auth,
      from: vi.fn((...args: unknown[]) => mocks.from(...args)),
    },
  };
});

vi.mock('../../../lib/supabase/client', () => ({
  supabase: mocks.supabase,
}));

import { authService } from './authService';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default getSession to return no session unless overridden
    mocks.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('returns null when no user session exists', async () => {
    mocks.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mocks.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(authService.getSessionUser()).resolves.toBeNull();
  });

  it('hydrates profile, accepts invites, and returns app session data', async () => {
    const user = {
      id: 'user-1',
      email: 'owner@example.com',
      user_metadata: { full_name: 'Workspace Owner' },
    };

    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user } as any },
      error: null,
    });

    const tableHandlers: Record<string, () => any> = {
      profiles: () => {
        const queryMock: any = {};
        queryMock.select = vi.fn(() => queryMock);
        queryMock.eq = vi.fn(() => queryMock);
        queryMock.single = vi.fn().mockResolvedValue({
          data: { id: user.id, email: user.email, full_name: 'Workspace Owner' },
          error: null,
        });
        queryMock.upsert = vi.fn(() => queryMock);
        return queryMock;
      },
      organization_invitations: () => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn().mockResolvedValue({
              data: [{ id: 'invite-1', organization_id: 'org-1', role: 'admin', expires_at: null }],
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }),
      organization_members: () => ({
        upsert: vi.fn(() => Promise.resolve({ error: null })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      organization_id: 'org-1',
                      role: 'owner',
                      organizations: {
                        id: 'org-1',
                        name: 'Workspace Owner Workspace',
                        slug: 'workspace-owner',
                      },
                    },
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        })),
      }),
      organizations: () => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      }),
    };

    mocks.from.mockImplementation((table: string) => {
      const handler = tableHandlers[table];
      if (!handler) {
        throw new Error(`Unexpected table: ${table}`);
      }

      return handler();
    });

    const session = await authService.getSessionUser();

    expect(session?.membership.role).toBe('owner');
    expect(session?.activeOrganization.slug).toBe('workspace-owner');
    expect(session?.permissions.canManageOrganization).toBe(true);
    expect(mocks.from).toHaveBeenCalledWith('profiles');
    expect(mocks.from).toHaveBeenCalledWith('organization_invitations');
    expect(mocks.from).toHaveBeenCalledWith('organization_members');
  });

  it('delegates login and logout to Supabase auth', async () => {
    mocks.auth.signInWithOAuth.mockResolvedValue({ error: null });
    mocks.auth.signOut.mockResolvedValue({ error: null });

    await authService.login();
    await authService.logout();

    expect(mocks.auth.signInWithOAuth).toHaveBeenCalled();
    expect(mocks.auth.signOut).toHaveBeenCalled();
  });

  it('reuses the existing organization when bootstrap hits a duplicate slug conflict', async () => {
    const user = {
      id: 'user-2',
      email: 'owner@example.com',
      user_metadata: { full_name: 'Workspace Owner' },
    };

    mocks.auth.getSession.mockResolvedValue({
      data: { session: { user } as any },
      error: null,
    });

    const profilesUpsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: user.id, email: user.email, full_name: 'Workspace Owner' },
          error: null,
        }),
      })),
    }));

    const invitationSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        is: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
    }));

    const membershipSelect = vi
      .fn()
      .mockImplementation(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      }));

    const membershipUpsert = vi.fn().mockResolvedValue({ error: null });

    const organizationsInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: '23505',
            message: 'duplicate key value violates unique constraint "organizations_slug_key"',
          },
        }),
      })),
    }));

    const organizationsSelect = vi.fn(() => {
      const selectMock: any = {};
      selectMock.eq = vi.fn(() => {
        const eqMock: any = {};
        eqMock.single = vi.fn().mockResolvedValue({
          data: {
            id: 'org-1',
            name: 'Workspace Owner Workspace',
            slug: 'workspace-owner-user-1',
          },
          error: null,
        });
        eqMock.maybeSingle = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });
        return eqMock;
      });
      return selectMock;
    });

    mocks.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        const queryMock: any = {};
        queryMock.select = vi.fn(() => queryMock);
        queryMock.eq = vi.fn(() => queryMock);
        queryMock.single = vi.fn().mockResolvedValue({
          data: { id: user.id, email: user.email, full_name: 'Workspace Owner' },
          error: null,
        });
        queryMock.upsert = profilesUpsert;
        return queryMock;
      }

      if (table === 'organization_invitations') {
        return { select: invitationSelect };
      }

      if (table === 'organization_members') {
        return {
          select: membershipSelect,
          upsert: membershipUpsert,
        };
      }

      if (table === 'organizations') {
        return {
          insert: organizationsInsert,
          select: organizationsSelect,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const session = await authService.getSessionUser();

    expect(session?.activeOrganization.id).toBe('org-1');
    expect(session?.membership.role).toBe('owner');
    expect(organizationsInsert).toHaveBeenCalledTimes(1);
    expect(organizationsSelect).toHaveBeenCalledTimes(2);
    expect(membershipUpsert).toHaveBeenCalledWith(
      {
        organization_id: 'org-1',
        user_id: user.id,
        role: 'owner',
      },
      { onConflict: 'organization_id,user_id' },
    );
  });
});
