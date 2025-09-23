import { useQuery } from '@tanstack/react-query';
import { Package, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { authenticatedApiClient } from '@/lib/supabase';
import { useLocation } from 'wouter';

export default function SupplierOrders() {
  const [, setLocation] = useLocation();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/protected/orders'],
    queryFn: () => authenticatedApiClient.get('/api/protected/orders'),
  });

  const activeOrders = orders.filter((order: any) => 
    ['confirmed', 'in_production', 'shipped'].includes(order.status)
  );
  const completedOrders = orders.filter((order: any) => order.status === 'delivered');
  const totalRevenue = orders.reduce((sum: number, order: any) => 
    sum + (parseFloat(order.totalAmount) || 0), 0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_production': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Clock className="h-4 w-4" />;
      case 'in_production': return <Package className="h-4 w-4" />;
      case 'shipped': return <TrendingUp className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground mt-2">Track and manage your production orders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-orders">
                  {activeOrders.length}
                </p>
                <p className="text-sm text-muted-foreground">Active Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-completed-orders">
                  {completedOrders.length}
                </p>
                <p className="text-sm text-muted-foreground">Completed Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-orders">
                  {orders.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-revenue">
                  ₹{totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet</h3>
              <p className="text-muted-foreground">
                Orders will appear here when buyers purchase your offers
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Order ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">RFQ</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Order Date</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Expected Delivery</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order: any) => (
                    <tr key={order.id} data-testid={`row-order-${order.id}`}>
                      <td className="py-4 px-6 text-sm font-mono" data-testid={`text-order-id-${order.id}`}>
                        {order.id.slice(-8)}
                      </td>
                      <td className="py-4 px-6 text-sm" data-testid={`text-order-rfq-${order.id}`}>
                        {order.rfqId?.slice(-8) || 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={getStatusColor(order.status)}>
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(order.status)}
                            <span>{order.status.replace('_', ' ').toUpperCase()}</span>
                          </span>
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {order.expectedDeliveryDate 
                          ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                          : 'TBD'}
                      </td>
                      <td className="py-4 px-6">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setLocation(`/supplier/order/${order.id}`)}
                          data-testid={`button-view-order-${order.id}`}
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