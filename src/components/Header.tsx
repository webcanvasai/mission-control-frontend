import { Rocket, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function Header() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

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
        
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          title="Refresh tickets"
        >
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
