import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, FileText, Calendar, Factory, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authenticatedApiClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

export default function SupplierRFQDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: rfq, isLoading } = useQuery({
    queryKey: [`/api/protected/rfqs/${id}`],
    queryFn: () => authenticatedApiClient.get(`/api/protected/rfqs/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading RFQ details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">RFQ Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested RFQ could not be found.</p>
          <Button onClick={() => setLocation('/supplier/quotes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  const handleDownloadFile = (file: any) => {
    try {
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/supplier/quotes')}
              data-testid="button-back-to-quotes"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotes
            </Button>
            <div>
              <h1 className="text-3xl font-bold" data-testid="heading-rfq-title">{rfq.title}</h1>
              <p className="text-muted-foreground" data-testid="text-rfq-number">{rfq.rfqNumber}</p>
            </div>
          </div>
          <Badge
            className={`px-3 py-1 ${
              rfq.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              rfq.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
              rfq.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
              rfq.status === 'invited' ? 'bg-purple-100 text-purple-800' :
              rfq.status === 'quoted' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}
            data-testid="badge-rfq-status"
          >
            {(rfq.status || 'draft').replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="font-medium" data-testid="text-industry">
                      {rfq.details?.industry?.replace('_', ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Process</p>
                    <p className="font-medium" data-testid="text-process">
                      {rfq.details?.sku?.processName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium" data-testid="text-quantity">
                      {rfq.details?.items?.[0]?.quantity || 'N/A'} {rfq.details?.items?.[0]?.unit || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Target Unit Price</p>
                    <p className="font-medium" data-testid="text-target-price">
                      {rfq.details?.items?.[0]?.targetUnitPrice 
                        ? formatCurrency(rfq.details.items[0].targetUnitPrice)
                        : 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-foreground" data-testid="text-description">
                    {rfq.description || 'No description provided'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Factory className="h-5 w-5 mr-2" />
                  Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rfq.details?.items?.length > 0 ? (
                  <div className="space-y-4">
                    {rfq.details.items.map((item: any, index: number) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Material</p>
                            <p className="font-medium">{item.material || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Dimensions</p>
                            <p className="font-medium">{item.dimensions || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Tolerance</p>
                            <p className="font-medium">{item.tolerance || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Finish</p>
                            <p className="font-medium">{item.finish || 'N/A'}</p>
                          </div>
                        </div>
                        {item.specifications && (
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground">Additional Specifications</p>
                            <p className="text-foreground">{item.specifications}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No technical specifications provided</p>
                )}
              </CardContent>
            </Card>

            {/* Attached Files */}
            {(rfq.details?.attachments?.length > 0 || rfq.details?.files?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Attached Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(rfq.details.attachments ?? rfq.details.files).map((file: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleDownloadFile(file)}
                        data-testid={`file-attachment-${index}`}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium" data-testid="text-created-date">
                    {new Date(rfq.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quote Deadline</p>
                  <p className="font-medium text-orange-600" data-testid="text-quote-deadline">
                    {rfq.details?.quoteDeadline 
                      ? new Date(rfq.details.quoteDeadline).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Delivery</p>
                  <p className="font-medium" data-testid="text-expected-delivery">
                    {rfq.details?.expectedDeliveryDate 
                      ? new Date(rfq.details.expectedDeliveryDate).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rfq.details?.requiresSample && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Sample Required</span>
                  </div>
                )}
                {rfq.details?.urgentRequest && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Urgent Request</span>
                  </div>
                )}
                {rfq.details?.qualityCertification && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Quality Certification Required</span>
                  </div>
                )}
                {!rfq.details?.requiresSample && !rfq.details?.urgentRequest && !rfq.details?.qualityCertification && (
                  <p className="text-sm text-muted-foreground">No special requirements</p>
                )}
              </CardContent>
            </Card>

            {/* Action Button */}
            <Button 
              onClick={() => setLocation('/supplier/quotes')}
              className="w-full"
              data-testid="button-back-to-quotes-action"
            >
              Back to Submit Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}