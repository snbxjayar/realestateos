import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { AddLeadModal } from '../components/leads/AddLeadModal';
import { leadService } from '../services/leadService';
import { Lead, LeadStatus } from '../types';

const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'viewing_scheduled',
  'offer_made',
  'won',
  'lost',
];

export const Leads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();

  useEffect(() => {
    if (user?.uid) {
      loadLeads();
    }
  }, [user?.uid]);

  const loadLeads = async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await leadService.getLeads(user.uid);
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadAdded = (lead: Lead) => {
    setLeads([lead, ...leads]);
  };

  const handleLeadUpdated = (lead: Lead) => {
    setLeads(leads.map((l) => (l.id === lead.id ? lead : l)));
    setSelectedLead(undefined);
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      await leadService.deleteLead(leadId);
      setLeads(leads.filter((l) => l.id !== leadId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete lead');
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await leadService.updateLead(leadId, { status: newStatus });
      setLeads(
        leads.map((l) =>
          l.id === leadId ? { ...l, status: newStatus } : l
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update lead status');
    }
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedLead(undefined);
  };

  const leadsByStatus = LEAD_STATUSES.reduce(
    (acc, status) => ({
      ...acc,
      [status]: leads.filter((l) => l.status === status),
    }),
    {} as Record<LeadStatus, Lead[]>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading leads...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text mb-2">
            Leads
          </h1>
          <p className="text-gray-600">Manage your lead pipeline</p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => {
            setSelectedLead(undefined);
            setIsModalOpen(true);
          }}
        >
          <Plus size={20} />
          Add Lead
        </Button>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {/* Kanban Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto pb-4">
        {LEAD_STATUSES.map((status) => {
          const statusLeads = leadsByStatus[status];
          return (
            <div
              key={status}
              className="flex flex-col bg-background rounded-lg p-4 min-w-full md:min-w-0"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-text capitalize">
                  {status.replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-600">
                  {statusLeads.length} leads
                </p>
              </div>

              <div className="space-y-3 flex-1">
                {statusLeads.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    No leads
                  </p>
                ) : (
                  statusLeads.map((lead) => (
                    <Card key={lead.id}>
                      <CardBody className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-text">
                              {lead.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {lead.phone || lead.email}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(lead)}
                              className="!p-0"
                              title="Edit lead"
                            >
                              ✎
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="!p-0"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <Badge variant="secondary">
                            {lead.source}
                          </Badge>
                          {lead.budget && (
                            <span className="text-xs font-semibold text-primary">
                              ₱{lead.budget.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {status !== 'won' && status !== 'lost' && (
                          <select
                            value={status}
                            onChange={(e) =>
                              handleStatusChange(lead.id, e.target.value as LeadStatus)
                            }
                            className="w-full text-xs px-2 py-1 border border-gray-300 rounded
                              focus:outline-none focus:border-primary"
                          >
                            {LEAD_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        )}
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddLeadModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        agentId={user?.uid || ''}
        lead={selectedLead}
        onLeadAdded={handleLeadAdded}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
};
