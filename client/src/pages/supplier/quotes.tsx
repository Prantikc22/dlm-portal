import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { Plus, FileText, Calculator, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authenticatedApiClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const quoteSchema = z.object({
  unitPrice: z.number().min(0.01, 'Unit price must be greater than 0'),
  toolingCost: z.number().optional(),
  leadTimeDays: z.number().min(1, 'Lead time must be at least 1 day'),
  validityDays: z.number().min(1, 'Validity must be at least 1 day'),
  notes: z.string().optional(),
  sampleLeadTime: z.number().optional(),
  samplePrice: z.number().optional(),
});

type QuoteForm = z.infer<typeof quoteSchema>;

export default function SupplierQuotes() {
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['/api/protected/quotes'],
    queryFn: () => authenticatedApiClient.get('/api/protected/quotes'),
  });

  const { data: invites = [] } = useQuery({
    queryKey: ['/api/protected/suppliers/invites'],
    queryFn: () => authenticatedApiClient.get('/api/protected/suppliers/invites'),
  });

  const form = useForm<QuoteForm>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      leadTimeDays: 14,
      validityDays: 30,
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: (data: { rfqId: string; quoteJson: any }) =>
      authenticatedApiClient.post('/api/protected/quotes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/quotes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/suppliers/invites'] });
      setShowQuoteForm(false);
      setSelectedRFQ(null);
      form.reset();
      toast({
        title: "Quote submitted successfully",
        description: "Your quote has been sent for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitQuote = (data: QuoteForm) => {
    if (!selectedRFQ) return;

    const quoteData = {
      rfqId: selectedRFQ.rfq.id,
      status: 'submitted',
      quoteJson: {
        ...data,
        rfqItems: selectedRFQ.rfq.details?.items?.map((item: any) => ({
          itemRef: item.itemRef || '1',
          unitPrice: data.unitPrice,
          totalPrice: data.unitPrice * (item.quantity || 1),
          leadTimeDays: data.leadTimeDays,
        })) || [],
        totalAmount: data.unitPrice * (selectedRFQ.rfq.details?.items?.[0]?.quantity || 1),
        submittedAt: new Date().toISOString(),
      },
    };

    createQuoteMutation.mutate(quoteData);
  };

  const pendingInvites = invites.filter((invite: any) => invite.invite.status === 'invited');
  const submittedQuotes = quotes.filter((quote: any) => quote.status === 'submitted');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Quotes</h1>
        <p className="text-muted-foreground mt-2">Submit and manage your quotations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-pending-quotes">
                  {pendingInvites.length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-submitted-quotes">
                  {submittedQuotes.length}
                </p>
                <p className="text-sm text-muted-foreground">Submitted Quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-quotes">
                  {quotes.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending RFQs for Quoting */}
      {pendingInvites.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-orange-600">
              <Clock className="h-5 w-5 inline mr-2" />
              RFQs Awaiting Quotes ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvites.map((invite: any) => (
                <div
                  key={invite.invite.id}
                  className="border border-orange-200 rounded-lg p-4 bg-orange-50"
                  data-testid={`card-pending-rfq-${invite.invite.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-foreground" data-testid={`text-rfq-title-${invite.invite.id}`}>
                          {invite.rfq.rfqNumber} - {invite.rfq.title}
                        </h3>
                        <Badge className="bg-orange-100 text-orange-800">
                          Quote Required
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Process</p>
                          <p className="font-medium">{invite.rfq.details?.sku?.processName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">
                            {invite.rfq.details?.items?.[0]?.quantity || 'N/A'} {invite.rfq.details?.items?.[0]?.unit || ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Material</p>
                          <p className="font-medium">{invite.rfq.details?.items?.[0]?.material || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target Price</p>
                          <p className="font-medium">
                            {invite.rfq.details?.items?.[0]?.targetUnitPrice 
                              ? `₹${invite.rfq.details.items[0].targetUnitPrice}`
                              : 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/supplier/rfq/${invite.rfq.id}`)}
                        data-testid={`button-view-rfq-details-${invite.invite.id}`}
                      >
                        View Details
                      </Button>
                      <Dialog open={showQuoteForm && selectedRFQ?.invite.id === invite.invite.id} onOpenChange={setShowQuoteForm}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedRFQ(invite)}
                            data-testid={`button-create-quote-${invite.invite.id}`}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Quote
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Submit Quote for {invite.rfq.rfqNumber}</DialogTitle>
                          </DialogHeader>
                          
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmitQuote)} className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  name="toolingCost"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Tooling Cost (₹) - Optional</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="Enter tooling cost"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                          data-testid="input-tooling-cost"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                <FormField
                                  control={form.control}
                                  name="validityDays"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Quote Validity (Days)</FormLabel>
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
                                name="notes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Additional Notes</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Any additional information about your quote..."
                                        {...field}
                                        data-testid="textarea-notes"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="flex justify-end space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowQuoteForm(false)}
                                  data-testid="button-cancel-quote"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={createQuoteMutation.isPending}
                                  data-testid="button-submit-quote"
                                >
                                  {createQuoteMutation.isPending ? 'Submitting...' : 'Submit Quote'}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submitted Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          {quotesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading quotes...</div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No quotes submitted yet</h3>
              <p className="text-muted-foreground">
                Submit your first quote when you receive an RFQ invitation
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">RFQ ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Unit Price</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Lead Time</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Total Amount</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Submitted</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quotes.map((quote: any) => (
                    <tr key={quote.id} data-testid={`row-quote-${quote.id}`}>
                      <td className="py-4 px-6 text-sm font-mono" data-testid={`text-quote-rfq-${quote.id}`}>
                        {quote.rfqId}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium" data-testid={`text-quote-price-${quote.id}`}>
                        ₹{quote.quoteJson?.unitPrice?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {quote.quoteJson?.leadTimeDays || 'N/A'} days
                      </td>
                      <td className="py-4 px-6 text-sm font-medium">
                        ₹{quote.quoteJson?.totalAmount?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          className={
                            quote.status === 'submitted'
                              ? 'bg-blue-100 text-blue-800'
                              : quote.status === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {quote.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setLocation(`/supplier/rfq/${quote.rfqId}`)}
                          data-testid={`button-view-quote-${quote.id}`}
                        >
                          View Details
                        </Button>
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
