import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { authenticatedApiClient } from '@/lib/supabase';

export default function AdminLogisticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/protected/admin/logistics'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/logistics')
  });

  return (
    <div className="p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Buyer Logistics Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading...</p>}
          {error && <p className="text-red-500">Failed to load logistics requests</p>}
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Buyer</th>
                    <th className="py-2 pr-4">Source</th>
                    <th className="py-2 pr-4">Destination</th>
                    <th className="py-2 pr-4">Weight (kg)</th>
                    <th className="py-2 pr-4">Size</th>
                    <th className="py-2 pr-4">Pickup Date</th>
                    <th className="py-2 pr-4">Insurance</th>
                    <th className="py-2 pr-4">Notes</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(data || []).map((row: any) => (
                    <tr key={row.id} className="border-b">
                      <td className="py-2 pr-4">{row.buyer?.name || row.buyer?.email || row.buyerId}</td>
                      <td className="py-2 pr-4">{row.source}</td>
                      <td className="py-2 pr-4">{row.destination}</td>
                      <td className="py-2 pr-4">{row.weightKg}</td>
                      <td className="py-2 pr-4">{row.size}</td>
                      <td className="py-2 pr-4">{row.pickupDate ? new Date(row.pickupDate).toLocaleDateString() : '-'}</td>
                      <td className="py-2 pr-4">{row.insuranceRequired ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-4">{row.notes || '-'}</td>
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
