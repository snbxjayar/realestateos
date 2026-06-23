import { useState, useEffect } from 'react';
import { X, Upload, ImageIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Property, PropertyType, PropertyStatus } from '../../types';
import { propertyService } from '../../services/propertyService';
import { uploadImages, isValidImage, getImageValidationError } from '../../lib/imageUpload';
import { useUIStore } from '../../store';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  property?: Property;
  onPropertyAdded?: (property: Property) => void;
  onPropertyUpdated?: (property: Property) => void;
}

const BLANK_FORM = {
  title: '',
  type: 'condo' as PropertyType,
  status: 'available' as PropertyStatus,
  price: '',
  address: '',
  city: '',
  province: '',
  region: '',
  bedrooms: '',
  bathrooms: '',
  floorArea: '',
  lotArea: '',
  parking: '',
  developer: '',
  turnoverDate: '',
  tags: '',
  description: '',
};

const selectClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white';

const labelClass = 'block text-sm font-medium text-text mb-1';

export const AddPropertyModal = ({
  isOpen,
  onClose,
  agentId,
  property,
  onPropertyAdded,
  onPropertyUpdated,
}: AddPropertyModalProps) => {
  const { showToast } = useUIStore();
  const isEditMode = !!property;

  const [formData, setFormData] = useState(BLANK_FORM);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && property) {
      setFormData({
        title: property.title,
        type: property.type,
        status: property.status,
        price: property.price.toString(),
        address: property.location.address,
        city: property.location.city,
        province: property.location.province,
        region: property.location.region,
        bedrooms: property.details.bedrooms?.toString() ?? '',
        bathrooms: property.details.bathrooms?.toString() ?? '',
        floorArea: property.details.floorArea?.toString() ?? '',
        lotArea: property.details.lotArea?.toString() ?? '',
        parking: property.details.parking?.toString() ?? '',
        developer: property.developer ?? '',
        turnoverDate: property.turnoverDate
          ? property.turnoverDate.toISOString().split('T')[0]
          : '',
        tags: property.tags.join(', '),
        description: property.description ?? '',
      });
      setUploadedImages(property.images);
    } else {
      setFormData(BLANK_FORM);
      setUploadedImages([]);
    }
    setSelectedFiles([]);
    setPreviewUrls([]);
    setFormError('');
  }, [isOpen, property, isEditMode]);

  // Revoke preview URLs on unmount
  useEffect(() => {
    return () => previewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [previewUrls]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid: File[] = [];
    for (const file of files) {
      const err = getImageValidationError(file);
      if (err) { setFormError(err); return; }
      if (isValidImage(file)) valid.push(file);
    }
    setSelectedFiles((prev) => [...prev, ...valid]);
    setPreviewUrls((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeSelected = (i: number) => {
    URL.revokeObjectURL(previewUrls[i]);
    setSelectedFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviewUrls((p) => p.filter((_, idx) => idx !== i));
  };

  const removeUploaded = (url: string) =>
    setUploadedImages((p) => p.filter((u) => u !== url));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) { setFormError('Property title is required.'); return; }
    if (!formData.price || Number(formData.price) <= 0) { setFormError('A valid price is required.'); return; }

    setIsLoading(true);
    try {
      let finalImages = [...uploadedImages];
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        const urls = await uploadImages(selectedFiles);
        finalImages = [...finalImages, ...urls];
        setIsUploading(false);
      }

      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        status: formData.status,
        price: Number(formData.price),
        location: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          province: formData.province.trim(),
          region: formData.region.trim(),
        },
        details: {
          bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
          floorArea: formData.floorArea ? Number(formData.floorArea) : undefined,
          lotArea: formData.lotArea ? Number(formData.lotArea) : undefined,
          parking: formData.parking ? Number(formData.parking) : undefined,
        },
        developer: formData.developer.trim() || undefined,
        turnoverDate: formData.turnoverDate ? new Date(formData.turnoverDate) : undefined,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        description: formData.description.trim() || undefined,
        images: finalImages,
      };

      if (isEditMode && property) {
        await propertyService.updateProperty(property.id, payload);
        onPropertyUpdated?.({
          ...property,
          ...payload,
          updatedAt: new Date(),
        });
        showToast('Property updated successfully.', 'success');
      } else {
        const created = await propertyService.createProperty({ ...payload, agentId });
        onPropertyAdded?.(created);
        showToast('Property created successfully.', 'success');
      }

      onClose();
    } catch (err: any) {
      const msg = err.message || (isEditMode ? 'Failed to update property.' : 'Failed to create property.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const totalImages = uploadedImages.length + previewUrls.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Property' : 'Add New Property'}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        {/* Scrollable body */}
        <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}

          {/* Basic Info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Basic Info
            </h3>
            <div className="space-y-3">
              <Input
                label="Property Title *"
                name="title"
                placeholder="e.g., 3BR Condo in BGC"
                value={formData.title}
                onChange={handleChange}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Property Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className={selectClass}>
                    <option value="house_and_lot">House &amp; Lot</option>
                    <option value="condo">Condominium</option>
                    <option value="lot">Lot Only</option>
                    <option value="commercial">Commercial</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className={selectClass}>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="for_rent">For Rent</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>
              </div>
              <Input
                label="Price (₱) *"
                name="price"
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* Location */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Location
            </h3>
            <div className="space-y-3">
              <Input label="Address" name="address" placeholder="123 Main Street" value={formData.address} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" name="city" placeholder="Makati" value={formData.city} onChange={handleChange} />
                <Input label="Province" name="province" placeholder="Metro Manila" value={formData.province} onChange={handleChange} />
              </div>
              <Input label="Region" name="region" placeholder="NCR" value={formData.region} onChange={handleChange} />
            </div>
          </section>

          {/* Property Details */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Property Details
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Bedrooms" name="bedrooms" type="number" placeholder="0" value={formData.bedrooms} onChange={handleChange} />
              <Input label="Bathrooms" name="bathrooms" type="number" placeholder="0" value={formData.bathrooms} onChange={handleChange} />
              <Input label="Parking Spaces" name="parking" type="number" placeholder="0" value={formData.parking} onChange={handleChange} />
              <Input label="Floor Area (sqm)" name="floorArea" type="number" placeholder="0" value={formData.floorArea} onChange={handleChange} />
              <Input label="Lot Area (sqm)" name="lotArea" type="number" placeholder="0" value={formData.lotArea} onChange={handleChange} />
            </div>
          </section>

          {/* Additional Info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Additional Info
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Developer" name="developer" placeholder="e.g., Ayala Land" value={formData.developer} onChange={handleChange} />
                <div>
                  <label className={labelClass}>Turnover Date</label>
                  <input
                    type="date"
                    name="turnoverDate"
                    value={formData.turnoverDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <Input
                label="Tags (comma-separated)"
                name="tags"
                placeholder="luxury, investment, beachfront"
                value={formData.tags}
                onChange={handleChange}
              />
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the property, highlights, nearby amenities..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </section>

          {/* Images */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Property Images {totalImages > 0 && `(${totalImages})`}
            </h3>

            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors">
              <Upload size={22} className="text-gray-400" />
              <span className="text-sm text-gray-500">Click to add images</span>
              <span className="text-xs text-gray-400">JPEG, PNG, WebP — max 5MB each</span>
              <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" disabled={isLoading} />
            </label>

            {/* Already-uploaded images */}
            {uploadedImages.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">Saved images</p>
                <div className="grid grid-cols-4 gap-2">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeUploaded(url)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={18} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending new images */}
            {previewUrls.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">New images (pending upload)</p>
                <div className="grid grid-cols-4 gap-2">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeSelected(i)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={18} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalImages === 0 && (
              <div className="mt-3 flex items-center gap-2 text-gray-400 text-xs">
                <ImageIcon size={14} />
                <span>No images added yet</span>
              </div>
            )}
          </section>
        </div>

        {/* Fixed footer */}
        <div className="flex gap-3 pt-5 mt-2 border-t">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading || isUploading}>
            {isUploading ? 'Uploading images...' : isEditMode ? 'Save Changes' : 'Create Property'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
