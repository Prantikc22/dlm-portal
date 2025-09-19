import { Bell, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { NotificationDropdown } from './notification-dropdown';

interface NavbarProps {
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

export function Navbar({ onTabChange, activeTab }: NavbarProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const tabs = [
    { id: 'buyer', label: 'Buyer Portal', roles: ['buyer', 'admin'] },
    { id: 'supplier', label: 'Supplier Portal', roles: ['supplier', 'admin'] },
    { id: 'admin', label: 'Admin Portal', roles: ['admin'] },
  ];

  const visibleTabs = tabs.filter(tab => 
    user?.role && tab.roles.includes(user.role)
  );

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary">Logicwerk</h1>
            </div>
            {onTabChange && (
              <nav className="hidden md:flex space-x-6">
                {visibleTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <NotificationDropdown />
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                <span data-testid="text-user-initials">{getInitials(user?.name || undefined)}</span>
              </div>
              <span className="text-sm font-medium" data-testid="text-user-name">
                {user?.name || user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
