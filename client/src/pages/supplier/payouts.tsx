import { useQuery } from '@tanstack/react-query';
import { DollarSign, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { authenticatedApiClient } from '@/lib/supabase';

export default function SupplierPayouts() {
  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['/api/protected/suppliers/payouts'],
    queryFn: () => authenticatedApiClient.get('/api/protected/suppliers/payouts'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/protected/orders'],
    queryFn: () => authenticatedApiClient.get('/api/protected/orders'),
  });

  const pendingPayouts = payouts.filter((payout: any) => payout.status === 'pending');
  const completedPayouts = payouts.filter((payout: any) => payout.status === 'completed');
  const totalEarnings = completedPayouts.reduce((sum: number, payout: any) => 
    sum + (parseFloat(payout.amount) || 0), 0
  );
  const pendingAmount = pendingPayouts.reduce((sum: number, payout: any) => 
    sum + (parseFloat(payout.amount) || 0), 0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <TrendingUp className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Payouts</h1>
        <p className="text-muted-foreground mt-2">Track your earnings and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-earnings">
                  ₹{totalEarnings.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-pending-amount">
                  ₹{pendingAmount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-completed-payouts">
                  {completedPayouts.length}
                </p>
                <p className="text-sm text-muted-foreground">Completed Payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-this-month">
                  {completedPayouts.filter((p: any) => {
                    const payoutDate = new Date(p.completedAt || p.createdAt);
                    const now = new Date();
                    return payoutDate.getMonth() === now.getMonth() && 
                           payoutDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payout Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Payment Terms</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Payments are processed within 7-10 business days after order completion</li>
                <li>• Minimum payout amount: ₹1,000</li>
                <li>• Advance payments: Released upon order confirmation</li>
                <li>• Final payments: Released upon delivery confirmation</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Payment Methods</h3>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• Bank transfer (NEFT/RTGS)</li>
                <li>• UPI payments</li>
                <li>• Digital wallet transfers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" data-testid="button-update-payment-info">
              Update Payment Info
            </Button>
            <Button variant="outline" className="w-full" data-testid="button-download-statements">
              Download Statements
            </Button>
            <Button variant="outline" className="w-full" data-testid="button-tax-documents">
              Tax Documents
            </Button>
            <Button variant="outline" className="w-full" data-testid="button-contact-support">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payouts History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading payouts...</div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No payouts yet</h3>
              <p className="text-muted-foreground">
                Complete orders to start receiving payments
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Payout ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Order ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payouts.map((payout: any) => (
                    <tr key={payout.id} data-testid={`row-payout-${payout.id}`}>
                      <td className="py-4 px-6 text-sm font-mono" data-testid={`text-payout-id-${payout.id}`}>
                        {payout.id.slice(-8)}
                      </td>
                      <td className="py-4 px-6 text-sm" data-testid={`text-payout-order-${payout.id}`}>
                        {payout.orderId?.slice(-8) || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium" data-testid={`text-payout-amount-${payout.id}`}>
                        ₹{parseFloat(payout.amount || '0').toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <Badge variant="outline">
                          {payout.type === 'advance' ? 'Advance' : 'Final'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={getStatusColor(payout.status)}>
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(payout.status)}
                            <span>{payout.status.toUpperCase()}</span>
                          </span>
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          data-testid={`button-view-payout-${payout.id}`}
                        >
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