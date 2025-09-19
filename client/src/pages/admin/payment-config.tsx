import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  CreditCard, Settings, DollarSign, Percent, 
  Plus, Edit, Trash2, Save, X, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { authenticatedApiClient } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'razorpay' | 'bank_transfer' | 'upi' | 'wallet' | 'other';
  isActive: boolean;
  configuration: any;
  displayName: string;
  description?: string;
  processingFeePercent: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentConfiguration {
  id: string;
  configType: 'advance_percentage' | 'commission_rate' | 'platform_fee' | 'gateway_fee';
  value: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentConfigPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('methods');
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [editingConfig, setEditingConfig] = useState<PaymentConfiguration | null>(null);

  // Payment Methods Data
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['/api/protected/admin/payment-methods'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/payment-methods'),
  });

  // Payment Configurations Data
  const { data: paymentConfigs = [] } = useQuery({
    queryKey: ['/api/protected/admin/payment-configurations'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/payment-configurations'),
  });

  // Payment Method Mutations
  const createMethodMutation = useMutation({
    mutationFn: (data: any) => authenticatedApiClient.post('/api/protected/admin/payment-methods', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/payment-methods'] });
      setShowMethodDialog(false);
      setEditingMethod(null);
      toast({ title: 'Success', description: 'Payment method created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create payment method', variant: 'destructive' });
    }
  });

  const updateMethodMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => authenticatedApiClient.put(`/api/protected/admin/payment-methods/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/payment-methods'] });
      setShowMethodDialog(false);
      setEditingMethod(null);
      toast({ title: 'Success', description: 'Payment method updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update payment method', variant: 'destructive' });
    }
  });

  const deleteMethodMutation = useMutation({
    mutationFn: (id: string) => authenticatedApiClient.delete(`/api/protected/admin/payment-methods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/payment-methods'] });
      toast({ title: 'Success', description: 'Payment method deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete payment method', variant: 'destructive' });
    }
  });

  // Payment Configuration Mutations
  const createConfigMutation = useMutation({
    mutationFn: (data: any) => authenticatedApiClient.post('/api/protected/admin/payment-configurations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/payment-configurations'] });
      setShowConfigDialog(false);
      setEditingConfig(null);
      toast({ title: 'Success', description: 'Payment configuration created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create payment configuration', variant: 'destructive' });
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => authenticatedApiClient.put(`/api/protected/admin/payment-configurations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/payment-configurations'] });
      setShowConfigDialog(false);
      setEditingConfig(null);
      toast({ title: 'Success', description: 'Payment configuration updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update payment configuration', variant: 'destructive' });
    }
  });

  const handleMethodSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name'),
      type: formData.get('type'),
      displayName: formData.get('displayName'),
      description: formData.get('description'),
      processingFeePercent: formData.get('processingFeePercent'),
      isActive: formData.get('isActive') === 'on',
      configuration: {
        apiKey: formData.get('apiKey'),
        secretKey: formData.get('secretKey'),
        webhookSecret: formData.get('webhookSecret'),
      }
    };

    if (editingMethod) {
      updateMethodMutation.mutate({ id: editingMethod.id, ...data });
    } else {
      createMethodMutation.mutate(data);
    }
  };

  const handleConfigSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      configType: formData.get('configType'),
      value: formData.get('value'),
      description: formData.get('description'),
      isActive: formData.get('isActive') === 'on',
    };

    if (editingConfig) {
      updateConfigMutation.mutate({ id: editingConfig.id, ...data });
    } else {
      createConfigMutation.mutate(data);
    }
  };

  const getMethodTypeIcon = (type: string) => {
    switch (type) {
      case 'razorpay': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <DollarSign className="h-4 w-4" />;
      case 'upi': return <Settings className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getConfigTypeLabel = (type: string) => {
    switch (type) {
      case 'advance_percentage': return 'Advance Payment %';
      case 'commission_rate': return 'Commission Rate %';
      case 'platform_fee': return 'Platform Fee %';
      case 'gateway_fee': return 'Gateway Fee %';
      default: return type;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Configuration</h1>
          <p className="text-muted-foreground mt-2">Manage payment methods, gateways, and fee structures</p>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="methods" data-testid="tab-payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="configurations" data-testid="tab-payment-configurations">Fee Structure</TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-payment-overview">Overview</TabsTrigger>
        </TabsList>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Payment Methods</h2>
            <Dialog open={showMethodDialog} onOpenChange={setShowMethodDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingMethod(null)} data-testid="button-add-payment-method">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMethodSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Internal Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingMethod?.name}
                        placeholder="razorpay_primary"
                        required
                        data-testid="input-method-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Method Type</Label>
                      <Select name="type" defaultValue={editingMethod?.type}>
                        <SelectTrigger data-testid="select-method-type">
                          <SelectValue placeholder="Select method type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="razorpay">Razorpay</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="wallet">Wallet</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      defaultValue={editingMethod?.displayName}
                      placeholder="Credit/Debit Card via Razorpay"
                      required
                      data-testid="input-display-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingMethod?.description}
                      placeholder="Secure payment processing via Razorpay gateway"
                      data-testid="textarea-description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="processingFeePercent">Processing Fee (%)</Label>
                    <Input
                      id="processingFeePercent"
                      name="processingFeePercent"
                      type="number"
                      step="0.01"
                      defaultValue={editingMethod?.processingFeePercent}
                      placeholder="2.5"
                      data-testid="input-processing-fee"
                    />
                  </div>

                  {/* Gateway Configuration */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Gateway Configuration</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          name="apiKey"
                          type="password"
                          defaultValue={editingMethod?.configuration?.apiKey}
                          placeholder="API Key"
                          data-testid="input-api-key"
                        />
                      </div>
                      <div>
                        <Label htmlFor="secretKey">Secret Key</Label>
                        <Input
                          id="secretKey"
                          name="secretKey"
                          type="password"
                          defaultValue={editingMethod?.configuration?.secretKey}
                          placeholder="Secret Key"
                          data-testid="input-secret-key"
                        />
                      </div>
                      <div>
                        <Label htmlFor="webhookSecret">Webhook Secret</Label>
                        <Input
                          id="webhookSecret"
                          name="webhookSecret"
                          type="password"
                          defaultValue={editingMethod?.configuration?.webhookSecret}
                          placeholder="Webhook Secret"
                          data-testid="input-webhook-secret"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      name="isActive"
                      defaultChecked={editingMethod?.isActive ?? true}
                      data-testid="switch-method-active"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMethodDialog(false)}
                      data-testid="button-cancel-method"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMethodMutation.isPending || updateMethodMutation.isPending}
                      data-testid="button-save-method"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingMethod ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map((method: PaymentMethod) => (
              <Card key={method.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getMethodTypeIcon(method.type)}
                      <CardTitle className="text-lg">{method.displayName}</CardTitle>
                    </div>
                    <Badge variant={method.isActive ? "default" : "secondary"}>
                      {method.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type: {method.type}</p>
                    <p className="text-sm text-muted-foreground">Fee: {method.processingFeePercent}%</p>
                    {method.description && (
                      <p className="text-sm text-muted-foreground mt-2">{method.description}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingMethod(method);
                        setShowMethodDialog(true);
                      }}
                      data-testid={`button-edit-method-${method.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMethodMutation.mutate(method.id)}
                      disabled={deleteMethodMutation.isPending}
                      data-testid={`button-delete-method-${method.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payment Configurations Tab */}
        <TabsContent value="configurations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Fee Structure Configuration</h2>
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingConfig(null)} data-testid="button-add-config">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Configuration
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingConfig ? 'Edit Configuration' : 'Add Configuration'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleConfigSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="configType">Configuration Type</Label>
                    <Select name="configType" defaultValue={editingConfig?.configType}>
                      <SelectTrigger data-testid="select-config-type">
                        <SelectValue placeholder="Select configuration type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advance_percentage">Advance Payment %</SelectItem>
                        <SelectItem value="commission_rate">Commission Rate %</SelectItem>
                        <SelectItem value="platform_fee">Platform Fee %</SelectItem>
                        <SelectItem value="gateway_fee">Gateway Fee %</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      name="value"
                      type="number"
                      step="0.01"
                      defaultValue={editingConfig?.value}
                      placeholder="30.00"
                      required
                      data-testid="input-config-value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingConfig?.description}
                      placeholder="Description of this configuration"
                      data-testid="textarea-config-description"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      name="isActive"
                      defaultChecked={editingConfig?.isActive ?? true}
                      data-testid="switch-config-active"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowConfigDialog(false)}
                      data-testid="button-cancel-config"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createConfigMutation.isPending || updateConfigMutation.isPending}
                      data-testid="button-save-config"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingConfig ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentConfigs.map((config: PaymentConfiguration) => (
              <Card key={config.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {getConfigTypeLabel(config.configType)}
                    </CardTitle>
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {config.value}%
                    </p>
                    {config.description && (
                      <p className="text-sm text-muted-foreground mt-2">{config.description}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingConfig(config);
                        setShowConfigDialog(true);
                      }}
                      data-testid={`button-edit-config-${config.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <h2 className="text-2xl font-semibold">Payment System Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {paymentMethods.filter((m: PaymentMethod) => m.isActive).length}
                </p>
                <p className="text-muted-foreground">Active methods</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Percent className="h-5 w-5 mr-2" />
                  Fee Configurations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {paymentConfigs.filter((c: PaymentConfiguration) => c.isActive).length}
                </p>
                <p className="text-muted-foreground">Active configurations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">Ready</p>
                <p className="text-muted-foreground">Payment system operational</p>
              </CardContent>
            </Card>
          </div>

          {/* Current Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Current Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentConfigs.filter((c: PaymentConfiguration) => c.isActive).map((config: PaymentConfiguration) => (
                  <div key={config.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">{getConfigTypeLabel(config.configType)}</span>
                    <span className="text-lg font-bold">{config.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}