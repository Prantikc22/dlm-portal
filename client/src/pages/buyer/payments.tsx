import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, Clock, CheckCircle, XCircle, AlertCircle, 
  Calendar, DollarSign, ExternalLink, Filter, Download, 
  Eye, ArrowUpRight, Wallet, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { authenticatedApiClient } from '@/lib/supabase';
import { format } from 'date-fns';

interface PaymentTransaction {
  id: string;
  transactionRef: string;
  orderId?: string;
  curatedOfferId?: string;
  amount: string;
  fees: string;
  netAmount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  transactionType: 'advance_payment' | 'final_payment' | 'full_payment' | 'refund' | 'commission';
  notes?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CuratedOffer {
  id: string;
  rfqId: string;
  title: string;
  totalPrice: string;
  paymentLink?: string;
  advancePaymentAmount?: string;
  finalPaymentAmount?: string;
  paymentDeadline?: string;
  paymentTerms?: string;
  publishedAt: string;
  expiresAt?: string;
}

export default function BuyerPaymentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Payment Transactions Data
  const { data: paymentTransactions = [] } = useQuery({
    queryKey: ['/api/protected/buyer/payment-transactions'],
    queryFn: () => authenticatedApiClient.get('/api/protected/buyer/payment-transactions'),
  });

  // Orders with payment information
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/protected/orders'],
    queryFn: () => authenticatedApiClient.get('/api/protected/orders'),
  });

  // Filter transactions based on status
  const filteredTransactions = paymentTransactions.filter((tx: PaymentTransaction) => {
    if (statusFilter === 'all') return true;
    return tx.status === statusFilter;
  });

  // Calculate payment statistics
  const paymentStats = {
    totalPaid: paymentTransactions
      .filter((tx: PaymentTransaction) => tx.status === 'completed')
      .reduce((sum: number, tx: PaymentTransaction) => sum + parseFloat(tx.amount), 0),
    totalPending: paymentTransactions
      .filter((tx: PaymentTransaction) => tx.status === 'pending')
      .reduce((sum: number, tx: PaymentTransaction) => sum + parseFloat(tx.amount), 0),
    completedCount: paymentTransactions.filter((tx: PaymentTransaction) => tx.status === 'completed').length,
    pendingCount: paymentTransactions.filter((tx: PaymentTransaction) => tx.status === 'pending').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing': return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary", 
      processing: "outline",
      failed: "destructive",
      cancelled: "secondary"
    };
    return variants[status] || "secondary";
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'advance_payment': return 'Advance Payment';
      case 'final_payment': return 'Final Payment';
      case 'full_payment': return 'Full Payment';
      case 'refund': return 'Refund';
      default: return type;
    }
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Dashboard</h1>
          <p className="text-muted-foreground mt-2">Track your payments, view history, and manage transactions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" data-testid="button-download-statement">
            <Download className="h-4 w-4 mr-2" />
            Download Statement
          </Button>
        </div>
      </div>

      {/* Payment Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Paid</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-total-paid">
                  {formatCurrency(paymentStats.totalPaid.toString())}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-green-600 text-sm mt-2">{paymentStats.completedCount} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Amount Pending</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="text-total-pending">
                  {formatCurrency(paymentStats.totalPending.toString())}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-yellow-600 text-sm mt-2">{paymentStats.pendingCount} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">This Month</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-monthly-amount">
                  {formatCurrency("45000")}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-green-600 text-sm mt-2">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Payment Methods</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-payment-methods">3</p>
              </div>
              <Wallet className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-muted-foreground text-sm mt-2">Available options</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-payment-overview">Overview</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-payments">Pending Payments</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-payment-history">Payment History</TabsTrigger>
          <TabsTrigger value="methods" data-testid="tab-payment-methods">Payment Methods</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentTransactions.slice(0, 5).map((transaction: PaymentTransaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(transaction.status)}
                      <div>
                        <p className="font-medium text-foreground">{transaction.transactionRef}</p>
                        <p className="text-sm text-muted-foreground">
                          {getTransactionTypeLabel(transaction.transactionType)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(transaction.amount)}</p>
                      <Badge variant={getStatusBadge(transaction.status)} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {paymentTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Action Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pending payments that need action */}
                {paymentTransactions
                  .filter((tx: PaymentTransaction) => tx.status === 'pending')
                  .slice(0, 3)
                  .map((transaction: PaymentTransaction) => (
                  <div key={transaction.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Payment Due</p>
                        <p className="text-sm text-muted-foreground">
                          {getTransactionTypeLabel(transaction.transactionType)} - {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Button size="sm" data-testid={`button-pay-${transaction.id}`}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
                
                {paymentTransactions.filter((tx: PaymentTransaction) => tx.status === 'pending').length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">All payments are up to date!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pending Payments Tab */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Pending Payments</CardTitle>
                <Badge variant="secondary">{paymentStats.pendingCount} pending</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentTransactions
                  .filter((tx: PaymentTransaction) => tx.status === 'pending')
                  .map((transaction: PaymentTransaction) => (
                  <Card key={transaction.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{transaction.transactionRef}</Badge>
                            <Badge variant="secondary">{getTransactionTypeLabel(transaction.transactionType)}</Badge>
                          </div>
                          <p className="text-2xl font-bold text-foreground">{formatCurrency(transaction.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            Created: {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                          </p>
                          {transaction.notes && (
                            <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" data-testid={`button-view-${transaction.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm" data-testid={`button-pay-now-${transaction.id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {paymentStats.pendingCount === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">You have no pending payments at this time.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Payment History</CardTitle>
                <div className="flex space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40" data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction Ref</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction: PaymentTransaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.transactionRef}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTransactionTypeLabel(transaction.transactionType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(transaction.status)}
                          <Badge variant={getStatusBadge(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(transaction.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-view-transaction-${transaction.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Transactions Found</h3>
                  <p className="text-muted-foreground">
                    {statusFilter === 'all' 
                      ? 'You haven\'t made any payments yet.' 
                      : `No ${statusFilter} transactions found.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Available Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Sample payment methods */}
                <div className="p-6 border border-border rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <CreditCard className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-foreground">Credit/Debit Card</h3>
                      <p className="text-sm text-muted-foreground">Via Razorpay</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Secure payment processing with all major credit and debit cards
                  </p>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="p-6 border border-border rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Wallet className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-foreground">UPI</h3>
                      <p className="text-sm text-muted-foreground">Instant payments</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pay instantly using UPI apps like PhonePe, Google Pay, Paytm
                  </p>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="p-6 border border-border rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-foreground">Bank Transfer</h3>
                      <p className="text-sm text-muted-foreground">NEFT/RTGS</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Direct bank transfer for large transactions
                  </p>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}