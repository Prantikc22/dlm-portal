import { useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { authenticatedApiClient } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, CheckCircle, Clock, Truck } from 'lucide-react';

export default function SupplierOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: order } = useQuery({
    queryKey: ['/api/protected/orders', id],
    queryFn: async () => {
      const all = await authenticatedApiClient.get('/api/protected/orders');
      return (all as any[]).find(o => o.id === id);
    },
    enabled: !!id,
  });

  const { data: updates = [] } = useQuery({
    queryKey: ['/api/protected/orders', id, 'updates'],
    queryFn: () => authenticatedApiClient.get(`/api/protected/orders/${id}/updates`),
    enabled: !!id,
  });

  const statusColor = (s?: string) => {
    switch (s) {
      case 'production':
      case 'in_production': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'deposit_paid': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/supplier/orders')}>
            <ArrowLeft className="h-4 w-4 mr-1"/>Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order {order?.orderNumber || id?.slice(-8)}</h1>
            <p className="text-muted-foreground">RFQ: {order?.rfqId}</p>
          </div>
        </div>
        <Badge className={statusColor(order?.status)}>{String(order?.status || 'pending').replace('_',' ').toUpperCase()}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <div className="text-muted-foreground py-8">No updates yet. Admin will post production updates here.</div>
          ) : (
            <div className="space-y-3">
              {(updates as any[]).map((u, idx) => (
                <div key={u.id || idx} className="p-4 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {idx === 0 ? <Clock className="h-4 w-4 text-blue-600"/> : <CheckCircle className="h-4 w-4 text-green-600"/>}
                    <div>
                      <div className="font-medium">{u.stage}</div>
                      <div className="text-sm text-muted-foreground">{u.detail}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
