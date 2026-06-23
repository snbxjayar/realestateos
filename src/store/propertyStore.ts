import { create } from 'zustand';
import { Property, PropertyFilters } from '../types';

interface PropertyStore {
  properties: Property[];
  selectedProperty: Property | null;
  filters: PropertyFilters;
  isLoading: boolean;
  error: string | null;
  setProperties: (properties: Property[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  setFilters: (filters: PropertyFilters) => void;
  addProperty: (property: Property) => void;
  updateProperty: (property: Property) => void;
  deleteProperty: (propertyId: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePropertyStore = create<PropertyStore>((set) => ({
  properties: [],
  selectedProperty: null,
  filters: {},
  isLoading: false,
  error: null,
  setProperties: (properties) => set({ properties }),
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  setFilters: (filters) => set({ filters }),
  addProperty: (property) =>
    set((state) => ({ properties: [...state.properties, property] })),
  updateProperty: (property) =>
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === property.id ? property : p
      ),
    })),
  deleteProperty: (propertyId) =>
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== propertyId),
    })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
