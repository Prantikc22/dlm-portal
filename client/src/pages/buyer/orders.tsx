import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authenticatedApiClient } from '@/lib/supabase';
import { ORDER_STATUS_COLORS } from '@/lib/constants';
import { ShoppingCart, Download, Eye } from 'lucide-react';

export default function BuyerOrders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/protected/orders'],
    queryFn: () => authenticatedApiClient.get('/api/protected/orders'),
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground mt-2">Track your orders and view delivery status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">
                Accept an offer to create your first order
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Order Number</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">RFQ</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order: any) => (
                    <tr key={order.id} data-testid={`row-order-${order.id}`}>
                      <td className="py-4 px-6 text-sm font-mono" data-testid={`text-order-number-${order.id}`}>
                        {order.orderNumber}
                      </td>
                      <td className="py-4 px-6 text-sm" data-testid={`text-order-rfq-${order.id}`}>
                        {order.rfqId}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium" data-testid={`text-order-amount-${order.id}`}>
                        ₹{order.totalAmount?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.created}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`button-view-order-${order.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-download-invoice-${order.id}`}>
                          <Download className="h-4 w-4 mr-1" />
                          Invoice
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
