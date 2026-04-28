import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService, type ReviewStatus } from '../api/reviewService';
import { useAppSession } from '../../auth/hooks/useSessionQuery';
import { queryKeys } from '../../../lib/queryKeys';

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
    refetchInterval: 30_000, // Poll every 30s for real-time feel
  });
}

export function usePendingReviewCount() {
  const session = useAppSession();
  const orgId = session?.membership.organizationId ?? '';

  return useQuery({
    queryKey: REVIEW_KEYS.pendingCount(orgId),
    queryFn: () => reviewService.getPendingCount(orgId),
    enabled: Boolean(orgId),
    refetchInterval: 15_000, // Check for new reviews every 15s
  });
}

export function useSubmitRejection() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const orgId = session?.membership.organizationId ?? '';
  const actorId = session?.user.id ?? '';

  return useMutation({
    mutationFn: ({ file, reason }: { file: File; reason?: string }) =>
      reviewService.submitRejection(orgId, actorId, file, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
    },
  });
}

export function useResolveReview() {
  const session = useAppSession();
  const queryClient = useQueryClient();
  const orgId = session?.membership.organizationId ?? '';
  const actorId = session?.user.id ?? '';

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
    }) => reviewService.resolveReview(orgId, actorId, reviewId, decision, notes, originalStoragePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all });
    },
  });
}
