import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { propertyService } from '../services/propertyService';
import { formatCurrency } from '../lib/utils';
import { Property } from '../types';

export const PropertyDetail = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  const loadProperty = async () => {
    if (!propertyId) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await propertyService.getProperty(propertyId);
      setProperty(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load property details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div>
        <Button
          variant="outline"
          className="gap-2 mb-6"
          onClick={() => navigate('/properties')}
        >
          <ArrowLeft size={18} />
          Back to Properties
        </Button>
        <Alert type="error" message="Property not found" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Button
        variant="outline"
        className="gap-2 mb-6"
        onClick={() => navigate('/properties')}
      >
        <ArrowLeft size={18} />
        Back to Properties
      </Button>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {/* Image Gallery */}
      <div className="mb-8">
        <Card>
          <CardBody className="p-0">
            {property.images.length > 0 ? (
              <>
                <div className="bg-gray-900 flex items-center justify-center" style={{ height: '500px' }}>
                  <img
                    src={property.images[selectedImageIndex]}
                    alt={property.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Image Thumbnails */}
                {property.images.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto bg-background border-t">
                    {property.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImageIndex === index
                            ? 'border-primary'
                            : 'border-gray-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-96 bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-xl">No images available</span>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Property Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Status */}
          <Card>
            <CardBody>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-display font-bold text-text mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} />
                    <span>
                      {property.location.address}, {property.location.city}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {property.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {property.location.province}, {property.location.region}
              </p>
            </CardBody>
          </Card>

          {/* Price */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text">Price</h2>
            </CardHeader>
            <CardBody>
              <p className="text-4xl font-bold text-primary">
                {formatCurrency(property.price)}
              </p>
            </CardBody>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text">Property Details</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {property.details.bedrooms !== undefined && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Bedrooms</p>
                    <p className="text-2xl font-bold text-text">
                      {property.details.bedrooms}
                    </p>
                  </div>
                )}
                {property.details.bathrooms !== undefined && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Bathrooms</p>
                    <p className="text-2xl font-bold text-text">
                      {property.details.bathrooms}
                    </p>
                  </div>
                )}
                {property.details.floorArea !== undefined && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Floor Area</p>
                    <p className="text-2xl font-bold text-text">
                      {property.details.floorArea}m²
                    </p>
                  </div>
                )}
                {property.details.lotArea !== undefined && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Lot Area</p>
                    <p className="text-2xl font-bold text-text">
                      {property.details.lotArea}m²
                    </p>
                  </div>
                )}
                {property.details.parking !== undefined && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Parking</p>
                    <p className="text-2xl font-bold text-text">
                      {property.details.parking}
                    </p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Type</p>
                  <p className="text-lg font-bold text-text capitalize">
                    {property.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Description */}
          {property.tags.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-text">Tags</h2>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {property.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text">Quick Info</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Listed on</p>
                <p className="font-semibold text-text">
                  {new Date(property.createdAt).toLocaleDateString('en-PH')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-semibold text-text">
                  {new Date(property.updatedAt).toLocaleDateString('en-PH')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Property ID</p>
                <p className="font-mono text-xs text-gray-500 break-all">
                  {property.id}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          {user?.uid === property.agentId && (
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate(`/properties`)}
            >
              Edit Property
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
