import { useQuery } from '@tanstack/react-query';
import { FileText, Quote, ShoppingCart, DollarSign, Star, Check, AlertCircle, Upload, Building2, Award, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { authenticatedApiClient } from '@/lib/supabase';
import { useLocation } from 'wouter';

export default function SupplierDashboard() {
  const [, setLocation] = useLocation();

  const { data: invites = [], isLoading: invitesLoading } = useQuery({
    queryKey: ['/api/protected/suppliers/invites'],
    queryFn: () => authenticatedApiClient.get('/api/protected/suppliers/invites'),
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['/api/protected/quotes'],
    queryFn: () => authenticatedApiClient.get('/api/protected/quotes'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/protected/orders'],
    queryFn: () => authenticatedApiClient.get('/api/protected/orders'),
  });

  const { data: profileCompletion, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/protected/suppliers/profile-completion'],
    queryFn: () => authenticatedApiClient.get('/api/protected/suppliers/profile-completion'),
  });

  const stats = {
    pendingRFQs: invites.filter((invite: any) => invite.invite.status === 'invited').length,
    submittedQuotes: quotes.length,
    activeOrders: orders.filter((order: any) => ['production', 'inspection', 'shipped'].includes(order.status)).length,
    monthlyPayout: 245000, // This would come from API
  };

  return (
    <div className="p-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Supplier Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage your quotes and track orders</p>
      </div>

      {/* Profile Completion Status */}
      {profileLoading ? (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Loading Profile Status...</h3>
                <p className="text-muted-foreground text-sm">Checking profile completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : profileCompletion?.shouldShowPrompt ? (
        <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Complete Your Profile for Verification</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Your profile is {profileCompletion.completionPercentage}% complete. Complete the remaining steps to get verified and start receiving RFQ invitations.
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">Profile Progress</span>
                      <span className="text-sm text-muted-foreground">{profileCompletion.completionPercentage}%</span>
                    </div>
                    <Progress value={profileCompletion.completionPercentage} className="h-2" />
                  </div>

                  {/* Completion Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className={`flex items-center space-x-2 text-sm ${
                      profileCompletion.steps.companyInfo.completed 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-muted-foreground'
                    }`}>
                      {profileCompletion.steps.companyInfo.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <Building2 className="h-4 w-4" />
                      <span>{profileCompletion.steps.companyInfo.label}</span>
                    </div>
                    
                    <div className={`flex items-center space-x-2 text-sm ${
                      profileCompletion.steps.supplierProfile.completed 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-muted-foreground'
                    }`}>
                      {profileCompletion.steps.supplierProfile.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <Award className="h-4 w-4" />
                      <span>{profileCompletion.steps.supplierProfile.label}</span>
                    </div>
                    
                    <div className={`flex items-center space-x-2 text-sm ${
                      profileCompletion.steps.documentUpload.completed 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-muted-foreground'
                    }`}>
                      {profileCompletion.steps.documentUpload.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <Upload className="h-4 w-4" />
                      <span>{profileCompletion.steps.documentUpload.label}</span>
                    </div>
                    
                    <div className={`flex items-center space-x-2 text-sm ${
                      profileCompletion.steps.verification.completed 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {profileCompletion.steps.verification.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      <Star className="h-4 w-4" />
                      <span>{profileCompletion.steps.verification.label}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                <Button 
                  onClick={() => setLocation('/supplier/onboarding')}
                  data-testid="button-complete-profile"
                  className="whitespace-nowrap"
                >
                  Complete Profile
                </Button>
                {profileCompletion.verificationStatus === 'unverified' && profileCompletion.profileComplete && (
                  <p className="text-xs text-center text-muted-foreground">Pending verification</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Profile Verified</h3>
                  <p className="text-muted-foreground text-sm">
                    {profileCompletion?.verificationStatus === 'gold' && 'Gold tier supplier - All documents verified'}
                    {profileCompletion?.verificationStatus === 'silver' && 'Silver tier supplier - Profile verified'}
                    {profileCompletion?.verificationStatus === 'bronze' && 'Bronze tier supplier - Basic verification'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={
                  profileCompletion?.verificationStatus === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                  profileCompletion?.verificationStatus === 'silver' ? 'bg-gray-100 text-gray-800' :
                  'bg-orange-100 text-orange-800'
                }>
                  <Star className="h-3 w-3 mr-1" />
                  {profileCompletion?.verificationStatus?.charAt(0).toUpperCase() + profileCompletion?.verificationStatus?.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending RFQs</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-pending-rfqs">
                  {stats.pendingRFQs}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Submitted Quotes</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-submitted-quotes">
                  {stats.submittedQuotes}
                </p>
              </div>
              <Quote className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Orders</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-orders">
                  {stats.activeOrders}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">This Month Payout</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-monthly-payout">
                  ₹{stats.monthlyPayout.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent RFQs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invited RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading RFQs...</div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No RFQ invitations yet</h3>
              <p className="text-muted-foreground">Invitations will appear here when admins match you to RFQs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">RFQ ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Process</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Quantity</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Deadline</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invites.slice(0, 5).map((invite: any) => (
                    <tr key={invite.invite.id} data-testid={`row-invite-${invite.invite.id}`}>
                      <td className="py-4 px-6 text-sm" data-testid={`text-rfq-number-${invite.invite.id}`}>
                        {invite.rfq.rfqNumber}
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
                      <td className="py-4 px-6">
                        {invite.invite.status === 'invited' ? (
                          <Button
                            size="sm"
                            onClick={() => setLocation('/supplier/rfqs')}
                            data-testid={`button-submit-quote-${invite.invite.id}`}
                          >
                            Submit Quote
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
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
