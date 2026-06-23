import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { formatCurrency } from '../../lib/utils';
import { Property, PropertyType } from '../../types';

const TYPE_LABELS: Record<PropertyType, string> = {
  house_and_lot: 'House & Lot',
  condo: 'Condominium',
  lot: 'Lot Only',
  commercial: 'Commercial',
  apartment: 'Apartment',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'For Sale',
  for_rent: 'For Rent',
};

export const PublicListings = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    propertyService
      .getPublicListings()
      .then((data) => {
        setProperties(data);
        setFiltered(data);
      })
      .catch(() => setLoadError('Unable to load listings. Please try again later.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    let result = [...properties];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.location.city.toLowerCase().includes(s) ||
          p.location.address.toLowerCase().includes(s) ||
          p.location.province.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== 'all') result = result.filter((p) => p.type === typeFilter);
    if (statusFilter !== 'all') result = result.filter((p) => p.status === statusFilter);
    if (maxPrice) result = result.filter((p) => p.price <= Number(maxPrice));
    setFiltered(result);
  }, [search, typeFilter, statusFilter, maxPrice, properties]);

  return (
    <div className="min-h-screen bg-[#F8F7F4] font-body">
      {/* Header */}
      <header className="bg-[#0F2D52] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <span className="font-display font-bold text-xl tracking-tight">RealEstateOS</span>
        <a
          href="/auth"
          className="text-sm text-[#C9963A] hover:text-amber-300 transition-colors font-medium"
        >
          Agent Login →
        </a>
      </header>

      {/* Hero */}
      <section
        className="relative bg-[#0F2D52] text-white py-20 px-6 text-center overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #C9963A 0%, transparent 60%)' }}
        />
        <div className="relative max-w-2xl mx-auto">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 leading-tight">
            Find Your Dream Property
          </h1>
          <p className="text-blue-200 text-lg">
            Browse our exclusive listings. Your next home is just a click away.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="bg-white border-b shadow-sm sticky top-[65px] z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52] bg-white"
          >
            <option value="all">All Types</option>
            {(Object.entries(TYPE_LABELS) as [PropertyType, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52] bg-white"
          >
            <option value="all">For Sale &amp; Rent</option>
            <option value="available">For Sale</option>
            <option value="for_rent">For Rent</option>
          </select>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="py-2 pl-7 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52] w-36"
            />
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F2D52]" />
          </div>
        ) : loadError ? (
          <div className="text-center py-24 text-red-600">
            <p className="text-lg font-medium">{loadError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p className="text-2xl font-display font-semibold text-gray-700 mb-2">No properties found</p>
            <p className="text-sm">Try adjusting your filters or search terms.</p>
            {(search || typeFilter !== 'all' || statusFilter !== 'all' || maxPrice) && (
              <button
                onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setMaxPrice(''); }}
                className="mt-4 text-sm text-[#0F2D52] underline hover:no-underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {filtered.length} propert{filtered.length === 1 ? 'y' : 'ies'} found
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((property) => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/listings/${property.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden group"
                >
                  {/* Image */}
                  <div className="h-52 bg-gradient-to-br from-[#0F2D52] to-[#1a4a7a] overflow-hidden relative">
                    {property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/40 text-sm">No photo available</span>
                      </div>
                    )}
                    {/* Status pill */}
                    <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${
                      property.status === 'for_rent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#C9963A] text-white'
                    }`}>
                      {STATUS_LABELS[property.status] ?? property.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                      {TYPE_LABELS[property.type]}
                    </p>
                    <h3 className="font-display font-semibold text-[#1E293B] text-lg leading-snug mb-2 line-clamp-2">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">
                        {property.location.city}, {property.location.province}
                      </span>
                    </div>
                    {/* Stats row */}
                    <div className="flex gap-4 text-sm text-gray-500 mb-4">
                      {(property.details.bedrooms ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Bed size={14} />
                          {property.details.bedrooms} BD
                        </span>
                      )}
                      {(property.details.bathrooms ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Bath size={14} />
                          {property.details.bathrooms} BA
                        </span>
                      )}
                      {(property.details.floorArea ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Maximize size={14} />
                          {property.details.floorArea} sqm
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="font-bold text-[#0F2D52] text-xl">
                        {formatCurrency(property.price)}
                      </span>
                      <span className="text-xs font-semibold text-[#C9963A] uppercase tracking-wide">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-16 py-10 text-center">
        <p className="font-display font-bold text-[#0F2D52] text-lg mb-1">RealEstateOS</p>
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} All rights reserved.
        </p>
      </footer>
    </div>
  );
};
