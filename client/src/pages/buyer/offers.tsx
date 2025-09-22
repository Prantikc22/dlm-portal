import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Shield, Award, CreditCard, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { authenticatedApiClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { CuratedOffer } from '@shared/schema';

// Interface for offer structure used in the component
interface OfferData {
  id: string;
  rfqId: string;
  rfqTitle: string;
  type: string;
  price: number;
  leadTime: number;
  warranty: string;
  quality: string;
  features: string[];
  recommended: boolean;
}

export default function BuyerOffers() {
  const [selectedOffer, setSelectedOffer] = useState<OfferData | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const { toast } = useToast();

  // Fetch actual offers from API
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['/api/protected/buyer/offers'],
    queryFn: () => authenticatedApiClient.get('/api/protected/buyer/offers'),
  });

  // Transform API offers to match component interface
  const displayOffers = offers.map((offer: any) => ({
    id: offer.id,
    rfqId: offer.rfqId,
    rfqTitle: offer.rfq?.title || offer.rfq?.description || 'RFQ',
    type: offer.title || 'Standard',
    price: parseFloat(offer.totalPrice || '0'), // Use totalPrice for total order value
    unitPrice: parseFloat(offer.unitPrice || offer.details?.unitPrice || '0'), // Keep unit price separate
    quantity: offer.quantity || 100,
    leadTime: offer.details?.leadTime || offer.details?.leadTimeDays || 14,
    warranty: offer.details?.warranty || '6 months',
    quality: offer.details?.qualityAssurance || 'Standard quality check',
    features: offer.details?.features || ['Quality Assured', 'On-time Delivery'],
    recommended: false,
    paymentLink: offer.paymentLink, // Include payment link from admin
  }));

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculatePaymentBreakdown = (totalPrice: number, advancePercentage: number = 30) => {
    const advanceAmount = Math.round(totalPrice * (advancePercentage / 100));
    const finalAmount = totalPrice - advanceAmount;
    return { advanceAmount, finalAmount, totalPrice };
  };

  const handleAcceptOffer = (offer: OfferData) => {
    setSelectedOffer(offer);
    setShowPaymentDialog(true);
  };

  const handlePaymentAction = async (offer: OfferData, paymentType: 'advance' | 'final') => {
    try {
      // Get the payment link from the offer
      const paymentLink = (offer as any).paymentLink;
      
      if (paymentLink) {
        // Open payment link in new tab
        window.open(paymentLink, '_blank');
        toast({
          title: "Payment Link Opened",
          description: "Complete payment and then mark as paid below.",
        });
      } else {
        toast({
          title: "No Payment Link",
          description: "Contact admin for payment instructions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Unable to open payment link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (offer: OfferData, transactionRef: string) => {
    try {
      const transactionData = {
        curatedOfferId: offer.id,
        status: 'completed',
        transactionRef: transactionRef || `EXTERNAL-${Date.now()}`,
        amount: offer.price,
        paymentMethod: 'external'
      };
      
      await authenticatedApiClient.post('/api/protected/payment-transactions', transactionData);
      
      toast({
        title: "Payment Recorded!",
        description: "Your payment has been marked as completed. Order will be created automatically.",
      });
      
      setShowPaymentDialog(false);
      
    } catch (error) {
      console.error('Payment recording error:', error);
      toast({
        title: "Failed to Record Payment",
        description: "Unable to record payment status. Please contact support.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Offers</h1>
        <p className="text-muted-foreground mt-2">Review and accept offers from the marketplace</p>
      </div>

      <div className="space-y-6">
        {displayOffers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No offers available at the moment.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Offers will appear here once admins publish them for your RFQs.
              </p>
            </CardContent>
          </Card>
        ) : (
          displayOffers.map((offer: OfferData) => (
            <Card key={offer.rfqId}>
              <CardHeader>
                <CardTitle>{offer.rfqTitle}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Received curated offers • Review and accept to proceed
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card 
                    key={offer.id} 
                    className={`relative ${offer.recommended ? 'border-primary shadow-lg' : ''}`}
                    data-testid={`card-offer-${offer.id}`}
                  >
                    {offer.recommended && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-green-100 text-green-800">
                          <Award className="h-3 w-3 mr-1" />
                          Best Value
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">{offer.type} Offer</CardTitle>
                      <div className="text-2xl font-bold">₹{(offer.unitPrice || offer.price / (offer.quantity || 100)).toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">per piece</p>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Lead Time: {offer.leadTime} days</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Warranty: {offer.warranty}</span>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">Quality Assurance:</p>
                          <p className="text-sm text-muted-foreground">{offer.quality}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-2">Features:</p>
                          <div className="flex flex-wrap gap-1">
                            {offer.features.map((feature: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment Information */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">Payment Structure</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-blue-700 dark:text-blue-300">Advance (30%)</p>
                            <p className="font-bold text-blue-900 dark:text-blue-100">
                              {formatCurrency(calculatePaymentBreakdown(offer.price).advanceAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-700 dark:text-blue-300">Final (70%)</p>
                            <p className="font-bold text-blue-900 dark:text-blue-100">
                              {formatCurrency(calculatePaymentBreakdown(offer.price).finalAmount)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-blue-300 dark:border-blue-700">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 dark:text-blue-300 text-sm">Total Order Value</span>
                            <span className="font-bold text-blue-900 dark:text-blue-100">
                              {formatCurrency(offer.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-3 text-center">
                          Fulfilled by Logicwerk Marketplace
                        </p>
                        <Button 
                          className="w-full"
                          variant={offer.recommended ? "default" : "outline"}
                          onClick={() => handleAcceptOffer(offer)}
                          data-testid={`button-accept-offer-${offer.id}`}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Accept Offer & Pay
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">{selectedOffer.type} Offer</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  RFQ: {selectedOffer.rfqTitle}
                </p>
                <div className="text-2xl font-bold">{formatCurrency(selectedOffer.price * 50)}</div>
                <p className="text-sm text-muted-foreground">Total Order Value</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Advance Payment (30%)</p>
                    <p className="text-sm text-muted-foreground">Required to start production</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(calculatePaymentBreakdown(selectedOffer.price * 50).advanceAmount)}</p>
                    <Button 
                      size="sm" 
                      onClick={() => handlePaymentAction(selectedOffer, 'advance')}
                      data-testid="button-pay-advance"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Pay Now
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-muted-foreground">Final Payment (70%)</p>
                    <p className="text-sm text-muted-foreground">Due on delivery</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-muted-foreground">{formatCurrency(calculatePaymentBreakdown(selectedOffer.price * 50).finalAmount)}</p>
                    <p className="text-xs text-muted-foreground">Pay later</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Payment deadline: 7 days from acceptance
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowPaymentDialog(false)}
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handlePaymentAction(selectedOffer, 'advance')}
                  data-testid="button-proceed-payment"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Pay
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}