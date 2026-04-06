import { ChevronRight } from 'lucide-react';
import { Link, useMatches } from 'react-router-dom';

interface CrumbHandle {
  breadcrumb?: string | ((params: Record<string, string | undefined>) => string);
}

export function Breadcrumbs() {
  const matches = useMatches();

  const crumbs = matches
    .filter((match) => (match.handle as CrumbHandle | undefined)?.breadcrumb)
    .map((match) => {
      const handle = match.handle as CrumbHandle;
      const label =
        typeof handle.breadcrumb === 'function'
          ? handle.breadcrumb(match.params)
          : handle.breadcrumb;

      return {
        label,
        pathname: match.pathname,
      };
    });

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <div key={crumb.pathname} className="flex items-center gap-2">
            {isLast ? (
              <span className="font-medium text-gray-900">{crumb.label}</span>
            ) : (
              <Link className="transition hover:text-gray-900" to={crumb.pathname}>
                {crumb.label}
              </Link>
            )}
            {!isLast ? <ChevronRight size={14} /> : null}
          </div>
        );
      })}
    </nav>
  );
}
