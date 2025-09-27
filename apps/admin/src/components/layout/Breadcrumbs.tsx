import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useMemo } from 'react';

const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  speakers: 'Palestrantes',
  sessions: 'Palestras',
  sponsors: 'Patrocinadores',
  faq: 'FAQ',
  visibility: 'Visibilidade',
  notifications: 'Notificações',
};

export function Breadcrumbs() {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const pathnames = location.pathname.split('/').filter((x) => x);

    return pathnames.map((path, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      const name = routeNames[path] || path;

      return { name, routeTo, isLast };
    });
  }, [location.pathname]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {breadcrumbs.map((crumb) => (
        <div key={crumb.routeTo} className="flex items-center">
          <ChevronRight className="w-4 h-4 mx-1" />
          {crumb.isLast ? (
            <span className="font-medium text-gray-900">{crumb.name}</span>
          ) : (
            <Link
              to={crumb.routeTo}
              className="hover:text-gray-900 transition-colors"
            >
              {crumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}