import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Send, Eye, FileText, DollarSign, Clock, Award, CreditCard, ExternalLink, Calendar, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authenticatedApiClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const offerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  unitPrice: z.number().min(0.01, 'Unit price must be greater than 0'),
  leadTimeDays: z.number().min(1, 'Lead time must be at least 1 day'),
  warranty: z.string().min(1, 'Warranty is required'),
  qualityAssurance: z.string().min(1, 'Quality assurance is required'),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  validityDays: z.number().min(1, 'Validity must be at least 1 day'),
  description: z.string().optional(),
  // Payment fields
  paymentLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  advancePaymentPercentage: z.number().min(0).max(100).optional(),
  paymentDeadlineDays: z.number().min(1, 'Payment deadline must be at least 1 day').optional(),
  paymentTerms: z.string().optional(),
});

type OfferForm = z.infer<typeof offerSchema>;

export default function AdminOfferComposer() {
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<any[]>([]);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [calculatedPayments, setCalculatedPayments] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rfqs = [] } = useQuery({
    queryKey: ['/api/protected/rfqs'],
    queryFn: () => authenticatedApiClient.get('/api/protected/rfqs'),
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['/api/protected/admin/quotes'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/quotes'),
    enabled: !!selectedRFQ,
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['/api/protected/admin/offers'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/offers'),
  });

  // Payment configurations for calculations
  const { data: paymentConfigs = [] } = useQuery({
    queryKey: ['/api/protected/admin/payment-configurations'],
    queryFn: () => authenticatedApiClient.get('/api/protected/admin/payment-configurations'),
  });

  const form = useForm<OfferForm>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      leadTimeDays: 14,
      validityDays: 30,
      features: [],
      advancePaymentPercentage: 30,
      paymentDeadlineDays: 7,
      paymentTerms: 'Payment due within specified deadline. Late payments may incur additional charges.',
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: (data: any) =>
      authenticatedApiClient.post('/api/protected/admin/curated-offers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/offers'] });
      setShowOfferDialog(false);
      setEditingOffer(null);
      form.reset();
      toast({
        title: "Offer created successfully",
        description: "The curated offer has been created and can now be published.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const publishOfferMutation = useMutation({
    mutationFn: (offerId: string) =>
      authenticatedApiClient.post(`/api/protected/admin/offers/${offerId}/publish`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/admin/offers'] });
      toast({
        title: "Offer published successfully",
        description: "The offer has been sent to the buyer.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to publish offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rfqsWithQuotes = rfqs.filter((rfq: any) => 
    rfq.status === 'invited' || rfq.status === 'under_review'
  );

  // Calculate payment amounts based on configuration
  const calculatePaymentAmounts = (totalPrice: number, advancePercentage: number = 30) => {
    const advanceAmount = Math.round(totalPrice * (advancePercentage / 100));
    const finalAmount = totalPrice - advanceAmount;
    return { advanceAmount, finalAmount, totalPrice };
  };

  const handleSubmitOffer = (data: OfferForm) => {
    if (!selectedRFQ) return;

    const totalPrice = data.unitPrice * (selectedRFQ.details?.items?.[0]?.quantity || 1);
    const paymentAmounts = calculatePaymentAmounts(totalPrice, data.advancePaymentPercentage);

    const offerData = {
      rfqId: selectedRFQ.id,
      title: data.title,
      details: {
        unitPrice: data.unitPrice,
        leadTimeDays: data.leadTimeDays,
        warranty: data.warranty,
        qualityAssurance: data.qualityAssurance,
        features: data.features,
        description: data.description,
        validityDays: data.validityDays,
        totalPrice: paymentAmounts.totalPrice,
      },
      // Payment information
      paymentLink: data.paymentLink || null,
      advancePaymentAmount: paymentAmounts.advanceAmount.toString(),
      finalPaymentAmount: paymentAmounts.finalAmount.toString(),
      paymentDeadline: data.paymentDeadlineDays ? new Date(Date.now() + data.paymentDeadlineDays * 24 * 60 * 60 * 1000).toISOString() : null,
      paymentTerms: data.paymentTerms || null,
      supplierIndicators: {
        quotesUsed: selectedQuotes.length,
        averagePrice: selectedQuotes.reduce((sum: number, q: any) => sum + (q.quoteJson?.unitPrice || 0), 0) / selectedQuotes.length || 0,
      },
    };

    createOfferMutation.mutate(offerData);
  };

  const handlePublishOffer = (offerId: string) => {
    publishOfferMutation.mutate(offerId);
  };

  const offerTypeOptions = [
    { value: 'Standard', label: 'Standard Offer', color: 'bg-blue-100 text-blue-800' },
    { value: 'Premium', label: 'Premium Offer', color: 'bg-green-100 text-green-800' },
    { value: 'Fast Track', label: 'Fast Track Offer', color: 'bg-red-100 text-red-800' },
  ];

  const qualityOptions = [
    'Basic dimensional check',
    'Advanced CMM inspection',
    'Priority inspection',
    'Lab testing included',
    'Material certificates',
    'First article inspection',
  ];

  const featureOptions = [
    'Quality Assured',
    'On-time Delivery',
    'Premium Quality',
    'Express Processing',
    'Extended Warranty',
    'Express Delivery',
    'Rush Processing',
    'Free Samples',
    'Custom Packaging',
    'Technical Support',
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Offer Composer</h1>
        <p className="text-muted-foreground mt-2">Create and manage platform offers from supplier quotes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RFQ Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select RFQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rfqsWithQuotes.length === 0 ? (
                <p className="text-muted-foreground text-sm">No RFQs with quotes available</p>
              ) : (
                rfqsWithQuotes.map((rfq: any) => (
                  <div
                    key={rfq.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRFQ?.id === rfq.id ? 'border-primary bg-accent' : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedRFQ(rfq)}
                    data-testid={`card-rfq-${rfq.id}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm" data-testid={`text-rfq-title-${rfq.id}`}>
                          {rfq.rfqNumber}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {rfq.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rfq.title}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Qty: {rfq.details?.items?.[0]?.quantity || 'N/A'}</span>
                        <span>Process: {rfq.details?.sku?.processName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {selectedRFQ && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">RFQ Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Process</p>
                  <p className="text-sm text-muted-foreground">{selectedRFQ.details?.sku?.processName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Quantity</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRFQ.details?.items?.[0]?.quantity} {selectedRFQ.details?.items?.[0]?.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Material</p>
                  <p className="text-sm text-muted-foreground">{selectedRFQ.details?.items?.[0]?.material}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Target Price</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRFQ.details?.items?.[0]?.targetUnitPrice 
                      ? `₹${selectedRFQ.details.items[0].targetUnitPrice}`
                      : 'Not specified'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="quotes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quotes">Supplier Quotes</TabsTrigger>
              <TabsTrigger value="compose">Compose Offers</TabsTrigger>
              <TabsTrigger value="published">Published Offers</TabsTrigger>
            </TabsList>

            <TabsContent value="quotes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Received Quotes</CardTitle>
                  {selectedRFQ && (
                    <p className="text-sm text-muted-foreground">
                      For RFQ: {selectedRFQ.rfqNumber}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {!selectedRFQ ? (
                    <p className="text-muted-foreground text-center py-8">
                      Select an RFQ to view supplier quotes
                    </p>
                  ) : quotes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No quotes received for this RFQ yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {quotes.map((quote: any) => (
                        <div
                          key={quote.id}
                          className="border rounded-lg p-4 space-y-3"
                          data-testid={`card-quote-${quote.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Supplier {quote.supplierId.slice(-6)}</p>
                              <p className="text-sm text-muted-foreground">
                                Submitted {new Date(quote.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {quote.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Unit Price</p>
                              <p className="font-medium text-lg">₹{quote.quoteJson?.unitPrice?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Lead Time</p>
                              <p className="font-medium">{quote.quoteJson?.leadTimeDays} days</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Amount</p>
                              <p className="font-medium">₹{quote.quoteJson?.totalAmount?.toLocaleString()}</p>
                            </div>
                          </div>

                          {quote.quoteJson?.notes && (
                            <div>
                              <p className="text-sm font-medium">Notes</p>
                              <p className="text-sm text-muted-foreground">{quote.quoteJson.notes}</p>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const isSelected = selectedQuotes.some(q => q.id === quote.id);
                                if (isSelected) {
                                  setSelectedQuotes(selectedQuotes.filter(q => q.id !== quote.id));
                                } else {
                                  setSelectedQuotes([...selectedQuotes, quote]);
                                }
                              }}
                              data-testid={`button-select-quote-${quote.id}`}
                            >
                              {selectedQuotes.some(q => q.id === quote.id) ? 'Deselect' : 'Select for Offer'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compose" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Compose New Offer</CardTitle>
                    {selectedRFQ && (
                      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
                        <DialogTrigger asChild>
                          <Button data-testid="button-create-offer">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Offer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Create Curated Offer</DialogTitle>
                          </DialogHeader>
                          
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmitOffer)} className="space-y-6">
                              <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Offer Title</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-offer-title">
                                          <SelectValue placeholder="Select offer type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {offerTypeOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="unitPrice"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Unit Price (₹)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="Enter unit price"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                          data-testid="input-unit-price"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="leadTimeDays"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Lead Time (Days)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="Enter lead time"
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                                          data-testid="input-lead-time"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="warranty"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Warranty</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., 6 months" {...field} data-testid="input-warranty" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="validityDays"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Offer Validity (Days)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="Enter validity period"
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                                          data-testid="input-validity"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="qualityAssurance"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Quality Assurance</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-quality-assurance">
                                          <SelectValue placeholder="Select quality assurance level" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {qualityOptions.map((option) => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="features"
                                render={() => (
                                  <FormItem>
                                    <FormLabel>Features</FormLabel>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      {featureOptions.map((feature) => (
                                        <FormField
                                          key={feature}
                                          control={form.control}
                                          name="features"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                              <FormControl>
                                                <input
                                                  type="checkbox"
                                                  checked={field.value?.includes(feature)}
                                                  onChange={(e) => {
                                                    const updatedValue = e.target.checked
                                                      ? [...(field.value || []), feature]
                                                      : (field.value || []).filter(value => value !== feature);
                                                    field.onChange(updatedValue);
                                                  }}
                                                  className="h-4 w-4"
                                                  data-testid={`checkbox-feature-${feature.toLowerCase().replace(/\s+/g, '-')}`}
                                                />
                                              </FormControl>
                                              <FormLabel className="text-sm font-normal">
                                                {feature}
                                              </FormLabel>
                                            </FormItem>
                                          )}
                                        />
                                      ))}
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Additional Description</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Any additional details about the offer..."
                                        {...field}
                                        data-testid="textarea-description"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Payment Configuration Section */}
                              <div className="border-t pt-6">
                                <div className="flex items-center space-x-2 mb-4">
                                  <CreditCard className="h-5 w-5 text-blue-600" />
                                  <h3 className="text-lg font-semibold">Payment Configuration</h3>
                                </div>
                                
                                <div className="space-y-4">
                                  <FormField
                                    control={form.control}
                                    name="paymentLink"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Payment Link (Optional)</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="https://razorpay.me/your-payment-link"
                                            {...field}
                                            data-testid="input-payment-link"
                                          />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                          External payment link for Razorpay or other gateways
                                        </p>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name="advancePaymentPercentage"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Advance Payment (%)</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="0"
                                              max="100"
                                              placeholder="30"
                                              {...field}
                                              onChange={(e) => {
                                                const value = parseFloat(e.target.value) || 0;
                                                field.onChange(value);
                                                // Calculate and update payment preview
                                                const totalPrice = form.getValues('unitPrice') * (selectedRFQ?.details?.items?.[0]?.quantity || 1);
                                                setCalculatedPayments(calculatePaymentAmounts(totalPrice, value));
                                              }}
                                              data-testid="input-advance-percentage"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name="paymentDeadlineDays"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Payment Deadline (Days)</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="1"
                                              placeholder="7"
                                              {...field}
                                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                                              data-testid="input-payment-deadline"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <FormField
                                    control={form.control}
                                    name="paymentTerms"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Payment Terms</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Payment terms and conditions..."
                                            {...field}
                                            data-testid="textarea-payment-terms"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  {/* Payment Amount Preview */}
                                  {calculatedPayments && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Payment Breakdown Preview</h4>
                                      <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                          <p className="text-blue-700 dark:text-blue-300">Advance Payment</p>
                                          <p className="font-bold text-blue-900 dark:text-blue-100">
                                            ₹{calculatedPayments.advanceAmount.toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-blue-700 dark:text-blue-300">Final Payment</p>
                                          <p className="font-bold text-blue-900 dark:text-blue-100">
                                            ₹{calculatedPayments.finalAmount.toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-blue-700 dark:text-blue-300">Total Amount</p>
                                          <p className="font-bold text-blue-900 dark:text-blue-100">
                                            ₹{calculatedPayments.totalPrice.toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-end space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowOfferDialog(false)}
                                  data-testid="button-cancel-offer"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={createOfferMutation.isPending}
                                  data-testid="button-save-offer"
                                >
                                  {createOfferMutation.isPending ? 'Creating...' : 'Create Offer'}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedRFQ ? (
                    <p className="text-muted-foreground text-center py-8">
                      Select an RFQ to compose offers
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedQuotes.length > 0 && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h3 className="font-medium mb-2">Selected Quotes ({selectedQuotes.length})</h3>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Average Price</p>
                              <p className="font-medium">
                                ₹{Math.round(selectedQuotes.reduce((sum, q) => sum + (q.quoteJson?.unitPrice || 0), 0) / selectedQuotes.length).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Best Lead Time</p>
                              <p className="font-medium">
                                {Math.min(...selectedQuotes.map(q => q.quoteJson?.leadTimeDays || 999))} days
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Price Range</p>
                              <p className="font-medium">
                                ₹{Math.min(...selectedQuotes.map(q => q.quoteJson?.unitPrice || 0)).toLocaleString()} - 
                                ₹{Math.max(...selectedQuotes.map(q => q.quoteJson?.unitPrice || 0)).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-muted-foreground">
                        Select quotes from the "Supplier Quotes" tab to create competitive offers for the buyer.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="published" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Published Offers</CardTitle>
                </CardHeader>
                <CardContent>
                  {offers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No offers have been published yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {offers.map((offer: any) => (
                        <div
                          key={offer.id}
                          className="border rounded-lg p-4 space-y-3"
                          data-testid={`card-offer-${offer.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{offer.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                RFQ: {offer.rfqId} • Created {new Date(offer.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {offer.publishedAt ? (
                                <Badge className="bg-green-100 text-green-800">Published</Badge>
                              ) : (
                                <Badge variant="secondary">Draft</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-muted-foreground">Price</p>
                              <p className="font-medium">₹{offer.details?.unitPrice?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Lead Time</p>
                              <p className="font-medium">{offer.details?.leadTimeDays} days</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Warranty</p>
                              <p className="font-medium">{offer.details?.warranty}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Quality</p>
                              <p className="font-medium">{offer.details?.qualityAssurance}</p>
                            </div>
                          </div>

                          {/* Payment Information */}
                          {(offer.advancePaymentAmount || offer.paymentLink) && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-center space-x-2 mb-2">
                                <CreditCard className="h-4 w-4 text-green-600" />
                                <h4 className="font-medium text-green-900 dark:text-green-100">Payment Details</h4>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                {offer.advancePaymentAmount && (
                                  <div>
                                    <p className="text-green-700 dark:text-green-300">Advance Payment</p>
                                    <p className="font-bold text-green-900 dark:text-green-100">
                                      ₹{parseFloat(offer.advancePaymentAmount).toLocaleString()}
                                    </p>
                                  </div>
                                )}
                                {offer.finalPaymentAmount && (
                                  <div>
                                    <p className="text-green-700 dark:text-green-300">Final Payment</p>
                                    <p className="font-bold text-green-900 dark:text-green-100">
                                      ₹{parseFloat(offer.finalPaymentAmount).toLocaleString()}
                                    </p>
                                  </div>
                                )}
                                {offer.paymentDeadline && (
                                  <div>
                                    <p className="text-green-700 dark:text-green-300">Payment Deadline</p>
                                    <p className="font-bold text-green-900 dark:text-green-100">
                                      {new Date(offer.paymentDeadline).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {offer.paymentLink && (
                                <div className="mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/30"
                                    data-testid={`button-payment-link-${offer.id}`}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Payment Link
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" data-testid={`button-view-offer-${offer.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {offer.paymentLink && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(offer.paymentLink, '_blank')}
                                data-testid={`button-open-payment-${offer.id}`}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Payment
                              </Button>
                            )}
                            {!offer.publishedAt && (
                              <Button
                                size="sm"
                                onClick={() => handlePublishOffer(offer.id)}
                                disabled={publishOfferMutation.isPending}
                                data-testid={`button-publish-offer-${offer.id}`}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Publish
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
