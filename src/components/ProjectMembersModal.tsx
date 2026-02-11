import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Crown, User, Eye } from 'lucide-react';
import {
  fetchProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  type ProjectMember,
  type ProjectRole,
} from '../api/projects';
import { useAuth } from '../contexts/AuthContext';

interface ProjectMembersModalProps {
  projectName: string;
  onClose: () => void;
}

const ROLE_ICONS: Record<ProjectRole, typeof Crown> = {
  admin: Crown,
  owner: Crown,
  member: User,
  viewer: Eye,
};

const ROLE_LABELS: Record<ProjectRole, string> = {
  admin: 'Admin',
  owner: 'Owner',
  member: 'Member',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<ProjectRole, string> = {
  admin: 'bg-purple-500',
  owner: 'bg-yellow-500',
  member: 'bg-blue-500',
  viewer: 'bg-gray-500',
};

export function ProjectMembersModal({ projectName, onClose }: ProjectMembersModalProps) {
  const { user, canManageProject } = useAuth();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>('viewer');
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const canManage = canManageProject(projectName);

  useEffect(() => {
    loadMembers();
  }, [projectName]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProjectMembers(projectName);
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    try {
      setAdding(true);
      setError(null);
      await addProjectMember(projectName, newMemberEmail.trim(), newMemberRole);
      setNewMemberEmail('');
      setNewMemberRole('viewer');
      setShowAddForm(false);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: ProjectRole) => {
    try {
      setUpdating(userId);
      setError(null);
      await updateProjectMemberRole(projectName, userId, newRole);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!confirm(`Remove ${email} from this project?`)) return;

    try {
      setUpdating(userId);
      setError(null);
      await removeProjectMember(projectName, userId);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setUpdating(null);
    }
  };

  const isLastOwner = (member: ProjectMember) => {
    if (member.role !== 'owner') return false;
    const ownerCount = members.filter((m) => m.role === 'owner').length;
    return ownerCount <= 1;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Project Members</h2>
            <p className="text-sm text-gray-400">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No members yet</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {members.map((member) => {
                const RoleIcon = ROLE_ICONS[member.role];
                const isCurrentUser = member.user_id === user?.id;
                const isUpdating = updating === member.user_id;

                return (
                  <li
                    key={member.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isCurrentUser ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${ROLE_COLORS[member.role]} flex items-center justify-center`}>
                        <RoleIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {member.email}
                          {isCurrentUser && (
                            <span className="text-xs text-blue-400 ml-2">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {ROLE_LABELS[member.role]}
                        </p>
                      </div>
                    </div>

                    {canManage && !isCurrentUser && (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateRole(member.user_id, e.target.value as ProjectRole)
                          }
                          disabled={isUpdating || isLastOwner(member)}
                          className="bg-gray-600 text-white text-sm rounded px-2 py-1 border-0 disabled:opacity-50"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="owner">Owner</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.user_id, member.email)}
                          disabled={isUpdating || isLastOwner(member)}
                          className="p-1.5 hover:bg-red-500/20 rounded text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isLastOwner(member) ? 'Cannot remove last owner' : 'Remove member'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Add Member Form */}
        {canManage && (
          <div className="p-4 border-t border-gray-700">
            {showAddForm ? (
              <form onSubmit={handleAddMember} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Email address"
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    disabled={adding}
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as ProjectRole)}
                    className="px-3 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={adding}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={adding || !newMemberEmail.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-white font-medium transition-colors"
                  >
                    {adding ? 'Adding...' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewMemberEmail('');
                      setError(null);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
