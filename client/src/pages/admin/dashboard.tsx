import { useQuery } from '@tanstack/react-query';
import { 
  FileText, Users, TrendingUp, Trophy, 
  Clock, AlertCircle, CheckCircle, Building2, 
  Microchip, Package, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authenticatedApiClient } from '@/lib/supabase';
import { useLocation } from 'wouter';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/protected/admin/suppliers'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/suppliers'),
  });

  // Mock data for admin metrics - in production this would come from API
  const metrics = {
    activeRFQs: 32,
    verifiedSuppliers: suppliers.length || 147,
    monthlyVolume: 4520000, // ₹45.2L
    successRate: 94.5,
  };

  const rfqInbox = [
    {
      id: '1',
      title: 'CNC Machined Brackets',
      quantity: '100 pcs',
      dueDate: 'Dec 15',
      status: 'new',
      priority: 'high',
    },
    {
      id: '2',
      title: 'PCB Assembly Service',
      quantity: '200 pcs',
      dueDate: 'Dec 18',
      status: 'matching',
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Custom Packaging',
      quantity: '1000 pcs',
      dueDate: 'Dec 20',
      status: 'quoted',
      priority: 'low',
    },
  ];

  const verificationQueue = [
    {
      id: '1',
      company: 'Precision Tech Pvt Ltd',
      capability: 'CNC Machining',
      status: 'pending',
      type: 'new',
    },
    {
      id: '2',
      company: 'ElectroCircuits Solutions',
      capability: 'PCB Assembly',
      status: 'approved',
      type: 'certified',
    },
    {
      id: '3',
      company: 'PackPro Industries',
      capability: 'Packaging',
      status: 'incomplete',
      type: 'followup',
    },
  ];

  return (
    <div className="p-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage marketplace operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active RFQs</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-rfqs">
                  {metrics.activeRFQs}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-green-600 text-sm mt-2">+8% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Verified Suppliers</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-verified-suppliers">
                  {metrics.verifiedSuppliers}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-green-600 text-sm mt-2">+12 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Monthly Volume</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-monthly-volume">
                  ₹{(metrics.monthlyVolume / 100000).toFixed(1)}L
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-green-600 text-sm mt-2">+23% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-success-rate">
                  {metrics.successRate}%
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-green-600 text-sm mt-2">+2.3% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* RFQ Inbox */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">RFQ Inbox</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/admin/rfqs')}
                data-testid="button-view-all-rfqs"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rfqInbox.map((rfq) => (
              <div
                key={rfq.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
                data-testid={`card-rfq-${rfq.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    rfq.priority === 'high' ? 'bg-red-500' :
                    rfq.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-sm" data-testid={`text-rfq-title-${rfq.id}`}>
                      {rfq.title}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Qty: {rfq.quantity} • Due: {rfq.dueDate}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid={`button-process-rfq-${rfq.id}`}
                >
                  {rfq.status === 'new' ? 'Match' : 
                   rfq.status === 'matching' ? 'Review' : 'Compose'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Supplier Verification Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Verification Queue</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/admin/suppliers')}
                data-testid="button-view-all-suppliers"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationQueue.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
                data-testid={`card-supplier-${supplier.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {supplier.capability.includes('CNC') ? <Settings className="h-4 w-4 text-blue-600" /> :
                     supplier.capability.includes('PCB') ? <Microchip className="h-4 w-4 text-green-600" /> :
                     <Package className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm" data-testid={`text-supplier-name-${supplier.id}`}>
                      {supplier.company}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {supplier.capability} • {supplier.type}
                    </p>
                  </div>
                </div>
                <Button
                  variant={supplier.status === 'approved' ? 'default' : 
                          supplier.status === 'incomplete' ? 'secondary' : 'outline'}
                  size="sm"
                  className={
                    supplier.status === 'approved' ? 'bg-green-600 hover:bg-green-600/90' :
                    supplier.status === 'incomplete' ? 'bg-yellow-600 hover:bg-yellow-600/90' : ''
                  }
                  data-testid={`button-verify-supplier-${supplier.id}`}
                >
                  {supplier.status === 'approved' ? 'Approved' :
                   supplier.status === 'incomplete' ? 'Follow Up' : 'Review'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Offer Composer Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Offer Composer</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">Create platform offers from supplier quotes</p>
            </div>
            <Button
              onClick={() => setLocation('/admin/offers')}
              data-testid="button-open-composer"
            >
              Open Composer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Standard Offer */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Standard Offer</h3>
                <Badge className="bg-blue-100 text-blue-800">Popular</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p className="text-lg font-bold">₹2,450</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Time</p>
                  <p className="font-medium">14 days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quality Assurance</p>
                  <p className="font-medium">Basic dimensional check</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warranty</p>
                  <p className="font-medium">6 months</p>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" data-testid="button-publish-standard">
                Publish Offer
              </Button>
            </div>

            {/* Premium Offer */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Premium Offer</h3>
                <Badge className="bg-green-100 text-green-800">Best Value</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p className="text-lg font-bold">₹2,850</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Time</p>
                  <p className="font-medium">12 days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quality Assurance</p>
                  <p className="font-medium">Advanced CMM inspection</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warranty</p>
                  <p className="font-medium">12 months</p>
                </div>
              </div>
              <Button className="w-full mt-4" data-testid="button-publish-premium">
                Publish Offer
              </Button>
            </div>

            {/* Fast Track Offer */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Fast Track Offer</h3>
                <Badge className="bg-red-100 text-red-800">Express</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p className="text-lg font-bold">₹3,200</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Time</p>
                  <p className="font-medium">7 days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quality Assurance</p>
                  <p className="font-medium">Priority inspection</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warranty</p>
                  <p className="font-medium">6 months</p>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" data-testid="button-publish-fast">
                Publish Offer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
