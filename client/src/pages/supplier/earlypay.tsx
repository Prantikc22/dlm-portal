import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { authenticatedApiClient } from '@/lib/supabase';

export default function SupplierEarlyPayPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invoiceNumber: '',
    amount: '',
    currency: 'INR',
    orderId: '',
    deliveredConfirmed: false,
    buyerInvoiceApproved: false,
    expectedDays: '5',
    notes: '',
  });

  const listQuery = useQuery({
    queryKey: ['/api/protected/supplier/earlypay'],
    queryFn: () => authenticatedApiClient.get('/api/protected/supplier/earlypay')
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = async () => {
    if (!form.invoiceNumber || !form.amount) {
      toast({ title: 'Missing fields', description: 'Invoice number and amount are required.', variant: 'destructive' });
      return;
    }
    // Guard: Only allow submit if delivered and approved are ticked (per business rule)
    if (!form.deliveredConfirmed || !form.buyerInvoiceApproved) {
      toast({ title: 'Condition not met', description: 'Product must be delivered and invoice approved by buyer.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await authenticatedApiClient.post('/api/protected/supplier/earlypay', {
        invoiceNumber: form.invoiceNumber,
        amount: parseFloat(form.amount),
        currency: form.currency,
        orderId: form.orderId || undefined,
        deliveredConfirmed: form.deliveredConfirmed,
        buyerInvoiceApproved: form.buyerInvoiceApproved,
        expectedDays: form.expectedDays ? parseInt(form.expectedDays, 10) : undefined,
        notes: form.notes || undefined,
      });
      toast({ title: 'EarlyPay requested', description: 'Your EarlyPay request has been submitted.' });
      setForm({ invoiceNumber: '', amount: '', currency: 'INR', orderId: '', deliveredConfirmed: false, buyerInvoiceApproved: false, expectedDays: '5', notes: '' });
      listQuery.refetch();
    } catch (e: any) {
      toast({ title: 'Submission failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const amountNum = parseFloat(form.amount || '0') || 0;
  const discount = amountNum * 0.03;
  const netPayout = amountNum - discount;

  return (
    <div className="p-8 space-y-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-xl p-6 bg-gradient-to-r from-sky-600 to-violet-600 text-white shadow">
          <div className="flex items-center gap-3">
            <i className="fas fa-bolt text-2xl"></i>
            <h1 className="text-2xl font-semibold">Logicwerk EarlyPay</h1>
          </div>
          <p className="mt-1 text-white/90">Accelerated payout in ~3 days with a 3% discount applied.</p>
        </div>
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Logicwerk EarlyPay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-md text-sm">
            <p className="font-medium mb-1">Eligibility</p>
            <p className="mb-2">EarlyPay is available only when <strong>Product Delivered</strong> and <strong>Invoice Approved by Buyer</strong> are both true.</p>
            <p className="font-medium mb-1">Advantage</p>
            <p>Get paid in approximately <strong>3 days</strong>. A <strong>3% discount</strong> is applied to the invoice amount.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 bg-card">
              <p className="text-sm text-muted-foreground">Invoice Amount</p>
              <p className="text-xl font-semibold">{form.currency || 'INR'} {isNaN(amountNum) ? '-' : amountNum.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border p-4 bg-card">
              <p className="text-sm text-muted-foreground">Discount (3%)</p>
              <p className="text-xl font-semibold text-amber-600">{form.currency || 'INR'} {isNaN(discount) ? '-' : discount.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border p-4 bg-card">
              <p className="text-sm text-muted-foreground">Estimated Payout (~3 days)</p>
              <p className="text-xl font-semibold text-emerald-600">{form.currency || 'INR'} {isNaN(netPayout) ? '-' : netPayout.toFixed(2)}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <Input name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} placeholder="INV-12345" />
            </div>
            <div>
              <Label>Amount</Label>
              <Input name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} placeholder="e.g., 250000" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Currency</Label>
              <Input name="currency" value={form.currency} onChange={handleChange} placeholder="INR" />
            </div>
            <div>
              <Label>Order ID (optional)</Label>
              <Input name="orderId" value={form.orderId} onChange={handleChange} placeholder="Order UUID" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox id="delivered" checked={form.deliveredConfirmed} onCheckedChange={(v) => setForm(prev => ({ ...prev, deliveredConfirmed: Boolean(v) }))} />
              <Label htmlFor="delivered">Product Delivered</Label>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox id="approved" checked={form.buyerInvoiceApproved} onCheckedChange={(v) => setForm(prev => ({ ...prev, buyerInvoiceApproved: Boolean(v) }))} />
              <Label htmlFor="approved">Invoice Approved by Buyer</Label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Expected Days (2–5)</Label>
              <Input name="expectedDays" type="number" min={2} max={5} value={form.expectedDays} onChange={handleChange} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any details regarding this request" />
            </div>
          </div>
          <Button onClick={submit} disabled={loading || !form.deliveredConfirmed || !form.buyerInvoiceApproved}>
            {loading ? 'Submitting...' : 'Request EarlyPay'}
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>My EarlyPay Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading && <p>Loading...</p>}
          {listQuery.error && <p className="text-red-500">Failed to load EarlyPay requests</p>}
          {!listQuery.isLoading && !listQuery.error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Invoice</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Currency</th>
                    <th className="py-2 pr-4">Delivered</th>
                    <th className="py-2 pr-4">Buyer Approved</th>
                    <th className="py-2 pr-4">Expected Days</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(listQuery.data || []).map((row: any) => (
                    <tr key={row.id} className="border-b">
                      <td className="py-2 pr-4">{row.invoiceNumber}</td>
                      <td className="py-2 pr-4">{row.amount}</td>
                      <td className="py-2 pr-4">{row.currency}</td>
                      <td className="py-2 pr-4">{row.deliveredConfirmed ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-4">{row.buyerInvoiceApproved ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-4">{row.expectedDays ?? '-'}</td>
                      <td className="py-2 pr-4">{row.status}</td>
                      <td className="py-2 pr-4">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</td>
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
