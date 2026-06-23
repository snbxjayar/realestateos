import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Bed, Bath, Maximize, Car,
  CheckCircle, Building2, Calendar,
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { leadService } from '../../services/leadService';
import { formatCurrency, formatDate } from '../../lib/utils';
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

const INTEREST_OPTIONS = [
  { value: 'buy', label: 'I want to purchase this property' },
  { value: 'rent', label: 'I want to rent this property' },
  { value: 'inquire', label: 'I just want more information' },
];


export const PublicPropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    interest: 'buy',
    message: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    propertyService
      .getProperty(id)
      .then((p) => {
        if (!p) setLoadError('Property not found.');
        else setProperty(p);
      })
      .catch(() => setLoadError('Unable to load this property.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    if (!form.name.trim()) { setFormError('Please enter your name.'); return; }
    if (!form.phone.trim()) { setFormError('Please enter your phone number.'); return; }

    setFormError('');
    setIsSubmitting(true);

    const interestLabel =
      INTEREST_OPTIONS.find((o) => o.value === form.interest)?.label ?? form.interest;

    const notes = [
      `Interest: ${interestLabel}`,
      form.message.trim() ? `Message: ${form.message.trim()}` : '',
      `Property: ${property.title}`,
      `Property ID: ${property.id}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const lead = await leadService.createLead({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim(),
        source: 'website',
        status: 'new',
        interestedIn: [property.id],
        agentId: property.agentId,
        notes,
      });

      // Best-effort: create GHL contact and link back to Firestore lead
      try {
        const res = await fetch('https://services.leadconnectorhq.com/contacts/', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GHL_API_KEY}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: form.name.trim().split(' ')[0],
            lastName: form.name.trim().split(' ').slice(1).join(' ') || undefined,
            email: form.email.trim() || undefined,
            phone: form.phone.trim(),
            locationId: import.meta.env.VITE_GHL_LOCATION_ID,
            source: 'Public Property Listing',
            tags: ['real_estate_inquiry'],
          }),
        });
        if (res.ok) {
          const ghlData = await res.json();
          const contactId = ghlData?.contact?.id;
          if (contactId) {
            await leadService.updateLead(lead.id, { ghlContactId: contactId });
          }
        }
      } catch {
        // non-blocking — Firestore lead was already created
      }

      setIsSuccess(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColor =
    property?.status === 'for_rent'
      ? 'bg-blue-600 text-white'
      : 'bg-[#C9963A] text-white';

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

      {/* Back nav */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0F2D52] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Listings
        </button>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex justify-center items-center py-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F2D52]" />
        </div>
      )}
      {loadError && (
        <div className="max-w-6xl mx-auto px-6 py-20 text-center text-gray-500">
          <p className="text-lg">{loadError}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-[#0F2D52] underline text-sm">
            ← Back to listings
          </button>
        </div>
      )}

      {property && (
        <main className="max-w-6xl mx-auto px-6 pb-20">
          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor}`}>
                  {STATUS_LABELS[property.status] ?? property.status}
                </span>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {TYPE_LABELS[property.type]}
                </span>
              </div>
              <h1 className="font-display font-bold text-[#0F2D52] text-3xl md:text-4xl leading-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-2">
                <MapPin size={14} className="shrink-0" />
                <span>{property.location.address}, {property.location.city}, {property.location.province}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#0F2D52]">{formatCurrency(property.price)}</p>
              {property.status === 'for_rent' && (
                <p className="text-sm text-gray-400">per month</p>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Images + Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Gallery */}
              <div>
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#0F2D52] to-[#1a4a7a] h-72 md:h-96">
                  {property.images.length > 0 ? (
                    <img
                      src={property.images[selectedImage]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      No photos available
                    </div>
                  )}
                </div>
                {property.images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {property.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedImage === i ? 'border-[#C9963A]' : 'border-transparent'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-display font-semibold text-[#0F2D52] text-xl mb-5">
                  Property Details
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(property.details.bedrooms ?? 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-[#F8F7F4] rounded-xl">
                      <Bed size={20} className="text-[#0F2D52]" />
                      <div>
                        <p className="text-xs text-gray-400">Bedrooms</p>
                        <p className="font-semibold text-[#1E293B]">{property.details.bedrooms}</p>
                      </div>
                    </div>
                  )}
                  {(property.details.bathrooms ?? 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-[#F8F7F4] rounded-xl">
                      <Bath size={20} className="text-[#0F2D52]" />
                      <div>
                        <p className="text-xs text-gray-400">Bathrooms</p>
                        <p className="font-semibold text-[#1E293B]">{property.details.bathrooms}</p>
                      </div>
                    </div>
                  )}
                  {(property.details.floorArea ?? 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-[#F8F7F4] rounded-xl">
                      <Maximize size={20} className="text-[#0F2D52]" />
                      <div>
                        <p className="text-xs text-gray-400">Floor Area</p>
                        <p className="font-semibold text-[#1E293B]">{property.details.floorArea} sqm</p>
                      </div>
                    </div>
                  )}
                  {(property.details.lotArea ?? 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-[#F8F7F4] rounded-xl">
                      <Building2 size={20} className="text-[#0F2D52]" />
                      <div>
                        <p className="text-xs text-gray-400">Lot Area</p>
                        <p className="font-semibold text-[#1E293B]">{property.details.lotArea} sqm</p>
                      </div>
                    </div>
                  )}
                  {(property.details.parking ?? 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-[#F8F7F4] rounded-xl">
                      <Car size={20} className="text-[#0F2D52]" />
                      <div>
                        <p className="text-xs text-gray-400">Parking Slots</p>
                        <p className="font-semibold text-[#1E293B]">{property.details.parking}</p>
                      </div>
                    </div>
                  )}
                  {property.turnoverDate && (
                    <div className="flex items-center gap-3 p-3 bg-[#F8F7F4] rounded-xl">
                      <Calendar size={20} className="text-[#0F2D52]" />
                      <div>
                        <p className="text-xs text-gray-400">Turnover</p>
                        <p className="font-semibold text-[#1E293B]">{formatDate(property.turnoverDate)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {property.developer && (
                  <div className="mt-5 pt-5 border-t">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Developer</p>
                    <p className="text-[#1E293B] font-medium">{property.developer}</p>
                  </div>
                )}

                {property.tags.length > 0 && (
                  <div className="mt-5 pt-5 border-t">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {property.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-[#0F2D52]/10 text-[#0F2D52] px-2.5 py-1 rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-display font-semibold text-[#0F2D52] text-xl mb-4">Location</h2>
                <div className="text-gray-600 space-y-1 text-sm">
                  <p className="font-medium text-[#1E293B]">{property.location.address}</p>
                  <p>{property.location.city}, {property.location.province}</p>
                  <p>{property.location.region}</p>
                </div>
              </div>
            </div>

            {/* Right: Inquiry Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                  {isSuccess ? (
                    <div className="text-center py-6">
                      <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                      <h3 className="font-display font-bold text-[#0F2D52] text-xl mb-2">
                        Inquiry Sent!
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        Thank you! Our agent will reach out to you shortly.
                      </p>
                      <button
                        onClick={() => navigate('/')}
                        className="text-sm text-[#0F2D52] underline hover:no-underline"
                      >
                        ← Browse more properties
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-5">
                        <h3 className="font-display font-bold text-[#0F2D52] text-xl">
                          Interested in this property?
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Fill in the form and an agent will contact you.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Juan dela Cruz"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+63 917 000 0000"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="juan@email.com"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            I'm interested in...
                          </label>
                          <div className="space-y-2">
                            {INTEREST_OPTIONS.map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                  form.interest === opt.value
                                    ? 'border-[#0F2D52] bg-[#0F2D52]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="interest"
                                  value={opt.value}
                                  checked={form.interest === opt.value}
                                  onChange={handleChange}
                                  className="accent-[#0F2D52]"
                                />
                                <span className="text-sm text-[#1E293B]">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message (optional)
                          </label>
                          <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Any questions or notes for the agent..."
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52] resize-none"
                          />
                        </div>

                        {formError && (
                          <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                            {formError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 bg-[#0F2D52] hover:bg-[#0a1f3a] text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                        </button>

                        <p className="text-xs text-gray-400 text-center">
                          Your information is kept private and will only be shared with our agent.
                        </p>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t bg-white py-10 text-center">
        <p className="font-display font-bold text-[#0F2D52] text-lg mb-1">RealEstateOS</p>
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} All rights reserved.
        </p>
      </footer>
    </div>
  );
};
