import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Building2, Zap, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import { propertyService } from '../services/propertyService';
import { leadService } from '../services/leadService';
import { dealService } from '../services/dealService';
import { Property, Lead, Deal } from '../types';

export const Dashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadDashboardData();
    }
  }, [user?.uid]);

  const loadDashboardData = async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      const [propertiesData, leadsData, dealsData] = await Promise.all([
        propertyService.getProperties(user.uid),
        leadService.getLeads(user.uid),
        dealService.getDeals(user.uid),
      ]);
      setProperties(propertiesData);
      setLeads(leadsData);
      setDeals(dealsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const kpis = useMemo(
    () => ({
      totalListings: properties.length,
      activeLeads: leads.filter((l) => l.status !== 'lost' && l.status !== 'won').length,
      dealsClosedThisMonth: deals.filter((d) => d.status === 'closed').length,
      projectedCommission: deals.reduce((sum, d) => sum + d.commissionAmount, 0),
    }),
    [properties, leads, deals]
  );

  const kpiCards = [
    {
      label: 'Total Listings',
      value: kpis.totalListings,
      icon: Building2,
      color: 'primary',
    },
    {
      label: 'Active Leads',
      value: kpis.activeLeads,
      icon: Zap,
      color: 'accent',
    },
    {
      label: 'Deals Closed',
      value: kpis.dealsClosedThisMonth,
      icon: TrendingUp,
      color: 'success',
    },
    {
      label: 'Total Commission',
      value: formatCurrency(kpis.projectedCommission),
      icon: Wallet,
      color: 'warning',
    },
  ];

  const leadsStatusCount = {
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    viewing_scheduled: leads.filter((l) => l.status === 'viewing_scheduled').length,
    offer_made: leads.filter((l) => l.status === 'offer_made').length,
    won: leads.filter((l) => l.status === 'won').length,
    lost: leads.filter((l) => l.status === 'lost').length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-text mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">Welcome back, {user?.displayName}! Here's your performance overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardBody className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-${color} bg-opacity-10`}>
                <Icon
                  size={24}
                  className={`text-${color}`}
                  style={{
                    color:
                      color === 'primary'
                        ? '#0F2D52'
                        : color === 'accent'
                        ? '#C9963A'
                        : color === 'success'
                        ? '#16A34A'
                        : '#D97706',
                  }}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-text">{value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Properties */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-text">
              Recent Properties
            </h2>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : properties.length === 0 ? (
              <p className="text-gray-500">No properties yet</p>
            ) : (
              <div className="space-y-4">
                {properties.slice(0, 3).map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="font-semibold text-text">
                        {property.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {property.location.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(property.price)}
                      </p>
                      <Badge variant="secondary">
                        {property.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Lead Pipeline */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text">
              Lead Pipeline
            </h2>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(leadsStatusCount).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm capitalize text-gray-600">
                      {status.replace('_', ' ')}
                    </span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
