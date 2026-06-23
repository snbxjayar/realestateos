import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, LayoutGrid, List, Eye, Pencil, Trash2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { AddLeadModal } from '../components/leads/AddLeadModal';
import { LeadDetailDrawer } from '../components/leads/LeadDetailDrawer';
import { leadService } from '../services/leadService';
import { formatCurrency, formatDate } from '../lib/utils';
import { Lead, LeadSource, LeadStatus } from '../types';
import { useUIStore } from '../store';

// ── Constants ──────────────────────────────────────────────────────────────

const PIPELINE: Array<{ status: LeadStatus; label: string; emoji: string; color: string }> = [
  { status: 'new', label: 'New', emoji: '🆕', color: 'border-slate-300 bg-slate-50' },
  { status: 'contacted', label: 'Contacted', emoji: '📞', color: 'border-blue-200 bg-blue-50' },
  { status: 'qualified', label: 'Qualified', emoji: '✅', color: 'border-teal-200 bg-teal-50' },
  { status: 'viewing_scheduled', label: 'Viewing', emoji: '🏠', color: 'border-indigo-200 bg-indigo-50' },
  { status: 'offer_made', label: 'Offer Made', emoji: '💰', color: 'border-amber-200 bg-amber-50' },
  { status: 'won', label: 'Won', emoji: '🏆', color: 'border-green-200 bg-green-50' },
  { status: 'lost', label: 'Lost', emoji: '❌', color: 'border-red-200 bg-red-50' },
];

const SOURCE_CONFIG: Record<LeadSource, { label: string; className: string }> = {
  facebook: { label: 'Facebook', className: 'bg-blue-100 text-blue-700' },
  referral: { label: 'Referral', className: 'bg-purple-100 text-purple-700' },
  walk_in: { label: 'Walk-in', className: 'bg-orange-100 text-orange-700' },
  website: { label: 'Website', className: 'bg-teal-100 text-teal-700' },
  ghl: { label: 'GHL', className: 'bg-green-100 text-green-700' },
  other: { label: 'Other', className: 'bg-gray-100 text-gray-600' },
};

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: 'bg-slate-100 text-slate-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-teal-100 text-teal-700',
  viewing_scheduled: 'bg-indigo-100 text-indigo-700',
  offer_made: 'bg-amber-100 text-amber-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

// ── Skeleton ───────────────────────────────────────────────────────────────

const KanbanSkeleton = () => (
  <div className="flex gap-4 overflow-x-auto pb-4">
    {PIPELINE.map((col) => (
      <div key={col.status} className="shrink-0 w-64 rounded-2xl border bg-gray-50 p-3 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-3 mb-2 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

function daysAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

// ── Draggable Lead Card ────────────────────────────────────────────────────

const LeadCard = ({
  lead,
  onOpen,
  onEdit,
  onDelete,
  isDragOverlay = false,
}: {
  lead: Lead;
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDragOverlay?: boolean;
}) => {
  const src = SOURCE_CONFIG[lead.source];
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-3 space-y-2 ${isDragOverlay ? 'shadow-2xl rotate-1 scale-105' : 'shadow-sm hover:shadow-md transition-shadow'}`}
    >
      <div className="flex items-start justify-between gap-1">
        <p
          className="font-semibold text-text text-sm leading-snug cursor-pointer hover:text-primary transition-colors flex-1"
          onClick={onOpen}
        >
          {lead.name}
        </p>
        {!isDragOverlay && (
          <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={onOpen} className="p-1 text-gray-300 hover:text-primary rounded transition-colors" title="View">
              <Eye size={12} />
            </button>
            <button onClick={onEdit} className="p-1 text-gray-300 hover:text-accent rounded transition-colors" title="Edit">
              <Pencil size={12} />
            </button>
            <button onClick={onDelete} className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors" title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${src.className}`}>
          {src.label}
        </span>
        {lead.budget && (
          <span className="text-xs font-bold text-primary">{formatCurrency(lead.budget)}</span>
        )}
      </div>

      {lead.phone && (
        <p className="text-xs text-gray-400">{lead.phone}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
        <span>{lead.interestedIn.length} propert{lead.interestedIn.length !== 1 ? 'ies' : 'y'}</span>
        <span>{daysAgo(lead.createdAt)}</span>
      </div>
    </div>
  );
};

// ── Draggable Wrapper ──────────────────────────────────────────────────────

const DraggableCard = ({
  lead,
  onOpen,
  onEdit,
  onDelete,
}: {
  lead: Lead;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="touch-none"
    >
      <LeadCard lead={lead} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

// ── Droppable Column ───────────────────────────────────────────────────────

const KanbanColumn = ({
  col,
  leads,
  onOpen,
  onEdit,
  onDelete,
}: {
  col: typeof PIPELINE[number];
  leads: Lead[];
  onOpen: (l: Lead) => void;
  onEdit: (l: Lead) => void;
  onDelete: (id: string) => void;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: col.status });
  const total = leads.reduce((s, l) => s + (l.budget ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-64 rounded-2xl border-2 transition-all duration-150 ${col.color} ${isOver ? 'ring-2 ring-primary ring-offset-1 scale-[1.01]' : ''}`}
    >
      {/* Column header */}
      <div className="p-3 border-b border-black/5">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-bold text-text">
            {col.emoji} {col.label}
          </span>
          <span className="text-xs font-bold bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
        {total > 0 && (
          <p className="text-xs text-gray-400">{formatCurrency(total)} total</p>
        )}
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 min-h-[80px]">
        {leads.length === 0 ? (
          <p className="text-xs text-gray-300 text-center py-6">No leads</p>
        ) : (
          leads.map((lead) => (
            <DraggableCard
              key={lead.id}
              lead={lead}
              onOpen={() => onOpen(lead)}
              onEdit={() => onEdit(lead)}
              onDelete={() => onDelete(lead.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

export const Leads = () => {
  const { user } = useAuth();
  const { showToast } = useUIStore();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  // Modal / drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | undefined>();
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Drag state
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (user?.uid) loadLeads();
  }, [user?.uid]);

  const loadLeads = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const data = await leadService.getLeads(user.uid);
      setLeads(data);
    } catch {
      showToast('Failed to load leads.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filter
  const filtered = useMemo(() => {
    let list = [...leads];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(s) ||
          l.email?.toLowerCase().includes(s) ||
          l.phone?.includes(s)
      );
    }
    if (sourceFilter !== 'all') list = list.filter((l) => l.source === sourceFilter);
    if (minBudget) list = list.filter((l) => (l.budget ?? 0) >= Number(minBudget));
    if (maxBudget) list = list.filter((l) => (l.budget ?? 0) <= Number(maxBudget));
    return list;
  }, [leads, search, sourceFilter, minBudget, maxBudget]);

  const grouped = useMemo(() => {
    return PIPELINE.reduce((acc, col) => {
      acc[col.status] = filtered.filter((l) => l.status === col.status);
      return acc;
    }, {} as Record<LeadStatus, Lead[]>);
  }, [filtered]);

  // ── DnD handlers ──

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveDragLead(lead ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragLead(null);
    const { active, over } = event;
    if (!over || !user?.uid) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));

    try {
      await leadService.updateLeadStatus(leadId, newStatus, user.uid);
      const col = PIPELINE.find((c) => c.status === newStatus);
      showToast(`Moved to ${col?.label ?? newStatus}.`, 'success');
    } catch {
      // Revert
      setLeads((prev) => prev.map((l) => l.id === leadId ? lead : l));
      showToast('Failed to update lead status.', 'error');
    }
  };

  // ── CRUD handlers ──

  const openAdd = () => { setEditLead(undefined); setIsModalOpen(true); };
  const openEdit = (lead: Lead) => { setEditLead(lead); setIsModalOpen(true); };
  const openDrawer = (lead: Lead) => { setDrawerLead(lead); setIsDrawerOpen(true); };

  const handleAdded = (l: Lead) => setLeads((prev) => [l, ...prev]);
  const handleUpdated = (l: Lead) => setLeads((prev) => prev.map((x) => x.id === l.id ? l : x));
  const handleDeleted = (id: string) => setLeads((prev) => prev.filter((l) => l.id !== id));

  const handleDeleteFromTable = async (id: string) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await leadService.deleteLead(id);
      handleDeleted(id);
      showToast('Lead deleted.', 'success');
    } catch {
      showToast('Failed to delete lead.', 'error');
    }
  };

  const selectClass = 'py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-text">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLoading ? 'Loading...' : `${leads.length} total lead${leads.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={openAdd}>
          <Plus size={18} /> Add Lead
        </Button>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={selectClass}>
            <option value="all">All Sources</option>
            {(Object.entries(SOURCE_CONFIG) as [LeadSource, { label: string }][]).map(([v, { label }]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
              <input type="number" placeholder="Min budget" value={minBudget} onChange={(e) => setMinBudget(e.target.value)}
                className="w-28 pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <span className="text-gray-300">—</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
              <input type="number" placeholder="Max budget" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)}
                className="w-28 pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 ml-auto">
            <button onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Kanban View ── */}
      {viewMode === 'kanban' && (
        isLoading ? <KanbanSkeleton /> : (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1">
              {PIPELINE.map((col) => (
                <KanbanColumn
                  key={col.status}
                  col={col}
                  leads={grouped[col.status] ?? []}
                  onOpen={openDrawer}
                  onEdit={openEdit}
                  onDelete={handleDeleteFromTable}
                />
              ))}
            </div>
            <DragOverlay>
              {activeDragLead && <LeadCard lead={activeDragLead} isDragOverlay />}
            </DragOverlay>
          </DndContext>
        )
      )}

      {/* ── Table View ── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Name', 'Phone', 'Email', 'Source', 'Status', 'Budget', 'Properties', 'Updated', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(9)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                      No leads match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => {
                    const src = SOURCE_CONFIG[lead.source];
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-text whitespace-nowrap">
                          <button onClick={() => openDrawer(lead)} className="hover:text-primary transition-colors">
                            {lead.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{lead.phone ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{lead.email ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${src.className}`}>
                            {src.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[lead.status]}`}>
                            {PIPELINE.find((c) => c.status === lead.status)?.label ?? lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                          {lead.budget ? formatCurrency(lead.budget) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{lead.interestedIn.length}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(lead.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => openDrawer(lead)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors" title="View">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => openEdit(lead)} className="p-1.5 text-gray-400 hover:text-accent rounded-lg hover:bg-accent/10 transition-colors" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDeleteFromTable(lead.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agentId={user?.uid ?? ''}
        lead={editLead}
        onLeadAdded={handleAdded}
        onLeadUpdated={handleUpdated}
      />

      {/* Detail Drawer */}
      <LeadDetailDrawer
        lead={drawerLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={(l) => { setIsDrawerOpen(false); openEdit(l); }}
        onDelete={handleDeleted}
        onLeadUpdated={handleUpdated}
      />
    </div>
  );
};
