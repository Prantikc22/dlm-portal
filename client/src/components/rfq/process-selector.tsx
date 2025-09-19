import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/supabase';
import { SKU } from '@shared/schema';

interface ProcessSelectorProps {
  selectedIndustry: string;
  selectedProcess?: string;
  onProcessSelect: (process: SKU) => void;
}

export function ProcessSelector({ selectedIndustry, selectedProcess, onProcessSelect }: ProcessSelectorProps) {
  const { data: skus = [], isLoading } = useQuery({
    queryKey: ['/api/skus/industry', selectedIndustry],
    queryFn: () => apiClient.get(`/api/skus/industry/${selectedIndustry}`) as Promise<SKU[]>,
    enabled: !!selectedIndustry,
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading processes...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Select Process</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skus.map((sku) => (
          <Card
            key={sku.code}
            className={`cursor-pointer transition-colors hover:border-primary hover:bg-accent ${
              selectedProcess === sku.code ? 'border-primary bg-accent' : ''
            }`}
            onClick={() => onProcessSelect(sku)}
            data-testid={`card-process-${sku.code}`}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <h4 className="font-semibold">{sku.processName}</h4>
                <p className="text-sm text-muted-foreground">{sku.description}</p>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Default MOQ: {sku.defaultMoq || 'N/A'}</span>
                  <span>Lead Time: {sku.defaultLeadTimeDays || 'N/A'} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
