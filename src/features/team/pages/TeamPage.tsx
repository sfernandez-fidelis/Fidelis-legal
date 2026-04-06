import { useMemo, useState } from 'react';
import { Shield, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageErrorState } from '../../../shared/components/PageErrorState';
import { usePermissions } from '../../auth/hooks/usePermissions';
import { useInviteMember, useInvitationsQuery, useRevokeInvitation, useTeamMembersQuery, useUpdateMemberRole } from '../hooks/useTeam';

const editableRoles = ['admin', 'editor', 'viewer'] as const;

export function TeamPage() {
  const permissions = usePermissions();
  const membersQuery = useTeamMembersQuery();
  const invitationsQuery = useInvitationsQuery();
  const inviteMember = useInviteMember();
  const revokeInvitation = useRevokeInvitation();
  const updateMemberRole = useUpdateMemberRole();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<(typeof editableRoles)[number]>('editor');

  const activeMembers = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);

  if (membersQuery.isError || invitationsQuery.isError) {
    return (
      <PageErrorState
        message="The team workspace could not be loaded."
        onRetry={() => {
          void membersQuery.refetch();
          void invitationsQuery.refetch();
        }}
        title="Unable to load team management"
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Organization access</p>
          <h1 className="mt-2 text-4xl font-serif italic text-stone-900">Team management</h1>
          <p className="mt-2 max-w-2xl text-stone-500">
            Invite staff, manage roles, and keep access intentional across the workspace.
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          Your role: <span className="font-medium uppercase">{permissions.role}</span>
        </div>
      </header>

      {permissions.canManageOrganization ? (
        <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-stone-700" />
            <h2 className="text-lg font-medium text-stone-900">Invite member</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.5fr)_220px_auto]">
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              value={email}
            />
            <select
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(event) => setRole(event.target.value as (typeof editableRoles)[number])}
              value={role}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
              disabled={!email.trim() || inviteMember.isPending}
              onClick={async () => {
                try {
                  const token = await inviteMember.mutateAsync({ email, role });
                  await navigator.clipboard.writeText(`${window.location.origin}/login?invite=${token}`);
                  toast.success('Invitation created and invite link copied');
                  setEmail('');
                  setRole('editor');
                } catch {
                  toast.error('Could not create invitation');
                }
              }}
              type="button"
            >
              Send invite
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
          Only admins can invite members or change organization roles.
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-stone-700" />
            <h2 className="text-lg font-medium text-stone-900">Members</h2>
          </div>
          <div className="mt-4 space-y-3">
            {activeMembers.map((member) => (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={member.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{member.fullName || member.email || 'Team member'}</p>
                    <p className="mt-1 text-sm text-stone-500">{member.email || 'No email available'}</p>
                  </div>
                  {permissions.canManageOrganization && member.role !== 'owner' ? (
                    <select
                      className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
                      onChange={async (event) => {
                        try {
                          await updateMemberRole.mutateAsync({
                            memberId: member.id,
                            role: event.target.value as 'admin' | 'editor' | 'viewer',
                          });
                          toast.success('Role updated');
                        } catch {
                          toast.error('Could not update role');
                        }
                      }}
                      value={member.role}
                    >
                      {editableRoles.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-stone-700" />
            <h2 className="text-lg font-medium text-stone-900">Pending invitations</h2>
          </div>
          <div className="mt-4 space-y-3">
            {(invitationsQuery.data ?? []).length ? (
              invitationsQuery.data?.map((invite) => (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={invite.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-stone-900">{invite.email}</p>
                      <p className="mt-1 text-sm text-stone-500">
                        {invite.role} invited {new Date(invite.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {permissions.canManageOrganization ? (
                      <button
                        className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
                        onClick={async () => {
                          try {
                            await revokeInvitation.mutateAsync({ invitationId: invite.id });
                            toast.success('Invitation revoked');
                          } catch {
                            toast.error('Could not revoke invitation');
                          }
                        }}
                        type="button"
                      >
                        Revoke
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">No pending invitations.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
