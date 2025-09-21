import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Search, Filter, Users, Send, Eye, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { authenticatedApiClient } from '@/lib/supabase';
import { RFQ_STATUS_COLORS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export default function AdminRFQManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rfqs = [], isLoading: rfqsLoading } = useQuery({
    queryKey: ['/api/protected/rfqs'],
    queryFn: () => authenticatedApiClient.get('/api/protected/rfqs'),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/protected/admin/suppliers'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/suppliers'),
  });

  const inviteSuppliersMutation = useMutation({
    mutationFn: (data: { rfqId: string; supplierIds: string[] }) =>
      authenticatedApiClient.post('/api/protected/admin/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/rfqs'] });
      setShowInviteDialog(false);
      setSelectedSuppliers([]);
      setSelectedRFQ(null);
      toast({
        title: "Invitations sent successfully",
        description: "Suppliers have been notified about the RFQ.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitations",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredRFQs = rfqs.filter((rfq: any) => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInviteSuppliers = () => {
    if (!selectedRFQ || selectedSuppliers.length === 0) return;

    inviteSuppliersMutation.mutate({
      rfqId: selectedRFQ.id,
      supplierIds: selectedSuppliers,
    });
  };

  const getMatchingSuppliers = (rfq: any) => {
    // Simple matching based on capabilities
    const rfqProcess = rfq.details?.sku?.processName?.toLowerCase() || '';
    return suppliers.filter((supplier: any) => {
      const capabilities = supplier.profile?.capabilities || [];
      return capabilities.some((cap: string) => 
        cap.toLowerCase().includes(rfqProcess.split(' ')[0]) // Simple matching
      );
    });
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'invited', label: 'Suppliers Invited' },
    { value: 'offers_published', label: 'Offers Published' },
    { value: 'accepted', label: 'Accepted' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">RFQ Management</h1>
        <p className="text-muted-foreground mt-2">Review, match suppliers, and manage RFQs</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search RFQs by title or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-rfqs"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" data-testid="button-filter">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RFQ List */}
      <Card>
        <CardHeader>
          <CardTitle>All RFQs ({filteredRFQs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rfqsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading RFQs...</div>
          ) : filteredRFQs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No RFQs found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">RFQ ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Buyer</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Process</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRFQs.map((rfq: any) => (
                    <tr key={rfq.id} data-testid={`row-rfq-${rfq.id}`}>
                      <td className="py-4 px-6 text-sm font-mono" data-testid={`text-rfq-number-${rfq.id}`}>
                        {rfq.rfqNumber}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium" data-testid={`text-rfq-title-${rfq.id}`}>
                        {rfq.title}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {rfq.buyerId ? `Buyer-${rfq.buyerId.slice(-6)}` : 'Unknown'}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {rfq.details?.sku?.processName || 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={RFQ_STATUS_COLORS[rfq.status || 'draft'] || RFQ_STATUS_COLORS.draft}>
                          {(rfq.status || 'draft').replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(rfq.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/admin/rfq/${rfq.id}`)}
                            data-testid={`button-view-rfq-${rfq.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {rfq.status === 'submitted' || rfq.status === 'under_review' ? (
                            <Dialog open={showInviteDialog && selectedRFQ?.id === rfq.id} onOpenChange={setShowInviteDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedRFQ(rfq)}
                                  data-testid={`button-invite-suppliers-${rfq.id}`}
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  Invite Suppliers
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Invite Suppliers for {rfq.rfqNumber}</DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div className="bg-muted/50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2">RFQ Details</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Process:</span> {rfq.details?.sku?.processName}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Quantity:</span> {rfq.details?.items?.[0]?.quantity} {rfq.details?.items?.[0]?.unit}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Material:</span> {rfq.details?.items?.[0]?.material}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Priority:</span> {rfq.details?.items?.[0]?.priority}
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold mb-3">Matching Suppliers ({getMatchingSuppliers(rfq).length})</h3>
                                    <div className="max-h-64 overflow-y-auto space-y-2">
                                      {getMatchingSuppliers(rfq).map((supplier: any) => (
                                        <div
                                          key={supplier.user.id}
                                          className="flex items-center space-x-3 p-3 border rounded-lg"
                                          data-testid={`card-supplier-${supplier.user.id}`}
                                        >
                                          <Checkbox
                                            checked={selectedSuppliers.includes(supplier.user.id)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setSelectedSuppliers([...selectedSuppliers, supplier.user.id]);
                                              } else {
                                                setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.user.id));
                                              }
                                            }}
                                            data-testid={`checkbox-supplier-${supplier.user.id}`}
                                          />
                                          <div className="flex-1">
                                            <p className="font-medium">{supplier.company.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                              {supplier.profile?.capabilities?.slice(0, 3).join(', ')}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <Badge variant="secondary">
                                                {supplier.profile?.verifiedStatus || 'Unverified'}
                                              </Badge>
                                              <span className="text-xs text-muted-foreground">
                                                MOQ: {supplier.profile?.moqDefault || 'N/A'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setShowInviteDialog(false)}
                                      data-testid="button-cancel-invite"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleInviteSuppliers}
                                      disabled={selectedSuppliers.length === 0 || inviteSuppliersMutation.isPending}
                                      data-testid="button-send-invites"
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      {inviteSuppliersMutation.isPending 
                                        ? 'Sending...' 
                                        : `Send Invites (${selectedSuppliers.length})`}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`button-more-actions-${rfq.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>View Quotes</DropdownMenuItem>
                                <DropdownMenuItem>Compose Offers</DropdownMenuItem>
                                <DropdownMenuItem>Update Status</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
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
