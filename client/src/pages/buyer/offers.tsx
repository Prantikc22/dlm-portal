import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, Award } from 'lucide-react';

export default function BuyerOffers() {
  // Mock offers data - in real app this would come from API
  const offers = [
    {
      id: '1',
      rfqId: 'RFQ-2024-001',
      rfqTitle: 'CNC Machined Brackets',
      type: 'Standard',
      price: 2450,
      leadTime: 14,
      warranty: '6 months',
      quality: 'Basic dimensional check',
      features: ['Quality Assured', 'On-time Delivery'],
      recommended: false,
    },
    {
      id: '2',
      rfqId: 'RFQ-2024-001',
      rfqTitle: 'CNC Machined Brackets',
      type: 'Premium',
      price: 2850,
      leadTime: 12,
      warranty: '12 months',
      quality: 'Advanced CMM inspection',
      features: ['Premium Quality', 'Express Processing', 'Extended Warranty'],
      recommended: true,
    },
    {
      id: '3',
      rfqId: 'RFQ-2024-001',
      rfqTitle: 'CNC Machined Brackets',
      type: 'Fast Track',
      price: 3200,
      leadTime: 7,
      warranty: '6 months',
      quality: 'Priority inspection',
      features: ['Express Delivery', 'Rush Processing'],
      recommended: false,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Offers</h1>
        <p className="text-muted-foreground mt-2">Review and accept offers from the marketplace</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>RFQ-2024-001: CNC Machined Brackets</CardTitle>
            <p className="text-sm text-muted-foreground">
              Received 3 curated offers • Expires in 48 hours
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
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
                    <div className="text-2xl font-bold">₹{offer.price.toLocaleString()}</div>
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
                          {offer.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
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
                        data-testid={`button-accept-offer-${offer.id}`}
                      >
                        Accept Offer & Pay Deposit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
