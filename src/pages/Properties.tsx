import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Grid3X3, List, Search, Bed, Bath, Maximize, Pencil, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { AddPropertyModal } from '../components/properties/AddPropertyModal';
import { propertyService } from '../services/propertyService';
import { formatCurrency } from '../lib/utils';
import { Property, PropertyType, PropertyStatus } from '../types';
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
  available: { label: 'Available', className: 'bg-green-100 text-green-700' },
  reserved: { label: 'Reserved', className: 'bg-amber-100 text-amber-700' },
  sold: { label: 'Sold', className: 'bg-red-100 text-red-700' },
  for_rent: { label: 'For Rent', className: 'bg-blue-100 text-blue-700' },
  rented: { label: 'Rented', className: 'bg-purple-100 text-purple-700' },
};

// ── Skeleton ───────────────────────────────────────────────────────────────

const CardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-gray-200 rounded w-1/4" />
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-1/3 mt-4" />
    </div>
  </div>
);

const RowSkeleton = () => (
  <tr className="animate-pulse">
    {[...Array(7)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded" />
      </td>
    ))}
  </tr>
);

// ── Status Badge ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: PropertyStatus }) => {
  const { label, className } = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

export const Properties = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useUIStore();

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | undefined>();

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    if (user?.uid) loadProperties();
  }, [user?.uid]);

  const loadProperties = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const data = await propertyService.getProperties(user.uid);
      setProperties(data);
    } catch {
      showToast('Failed to load properties.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...properties];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.location.city.toLowerCase().includes(s) ||
          p.location.address.toLowerCase().includes(s) ||
          p.location.province.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== 'all') list = list.filter((p) => p.type === typeFilter);
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
    return list;
  }, [properties, search, typeFilter, statusFilter, minPrice, maxPrice]);

  const openAdd = () => { setEditProperty(undefined); setIsModalOpen(true); };
  const openEdit = (p: Property, e: React.MouseEvent) => { e.stopPropagation(); setEditProperty(p); setIsModalOpen(true); };

  const handleAdded = (p: Property) => setProperties((prev) => [p, ...prev]);
  const handleUpdated = (p: Property) => setProperties((prev) => prev.map((x) => x.id === p.id ? p : x));

  const selectClass = 'py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-text">Properties</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLoading ? 'Loading...' : `${properties.length} total listing${properties.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={openAdd}>
          <Plus size={18} />
          Add Property
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search title or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Type */}
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
            <option value="all">All Types</option>
            {(Object.entries(TYPE_LABELS) as [PropertyType, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          {/* Status */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="all">All Statuses</option>
            {(Object.entries(STATUS_CONFIG) as [PropertyStatus, { label: string }][]).map(([v, { label }]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>

          {/* Price range */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-28 pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <span className="text-gray-300 text-sm">—</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-28 pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && search || typeFilter !== 'all' || statusFilter !== 'all' || minPrice || maxPrice ? (
        <p className="text-sm text-gray-400 mb-4">
          Showing {filtered.length} of {properties.length} properties
        </p>
      ) : null}

      {/* ── Grid View ── */}
      {viewMode === 'grid' && (
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={!!(search || typeFilter !== 'all' || statusFilter !== 'all' || minPrice || maxPrice)} onAdd={openAdd} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onView={() => navigate(`/properties/${property.id}`)}
                onEdit={(e) => openEdit(property, e)}
              />
            ))}
          </div>
        )
      )}

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Image', 'Title', 'Type', 'Status', 'Price', 'Location', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <RowSkeleton key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No properties match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/properties/${p.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 shrink-0">
                          {p.images[0] && (
                            <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-text max-w-[200px] truncate">
                        {p.title}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{TYPE_LABELS[p.type]}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">
                        {p.location.city}, {p.location.province}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/properties/${p.id}`); }}
                            className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={(e) => openEdit(p, e)}
                            className="p-1.5 text-gray-400 hover:text-accent rounded-lg hover:bg-accent/10 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddPropertyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agentId={user?.uid ?? ''}
        property={editProperty}
        onPropertyAdded={handleAdded}
        onPropertyUpdated={handleUpdated}
      />
    </div>
  );
};

// ── Property Card ──────────────────────────────────────────────────────────

const PropertyCard = ({
  property,
  onView,
  onEdit,
}: {
  property: Property;
  onView: () => void;
  onEdit: (e: React.MouseEvent) => void;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group">
    {/* Image */}
    <div
      onClick={onView}
      className="h-48 bg-gradient-to-br from-primary to-accent overflow-hidden cursor-pointer relative"
    >
      {property.images[0] ? (
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
          No photo
        </div>
      )}
      <div className="absolute top-3 left-3">
        <StatusBadge status={property.status} />
      </div>
    </div>

    {/* Body */}
    <div className="p-5">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
        {TYPE_LABELS[property.type]}
      </p>
      <h3
        onClick={onView}
        className="font-display font-semibold text-text text-lg leading-snug mb-1 line-clamp-1 cursor-pointer hover:text-primary transition-colors"
      >
        {property.title}
      </h3>
      <p className="text-sm text-gray-500 mb-3 truncate">
        {property.location.city}, {property.location.province}
      </p>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(property.details.bedrooms ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            <Bed size={12} /> {property.details.bedrooms} BD
          </span>
        )}
        {(property.details.bathrooms ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            <Bath size={12} /> {property.details.bathrooms} BA
          </span>
        )}
        {(property.details.floorArea ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            <Maximize size={12} /> {property.details.floorArea} sqm
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="font-bold text-primary text-xl">{formatCurrency(property.price)}</span>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:border-accent hover:text-accent transition-colors"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Eye size={12} /> View
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Empty State ────────────────────────────────────────────────────────────

const EmptyState = ({ hasFilters, onAdd }: { hasFilters: boolean; onAdd: () => void }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Grid3X3 size={28} className="text-gray-400" />
    </div>
    <h3 className="font-display font-semibold text-text text-xl mb-2">
      {hasFilters ? 'No properties match your filters' : 'No properties yet'}
    </h3>
    <p className="text-gray-400 text-sm mb-6">
      {hasFilters ? 'Try adjusting or clearing your filters.' : 'Add your first property listing to get started.'}
    </p>
    {!hasFilters && (
      <Button variant="primary" className="gap-2 mx-auto" onClick={onAdd}>
        <Plus size={16} /> Add Your First Property
      </Button>
    )}
  </div>
);
