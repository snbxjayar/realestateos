import { useEffect } from 'react';
import { usePropertyStore } from '../store/propertyStore';

// Mock data for development
const MOCK_PROPERTIES = [
  {
    id: '1',
    title: 'Luxury Condo in BGC',
    type: 'condo' as const,
    status: 'available' as const,
    price: 12500000,
    location: {
      address: '123 Makati Avenue',
      city: 'Makati',
      province: 'Metro Manila',
      region: 'NCR',
    },
    details: {
      bedrooms: 2,
      bathrooms: 2,
      floorArea: 95,
      parking: 2,
    },
    images: [],
    agentId: 'agent1',
    tags: ['luxury', 'bgc', 'condo'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'House and Lot in Quezon City',
    type: 'house_and_lot' as const,
    status: 'available' as const,
    price: 8500000,
    location: {
      address: '456 Acacia Road',
      city: 'Quezon City',
      province: 'NCR',
      region: 'NCR',
    },
    details: {
      bedrooms: 3,
      bathrooms: 3,
      floorArea: 150,
      lotArea: 250,
      parking: 2,
    },
    images: [],
    agentId: 'agent1',
    tags: ['residential', 'qc'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useProperties = () => {
  const { properties, setProperties, isLoading, setIsLoading } = usePropertyStore();

  useEffect(() => {
    // Load mock data for now
    setIsLoading(true);
    setTimeout(() => {
      setProperties(MOCK_PROPERTIES);
      setIsLoading(false);
    }, 500);
  }, [setProperties, setIsLoading]);

  return { properties, isLoading };
};
