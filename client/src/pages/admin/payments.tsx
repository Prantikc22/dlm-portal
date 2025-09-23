import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authenticatedApiClient } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  fees: string;
  currency: string;
  status: 'pending'|'processing'|'completed'|'failed'|'cancelled'|'refunded';
  transactionType: 'advance_payment'|'final_payment'|'full_payment'|'refund'|'commission';
  createdAt: string;
}

export default function AdminPayments() {
  const [status, setStatus] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['/api/protected/admin/payment-transactions'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/payment-transactions'),
  });

  const filtered = useMemo(() => {
    return (txs as PaymentTx[]).filter(tx => {
      const matchesStatus = status === 'all' || tx.status === status;
      const matchesType = type === 'all' || tx.transactionType === type;
      const matchesSearch = !search || tx.transactionRef.toLowerCase().includes(search.toLowerCase());
      const withinFrom = !from || new Date(tx.createdAt) >= new Date(from);
      const withinTo = !to || new Date(tx.createdAt) <= new Date(to);
      return matchesStatus && matchesType && matchesSearch && withinFrom && withinTo;
    });
  }, [txs, status, type, search, from, to]);

  const totals = useMemo(() => {
    const completed = filtered.filter(t => t.status === 'completed');
    const pending = filtered.filter(t => t.status === 'pending');
    return {
      volume: completed.reduce((s, t) => s + parseFloat(t.netAmount || t.amount), 0),
      fees: filtered.reduce((s, t) => s + parseFloat(t.fees || '0'), 0),
      pending: pending.reduce((s, t) => s + parseFloat(t.amount), 0),
      count: filtered.length,
    };
  }, [filtered]);

  const exportCsv = () => {
    const rows = [
      ['transactionRef','type','amount','netAmount','fees','status','createdAt'],
      ...filtered.map(t => [t.transactionRef, t.transactionType, t.amount, t.netAmount, t.fees, t.status, t.createdAt])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments (Admin)</h1>
          <p className="text-muted-foreground">All platform transactions</p>
        </div>
        <Button onClick={exportCsv}><Download className="h-4 w-4 mr-1"/>Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">Completed Volume</div><div className="text-2xl font-bold">{formatCurrency(totals.volume.toString())}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">Pending Amount</div><div className="text-2xl font-bold">{formatCurrency(totals.pending.toString())}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm text-muted-foreground">Transactions</div><div className="text-2xl font-bold">{totals.count}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-4 w-4"/> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input placeholder="Search Tx Ref" value={search} onChange={(e)=>setSearch(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Type"/></SelectTrigger>
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
        <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
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
                  <TableHead>Net</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm">{t.transactionRef}</TableCell>
                    <TableCell><Badge variant="outline">{t.transactionType.replace('_',' ')}</Badge></TableCell>
                    <TableCell className="font-semibold">{formatCurrency(t.amount)}</TableCell>
                    <TableCell>{formatCurrency(t.netAmount)}</TableCell>
                    <TableCell>{formatCurrency(t.fees || '0')}</TableCell>
                    <TableCell><Badge variant="secondary">{t.status}</Badge></TableCell>
                    <TableCell>{format(new Date(t.createdAt), 'MMM dd, yyyy')}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">No transactions</TableCell>
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
