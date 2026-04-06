import type { ReactNode } from 'react';

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`.trim()} />;
}

export function SectionSkeleton({
  title,
  toolbar,
  body,
}: {
  title?: ReactNode;
  toolbar?: ReactNode;
  body: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {title}
      {toolbar}
      {body}
    </div>
  );
}
