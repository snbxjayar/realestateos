import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Property, PropertyType, PropertyStatus } from '../../types';
import { propertyService } from '../../services/propertyService';
import { uploadImages, isValidImage, getImageValidationError } from '../../lib/imageUpload';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  property?: Property;
  onPropertyAdded?: (property: Property) => void;
  onPropertyUpdated?: (property: Property) => void;
}

export const AddPropertyModal = ({
  isOpen,
  onClose,
  agentId,
  property,
  onPropertyAdded,
  onPropertyUpdated,
}: AddPropertyModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const isEditMode = !!property;
  const [formData, setFormData] = useState({
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
    tags: '',
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
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
        bedrooms: property.details.bedrooms?.toString() || '',
        bathrooms: property.details.bathrooms?.toString() || '',
        floorArea: property.details.floorArea?.toString() || '',
        lotArea: property.details.lotArea?.toString() || '',
        parking: property.details.parking?.toString() || '',
        tags: property.tags?.join(', ') || '',
      });
      setUploadedImages(property.images || []);
    } else {
      setFormData({
        title: '',
        type: 'condo',
        status: 'available',
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
        tags: '',
      });
      setUploadedImages([]);
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
    setError('');
  }, [isOpen, property, isEditMode]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (isValidImage(file)) {
        newFiles.push(file);
      } else {
        errors.push(getImageValidationError(file));
      }
    });

    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setSelectedFiles([...selectedFiles, ...newFiles]);

    // Create preview URLs
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviews]);
  };

  const handleRemoveSelectedImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleRemoveUploadedImage = (imageUrl: string) => {
    setUploadedImages(uploadedImages.filter((url) => url !== imageUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Upload new selected images to GHL Media Library
      let finalImages = [...uploadedImages];
      
      if (selectedFiles.length > 0) {
        setUploadingImages(true);
        const uploadedUrls = await uploadImages(selectedFiles);
        finalImages = [...finalImages, ...uploadedUrls];
        setUploadingImages(false);
      }

      const propertyData = {
        title: formData.title,
        type: formData.type,
        status: formData.status,
        price: parseInt(formData.price) || 0,
        location: {
          address: formData.address,
          city: formData.city,
          province: formData.province,
          region: formData.region,
        },
        details: {
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
          floorArea: formData.floorArea ? parseInt(formData.floorArea) : undefined,
          lotArea: formData.lotArea ? parseInt(formData.lotArea) : undefined,
          parking: formData.parking ? parseInt(formData.parking) : undefined,
        },
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      if (isEditMode && property) {
        await propertyService.updateProperty(property.id, {
          ...propertyData,
          images: finalImages,
        });
        onPropertyUpdated?.({
          ...property,
          ...propertyData,
          images: finalImages,
          agentId: property.agentId,
          createdAt: property.createdAt,
          updatedAt: new Date(),
        });
      } else {
        const newProperty = await propertyService.createProperty({
          ...propertyData,
          images: finalImages,
          agentId,
        });
        onPropertyAdded?.(newProperty);
      }

      setFormData({
        title: '',
        type: 'condo',
        status: 'available',
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
        tags: '',
      });
      setUploadedImages([]);
      setSelectedFiles([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      onClose();
    } catch (err: any) {
      setError(err.message || (isEditMode ? 'Failed to update property' : 'Failed to create property'));
    } finally {
      setIsLoading(false);
      setUploadingImages(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
      title={isEditMode ? 'Edit Property' : 'Add New Property'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
        {error && (
          <div className="p-3 bg-error bg-opacity-10 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        <Input
          label="Property Title"
          name="title"
          placeholder="e.g., Luxury Condo in BGC"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Property Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="house_and_lot">House & Lot</option>
              <option value="condo">Condo</option>
              <option value="lot">Lot</option>
              <option value="commercial">Commercial</option>
              <option value="apartment">Apartment</option>
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
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
              <option value="for_rent">For Rent</option>
              <option value="rented">Rented</option>
            </select>
          </div>
        </div>

        <Input
          label="Price (₱)"
          name="price"
          type="number"
          placeholder="0"
          value={formData.price}
          onChange={handleChange}
          required
        />

        <Input
          label="Address"
          name="address"
          placeholder="123 Main Street"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            name="city"
            placeholder="Manila"
            value={formData.city}
            onChange={handleChange}
            required
          />
          <Input
            label="Province"
            name="province"
            placeholder="NCR"
            value={formData.province}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Region"
          name="region"
          placeholder="NCR"
          value={formData.region}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Bedrooms"
            name="bedrooms"
            type="number"
            placeholder="0"
            value={formData.bedrooms}
            onChange={handleChange}
          />
          <Input
            label="Bathrooms"
            name="bathrooms"
            type="number"
            placeholder="0"
            value={formData.bathrooms}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Floor Area (sqm)"
            name="floorArea"
            type="number"
            placeholder="0"
            value={formData.floorArea}
            onChange={handleChange}
          />
          <Input
            label="Lot Area (sqm)"
            name="lotArea"
            type="number"
            placeholder="0"
            value={formData.lotArea}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Parking Spaces"
          name="parking"
          type="number"
          placeholder="0"
          value={formData.parking}
          onChange={handleChange}
        />

        <Input
          label="Tags (comma-separated)"
          name="tags"
          placeholder="luxury, bgc, investment"
          value={formData.tags}
          onChange={handleChange}
        />

        {/* Image Upload Section */}
        <div className="border-t pt-4 mt-4">
          <label className="block text-sm font-medium text-text mb-2">
            Property Images
          </label>
          
          {/* File Input */}
          <div className="mb-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploadingImages || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Max 5MB per image. Supports JPEG, PNG, WebP, GIF
            </p>
          </div>

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">
                Uploaded Images ({uploadedImages.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group"
                  >
                    <img
                      src={imageUrl}
                      alt={`Property ${index}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveUploadedImage(imageUrl)}
                      className="absolute top-1 right-1 bg-error rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Images Preview */}
          {previewUrls.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                New Images ({previewUrls.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {previewUrls.map((previewUrl, index) => (
                  <div
                    key={index}
                    className="relative group"
                  >
                    <img
                      src={previewUrl}
                      alt={`Preview ${index}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedImage(index)}
                      className="absolute top-1 right-1 bg-error rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            isLoading={isLoading || uploadingImages}
          >
            {isEditMode ? 'Update Property' : 'Create Property'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
