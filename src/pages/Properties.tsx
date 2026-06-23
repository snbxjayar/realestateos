import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Grid3X3, List, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { AddPropertyModal } from '../components/properties/AddPropertyModal';
import { propertyService } from '../services/propertyService';
import { formatCurrency } from '../lib/utils';
import { Property } from '../types';

export const Properties = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>();

  useEffect(() => {
    if (user?.uid) {
      loadProperties();
    }
  }, [user?.uid]);

  const loadProperties = async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await propertyService.getProperties(user.uid);
      setProperties(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyAdded = (property: Property) => {
    setProperties([property, ...properties]);
  };

  const handlePropertyUpdated = (property: Property) => {
    setProperties(properties.map((p) => (p.id === property.id ? property : p)));
    setSelectedProperty(undefined);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      await propertyService.deleteProperty(propertyId);
      setProperties(properties.filter((p) => p.id !== propertyId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete property');
    }
  };

  const handleEditClick = (property: Property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProperty(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading properties...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text mb-2">
            Properties
          </h1>
          <p className="text-gray-600">Manage and view all your listings</p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => {
            setSelectedProperty(undefined);
            setIsModalOpen(true);
          }}
        >
          <Plus size={20} />
          Add Property
        </Button>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {/* View Controls */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === 'grid'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-text'
          }`}
        >
          <Grid3X3 size={20} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === 'list'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-text'
          }`}
        >
          <List size={20} />
        </button>
      </div>

      {/* Properties Grid/List */}
      {properties.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500 mb-4">No properties yet</p>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
            >
              Add Your First Property
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {properties.map((property) => (
            <div
              key={property.id}
              onClick={() => navigate(`/properties/${property.id}`)}
              className="cursor-pointer"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
              {viewMode === 'grid' ? (
                <>
                  <div className="h-48 bg-gradient-to-br from-primary to-accent overflow-hidden">
                    {property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-center text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <CardBody>
                    <h3 className="font-semibold text-text mb-1">
                      {property.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {property.location.address}
                    </p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(property.price)}
                      </span>
                      <Badge variant="secondary">
                        {property.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(property);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProperty(property.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardBody>
                </>
              ) : (
                <CardBody>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text">
                        {property.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {property.location.city}, {property.location.province}
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-primary">
                        {formatCurrency(property.price)}
                      </p>
                      <Badge variant="secondary">
                        {property.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(property);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProperty(property.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              )}
            </Card>
            </div>
          ))}
        </div>
      )}

      <AddPropertyModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        agentId={user?.uid || ''}
        property={selectedProperty}
        onPropertyAdded={handlePropertyAdded}
        onPropertyUpdated={handlePropertyUpdated}
      />
    </div>
  );
};
