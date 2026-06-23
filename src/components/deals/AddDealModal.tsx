import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Deal, DealStatus } from '../../types';
import { dealService } from '../../services/dealService';
import { propertyService } from '../../services/propertyService';
import { leadService } from '../../services/leadService';
import { Property, Lead } from '../../types';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  deal?: Deal;
  onDealAdded?: (deal: Deal) => void;
  onDealUpdated?: (deal: Deal) => void;
}

export const AddDealModal = ({
  isOpen,
  onClose,
  agentId,
  deal,
  onDealAdded,
  onDealUpdated,
}: AddDealModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const isEditMode = !!deal;
  const [formData, setFormData] = useState({
    propertyId: '',
    leadId: '',
    status: 'negotiation' as DealStatus,
    salePrice: '',
    commissionRate: '5',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadSelectionData();
      if (isEditMode && deal) {
        setFormData({
          propertyId: deal.propertyId,
          leadId: deal.leadId,
          status: deal.status,
          salePrice: deal.salePrice.toString(),
          commissionRate: deal.commissionRate.toString(),
          notes: deal.notes || '',
        });
      } else {
        setFormData({
          propertyId: '',
          leadId: '',
          status: 'negotiation',
          salePrice: '',
          commissionRate: '5',
          notes: '',
        });
      }
      setError('');
    }
  }, [isOpen, deal, isEditMode]);

  const loadSelectionData = async () => {
    try {
      const [propsData, leadsData] = await Promise.all([
        propertyService.getProperties(agentId),
        leadService.getLeads(agentId),
      ]);
      setProperties(propsData);
      setLeads(leadsData);
    } catch (err: any) {
      console.error('Failed to load properties/leads:', err);
    }
  };

  const commissionAmount = formData.salePrice && formData.commissionRate
    ? Math.round(parseInt(formData.salePrice) * (parseFloat(formData.commissionRate) / 100))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const dealData = {
        propertyId: formData.propertyId,
        leadId: formData.leadId,
        status: formData.status,
        salePrice: parseInt(formData.salePrice) || 0,
        commissionRate: parseFloat(formData.commissionRate) || 0,
        commissionAmount,
        notes: formData.notes,
        documents: isEditMode && deal ? deal.documents : [],
      };

      if (isEditMode && deal) {
        await dealService.updateDeal(deal.id, dealData);
        onDealUpdated?.({
          ...deal,
          ...dealData,
          agentId: deal.agentId,
          createdAt: deal.createdAt,
          updatedAt: new Date(),
        });
      } else {
        const newDeal = await dealService.createDeal({
          ...dealData,
          agentId,
        });
        onDealAdded?.(newDeal);
      }

      setFormData({
        propertyId: '',
        leadId: '',
        status: 'negotiation',
        salePrice: '',
        commissionRate: '5',
        notes: '',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || (isEditMode ? 'Failed to update deal' : 'Failed to create deal'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Deal' : 'Add New Deal'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
        {error && (
          <div className="p-3 bg-error bg-opacity-10 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Property
          </label>
          <select
            name="propertyId"
            value={formData.propertyId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="">Select a property</option>
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.title} - ₱{prop.price.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Lead
          </label>
          <select
            name="leadId"
            value={formData.leadId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="">Select a lead</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name} - {lead.source}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="negotiation">Negotiation</option>
            <option value="reservation">Reservation</option>
            <option value="contract_signing">Contract Signing</option>
            <option value="financing">Financing</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <Input
          label="Sale Price (₱)"
          name="salePrice"
          type="number"
          placeholder="0"
          value={formData.salePrice}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Commission Rate (%)"
            name="commissionRate"
            type="number"
            step="0.1"
            placeholder="5"
            value={formData.commissionRate}
            onChange={handleChange}
          />
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Commission Amount
            </label>
            <div className="px-3 py-2 bg-background rounded-lg border border-gray-300">
              <p className="font-semibold text-primary">
                ₱{commissionAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={isLoading}
          >
            {isEditMode ? 'Update Deal' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
