import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { authenticatedApiClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CreditCard, CheckCircle, Clock, Package, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Order, PaymentTransaction } from '@shared/schema';

export default function BuyerOrderDetail() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id || '';
  const { toast } = useToast();

  const { data: order }: { data?: Order } = useQuery({
    queryKey: ['/api/protected/orders', orderId],
    queryFn: async () => {
      const all = await authenticatedApiClient.get('/api/protected/orders');
      return (all as Order[]).find(o => o.id === orderId);
    }
  });

  const { data: updates = [] } = useQuery({
    queryKey: ['/api/protected/orders', orderId, 'updates'],
    queryFn: () => authenticatedApiClient.get(`/api/protected/orders/${orderId}/updates`),
    enabled: !!orderId,
  });

  const { data: txs = [] } = useQuery({
    queryKey: ['/api/protected/order-txs', orderId],
    queryFn: async () => authenticatedApiClient.get(`/api/protected/payment-transactions/order/${orderId}`),
    enabled: !!orderId,
  });

  const paid = useMemo(() => (txs as PaymentTransaction[]) 
    .filter(t => t.status === 'completed')
    .reduce((s, t) => s + parseFloat(String(t.netAmount || t.amount)), 0), [txs]);

  const total = useMemo(() => parseFloat(String(order?.totalAmount || '0')), [order]);
  const remaining = Math.max(total - paid, 0);

  const handlePayNow = async () => {
    try {
      if (order?.curatedOfferId) {
        const offer = await authenticatedApiClient.get(`/api/protected/curated-offers/${order.curatedOfferId}`);
        if (offer?.paymentLink) {
          window.open(offer.paymentLink, '_blank');
          return;
        }
      }
      toast({ title: 'Payment Link Missing', description: 'Contact admin to configure the gateway.', variant: 'destructive' });
    } catch (e:any) {
      toast({ title: 'Payment Error', description: e?.message || 'Unable to initiate payment', variant: 'destructive' });
    }
  };

  const downloadInvoice = async () => {
    try{
      const doc = await authenticatedApiClient.get(`/api/protected/orders/${orderId}/invoice`);
      if(doc?.metadata?.fileData){
        const a=document.createElement('a');
        a.href=doc.metadata.fileData;
        a.download=doc.metadata.fileName||`invoice-${order?.orderNumber}.pdf`;
        a.click();
      } else {
        toast({ title: 'No Invoice', description: 'Invoice not uploaded yet', variant: 'destructive' });
      }
    }catch(e:any){
      toast({ title: 'Invoice Error', description: e?.message || 'Unable to download invoice', variant: 'destructive' });
    }
  };

  if (!order) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => history.back()} className="mb-4"><ArrowLeft className="h-4 w-4 mr-1"/>Back</Button>
        <div className="text-muted-foreground">Loading order…</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">RFQ: {order.rfqId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadInvoice}><Download className="h-4 w-4 mr-1"/>Invoice</Button>
          {remaining > 0 && (
            <Button onClick={handlePayNow}><CreditCard className="h-4 w-4 mr-1"/>Pay Now</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-bold">{formatCurrency(String(total))}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">Paid</div><div className="text-2xl font-bold text-green-600">{formatCurrency(String(paid))}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">Remaining</div><div className="text-2xl font-bold text-yellow-600">{formatCurrency(String(remaining))}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4"/> Production Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <div className="text-muted-foreground py-8">No updates yet. You’ll see production updates here.</div>
          ) : (
            <div className="space-y-4">
              {(updates as any[]).map((u, idx) => (
                <div key={u.id || idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {idx === 0 ? <Clock className="h-4 w-4 text-blue-600"/> : <CheckCircle className="h-4 w-4 text-green-600"/>}
                      <div>
                        <div className="font-medium">{u.stage}</div>
                        <div className="text-sm text-muted-foreground">{u.detail}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
