import { useQuery } from '@tanstack/react-query';
import { FileText, Quote, ShoppingCart, DollarSign, Star, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authenticatedApiClient } from '@/lib/supabase';
import { useLocation } from 'wouter';

export default function SupplierDashboard() {
  const [, setLocation] = useLocation();

  const { data: invites = [], isLoading: invitesLoading } = useQuery({
    queryKey: ['/api/protected/suppliers/invites'],
    queryFn: () => authenticatedApiClient.get('/api/protected/suppliers/invites'),
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['/api/protected/quotes'],
    queryFn: () => authenticatedApiClient.get('/api/protected/quotes'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/protected/orders'],
    queryFn: () => authenticatedApiClient.get('/api/protected/orders'),
  });

  const stats = {
    pendingRFQs: invites.filter((invite: any) => invite.invite.status === 'invited').length,
    submittedQuotes: quotes.length,
    activeOrders: orders.filter((order: any) => ['production', 'inspection', 'shipped'].includes(order.status)).length,
    monthlyPayout: 245000, // This would come from API
  };

  return (
    <div className="p-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Supplier Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage your quotes and track orders</p>
      </div>

      {/* Profile Status */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Profile Verified</h3>
                <p className="text-muted-foreground text-sm">Gold tier supplier - All documents verified</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1" />
                Gold
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending RFQs</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-pending-rfqs">
                  {stats.pendingRFQs}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Submitted Quotes</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-submitted-quotes">
                  {stats.submittedQuotes}
                </p>
              </div>
              <Quote className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Orders</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-orders">
                  {stats.activeOrders}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">This Month Payout</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-monthly-payout">
                  ₹{stats.monthlyPayout.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent RFQs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invited RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading RFQs...</div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No RFQ invitations yet</h3>
              <p className="text-muted-foreground">Invitations will appear here when admins match you to RFQs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">RFQ ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Process</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Quantity</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Deadline</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invites.slice(0, 5).map((invite: any) => (
                    <tr key={invite.invite.id} data-testid={`row-invite-${invite.invite.id}`}>
                      <td className="py-4 px-6 text-sm" data-testid={`text-rfq-number-${invite.invite.id}`}>
                        {invite.rfq.rfqNumber}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {invite.rfq.details?.sku?.processName || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {invite.rfq.details?.items?.[0]?.quantity || 'N/A'} {invite.rfq.details?.items?.[0]?.unit || ''}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {invite.invite.responseDeadline ? new Date(invite.invite.responseDeadline).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          className={
                            invite.invite.status === 'invited'
                              ? 'bg-red-100 text-red-800'
                              : invite.invite.status === 'responded'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {invite.invite.status === 'invited' ? 'Quote Pending' : 
                           invite.invite.status === 'responded' ? 'Quote Submitted' : 
                           'Declined'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        {invite.invite.status === 'invited' ? (
                          <Button
                            size="sm"
                            onClick={() => setLocation('/supplier/rfqs')}
                            data-testid={`button-submit-quote-${invite.invite.id}`}
                          >
                            Submit Quote
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation('/supplier/quotes')}
                            data-testid={`button-view-quote-${invite.invite.id}`}
                          >
                            View Quote
                          </Button>
                        )}
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
