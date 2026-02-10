import { useState, useEffect } from 'react';
import type { Ticket, TicketStatus, Priority } from '../types/ticket';
import { STATUS_LABELS, PROJECT_COLORS } from '../types/ticket';
import { useUpdateTicket, useTriggerGrooming, useDeleteTicket } from '../hooks/useTickets';
import { useAuth } from '../contexts/AuthContext';
import { X, Loader2, Sparkles, Trash2, Eye } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';

interface TicketModalProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export function TicketModal({ ticket, onClose }: TicketModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedBody, setEditedBody] = useState('');
  
  const updateTicket = useUpdateTicket();
  const triggerGrooming = useTriggerGrooming();
  const deleteTicket = useDeleteTicket();
  const { canEdit, canDelete } = useAuth();

  useEffect(() => {
    if (ticket) {
      setEditedTitle(ticket.title);
      setEditedBody(ticket.body);
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleSave = () => {
    updateTicket.mutate({
      id: ticket.id,
      update: {
        title: editedTitle,
        body: editedBody,
      },
    }, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleStatusChange = (status: TicketStatus) => {
    updateTicket.mutate({ id: ticket.id, update: { status } });
  };

  const handlePriorityChange = (priority: Priority) => {
    updateTicket.mutate({ id: ticket.id, update: { priority } });
  };

  const handleGroom = () => {
    triggerGrooming.mutate(ticket.id);
  };

  const handleDelete = () => {
    if (confirm(`Delete ticket ${ticket.id}?`)) {
      deleteTicket.mutate(ticket.id, {
        onSuccess: () => onClose(),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-700">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-gray-400">{ticket.id}</span>
              <span className={clsx(
                'text-xs px-2 py-0.5 rounded',
                PROJECT_COLORS[ticket.project] || 'bg-gray-600'
              )}>
                {ticket.project}
              </span>
              {ticket.estimate && (
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                  {ticket.estimate} points
                </span>
              )}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-gray-700 rounded px-2 py-1 text-lg font-semibold"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-100">{ticket.title}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Read-only badge for viewers */}
          {!canEdit && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">Read-only mode. You need Editor or Admin role to make changes.</span>
            </div>
          )}

          {/* Status and Priority */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Status</label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                disabled={!canEdit}
                className={clsx(
                  "bg-gray-700 rounded px-3 py-1.5 text-sm",
                  !canEdit && "opacity-60 cursor-not-allowed"
                )}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">Priority</label>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                disabled={!canEdit}
                className={clsx(
                  "bg-gray-700 rounded px-3 py-1.5 text-sm",
                  !canEdit && "opacity-60 cursor-not-allowed"
                )}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Assignee</label>
              <span className="text-sm">{ticket.assignee || 'Unassigned'}</span>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Quality Score</label>
              <span className="text-sm">{ticket.qualityScore ?? 'N/A'}</span>
            </div>
          </div>

          {/* Grooming Status */}
          {ticket.grooming && (
            <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Grooming:</span>
                <span className={clsx(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  ticket.grooming.status === 'complete' && 'bg-green-500/20 text-green-400',
                  ticket.grooming.status === 'in-progress' && 'bg-blue-500/20 text-blue-400',
                  ticket.grooming.status === 'pending' && 'bg-yellow-500/20 text-yellow-400',
                  ticket.grooming.status === 'failed' && 'bg-red-500/20 text-red-400',
                  ticket.grooming.status === 'manual' && 'bg-purple-500/20 text-purple-400',
                )}>
                  {ticket.grooming.status}
                </span>
                {ticket.grooming.status === 'in-progress' && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                )}
              </div>
              {ticket.grooming.lastError && (
                <p className="text-xs text-red-400 mt-1">{ticket.grooming.lastError}</p>
              )}
            </div>
          )}

          {/* Body */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 block mb-2">Description</label>
            {isEditing ? (
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-sm font-mono min-h-[300px]"
              />
            ) : (
              <div className="bg-gray-700/30 rounded-lg p-4 prose prose-invert prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
                  {ticket.body}
                </pre>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Created: {format(new Date(ticket.createdAt), 'PPP p')}</p>
            <p>Updated: {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <div className="flex gap-2">
            {/* Delete - Admin only */}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            
            {/* Groom - Editor or Admin */}
            {canEdit && (
              <button
                onClick={handleGroom}
                disabled={triggerGrooming.isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm disabled:opacity-50"
              >
                {triggerGrooming.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Groom
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Edit buttons - Editor or Admin */}
            {canEdit && (
              isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateTicket.isPending}
                    className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 transition-colors text-sm disabled:opacity-50"
                  >
                    {updateTicket.isPending ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
                >
                  Edit
                </button>
              )
            )}
            
            {/* Close button for everyone */}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
