import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authenticatedApiClient } from '@/lib/supabase';
import { ORDER_STATUS_COLORS } from '@/lib/constants';
import { ShoppingCart, Download, Eye, CreditCard, Clock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order, PaymentTransaction } from '@shared/schema';

export default function BuyerOrders() {
  const { toast } = useToast();
  
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/protected/orders'],
    queryFn: () => authenticatedApiClient.get('/api/protected/orders'),
  });

  // Fetch payment transactions for orders
  const { data: paymentTransactions = [] } = useQuery({
    queryKey: ['/api/protected/buyer/payment-transactions'],
    queryFn: () => authenticatedApiClient.get('/api/protected/buyer/payment-transactions'),
  });

  const getPaymentStatus = (orderId: string) => {
    const orderTransactions = (paymentTransactions as PaymentTransaction[]).filter((tx: PaymentTransaction) => tx.orderId === orderId);
    const completedPayments = orderTransactions.filter((tx: PaymentTransaction) => tx.status === 'completed');
    const pendingPayments = orderTransactions.filter((tx: PaymentTransaction) => tx.status === 'pending');
    
    if (completedPayments.length === 0) return 'not_started';
    if (pendingPayments.length > 0) return 'partial';
    return 'completed';
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Partial</Badge>;
      case 'not_started':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPaymentActions = (order: Order) => {
    const paymentStatus = getPaymentStatus(order.id);
    const orderTransactions = (paymentTransactions as PaymentTransaction[]).filter((tx: PaymentTransaction) => tx.orderId === order.id);
    const pendingTransaction = orderTransactions.find((tx: PaymentTransaction) => tx.status === 'pending');
    
    if (paymentStatus === 'not_started' || pendingTransaction) {
      return (
        <Button 
          size="sm" 
          variant="default"
          onClick={() => handlePaymentAction(order, pendingTransaction)}
          data-testid={`button-pay-order-${order.id}`}
        >
          <CreditCard className="h-4 w-4 mr-1" />
          Pay Now
        </Button>
      );
    }
    
    return null;
  };

  const handlePaymentAction = (order: Order, transaction: PaymentTransaction | undefined) => {
    toast({
      title: "Payment Initiated",
      description: `Redirecting to payment gateway for order ${order.orderNumber}`,
    });
    // In a real app, this would redirect to Razorpay or other payment gateway
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

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
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Order Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Payment Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(orders as Order[]).map((order: Order) => (
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
                        <Badge className={ORDER_STATUS_COLORS[(order.status as keyof typeof ORDER_STATUS_COLORS) || 'created'] || ORDER_STATUS_COLORS.created}>
                          {(order.status || 'created').replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        {getPaymentStatusBadge(getPaymentStatus(order.id))}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 space-x-2">
                        {getPaymentActions(order)}
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
