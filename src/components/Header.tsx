import { Rocket, RefreshCw, LogOut, Shield, Edit3, Eye } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';

const ROLE_ICONS: Record<UserRole, typeof Shield> = {
  admin: Shield,
  editor: Edit3,
  viewer: Eye,
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  editor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  viewer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

export function Header() {
  const queryClient = useQueryClient();
  const { user, role, signOut } = useAuth();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  const handleLogout = async () => {
    await signOut();
  };

  const RoleIcon = role ? ROLE_ICONS[role] : Eye;

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Mission Control</h1>
            <p className="text-xs text-gray-400">Ticket Management Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-white font-medium truncate max-w-[150px]">
                  {user.email}
                </p>
                {role && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[role]}`}>
                    <RoleIcon className="w-3 h-3" />
                    {ROLE_LABELS[role]}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
