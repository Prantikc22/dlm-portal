import { useParams } from 'wouter';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, Download, Calendar, Users, Package, UserCheck } from 'lucide-react';
import { authenticatedApiClient } from '@/lib/supabase';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function AdminRFQDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rfq, isLoading } = useQuery({
    queryKey: [`/api/protected/rfqs/${id}`],
    queryFn: () => authenticatedApiClient.get(`/api/protected/rfqs/${id}`),
    enabled: !!id,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/protected/admin/suppliers'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/suppliers'),
  });

  const inviteSuppliersMutation = useMutation({
    mutationFn: (supplierIds: string[]) => 
      authenticatedApiClient.post('/api/protected/admin/invite-suppliers', {
        rfqId: id,
        supplierIds
      }),
    onSuccess: () => {
      toast({
        title: "Suppliers Invited",
        description: "Selected suppliers have been invited to quote on this RFQ.",
      });
      setShowInviteDialog(false);
      setSelectedSuppliers([]);
      queryClient.invalidateQueries({ queryKey: [`/api/protected/rfqs/${id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Invite Suppliers",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => 
      authenticatedApiClient.patch(`/api/protected/rfqs/${id}/status`, { status }),
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "RFQ status has been updated successfully.",
      });
      setShowStatusDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/protected/rfqs/${id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Status",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading RFQ details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">RFQ Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested RFQ could not be found.</p>
          <Button onClick={() => setLocation('/admin/rfqs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFQ Management
          </Button>
        </div>
      </div>
    );
  }

  const handleDownloadFile = (file: any) => {
    try {
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleInviteSuppliers = () => {
    if (selectedSuppliers.length === 0) {
      toast({
        title: "No Suppliers Selected",
        description: "Please select at least one supplier to invite.",
        variant: "destructive",
      });
      return;
    }
    inviteSuppliersMutation.mutate(selectedSuppliers);
  };

  const handleUpdateStatus = () => {
    if (!newStatus) {
      toast({
        title: "No Status Selected",
        description: "Please select a status to update.",
        variant: "destructive",
      });
      return;
    }
    updateStatusMutation.mutate(newStatus);
  };

  const verifiedSuppliers = suppliers.filter((s: any) => 
    s.verificationLevel && ['bronze', 'silver', 'gold'].includes(s.verificationLevel)
  );

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin/rfqs')}
              data-testid="button-back-to-rfqs"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to RFQ Management
            </Button>
            <div>
              <h1 className="text-3xl font-bold" data-testid="heading-rfq-title">{rfq.title}</h1>
              <p className="text-muted-foreground" data-testid="text-rfq-number">{rfq.rfqNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              className={`px-3 py-1 ${
                rfq.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                rfq.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                rfq.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                rfq.status === 'quoted' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}
              data-testid="badge-rfq-status"
            >
              {(rfq.status || 'draft').replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          {(rfq.status === 'submitted' || rfq.status === 'under_review') && (
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-invite-suppliers">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Suppliers
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Invite Suppliers to Quote</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select verified suppliers to invite for this RFQ:
                  </p>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {verifiedSuppliers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No verified suppliers available
                      </p>
                    ) : (
                      verifiedSuppliers.map((supplier: any) => (
                        <div
                          key={supplier.user.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            id={supplier.user.id}
                            checked={selectedSuppliers.includes(supplier.user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSuppliers([...selectedSuppliers, supplier.user.id]);
                              } else {
                                setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.user.id));
                              }
                            }}
                            className="h-4 w-4"
                            data-testid={`checkbox-supplier-${supplier.user.id}`}
                          />
                          <label htmlFor={supplier.user.id} className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-medium">{supplier.companyName}</p>
                              <p className="text-sm text-muted-foreground">{supplier.user.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <UserCheck className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-green-600">
                                  {supplier.verificationLevel?.charAt(0).toUpperCase() + supplier.verificationLevel?.slice(1) || 'Verified'}
                                </span>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))
                    )}
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
                      data-testid="button-confirm-invite"
                    >
                      {inviteSuppliersMutation.isPending ? 'Inviting...' : `Invite ${selectedSuppliers.length} Supplier${selectedSuppliers.length !== 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-update-status">
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update RFQ Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">New Status</Label>
                  <Select onValueChange={setNewStatus} value={newStatus}>
                    <SelectTrigger data-testid="select-new-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusDialog(false)}
                    data-testid="button-cancel-status"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={!newStatus || updateStatusMutation.isPending}
                    data-testid="button-confirm-status"
                  >
                    {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="font-medium" data-testid="text-industry">
                      {rfq.details?.industry?.replace('_', ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Process</p>
                    <p className="font-medium" data-testid="text-process">
                      {rfq.details?.sku?.processName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium" data-testid="text-quantity">
                      {rfq.details?.items?.[0]?.quantity} {rfq.details?.items?.[0]?.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize" data-testid="text-priority">
                      {rfq.details?.items?.[0]?.priority || 'Standard'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Buyer</p>
                    <p className="font-medium" data-testid="text-buyer">
                      {rfq.buyerId ? `Buyer-${rfq.buyerId.slice(-6)}` : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            {rfq.details?.items?.[0] && (
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rfq.details.items[0].material && (
                      <div>
                        <p className="text-sm text-muted-foreground">Material</p>
                        <p className="font-medium" data-testid="text-material">{rfq.details.items[0].material}</p>
                      </div>
                    )}
                    {rfq.details.items[0].tolerance && (
                      <div>
                        <p className="text-sm text-muted-foreground">Tolerance</p>
                        <p className="font-medium" data-testid="text-tolerance">{rfq.details.items[0].tolerance}</p>
                      </div>
                    )}
                  </div>
                  {rfq.details.items[0].specialRequirements && (
                    <div>
                      <p className="text-sm text-muted-foreground">Special Requirements</p>
                      <p className="font-medium" data-testid="text-special-requirements">
                        {rfq.details.items[0].specialRequirements}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Files */}
            {rfq.details?.files && rfq.details.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Attached Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rfq.details.files.map((file: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`file-${index}`}
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                          data-testid={`button-download-file-${index}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium" data-testid="text-created-date">
                    {new Date(rfq.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {rfq.details?.items?.[0]?.targetDeliveryDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Target Delivery</p>
                    <p className="font-medium" data-testid="text-target-delivery">
                      {new Date(rfq.details.items[0].targetDeliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Information */}
            {rfq.budgetRange && (
              <Card>
                <CardHeader>
                  <CardTitle>Budget Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary" data-testid="text-budget-range">
                      ₹{rfq.budgetRange.min?.toLocaleString()} - ₹{rfq.budgetRange.max?.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Options */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rfq.ndaRequired && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>NDA Required</span>
                  </div>
                )}
                {rfq.confidential && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Confidential RFQ</span>
                  </div>
                )}
                {rfq.details?.items?.[0]?.toolingRequired && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Tooling Required</span>
                  </div>
                )}
                {rfq.details?.items?.[0]?.sampleRequired && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Sample Required</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}