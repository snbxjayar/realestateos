import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Phone, Mail, DollarSign, Clock, Send,
  MessageSquare, Trophy, XCircle, Pencil, Trash2, Building2,
} from 'lucide-react';
import { Lead, Activity, LeadStatus, LeadSource, Property } from '../../types';
import { leadService } from '../../services/leadService';
import { propertyService } from '../../services/propertyService';
import { ghlClient } from '../../lib/ghl';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store';
import { Button } from '../ui/Button';

// ── Constants ──────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<LeadSource, { label: string; className: string }> = {
  facebook: { label: 'Facebook', className: 'bg-blue-100 text-blue-700' },
  referral: { label: 'Referral', className: 'bg-purple-100 text-purple-700' },
  walk_in: { label: 'Walk-in', className: 'bg-orange-100 text-orange-700' },
  website: { label: 'Website', className: 'bg-teal-100 text-teal-700' },
  ghl: { label: 'GHL', className: 'bg-green-100 text-green-700' },
  other: { label: 'Other', className: 'bg-gray-100 text-gray-600' },
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: '🆕 New', className: 'bg-slate-100 text-slate-700' },
  contacted: { label: '📞 Contacted', className: 'bg-blue-100 text-blue-700' },
  qualified: { label: '✅ Qualified', className: 'bg-teal-100 text-teal-700' },
  viewing_scheduled: { label: '🏠 Viewing', className: 'bg-indigo-100 text-indigo-700' },
  offer_made: { label: '💰 Offer Made', className: 'bg-amber-100 text-amber-700' },
  won: { label: '🏆 Won', className: 'bg-green-100 text-green-700' },
  lost: { label: '❌ Lost', className: 'bg-red-100 text-red-700' },
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  note: <MessageSquare size={14} />,
  status_change: <Clock size={14} />,
  sms: <Phone size={14} />,
  email: <Mail size={14} />,
  call: <Phone size={14} />,
};

// ── Props ──────────────────────────────────────────────────────────────────

interface LeadDetailDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onLeadUpdated: (lead: Lead) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export const LeadDetailDrawer = ({
  lead,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onLeadUpdated,
}: LeadDetailDrawerProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useUIStore();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!lead?.id || !isOpen) return;
    setActivities([]);
    setProperties([]);
    setNoteText('');

    leadService.getActivities(lead.id).then(setActivities).catch(() => {});

    if (lead.interestedIn.length > 0) {
      Promise.all(lead.interestedIn.map((id) => propertyService.getProperty(id)))
        .then((results) => setProperties(results.filter(Boolean) as Property[]))
        .catch(() => {});
    }
  }, [lead?.id, isOpen]);

  if (!lead) return null;

  const source = SOURCE_CONFIG[lead.source] ?? { label: lead.source, className: 'bg-gray-100 text-gray-600' };
  const status = STATUS_CONFIG[lead.status] ?? { label: lead.status, className: 'bg-gray-100 text-gray-600' };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const addNote = async () => {
    if (!noteText.trim() || !user?.uid) return;
    setIsSavingNote(true);
    try {
      const activity = await leadService.addActivity(lead.id, {
        type: 'note',
        content: noteText.trim(),
        createdBy: user.uid,
      });
      setActivities((prev) => [activity, ...prev]);
      setNoteText('');
      showToast('Note saved.', 'success');
    } catch {
      showToast('Failed to save note.', 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  const setStatus = async (newStatus: LeadStatus) => {
    if (!user?.uid || lead.status === newStatus) return;
    setIsActionLoading(newStatus);
    try {
      await leadService.updateLeadStatus(lead.id, newStatus, user.uid);
      const activity: Activity = {
        id: Date.now().toString(),
        type: 'status_change',
        content: `Status changed to ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`,
        createdBy: user.uid,
        createdAt: new Date(),
      };
      setActivities((prev) => [activity, ...prev]);
      const updated = { ...lead, status: newStatus, updatedAt: new Date() };
      onLeadUpdated(updated);
      showToast(`Lead marked as ${STATUS_CONFIG[newStatus]?.label}.`, 'success');
    } catch {
      showToast('Failed to update status.', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSMS = async () => {
    if (!lead.ghlContactId) {
      showToast('No GHL contact linked. Save the lead first.', 'warning');
      return;
    }
    setIsActionLoading('sms');
    try {
      const msg = `Hi ${lead.name}, this is a follow-up from RealEstateOS. How can we assist you today?`;
      await ghlClient.sendSMS(lead.ghlContactId, msg);
      if (user?.uid) {
        const activity = await leadService.addActivity(lead.id, {
          type: 'sms',
          content: `SMS sent: "${msg}"`,
          createdBy: user.uid,
        });
        setActivities((prev) => [activity, ...prev]);
      }
      showToast('SMS sent via GHL.', 'success');
    } catch {
      showToast('Failed to send SMS. Check GHL connection.', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleEmail = async () => {
    if (!lead.ghlContactId) {
      showToast('No GHL contact linked. Save the lead first.', 'warning');
      return;
    }
    setIsActionLoading('email');
    try {
      await ghlClient.sendEmail(
        lead.ghlContactId,
        'Following up on your property inquiry',
        `<p>Hi ${lead.name},</p><p>Thank you for your interest. We'd love to help you find the right property.</p>`
      );
      if (user?.uid) {
        const activity = await leadService.addActivity(lead.id, {
          type: 'email',
          content: 'Follow-up email sent via GHL.',
          createdBy: user.uid,
        });
        setActivities((prev) => [activity, ...prev]);
      }
      showToast('Email sent via GHL.', 'success');
    } catch {
      showToast('Failed to send email. Check GHL connection.', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      await leadService.deleteLead(lead.id);
      onDelete(lead.id);
      onClose();
      showToast('Lead deleted.', 'success');
    } catch {
      showToast('Failed to delete lead.', 'error');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-text text-xl truncate">{lead.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.className}`}>
                {status.label}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${source.className}`}>
                {source.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Contact Info */}
          <section className="bg-gray-50 rounded-2xl p-4 space-y-3">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-3 text-sm text-text hover:text-primary transition-colors group">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                  <Phone size={15} className="text-primary" />
                </span>
                <span className="font-medium">{lead.phone}</span>
                <span className="text-xs text-gray-400 ml-auto">Tap to call</span>
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-3 text-sm text-text hover:text-primary transition-colors group">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                  <Mail size={15} className="text-primary" />
                </span>
                <span className="font-medium">{lead.email}</span>
              </a>
            )}
            {lead.budget && (
              <div className="flex items-center gap-3 text-sm">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <DollarSign size={15} className="text-primary" />
                </span>
                <div>
                  <p className="text-xs text-gray-400">Budget</p>
                  <p className="font-bold text-primary">{formatCurrency(lead.budget)}</p>
                </div>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  <Phone size={14} /> Call
                </a>
              )}
              <button
                onClick={handleSMS}
                disabled={isActionLoading === 'sms'}
                className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                <MessageSquare size={14} /> {isActionLoading === 'sms' ? 'Sending...' : 'SMS'}
              </button>
              <button
                onClick={handleEmail}
                disabled={isActionLoading === 'email'}
                className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                <Mail size={14} /> {isActionLoading === 'email' ? 'Sending...' : 'Email'}
              </button>
              {lead.status !== 'won' && (
                <button
                  onClick={() => setStatus('won')}
                  disabled={!!isActionLoading}
                  className="flex items-center justify-center gap-2 py-2 px-3 border border-green-200 rounded-xl text-sm font-medium text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  <Trophy size={14} /> Mark Won
                </button>
              )}
              {lead.status !== 'lost' && (
                <button
                  onClick={() => setStatus('lost')}
                  disabled={!!isActionLoading}
                  className="flex items-center justify-center gap-2 py-2 px-3 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle size={14} /> Mark Lost
                </button>
              )}
            </div>
          </section>

          {/* Interested Properties */}
          {properties.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Interested Properties ({properties.length})
              </h3>
              <div className="space-y-2">
                {properties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/properties/${p.id}`)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="w-12 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 shrink-0">
                      {p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{p.title}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(p.price)}</p>
                    </div>
                    <Building2 size={14} className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {lead.notes && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notes</h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-line">{lead.notes}</p>
            </section>
          )}

          {/* Activity Timeline */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Activity Timeline {activities.length > 0 && `(${activities.length})`}
            </h3>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-0.5">
                      {ACTIVITY_ICONS[a.type] ?? <Clock size={14} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-text">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Add Note */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Add Note</h3>
            <div className="flex gap-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type a note..."
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
              <button
                onClick={addNote}
                disabled={!noteText.trim() || isSavingNote}
                className="px-3 py-2 bg-primary text-white rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </section>

          {/* Meta */}
          <section className="text-xs text-gray-400 space-y-1 pb-2">
            <p>Created: {formatDate(lead.createdAt)}</p>
            <p>Updated: {formatDate(lead.updatedAt)}</p>
            {lead.ghlContactId && <p>GHL ID: {lead.ghlContactId}</p>}
          </section>
        </div>

        {/* Footer */}
        <div className="border-t p-4 shrink-0 flex gap-2">
          {showDeleteConfirm ? (
            <>
              <span className="flex-1 text-sm text-red-600 flex items-center">Delete this lead?</span>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>No</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>Yes, Delete</Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => onEdit(lead)}>
                <Pencil size={14} /> Edit
              </Button>
              <Button variant="danger" className="gap-2" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
