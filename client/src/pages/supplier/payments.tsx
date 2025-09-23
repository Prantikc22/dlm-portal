import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authenticatedApiClient } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { CreditCard, Wallet, CheckCircle, Clock, XCircle, AlertCircle, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentTx {
  id: string;
  transactionRef: string;
  orderId?: string;
  curatedOfferId?: string;
  payerId?: string;
  recipientId?: string;
  amount: string;
  netAmount: string;
  currency: string;
  status: 'pending'|'processing'|'completed'|'failed'|'cancelled'|'refunded';
  transactionType: 'advance_payment'|'final_payment'|'full_payment'|'refund'|'commission';
  createdAt: string;
}

export default function SupplierPayments() {
  const [status, setStatus] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['/api/protected/supplier/payment-transactions', status, type],
    queryFn: () => authenticatedApiClient.get(`/api/protected/supplier/payment-transactions${buildQuery(status, type)}`),
  });

  function buildQuery(s?: string, t?: string) {
    const params = new URLSearchParams();
    if (s && s !== 'all') params.set('status', s);
    if (t && t !== 'all') params.set('type', t);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
    }

  const filtered = useMemo(() => {
    return (txs as PaymentTx[]).filter(tx => {
      const matchesSearch = !search || tx.transactionRef.toLowerCase().includes(search.toLowerCase());
      const withinFrom = !from || new Date(tx.createdAt) >= new Date(from);
      const withinTo = !to || new Date(tx.createdAt) <= new Date(to);
      return matchesSearch && withinFrom && withinTo;
    });
  }, [txs, search, from, to]);

  const stats = useMemo(() => {
    const completed = filtered.filter(t => t.status === 'completed');
    const pending = filtered.filter(t => t.status === 'pending');
    return {
      completedAmount: completed.reduce((s, t) => s + parseFloat(t.netAmount || t.amount), 0),
      pendingAmount: pending.reduce((s, t) => s + parseFloat(t.amount), 0),
      completedCount: completed.length,
      pendingCount: pending.length,
    };
  }, [filtered]);

  const statusIcon = (s: string) => {
    switch (s) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">View payouts and order-related transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.completedAmount.toString())}</p>
            </div>
            <Wallet className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount.toString())}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{stats.completedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input placeholder="Search Tx Ref" value={search} onChange={(e)=>setSearch(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="advance_payment">Advance</SelectItem>
              <SelectItem value="final_payment">Final</SelectItem>
              <SelectItem value="full_payment">Full</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground py-8">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">{tx.transactionRef}</TableCell>
                    <TableCell><Badge variant="outline">{tx.transactionType.replace('_',' ')}</Badge></TableCell>
                    <TableCell className="font-semibold">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">{statusIcon(tx.status)}<Badge variant="secondary">{tx.status}</Badge></div>
                    </TableCell>
                    <TableCell>{format(new Date(tx.createdAt), 'MMM dd, yyyy')}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No transactions</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
