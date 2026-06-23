import { Menu, X } from 'lucide-react';
import { useUIStore } from '../../store';
import { useAuth } from '../../hooks';

export const Navbar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-background rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-2xl font-display font-bold text-primary">
            RealEstateOS
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-text">{user?.displayName}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user?.displayName?.charAt(0) || 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
