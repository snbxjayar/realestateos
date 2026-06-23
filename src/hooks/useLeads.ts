import { useEffect } from 'react';
import { useLeadStore } from '../store/leadStore';

// Mock data for development
const MOCK_LEADS = [
  {
    id: '1',
    name: 'Juan Dela Cruz',
    email: 'juan@example.com',
    phone: '+63 917 123 4567',
    source: 'website' as const,
    status: 'qualified' as const,
    interestedIn: ['1'],
    budget: 10000000,
    agentId: 'agent1',
    notes: 'Interested in BGC properties',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@example.com',
    phone: '+63 917 987 6543',
    source: 'referral' as const,
    status: 'viewing_scheduled' as const,
    interestedIn: ['2'],
    budget: 8000000,
    agentId: 'agent1',
    notes: 'Referred by a friend',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useLeads = () => {
  const { leads, setLeads, isLoading, setIsLoading } = useLeadStore();

  useEffect(() => {
    // Load mock data for now
    setIsLoading(true);
    setTimeout(() => {
      setLeads(MOCK_LEADS);
      setIsLoading(false);
    }, 500);
  }, [setLeads, setIsLoading]);

  return { leads, isLoading };
};
