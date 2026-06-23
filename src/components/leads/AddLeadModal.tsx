import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Lead, LeadSource, LeadStatus, Property } from '../../types';
import { leadService } from '../../services/leadService';
import { propertyService } from '../../services/propertyService';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  lead?: Lead;
  onLeadAdded?: (lead: Lead) => void;
  onLeadUpdated?: (lead: Lead) => void;
}

const BLANK = {
  name: '',
  email: '',
  phone: '',
  source: 'website' as LeadSource,
  status: 'new' as LeadStatus,
  budget: '',
  notes: '',
};

const labelClass = 'block text-sm font-medium text-text mb-1';
const selectClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white';

export const AddLeadModal = ({
  isOpen,
  onClose,
  agentId,
  lead,
  onLeadAdded,
  onLeadUpdated,
}: AddLeadModalProps) => {
  const { user } = useAuth();
  const { showToast } = useUIStore();
  const isEdit = !!lead;

  const [formData, setFormData] = useState(BLANK);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Load agent's properties for the multi-select
  useEffect(() => {
    if (!isOpen || !user?.uid) return;
    propertyService
      .getProperties(user.uid)
      .then(setProperties)
      .catch(() => {});
  }, [isOpen, user?.uid]);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && lead) {
      setFormData({
        name: lead.name,
        email: lead.email ?? '',
        phone: lead.phone ?? '',
        source: lead.source,
        status: lead.status,
        budget: lead.budget?.toString() ?? '',
        notes: lead.notes,
      });
      setSelectedPropertyIds(lead.interestedIn);
    } else {
      setFormData(BLANK);
      setSelectedPropertyIds([]);
    }
    setFormError('');
  }, [isOpen, lead, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const toggleProperty = (id: string) =>
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) { setFormError('Full name is required.'); return; }
    if (!formData.phone.trim()) { setFormError('Phone number is required.'); return; }

    setIsLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim(),
        source: formData.source,
        status: formData.status,
        budget: formData.budget ? Number(formData.budget) : undefined,
        interestedIn: selectedPropertyIds,
        notes: formData.notes.trim(),
        agentId,
      };

      if (isEdit && lead) {
        await leadService.updateLead(lead.id, payload);
        onLeadUpdated?.({ ...lead, ...payload, updatedAt: new Date() });
        showToast('Lead updated successfully.', 'success');
      } else {
        const created = await leadService.createLead(payload);
        onLeadAdded?.(created);
        showToast('Lead created successfully.', 'success');
      }

      onClose();
    } catch (err: any) {
      const msg = err.message || (isEdit ? 'Failed to update lead.' : 'Failed to create lead.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Lead' : 'Add New Lead'}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}

          {/* Contact Info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Contact Info
            </h3>
            <div className="space-y-3">
              <Input
                label="Full Name *"
                name="name"
                placeholder="Juan Dela Cruz"
                value={formData.name}
                onChange={handleChange}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Phone Number *"
                  name="phone"
                  type="tel"
                  placeholder="09XX-XXX-XXXX"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* Lead Details */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Lead Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Source</label>
                <select name="source" value={formData.source} onChange={handleChange} className={selectClass}>
                  <option value="facebook">Facebook</option>
                  <option value="referral">Referral</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="website">Website</option>
                  <option value="ghl">GHL</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={selectClass}>
                  <option value="new">🆕 New</option>
                  <option value="contacted">📞 Contacted</option>
                  <option value="qualified">✅ Qualified</option>
                  <option value="viewing_scheduled">🏠 Viewing Scheduled</option>
                  <option value="offer_made">💰 Offer Made</option>
                  <option value="won">🏆 Won</option>
                  <option value="lost">❌ Lost</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <Input
                label="Budget (₱)"
                name="budget"
                type="number"
                placeholder="0"
                value={formData.budget}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* Interested Properties */}
          {properties.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Interested In {selectedPropertyIds.length > 0 && `(${selectedPropertyIds.length} selected)`}
              </h3>
              <div className="border border-gray-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-gray-50">
                {properties.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPropertyIds.includes(p.id)}
                      onChange={() => toggleProperty(p.id)}
                      className="accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{p.title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {p.location.city} · ₱{p.price.toLocaleString()}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notes</h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Initial contact notes, follow-up details, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </section>
        </div>

        <div className="flex gap-3 pt-5 mt-2 border-t">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
