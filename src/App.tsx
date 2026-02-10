import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { useTickets } from './hooks/useTickets';
import { useSocket } from './hooks/useSocket';
import type { Ticket } from './types/ticket';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { TicketModal } from './components/TicketModal';
import { ProjectFilter } from './components/ProjectFilter';
import { Loader2, AlertCircle } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30000,
    },
  },
});

function Dashboard() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  
  // Initialize WebSocket connection
  useSocket();
  
  const { data: tickets, isLoading, error } = useTickets();

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    if (!projectFilter) return tickets;
    return tickets.filter(t => t.project === projectFilter);
  }, [tickets, projectFilter]);

  const projects = useMemo(() => {
    if (!tickets) return [];
    const unique = [...new Set(tickets.map(t => t.project))];
    return unique.sort();
  }, [tickets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Failed to connect to API'}
          </p>
          <div className="bg-gray-800 rounded-lg p-4 text-left text-sm">
            <p className="text-gray-400 mb-2">Make sure the API is running:</p>
            <code className="text-green-400">docker-compose up</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-700">
          <ProjectFilter
            projects={projects}
            selected={projectFilter}
            onChange={setProjectFilter}
          />
          <div className="mt-2 text-sm text-gray-500">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
            {projectFilter && ` in ${projectFilter}`}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden p-6">
          <KanbanBoard
            tickets={filteredTickets}
            onTicketClick={setSelectedTicket}
          />
        </div>
      </div>

      <TicketModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
