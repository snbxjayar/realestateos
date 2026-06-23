// User Types
export type UserRole = 'agent' | 'broker' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  ghlContactId?: string;
  createdAt: Date;
}

// Property Types
export type PropertyType = 'house_and_lot' | 'condo' | 'lot' | 'commercial' | 'apartment';
export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'for_rent' | 'rented';

export interface PropertyLocation {
  address: string;
  city: string;
  province: string;
  region: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  floorArea?: number;  // sqm
  lotArea?: number;    // sqm
  parking?: number;
}

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  location: PropertyLocation;
  details: PropertyDetails;
  images: string[];
  description?: string;
  agentId: string;
  developer?: string;
  turnoverDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Lead Types
export type LeadSource = 'facebook' | 'referral' | 'walk_in' | 'website' | 'ghl' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'viewing_scheduled' | 'offer_made' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  interestedIn: string[];
  budget?: number;
  agentId: string;
  ghlContactId?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Deal Types
export type DealStatus = 'negotiation' | 'reservation' | 'contract_signing' | 'financing' | 'closed' | 'cancelled';

export interface Deal {
  id: string;
  propertyId: string;
  leadId: string;
  agentId: string;
  status: DealStatus;
  salePrice: number;
  commissionRate: number;
  commissionAmount: number;
  reservationDate?: Date;
  closingDate?: Date;
  notes: string;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Activity / Timeline Types
export type ActivityType = 'note' | 'status_change' | 'sms' | 'email' | 'call';

export interface Activity {
  id: string;
  type: ActivityType;
  content: string;
  createdBy: string;
  createdAt: Date;
}

// Dashboard KPI Types
export interface DashboardKPIs {
  totalListings: number;
  activeLeads: number;
  dealsClosedThisMonth: number;
  projectedCommission: number;
}

// Filter Types
export interface PropertyFilters {
  type?: PropertyType;
  status?: PropertyStatus;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  agentId?: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  agentId?: string;
  budgetMin?: number;
  budgetMax?: number;
}
