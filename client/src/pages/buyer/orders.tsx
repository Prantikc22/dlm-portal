import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { authenticatedApiClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { ORDER_STATUS_COLORS } from '@/lib/constants';
import { ShoppingCart, Download, Eye, CreditCard, Clock, CheckCircle, AlertCircle, ExternalLink, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order, PaymentTransaction } from '@shared/schema';
import { useLocation } from 'wouter';

export default function BuyerOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
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

  const handlePaymentAction = async (order: Order, _transaction: PaymentTransaction | undefined) => {
    try {
      // Use curated offer's configured paymentLink set by admin
      if (order.curatedOfferId) {
        const offer = await authenticatedApiClient.get(`/api/protected/curated-offers/${order.curatedOfferId}`);
        if (offer?.paymentLink) {
          window.open(offer.paymentLink, '_blank');
          toast({ title: 'Payment Link Opened', description: 'Complete payment in the gateway.' });
          return;
        }
      }
      toast({ title: 'Payment Link Missing', description: 'Contact support or admin to configure payment gateway.', variant: 'destructive' });
    } catch (e:any) {
      toast({ title: 'Payment Error', description: e?.message || 'Unable to initiate payment', variant: 'destructive' });
    }
  };

  // Using shared formatCurrency utility from @/lib/utils

  const [, navigate] = useLocation();
  const handleViewOrder = (order: Order) => {
    navigate(`/buyer/order/${order.id}`);
  };

  const paidAmountFor = (orderId: string) => {
    const completed = (paymentTransactions as PaymentTransaction[]).filter(tx => tx.orderId === orderId && tx.status === 'completed');
    return completed.reduce((sum, tx) => sum + parseFloat(String(tx.netAmount || tx.amount || 0)), 0);
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
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Total</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Paid</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Remaining</th>
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
                        {order.totalAmount ? formatCurrency(order.totalAmount) : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {formatCurrency(paidAmountFor(order.id).toString())}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {order.totalAmount ? formatCurrency((parseFloat(String(order.totalAmount)) - paidAmountFor(order.id)).toString()) : 'N/A'}
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewOrder(order)}
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-download-invoice-${order.id}`}
                          onClick={async ()=>{
                            try{
                              const doc= await authenticatedApiClient.get(`/api/protected/orders/${order.id}/invoice`);
                              if(doc?.metadata?.fileData){
                                const a=document.createElement('a');
                                a.href=doc.metadata.fileData;
                                a.download=doc.metadata.fileName||`invoice-${order.orderNumber}.pdf`;
                                a.click();
                              } else {
                                toast({title:'No Invoice', description:'Invoice not uploaded yet', variant:'destructive'});
                              }
                            }catch(e:any){
                              toast({title:'Invoice Error', description:e?.message||'Unable to download invoice', variant:'destructive'});
                            }
                          }}
                        >
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

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Overview */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Order Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Order Number:</span>
                      <span className="text-sm font-mono">{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">RFQ ID:</span>
                      <span className="text-sm font-mono">{selectedOrder.rfqId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Amount:</span>
                      <span className="text-sm font-semibold">{selectedOrder.totalAmount ? formatCurrency(selectedOrder.totalAmount) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={ORDER_STATUS_COLORS[(selectedOrder.status as keyof typeof ORDER_STATUS_COLORS) || 'created']}>
                        {(selectedOrder.status || 'created').replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created:</span>
                      <span className="text-sm">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Updated:</span>
                      <span className="text-sm">{selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Deposit Paid:</span>
                      <span className="text-sm">
                        {selectedOrder.depositPaid ? (
                          <Badge className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">No</Badge>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Payment Status</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Payment Status:</span>
                  {getPaymentStatusBadge(getPaymentStatus(selectedOrder.id))}
                </div>
                {selectedOrder.escrowTxRef && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Transaction Reference:</span>
                    <span className="text-sm font-mono">{selectedOrder.escrowTxRef}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t pt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetails(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
