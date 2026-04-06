import { getDocumentStatusLabel } from './documentLabels';
import type { DocumentStatus } from '../../../types';

const statusClasses: Record<DocumentStatus, string> = {
  draft: 'border-amber-200 bg-amber-50 text-amber-700',
  ready: 'border-sky-200 bg-sky-50 text-sky-700',
  generated: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  archived: 'border-gray-200 bg-gray-100 text-gray-600',
};

export function DocumentStatusBadge({ status = 'draft' }: { status?: DocumentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses[status]}`}>
      {getDocumentStatusLabel(status)}
    </span>
  );
}
