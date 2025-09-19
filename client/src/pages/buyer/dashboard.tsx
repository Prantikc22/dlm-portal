import { Plus, FileText, Handshake, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { authenticatedApiClient } from '@/lib/supabase';
import { RFQ } from '@shared/schema';
import { RFQ_STATUS_COLORS } from '@/lib/constants';
import { useLocation } from 'wouter';

export default function BuyerDashboard() {
  const [, setLocation] = useLocation();

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['/api/protected/rfqs'],
    queryFn: () => authenticatedApiClient.get('/api/protected/rfqs') as Promise<RFQ[]>,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/protected/orders'],
    queryFn: () => authenticatedApiClient.get('/api/protected/orders'),
  });

  const stats = {
    pendingOffers: rfqs.filter(rfq => rfq.status === 'offers_published').length,
    activeOrders: orders.filter((order: any) => ['production', 'inspection', 'shipped'].includes(order.status)).length,
  };

  return (
    <div className="p-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Buyer Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage your RFQs, view offers, and track orders</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/buyer/create-rfq')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Create New RFQ</CardTitle>
                <CardDescription className="mt-1">Start a new request for quotation</CardDescription>
              </div>
              <Button data-testid="button-create-rfq">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pending Offers</CardTitle>
                <CardDescription className="mt-1">
                  <span data-testid="text-pending-offers">{stats.pendingOffers}</span> offers awaiting review
                </CardDescription>
              </div>
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                <span data-testid="text-pending-count">{stats.pendingOffers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Active Orders</CardTitle>
                <CardDescription className="mt-1">
                  <span data-testid="text-active-orders">{stats.activeOrders}</span> orders in progress
                </CardDescription>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                <span data-testid="text-active-count">{stats.activeOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent RFQs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading RFQs...</div>
          ) : rfqs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No RFQs yet</h3>
              <p className="text-muted-foreground mb-4">Create your first RFQ to get started</p>
              <Button onClick={() => setLocation('/buyer/create-rfq')} data-testid="button-create-first-rfq">
                <Plus className="h-4 w-4 mr-2" />
                Create RFQ
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">RFQ ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rfqs.slice(0, 10).map((rfq) => (
                    <tr key={rfq.id} data-testid={`row-rfq-${rfq.id}`}>
                      <td className="py-4 px-6 text-sm" data-testid={`text-rfq-number-${rfq.id}`}>
                        {rfq.rfqNumber}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium" data-testid={`text-rfq-title-${rfq.id}`}>
                        {rfq.title}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${RFQ_STATUS_COLORS[rfq.status] || RFQ_STATUS_COLORS.draft}`}>
                          {rfq.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(rfq.createdAt!).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <Button variant="ghost" size="sm" data-testid={`button-view-rfq-${rfq.id}`}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
