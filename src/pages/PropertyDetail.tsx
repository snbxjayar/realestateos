import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Bed, Bath, Maximize, Car, Building2,
  Calendar, Tag, Pencil, Trash2, User, Phone, Mail, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { AddPropertyModal } from '../components/properties/AddPropertyModal';
import { propertyService } from '../services/propertyService';
import { leadService } from '../services/leadService';
import { formatCurrency, formatDate } from '../lib/utils';
import { Property, Lead, PropertyStatus, PropertyType } from '../types';
import { useUIStore } from '../store';

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PropertyType, string> = {
  house_and_lot: 'House & Lot',
  condo: 'Condominium',
  lot: 'Lot Only',
  commercial: 'Commercial',
  apartment: 'Apartment',
};

const STATUS_CONFIG: Record<PropertyStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-green-100 text-green-700 border-green-200' },
  reserved: { label: 'Reserved', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  sold: { label: 'Sold', className: 'bg-red-100 text-red-700 border-red-200' },
  for_rent: { label: 'For Rent', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  rented: { label: 'Rented', className: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  viewing_scheduled: 'Viewing',
  offer_made: 'Offer Made',
  won: 'Won',
  lost: 'Lost',
};

// ── Skeleton ───────────────────────────────────────────────────────────────

const DetailSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-80 bg-gray-200 rounded-2xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-10 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-40 bg-gray-200 rounded" />
        <div className="h-20 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

export const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useUIStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [linkedLeads, setLinkedLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadAll();
    }
  }, [id]);

  const loadAll = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [prop, leads] = await Promise.all([
        propertyService.getProperty(id),
        user?.uid ? leadService.getLeads(user.uid) : Promise.resolve([]),
      ]);
      setProperty(prop);
      if (prop) {
        setLinkedLeads(leads.filter((l) => l.interestedIn.includes(id)));
      }
    } catch {
      showToast('Failed to load property details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!property) return;
    setIsDeleting(true);
    try {
      await propertyService.deleteProperty(property.id);
      showToast('Property deleted successfully.', 'success');
      navigate('/properties');
    } catch {
      showToast('Failed to delete property.', 'error');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdated = (updated: Property) => {
    setProperty(updated);
    setIsEditOpen(false);
  };

  const prevImage = () => setSelectedImage((i) => (i === 0 ? (property?.images.length ?? 1) - 1 : i - 1));
  const nextImage = () => setSelectedImage((i) => ((i + 1) % (property?.images.length ?? 1)));

  if (isLoading) {
    return (
      <div>
        <button onClick={() => navigate('/properties')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Properties
        </button>
        <DetailSkeleton />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg mb-4">Property not found.</p>
        <Button variant="outline" onClick={() => navigate('/properties')}>← Back to Properties</Button>
      </div>
    );
  }

  const status = STATUS_CONFIG[property.status] ?? { label: property.status, className: 'bg-gray-100 text-gray-600 border-gray-200' };
  const isOwner = user?.uid === property.agentId;

  return (
    <div>
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/properties')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} /> Back to Properties
        </button>

        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsEditOpen(true)}>
              <Pencil size={15} /> Edit
            </Button>
            <Button variant="danger" className="gap-2" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={15} /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-display font-bold text-text text-lg mb-2">Delete Property?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently delete <strong>{property.title}</strong>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete} isLoading={isDeleting}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <div className="mb-8">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent h-80 md:h-[480px]">
          {property.images.length > 0 ? (
            <>
              <img
                src={property.images[selectedImage]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {property.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === selectedImage ? 'bg-white scale-125' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40">
              No photos available
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {property.images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {property.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === selectedImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Title & Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${status.className}`}>
                    {status.label}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{TYPE_LABELS[property.type]}</span>
                </div>
                <h1 className="text-3xl font-display font-bold text-text mb-2">{property.title}</h1>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <MapPin size={14} className="shrink-0" />
                  <span>{property.location.address}, {property.location.city}, {property.location.province}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-primary">{formatCurrency(property.price)}</p>
                {property.status === 'for_rent' && <p className="text-sm text-gray-400">/ month</p>}
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-display font-semibold text-text text-lg mb-3">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {/* Property Specs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-text text-lg mb-5">Property Specs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(property.details.bedrooms ?? 0) > 0 && (
                <SpecItem icon={<Bed size={20} />} label="Bedrooms" value={String(property.details.bedrooms)} />
              )}
              {(property.details.bathrooms ?? 0) > 0 && (
                <SpecItem icon={<Bath size={20} />} label="Bathrooms" value={String(property.details.bathrooms)} />
              )}
              {(property.details.floorArea ?? 0) > 0 && (
                <SpecItem icon={<Maximize size={20} />} label="Floor Area" value={`${property.details.floorArea} sqm`} />
              )}
              {(property.details.lotArea ?? 0) > 0 && (
                <SpecItem icon={<Building2 size={20} />} label="Lot Area" value={`${property.details.lotArea} sqm`} />
              )}
              {(property.details.parking ?? 0) > 0 && (
                <SpecItem icon={<Car size={20} />} label="Parking" value={String(property.details.parking)} />
              )}
              {property.developer && (
                <SpecItem icon={<Building2 size={20} />} label="Developer" value={property.developer} />
              )}
              {property.turnoverDate && (
                <SpecItem icon={<Calendar size={20} />} label="Turnover" value={formatDate(property.turnoverDate)} />
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-text text-lg mb-4">Location</h2>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-medium text-text">{property.location.address}</p>
              <p>{property.location.city}, {property.location.province}</p>
              <p className="text-gray-400">{property.location.region}</p>
            </div>
          </div>

          {/* Tags */}
          {property.tags.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={16} className="text-gray-400" />
                <h2 className="font-display font-semibold text-text text-lg">Tags</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {property.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Linked Leads */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-text text-lg mb-4">
              Interested Leads
              {linkedLeads.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">({linkedLeads.length})</span>
              )}
            </h2>
            {linkedLeads.length === 0 ? (
              <p className="text-gray-400 text-sm">No leads linked to this property yet.</p>
            ) : (
              <div className="space-y-3">
                {linkedLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-text text-sm">{lead.name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          {lead.phone && (
                            <span className="flex items-center gap-1"><Phone size={11} />{lead.phone}</span>
                          )}
                          {lead.email && (
                            <span className="flex items-center gap-1"><Mail size={11} />{lead.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                      {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Quick Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-text text-lg mb-4">Listing Info</h2>
            <div className="space-y-3">
              <InfoRow label="Listed on" value={formatDate(property.createdAt)} />
              <InfoRow label="Last updated" value={formatDate(property.updatedAt)} />
              <InfoRow label="Property ID" value={property.id} mono />
              <InfoRow label="Photos" value={`${property.images.length} image${property.images.length !== 1 ? 's' : ''}`} />
            </div>
          </div>

          {/* Agent Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-display font-semibold text-text text-lg mb-4">Listing Agent</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                {user?.displayName?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div>
                <p className="font-medium text-text text-sm">{user?.displayName ?? 'Agent'}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role ?? 'agent'}</p>
              </div>
            </div>
          </div>

          {/* CTA Card */}
          {isOwner && (
            <div className="bg-primary rounded-2xl p-6 text-white">
              <h3 className="font-display font-semibold text-lg mb-1">Manage Listing</h3>
              <p className="text-blue-200 text-sm mb-4">Update details or remove this listing.</p>
              <Button
                variant="secondary"
                className="w-full gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={() => setIsEditOpen(true)}
              >
                <Pencil size={15} /> Edit Property
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AddPropertyModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        agentId={property.agentId}
        property={property}
        onPropertyUpdated={handleUpdated}
      />
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

const SpecItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
    <span className="text-primary shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-semibold text-text text-sm">{value}</p>
    </div>
  </div>
);

const InfoRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex justify-between items-start gap-2">
    <p className="text-xs text-gray-400 shrink-0">{label}</p>
    <p className={`text-sm text-text text-right break-all ${mono ? 'font-mono text-xs text-gray-500' : 'font-medium'}`}>
      {value}
    </p>
  </div>
);
