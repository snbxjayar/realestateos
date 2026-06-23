import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { AddDealModal } from '../components/deals/AddDealModal';
import { dealService } from '../services/dealService';
import { propertyService } from '../services/propertyService';
import { leadService } from '../services/leadService';
import { formatCurrency } from '../lib/utils';
import { Deal, DealStatus, Property, Lead } from '../types';

const DEAL_STATUSES: DealStatus[] = [
  'negotiation',
  'reservation',
  'contract_signing',
  'financing',
  'closed',
  'cancelled',
];

export const Deals = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [properties, setProperties] = useState<Map<string, Property>>(new Map());
  const [leads, setLeads] = useState<Map<string, Lead>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | undefined>();

  useEffect(() => {
    if (user?.uid) {
      loadDealData();
    }
  }, [user?.uid]);

  const loadDealData = async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      setError('');
      const [dealsData, propsData, leadsData] = await Promise.all([
        dealService.getDeals(user.uid),
        propertyService.getProperties(user.uid),
        leadService.getLeads(user.uid),
      ]);
      
      setDeals(dealsData);
      
      // Create maps for quick lookup
      const propsMap = new Map(propsData.map((p) => [p.id, p]));
      const leadsMap = new Map(leadsData.map((l) => [l.id, l]));
      setProperties(propsMap);
      setLeads(leadsMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDealAdded = (deal: Deal) => {
    setDeals([deal, ...deals]);
  };

  const handleDealUpdated = (deal: Deal) => {
    setDeals(deals.map((d) => (d.id === deal.id ? deal : d)));
    setSelectedDeal(undefined);
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      await dealService.deleteDeal(dealId);
      setDeals(deals.filter((d) => d.id !== dealId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete deal');
    }
  };

  const handleStatusChange = async (dealId: string, newStatus: DealStatus) => {
    try {
      await dealService.updateDeal(dealId, { status: newStatus });
      setDeals(
        deals.map((d) =>
          d.id === dealId ? { ...d, status: newStatus } : d
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update deal status');
    }
  };

  const handleEditClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDeal(undefined);
  };

  const dealsByStatus = DEAL_STATUSES.reduce(
    (acc, status) => ({
      ...acc,
      [status]: deals.filter((d) => d.status === status),
    }),
    {} as Record<DealStatus, Deal[]>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading deals...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text mb-2">
            Deals
          </h1>
          <p className="text-gray-600">Track your sales pipeline and commissions</p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => {
            setSelectedDeal(undefined);
            setIsModalOpen(true);
          }}
        >
          <Plus size={20} />
          Add Deal
        </Button>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {/* Kanban Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto pb-4">
        {DEAL_STATUSES.map((status) => {
          const statusDeals = dealsByStatus[status];
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
                  {statusDeals.length} deals
                </p>
              </div>

              <div className="space-y-3 flex-1">
                {statusDeals.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    No deals
                  </p>
                ) : (
                  statusDeals.map((deal) => {
                    const property = properties.get(deal.propertyId);
                    const lead = leads.get(deal.leadId);

                    return (
                      <Card key={deal.id}>
                        <CardBody className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-text text-sm">
                                {property?.title || 'Property'}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {lead?.name || 'Lead'}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(deal)}
                                className="!p-0"
                                title="Edit deal"
                              >
                                ✎
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDeal(deal.id)}
                                className="!p-0"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>

                          <div className="pt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Sale Price:</span>
                              <span className="font-semibold text-primary">
                                {formatCurrency(deal.salePrice)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Commission:</span>
                              <span className="font-semibold text-accent">
                                {formatCurrency(deal.commissionAmount)}
                              </span>
                            </div>
                          </div>

                          {status !== 'closed' && status !== 'cancelled' && (
                            <select
                              value={status}
                              onChange={(e) =>
                                handleStatusChange(deal.id, e.target.value as DealStatus)
                              }
                              className="w-full text-xs px-2 py-1 border border-gray-300 rounded
                                focus:outline-none focus:border-primary"
                            >
                              {DEAL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddDealModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        agentId={user?.uid || ''}
        deal={selectedDeal}
        onDealAdded={handleDealAdded}
        onDealUpdated={handleDealUpdated}
      />
    </div>
  );
};
