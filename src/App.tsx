import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { useTickets } from './hooks/useTickets';
import { useSocket } from './hooks/useSocket';
import type { Ticket } from './types/ticket';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { TicketModal } from './components/TicketModal';
import { ProjectFilter } from './components/ProjectFilter';
import { ProjectMembersModal } from './components/ProjectMembersModal';
import { Loader2, AlertCircle, FolderX } from 'lucide-react';

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
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Get auth context for project access
  const {
    projects: userProjects,
    projectsLoading,
    role,
    hasProjectAccess,
    accessibleProjectNames,
  } = useAuth();

  // Initialize WebSocket connection
  useSocket();

  const { data: tickets, isLoading, error } = useTickets();

  // Filter tickets by accessible projects
  const accessibleTickets = useMemo(() => {
    if (!tickets) return [];
    // Admins see all tickets
    if (role === 'admin') return tickets;
    // Filter to only accessible projects
    return tickets.filter((t) => hasProjectAccess(t.project || 'Uncategorized'));
  }, [tickets, role, hasProjectAccess]);

  // Further filter by selected project
  const filteredTickets = useMemo(() => {
    if (!projectFilter) return accessibleTickets;
    return accessibleTickets.filter((t) => t.project === projectFilter);
  }, [accessibleTickets, projectFilter]);

  // Get unique projects from accessible tickets
  const availableProjects = useMemo(() => {
    if (role === 'admin') {
      // Admins see all projects from tickets
      const unique = [...new Set(accessibleTickets.map((t) => t.project || 'Uncategorized'))];
      return unique.sort();
    }
    // Non-admins only see their accessible projects
    return accessibleProjectNames.sort();
  }, [accessibleTickets, role, accessibleProjectNames]);

  // Loading states
  if (isLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  // Error state
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

  // No projects access state (non-admin with no projects)
  if (role !== 'admin' && userProjects.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <FolderX className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Projects Assigned</h2>
            <p className="text-gray-400 mb-4">
              You don't have access to any projects yet. Contact an administrator to get
              access to projects.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
              <p>
                Project access is managed by project owners and administrators. Ask them to
                add you as a member to view tickets.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header
        currentProject={projectFilter}
        onManageMembers={() => setShowMembersModal(true)}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-700">
          <ProjectFilter
            projects={availableProjects}
            selected={projectFilter}
            onChange={setProjectFilter}
          />
          <div className="mt-2 text-sm text-gray-500">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
            {projectFilter && ` in ${projectFilter}`}
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <KanbanBoard tickets={filteredTickets} onTicketClick={setSelectedTicket} />
        </div>
      </div>

      <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />

      {/* Project Members Modal */}
      {showMembersModal && projectFilter && (
        <ProjectMembersModal
          projectName={projectFilter}
          onClose={() => setShowMembersModal(false)}
        />
      )}
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
