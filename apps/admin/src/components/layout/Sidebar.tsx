import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  HelpCircle,
  Eye,
  Bell,
  ChevronLeft,
  ChevronRight,
  Layers,
  FolderOpen,
  Settings,
  FileText,
  Newspaper,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onClose?: () => void;
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/event-settings', label: 'Configurações', icon: Settings },
  { path: '/speakers', label: 'Palestrantes', icon: Users },
  { path: '/sessions', label: 'Palestras', icon: Calendar },
  { path: '/sponsor-tiers', label: 'Cotas', icon: Layers },
  { path: '/sponsors', label: 'Patrocinadores', icon: Building2 },
  { path: '/faq-categories', label: 'Categorias FAQ', icon: FolderOpen },
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
  { path: '/press-materials', label: 'Materiais de Imprensa', icon: FileText },
  { path: '/news-releases', label: 'Notícias', icon: Newspaper },
  { path: '/legal-pages', label: 'Páginas Legais', icon: Scale },
  { path: '/visibility', label: 'Visibilidade', icon: Eye },
  { path: '/notifications', label: 'Notificações', icon: Bell },
];

export function Sidebar({ onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on tablets
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-full',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1
            className={cn(
              'font-bold text-xl text-gray-900 transition-opacity',
              collapsed && 'opacity-0'
            )}
          >
            VTEX DAY 26
          </h1>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 rounded-md"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={cn(
                      'transition-opacity',
                      collapsed && 'sr-only'
                    )}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}