import { create } from 'zustand';
import { Lead, LeadFilters } from '../types';

interface LeadStore {
  leads: Lead[];
  selectedLead: Lead | null;
  filters: LeadFilters;
  isLoading: boolean;
  error: string | null;
  setLeads: (leads: Lead[]) => void;
  setSelectedLead: (lead: Lead | null) => void;
  setFilters: (filters: LeadFilters) => void;
  addLead: (lead: Lead) => void;
  updateLead: (lead: Lead) => void;
  deleteLead: (leadId: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLeadStore = create<LeadStore>((set) => ({
  leads: [],
  selectedLead: null,
  filters: {},
  isLoading: false,
  error: null,
  setLeads: (leads) => set({ leads }),
  setSelectedLead: (lead) => set({ selectedLead: lead }),
  setFilters: (filters) => set({ filters }),
  addLead: (lead) =>
    set((state) => ({ leads: [...state.leads, lead] })),
  updateLead: (lead) =>
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === lead.id ? lead : l
      ),
    })),
  deleteLead: (leadId) =>
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== leadId),
    })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
