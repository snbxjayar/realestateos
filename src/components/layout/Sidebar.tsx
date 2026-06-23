import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks';

const MENU_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Properties', icon: Building2, path: '/properties' },
  { label: 'Leads', icon: Users, path: '/leads' },
  { label: 'Deals', icon: Briefcase, path: '/deals' },
  { label: 'Clients', icon: Users, path: '/clients' },
  { label: 'Messages', icon: MessageSquare, path: '/messages' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside
      className={`
        fixed left-0 top-16 bottom-0 z-40 w-64 bg-primary text-white
        transform transition-transform duration-300 lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {MENU_ITEMS.map(({ label, icon: Icon, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-lg
                  transition-colors duration-200
                  ${isActive
                    ? 'bg-accent text-white'
                    : 'text-white hover:bg-opacity-10 hover:bg-white'
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-opacity-20 border-white">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-white
              hover:bg-opacity-10 hover:bg-white rounded-lg transition-colors duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
