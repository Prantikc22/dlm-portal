import { useQuery } from '@tanstack/react-query';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authenticatedApiClient } from '@/lib/supabase';
import { RFQ } from '@shared/schema';
import { RFQ_STATUS_COLORS } from '@/lib/constants';
import { useLocation } from 'wouter';

export default function BuyerRFQs() {
  const [, setLocation] = useLocation();

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['/api/protected/rfqs'],
    queryFn: () => authenticatedApiClient.get('/api/protected/rfqs') as Promise<RFQ[]>,
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My RFQs</h1>
          <p className="text-muted-foreground mt-2">Track and manage your requests for quotation</p>
        </div>
        <Button onClick={() => setLocation('/buyer/create-rfq')} data-testid="button-create-rfq">
          <Plus className="h-4 w-4 mr-2" />
          Create RFQ
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading RFQs...</div>
          ) : rfqs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No RFQs yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first RFQ to start getting quotes from verified suppliers
              </p>
              <Button onClick={() => setLocation('/buyer/create-rfq')} data-testid="button-create-first-rfq">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First RFQ
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">RFQ Number</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rfqs.map((rfq) => (
                    <tr key={rfq.id} data-testid={`row-rfq-${rfq.id}`}>
                      <td className="py-4 px-6 text-sm font-mono" data-testid={`text-rfq-number-${rfq.id}`}>
                        {rfq.rfqNumber}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium" data-testid={`text-rfq-title-${rfq.id}`}>
                        {rfq.title}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${RFQ_STATUS_COLORS[rfq.status || 'draft'] || RFQ_STATUS_COLORS.draft}`}>
                          {(rfq.status || 'draft').replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(rfq.createdAt!).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <Button variant="ghost" size="sm" data-testid={`button-view-rfq-${rfq.id}`}>
                          View Details
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
