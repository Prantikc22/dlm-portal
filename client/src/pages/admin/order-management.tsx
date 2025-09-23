import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Eye, Truck, Clock, CheckCircle, AlertCircle, RefreshCw, FilePlus2, Upload, Save, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { authenticatedApiClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  created: 'bg-yellow-100 text-yellow-800',
  deposit_paid: 'bg-emerald-100 text-emerald-800',
  confirmed: 'bg-blue-100 text-blue-800',
  production: 'bg-purple-100 text-purple-800',
  in_production: 'bg-purple-100 text-purple-800',
  quality_check: 'bg-orange-100 text-orange-800',
  shipped: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
} as const;

export default function AdminOrderManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateStage, setUpdateStage] = useState('Production Started');
  const [updateDetail, setUpdateDetail] = useState('');
  const [orderForDialog, setOrderForDialog] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/protected/admin/orders'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/orders'),
  });

  // Mutation: record advance payment
  const recordAdvanceMutation = useMutation({
    mutationFn: async (orderIdOrNumber: string) => {
      return authenticatedApiClient.post(`/api/protected/admin/orders/${orderIdOrNumber}/record-advance`, {});
    },
    onSuccess: () => {
      toast({ title: 'Advance Recorded', description: 'Paid amount has been registered.' });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/orders'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to record advance', description: error?.message || 'Please try again.', variant: 'destructive' });
    },
  });

  // Mutation: update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderIdOrNumber, status }: { orderIdOrNumber: string; status: string }) => {
      return authenticatedApiClient.put(`/api/protected/admin/orders/${orderIdOrNumber}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: 'Status Updated' });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/orders'] });
    },
    onError: (error: any) => toast({ title: 'Failed to update status', description: error?.message || '', variant: 'destructive' })
  });

  // Mutation: add production update
  const addUpdateMutation = useMutation({
    mutationFn: async ({ orderIdOrNumber, stage, detail }: { orderIdOrNumber: string; stage: string; detail: string }) => {
      return authenticatedApiClient.post(`/api/protected/admin/orders/${orderIdOrNumber}/updates`, { stage, detail });
    },
    onSuccess: () => {
      toast({ title: 'Update Added' });
      setShowUpdateDialog(false);
      setUpdateDetail('');
    },
    onError: (error: any) => toast({ title: 'Failed to add update', description: error?.message || '', variant: 'destructive' })
  });

  // Mutation: upload invoice
  const uploadInvoiceMutation = useMutation({
    mutationFn: async ({ orderIdOrNumber, fileName, fileData }: { orderIdOrNumber: string; fileName: string; fileData: string }) => {
      return authenticatedApiClient.post(`/api/protected/admin/orders/${orderIdOrNumber}/invoice`, { fileName, fileData });
    },
    onSuccess: () => {
      toast({ title: 'Invoice Uploaded' });
    },
    onError: (error: any) => toast({ title: 'Upload Failed', description: error?.message || '', variant: 'destructive' })
  });

  // Mutation: confirm order to supplier (moves to production)
  const confirmOrderMutation = useMutation({
    mutationFn: async (orderIdOrNumber: string) => {
      return authenticatedApiClient.post(`/api/protected/admin/orders/${orderIdOrNumber}/confirm`, {});
    },
    onSuccess: () => {
      toast({ title: 'Order Confirmed', description: 'Supplier has been notified.' });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/orders'] });
    },
    onError: (error: any) => {
      toast({ title: 'Confirmation Failed', description: error?.message || 'Unable to confirm order', variant: 'destructive' });
    },
  });

  // Mutation to recalculate order total
  const recalculateOrderMutation = useMutation({
    mutationFn: async (orderIdOrNumber: string) => {
      return authenticatedApiClient.post(`/api/protected/admin/orders/${orderIdOrNumber}/recalculate`, {});
    },
    onSuccess: (data, orderIdOrNumber) => {
      toast({
        title: "Order Recalculated",
        description: `Order total updated from ${data.previousAmount} to ${data.newAmount}`,
      });
      // Refresh orders list
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/orders'] });
    },
    onError: (error: any) => {
      toast({
        title: "Recalculation Failed",
        description: error.message || "Failed to recalculate order total",
        variant: "destructive",
      });
    },
  });

  const handleRecalculateOrder = (order: any) => {
    recalculateOrderMutation.mutate(order.orderNumber || order.id);
  };

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.buyerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_production', label: 'In Production' },
    { value: 'quality_check', label: 'Quality Check' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
        <p className="text-muted-foreground mt-2">Track and manage all orders across the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {orders.filter((o: any) => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">In Production</p>
                <p className="text-2xl font-bold">
                  {orders.filter((o: any) => o.status === 'in_production').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">
                  {orders.filter((o: any) => o.status === 'delivered').length}
                </p>
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
              <Input
                placeholder="Search by order number, buyer, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-orders"
              />
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Orders Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No orders match your current filters.' 
                  : 'No orders have been placed yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Order #</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Buyer</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Supplier</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Value</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Update</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Created</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-4 px-6 font-mono text-sm" data-testid={`text-order-number-${order.id}`}>
                        {order.orderNumber || order.id?.slice(-8)}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium">{order.buyerName || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{order.buyerEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium">{order.supplierName || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{order.supplierEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium">{order.productName || order.title || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {order.quantity || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-green-600">
                            {order.totalAmount ? formatCurrency(order.totalAmount) : 'N/A'}
                          </p>
                          {order.advancePayment && (
                            <p className="text-sm text-muted-foreground">
                              Advance: {formatCurrency(order.advancePayment)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Badge className={ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || ORDER_STATUS_COLORS.pending}>
                            {(order.status || 'pending').replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Select onValueChange={(val)=>updateStatusMutation.mutate({ orderIdOrNumber: order.orderNumber || order.id, status: val })}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="Set status"/></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="production">Production</SelectItem>
                              <SelectItem value="inspection">Inspection</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        {order.status === 'deposit_paid' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => confirmOrderMutation.mutate(order.orderNumber || order.id)}
                            disabled={confirmOrderMutation.isPending}
                            data-testid={`button-confirm-order-${order.id}`}
                            title="Confirm order and notify supplier"
                          >
                            {confirmOrderMutation.isPending ? 'Confirming…' : 'Confirm to Supplier'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRecalculateOrder(order)}
                          disabled={recalculateOrderMutation.isPending}
                          data-testid={`button-recalculate-order-${order.id}`}
                          title="Recalculate order total from offer details"
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${recalculateOrderMutation.isPending ? 'animate-spin' : ''}`} />
                          {recalculateOrderMutation.isPending ? 'Fixing...' : 'Fix Total'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setOrderForDialog(order); setShowUpdateDialog(true); }}
                          data-testid={`button-add-update-${order.id}`}
                          title="Add a production timeline update"
                        >
                          <FilePlus2 className="h-4 w-4 mr-1" />Add Update
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => recordAdvanceMutation.mutate(order.orderNumber || order.id)}
                          disabled={recordAdvanceMutation.isPending}
                          data-testid={`button-record-advance-${order.id}`}
                          title="Record advance payment for this order"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          {recordAdvanceMutation.isPending ? 'Recording…' : 'Record Advance'}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const base64 = String(reader.result);
                              uploadInvoiceMutation.mutate({
                                orderIdOrNumber: order.orderNumber || order.id,
                                fileName: file.name,
                                fileData: base64,
                              });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          title="Upload Invoice"
                          data-testid={`button-upload-invoice-${order.id}`}
                        >
                          <Upload className="h-4 w-4 mr-1" />Invoice
                        </Button>
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

    {/* Add Update Dialog */}
    <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Production Update - {orderForDialog?.orderNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Stage" value={updateStage} onChange={(e)=>setUpdateStage(e.target.value)} />
          <Input placeholder="Detail" value={updateDetail} onChange={(e)=>setUpdateDetail(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={()=> orderForDialog && addUpdateMutation.mutate({ orderIdOrNumber: orderForDialog.orderNumber || orderForDialog.id, stage: updateStage, detail: updateDetail })} disabled={addUpdateMutation.isPending || !updateDetail.trim()}>
              <Save className="h-4 w-4 mr-1"/>Save Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
);
}