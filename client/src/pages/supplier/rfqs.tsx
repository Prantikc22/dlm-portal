import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, Package, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authenticatedApiClient } from '@/lib/supabase';
import { useLocation } from 'wouter';

export default function SupplierRFQs() {
  const [, setLocation] = useLocation();

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ['/api/protected/suppliers/invites'],
    queryFn: () => authenticatedApiClient.get('/api/protected/suppliers/invites'),
  });

  const pendingInvites = invites.filter((invite: any) => invite.invite.status === 'invited');
  const respondedInvites = invites.filter((invite: any) => invite.invite.status === 'responded');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Invited RFQs</h1>
        <p className="text-muted-foreground mt-2">Review and respond to RFQ invitations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-pending-count">
                  {pendingInvites.length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-responded-count">
                  {respondedInvites.length}
                </p>
                <p className="text-sm text-muted-foreground">Quotes Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-count">
                  {invites.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Invitations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending RFQs */}
      {pendingInvites.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">
              <Clock className="h-5 w-5 inline mr-2" />
              Pending Responses ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvites.map((invite: any) => (
                <div
                  key={invite.invite.id}
                  className="border border-red-200 rounded-lg p-4 bg-red-50"
                  data-testid={`card-pending-invite-${invite.invite.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-foreground" data-testid={`text-rfq-title-${invite.invite.id}`}>
                          {invite.rfq.rfqNumber} - {invite.rfq.title}
                        </h3>
                        <Badge className="bg-red-100 text-red-800">
                          Urgent
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Process</p>
                          <p className="font-medium">{invite.rfq.details?.sku?.processName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">
                            {invite.rfq.details?.items?.[0]?.quantity || 'N/A'} {invite.rfq.details?.items?.[0]?.unit || ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Material</p>
                          <p className="font-medium">{invite.rfq.details?.items?.[0]?.material || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Deadline</p>
                          <p className="font-medium text-red-600">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {invite.invite.responseDeadline ? new Date(invite.invite.responseDeadline).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/supplier/rfq/${invite.rfq.id}`)}
                        data-testid={`button-view-details-${invite.invite.id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setLocation('/supplier/quotes')}
                        data-testid={`button-submit-quote-${invite.invite.id}`}
                      >
                        Submit Quote
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All RFQs */}
      <Card>
        <CardHeader>
          <CardTitle>All RFQ Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading RFQs...</div>
          ) : invites.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No RFQ invitations yet</h3>
              <p className="text-muted-foreground mb-6">
                Complete your supplier profile to start receiving RFQ invitations from buyers
              </p>
              <Button onClick={() => setLocation('/supplier/onboarding')} data-testid="button-complete-profile">
                Complete Profile
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">RFQ ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Process</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Quantity</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Deadline</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invites.map((invite: any) => (
                    <tr key={invite.invite.id} data-testid={`row-invite-${invite.invite.id}`}>
                      <td className="py-4 px-6 text-sm font-mono" data-testid={`text-rfq-number-${invite.invite.id}`}>
                        {invite.rfq.rfqNumber}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium" data-testid={`text-rfq-title-${invite.invite.id}`}>
                        {invite.rfq.title}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {invite.rfq.details?.sku?.processName || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {invite.rfq.details?.items?.[0]?.quantity || 'N/A'} {invite.rfq.details?.items?.[0]?.unit || ''}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {invite.invite.responseDeadline ? new Date(invite.invite.responseDeadline).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          className={
                            invite.invite.status === 'invited'
                              ? 'bg-red-100 text-red-800'
                              : invite.invite.status === 'responded'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {invite.invite.status === 'invited' ? 'Quote Pending' : 
                           invite.invite.status === 'responded' ? 'Quote Submitted' : 
                           'Declined'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/supplier/rfq/${invite.rfq.id}`)}
                          data-testid={`button-view-rfq-${invite.invite.id}`}
                        >
                          View Details
                        </Button>
                        {invite.invite.status === 'invited' ? (
                          <Button
                            size="sm"
                            onClick={() => setLocation('/supplier/quotes')}
                            data-testid={`button-quote-${invite.invite.id}`}
                          >
                            Submit Quote
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation('/supplier/quotes')}
                            data-testid={`button-view-quote-${invite.invite.id}`}
                          >
                            View Quote
                          </Button>
                        )}
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
