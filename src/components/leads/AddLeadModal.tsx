import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Lead, LeadSource, LeadStatus } from '../../types';
import { leadService } from '../../services/leadService';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  lead?: Lead;
  onLeadAdded?: (lead: Lead) => void;
  onLeadUpdated?: (lead: Lead) => void;
}

export const AddLeadModal = ({
  isOpen,
  onClose,
  agentId,
  lead,
  onLeadAdded,
  onLeadUpdated,
}: AddLeadModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditMode = !!lead;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'website' as LeadSource,
    status: 'new' as LeadStatus,
    budget: '',
    notes: '',
  });

  useEffect(() => {
    if (isEditMode && lead) {
      setFormData({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source,
        status: lead.status,
        budget: lead.budget?.toString() || '',
        notes: lead.notes || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: 'website',
        status: 'new',
        budget: '',
        notes: '',
      });
    }
    setError('');
  }, [isOpen, lead, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const leadData = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        source: formData.source,
        status: formData.status,
        budget: formData.budget ? parseInt(formData.budget) : undefined,
        interestedIn: isEditMode && lead ? lead.interestedIn : [],
        notes: formData.notes,
      };

      if (isEditMode && lead) {
        await leadService.updateLead(lead.id, leadData);
        onLeadUpdated?.({
          ...lead,
          ...leadData,
          agentId: lead.agentId,
          createdAt: lead.createdAt,
          updatedAt: new Date(),
        });
      } else {
        const newLead = await leadService.createLead({
          ...leadData,
          interestedIn: [],
          agentId,
        });
        onLeadAdded?.(newLead);
      }

      setFormData({
        name: '',
        email: '',
        phone: '',
        source: 'website',
        status: 'new',
        budget: '',
        notes: '',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || (isEditMode ? 'Failed to update lead' : 'Failed to create lead'));
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
      title={isEditMode ? 'Edit Lead' : 'Add New Lead'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
        {error && (
          <div className="p-3 bg-error bg-opacity-10 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        <Input
          label="Name"
          name="name"
          placeholder="Juan Dela Cruz"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="juan@example.com"
          value={formData.email}
          onChange={handleChange}
        />

        <Input
          label="Phone"
          name="phone"
          type="tel"
          placeholder="+63 917 123 4567"
          value={formData.phone}
          onChange={handleChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Source
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="facebook">Facebook</option>
              <option value="referral">Referral</option>
              <option value="walk_in">Walk-in</option>
              <option value="website">Website</option>
              <option value="ghl">GHL</option>
              <option value="other">Other</option>
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
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="viewing_scheduled">Viewing Scheduled</option>
              <option value="offer_made">Offer Made</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        <Input
          label="Budget (₱)"
          name="budget"
          type="number"
          placeholder="0"
          value={formData.budget}
          onChange={handleChange}
        />

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
            {isEditMode ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
