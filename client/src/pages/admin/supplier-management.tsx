import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Building2, Award, FileCheck, Eye, MoreHorizontal, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authenticatedApiClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function AdminSupplierManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['/api/protected/admin/suppliers'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/suppliers'),
  });

  const updateSupplierStatusMutation = useMutation({
    mutationFn: (data: { supplierId: string; status: string }) =>
      authenticatedApiClient.post('/api/protected/admin/supplier-status', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/suppliers'] });
      toast({
        title: "Supplier status updated",
        description: "The supplier verification status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredSuppliers = suppliers.filter((supplier: any) => {
    const matchesSearch = supplier.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || supplier.profile?.verifiedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'gold':
      case 'silver':
      case 'bronze':
        return CheckCircle;
      case 'unverified':
        return XCircle;
      default:
        return Clock;
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'unverified', label: 'Unverified' },
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
  ];

  const handleStatusUpdate = (supplierId: string, newStatus: string) => {
    updateSupplierStatusMutation.mutate({ supplierId, status: newStatus });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Supplier Management</h1>
        <p className="text-muted-foreground mt-2">Verify suppliers, manage capabilities, and track performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-unverified-count">
                  {suppliers.filter((s: any) => s.profile?.verifiedStatus === 'unverified').length}
                </p>
                <p className="text-sm text-muted-foreground">Unverified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-bronze-count">
                  {suppliers.filter((s: any) => s.profile?.verifiedStatus === 'bronze').length}
                </p>
                <p className="text-sm text-muted-foreground">Bronze</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Award className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-silver-count">
                  {suppliers.filter((s: any) => s.profile?.verifiedStatus === 'silver').length}
                </p>
                <p className="text-sm text-muted-foreground">Silver</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-gold-count">
                  {suppliers.filter((s: any) => s.profile?.verifiedStatus === 'gold').length}
                </p>
                <p className="text-sm text-muted-foreground">Gold</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search suppliers by company name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-suppliers"
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

      {/* Supplier List */}
      <Card>
        <CardHeader>
          <CardTitle>All Suppliers ({filteredSuppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Company</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Capabilities</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Location</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSuppliers.map((supplier: any) => {
                    const StatusIcon = getStatusIcon(supplier.profile?.verifiedStatus || 'unverified');
                    return (
                      <tr key={supplier.user.id} data-testid={`row-supplier-${supplier.user.id}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium" data-testid={`text-company-name-${supplier.user.id}`}>
                                {supplier.company.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {supplier.company.gstin ? `GSTIN: ${supplier.company.gstin}` : 'No GSTIN'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <div>
                            <p className="font-medium">{supplier.user.name || 'N/A'}</p>
                            <p className="text-muted-foreground">{supplier.user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <div className="flex flex-wrap gap-1 max-w-48">
                            {(supplier.profile?.capabilities || []).slice(0, 3).map((cap: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                            {(supplier.profile?.capabilities || []).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(supplier.profile?.capabilities || []).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge className={getStatusColor(supplier.profile?.verifiedStatus || 'unverified')}>
                              {(supplier.profile?.verifiedStatus || 'unverified').toUpperCase()}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          {supplier.company.city ? `${supplier.company.city}, ${supplier.company.state}` : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-muted-foreground">
                          {new Date(supplier.user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Dialog open={showDetailsDialog && selectedSupplier?.user.id === supplier.user.id} onOpenChange={setShowDetailsDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedSupplier(supplier)}
                                  data-testid={`button-view-supplier-${supplier.user.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>{supplier.company.name} - Supplier Details</DialogTitle>
                                </DialogHeader>
                                
                                <Tabs defaultValue="profile" className="w-full">
                                  <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="profile">Profile</TabsTrigger>
                                    <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                                    <TabsTrigger value="documents">Documents</TabsTrigger>
                                    <TabsTrigger value="performance">Performance</TabsTrigger>
                                  </TabsList>
                                  
                                  <TabsContent value="profile" className="space-y-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg">Company Information</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm font-medium">Company Name</p>
                                            <p className="text-sm text-muted-foreground">{supplier.company.name}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">GSTIN</p>
                                            <p className="text-sm text-muted-foreground">{supplier.company.gstin || 'Not provided'}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">PAN</p>
                                            <p className="text-sm text-muted-foreground">{supplier.company.pan || 'Not provided'}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Location</p>
                                            <p className="text-sm text-muted-foreground">
                                              {supplier.company.city}, {supplier.company.state}
                                            </p>
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Address</p>
                                          <p className="text-sm text-muted-foreground">
                                            {supplier.company.address?.street || 'Not provided'}
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg">Contact Information</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm font-medium">Contact Person</p>
                                            <p className="text-sm text-muted-foreground">{supplier.user.name || 'Not provided'}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Email</p>
                                            <p className="text-sm text-muted-foreground">{supplier.user.email}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Phone</p>
                                            <p className="text-sm text-muted-foreground">{supplier.user.phone || 'Not provided'}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Status</p>
                                            <Badge className={getStatusColor(supplier.profile?.verifiedStatus || 'unverified')}>
                                              {(supplier.profile?.verifiedStatus || 'unverified').toUpperCase()}
                                            </Badge>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </TabsContent>
                                  
                                  <TabsContent value="capabilities" className="space-y-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg">Manufacturing Capabilities</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="grid grid-cols-3 gap-2">
                                          {(supplier.profile?.capabilities || []).map((capability: string, index: number) => (
                                            <Badge key={index} variant="secondary">
                                              {capability}
                                            </Badge>
                                          ))}
                                        </div>
                                        {(!supplier.profile?.capabilities || supplier.profile.capabilities.length === 0) && (
                                          <p className="text-muted-foreground">No capabilities specified</p>
                                        )}
                                      </CardContent>
                                    </Card>
                                    
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg">Certifications</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="grid grid-cols-3 gap-2">
                                          {(supplier.profile?.certifications || []).map((cert: string, index: number) => (
                                            <Badge key={index} variant="outline">
                                              {cert}
                                            </Badge>
                                          ))}
                                        </div>
                                        {(!supplier.profile?.certifications || supplier.profile.certifications.length === 0) && (
                                          <p className="text-muted-foreground">No certifications specified</p>
                                        )}
                                      </CardContent>
                                    </Card>
                                    
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg">Production Details</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm font-medium">Default MOQ</p>
                                            <p className="text-sm text-muted-foreground">
                                              {supplier.profile?.moqDefault || 'Not specified'}
                                            </p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </TabsContent>
                                  
                                  <TabsContent value="documents" className="space-y-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg">Uploaded Documents</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center space-x-3">
                                              <FileCheck className="h-5 w-5 text-green-600" />
                                              <div>
                                                <p className="font-medium">Company Registration</p>
                                                <p className="text-sm text-muted-foreground">Uploaded 2 weeks ago</p>
                                              </div>
                                            </div>
                                            <Button variant="outline" size="sm">View</Button>
                                          </div>
                                          
                                          <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center space-x-3">
                                              <FileCheck className="h-5 w-5 text-green-600" />
                                              <div>
                                                <p className="font-medium">GST Certificate</p>
                                                <p className="text-sm text-muted-foreground">Uploaded 2 weeks ago</p>
                                              </div>
                                            </div>
                                            <Button variant="outline" size="sm">View</Button>
                                          </div>
                                          
                                          <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center space-x-3">
                                              <FileCheck className="h-5 w-5 text-blue-600" />
                                              <div>
                                                <p className="font-medium">ISO 9001:2015 Certificate</p>
                                                <p className="text-sm text-muted-foreground">Uploaded 1 week ago</p>
                                              </div>
                                            </div>
                                            <Button variant="outline" size="sm">View</Button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </TabsContent>
                                  
                                  <TabsContent value="performance" className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                      <Card>
                                        <CardContent className="p-6 text-center">
                                          <p className="text-2xl font-bold text-foreground">23</p>
                                          <p className="text-sm text-muted-foreground">Total Quotes</p>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="p-6 text-center">
                                          <p className="text-2xl font-bold text-foreground">8</p>
                                          <p className="text-sm text-muted-foreground">Orders Won</p>
                                        </CardContent>
                                      </Card>
                                      <Card>
                                        <CardContent className="p-6 text-center">
                                          <p className="text-2xl font-bold text-foreground">95%</p>
                                          <p className="text-sm text-muted-foreground">On-time Delivery</p>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                                
                                <div className="flex justify-end space-x-2 pt-4 border-t">
                                  <Select
                                    value={supplier.profile?.verifiedStatus || 'unverified'}
                                    onValueChange={(value) => handleStatusUpdate(supplier.user.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unverified">Unverified</SelectItem>
                                      <SelectItem value="bronze">Bronze</SelectItem>
                                      <SelectItem value="silver">Silver</SelectItem>
                                      <SelectItem value="gold">Gold</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                                    Close
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`button-more-actions-${supplier.user.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(supplier.user.id, 'bronze')}>
                                  Set to Bronze
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(supplier.user.id, 'silver')}>
                                  Set to Silver
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(supplier.user.id, 'gold')}>
                                  Set to Gold
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(supplier.user.id, 'unverified')}>
                                  Set to Unverified
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
