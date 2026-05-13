import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService, type ReviewStatus, type RejectionPayload } from '../api/reviewService';
import { useAppSession } from '../../auth/hooks/useSessionQuery';

const REVIEW_KEYS = {
  all: ['reviews'] as const,
  list: (orgId: string, status?: string) => ['reviews', 'list', orgId, status] as const,
  pendingCount: (orgId: string) => ['reviews', 'pendingCount', orgId] as const,
};

export function useReviewsQuery(statusFilter?: ReviewStatus | 'all') {
  const session = useAppSession();
  const orgId = session?.membership.organizationId ?? '';

  return useQuery({
    queryKey: REVIEW_KEYS.list(orgId, statusFilter),
    queryFn: () => reviewService.listReviews(orgId, statusFilter),
    enabled: Boolean(orgId),
  });
}

export function usePendingReviewCount() {
  const session = useAppSession();
  const orgId = session?.membership.organizationId ?? '';

  return useQuery({
    queryKey: REVIEW_KEYS.pendingCount(orgId),
    queryFn: () => reviewService.getPendingCount(orgId),
    enabled: Boolean(orgId),
    // Don't refetch on every navigation — cache for 60s
    staleTime: 60_000,
    // Show 0 immediately while loading so the sidebar renders without delay
    placeholderData: 0,
  });
}

export function useSubmitRejection() {
  const session = useAppSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RejectionPayload) => {
      const orgId = session?.membership.organizationId;
      const actorId = session?.user.id;
      if (!orgId) throw new Error('Sin sesión activa. Recarga la página.');
      if (!actorId) throw new Error('Usuario no identificado. Recarga la página.');
      return reviewService.submitRejection(orgId, actorId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
    },
  });
}

export function useResolveReview() {
  const session = useAppSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      decision,
      notes,
      originalStoragePath,
    }: {
      reviewId: string;
      decision: 'confirmed' | 'restored';
      notes?: string;
      originalStoragePath?: string;
    }) => {
      const orgId = session?.membership.organizationId;
      const actorId = session?.user.id;
      if (!orgId) throw new Error('Sin sesión activa. Recarga la página.');
      if (!actorId) throw new Error('Usuario no identificado. Recarga la página.');
      return reviewService.resolveReview(orgId, actorId, reviewId, decision, notes, originalStoragePath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
    },
  });
}
