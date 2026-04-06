import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 px-8 py-16 text-center">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
