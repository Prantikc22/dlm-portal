import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { IndustrySelector } from '@/components/rfq/industry-selector';
import { ProcessSelector } from '@/components/rfq/process-selector';
import { Configurator } from '@/components/rfq/configurator';
import { authenticatedApiClient } from '@/lib/supabase';
import { SKU } from '@shared/schema';
import { INDUSTRIES } from '@/lib/constants';

export default function CreateRFQ() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRFQMutation = useMutation({
    mutationFn: (rfqData: any) => 
      authenticatedApiClient.post('/api/protected/rfqs', rfqData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/rfqs'] });
      toast({
        title: "RFQ Created Successfully",
        description: "Your request for quotation has been submitted for review.",
      });
      setLocation('/buyer/rfqs');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create RFQ",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
    setCurrentStep(2);
  };

  const handleProcessSelect = (sku: SKU) => {
    setSelectedSKU(sku);
    setCurrentStep(3);
  };

  const handleConfiguratorSubmit = (data: any) => {
    if (!selectedSKU) return;

    const rfqData = {
      title: data.itemTitle,
      details: {
        industry: selectedIndustry,
        sku: selectedSKU,
        items: [{ ...data, skuCode: selectedSKU.code }],
      },
      ndaRequired: data.ndaRequired,
      confidential: data.confidential,
      budgetRange: data.budgetMin && data.budgetMax ? {
        min: data.budgetMin,
        max: data.budgetMax,
      } : null,
    };

    createRFQMutation.mutate(rfqData);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 2) {
        setSelectedIndustry('');
      } else if (currentStep === 3) {
        setSelectedSKU(null);
      }
    } else {
      setLocation('/buyer/dashboard');
    }
  };

  const steps = [
    { number: 1, title: 'Industry' },
    { number: 2, title: 'Process' },
    { number: 3, title: 'Configurator' },
  ];

  const selectedIndustryData = INDUSTRIES.find(ind => ind.id === selectedIndustry);

  return (
    <div className="p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Create New RFQ</CardTitle>
            <Button variant="outline" onClick={handleBack} data-testid="button-close">
              ✕
            </Button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center space-x-4 pt-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.number
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.number}
                </div>
                <span className={`text-sm ${currentStep >= step.number ? 'font-medium' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && <div className="w-8 h-px bg-border"></div>}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {currentStep === 1 && (
            <IndustrySelector
              selectedIndustry={selectedIndustry}
              onIndustrySelect={handleIndustrySelect}
            />
          )}

          {currentStep === 2 && selectedIndustry && (
            <div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Selected Industry: <span className="font-medium">{selectedIndustryData?.name}</span>
                </p>
              </div>
              <ProcessSelector
                selectedIndustry={selectedIndustry}
                selectedProcess={selectedSKU?.code}
                onProcessSelect={handleProcessSelect}
              />
            </div>
          )}

          {currentStep === 3 && selectedSKU && (
            <div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Selected Process: <span className="font-medium">{selectedSKU.processName}</span>
                </p>
              </div>
              <Configurator
                selectedSKU={selectedSKU}
                onSubmit={handleConfiguratorSubmit}
                onBack={handleBack}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
