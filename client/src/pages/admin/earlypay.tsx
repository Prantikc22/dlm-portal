import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { authenticatedApiClient } from '@/lib/supabase';

export default function AdminEarlyPayPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/protected/admin/earlypay'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/earlypay')
  });

  return (
    <div className="p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Supplier EarlyPay Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading...</p>}
          {error && <p className="text-red-500">Failed to load EarlyPay requests</p>}
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Supplier</th>
                    <th className="py-2 pr-4">Invoice</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Currency</th>
                    <th className="py-2 pr-4">Delivered</th>
                    <th className="py-2 pr-4">Buyer Approved</th>
                    <th className="py-2 pr-4">Expected Days</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(data || []).map((row: any) => (
                    <tr key={row.id} className="border-b">
                      <td className="py-2 pr-4">{row.supplier?.name || row.supplier?.email || row.supplierId}</td>
                      <td className="py-2 pr-4">{row.invoiceNumber}</td>
                      <td className="py-2 pr-4">{row.amount}</td>
                      <td className="py-2 pr-4">{row.currency}</td>
                      <td className="py-2 pr-4">{row.deliveredConfirmed ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-4">{row.buyerInvoiceApproved ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-4">{row.expectedDays ?? '-'}</td>
                      <td className="py-2 pr-4">{row.status}</td>
                      <td className="py-2 pr-4">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</td>
                      <td className="py-2 pr-4">{row.notes || '-'}</td>
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
