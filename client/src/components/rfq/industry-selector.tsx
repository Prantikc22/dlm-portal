import { INDUSTRIES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';

interface IndustrySelectorProps {
  selectedIndustry?: string;
  onIndustrySelect: (industry: string) => void;
}

export function IndustrySelector({ selectedIndustry, onIndustrySelect }: IndustrySelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Select Industry</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INDUSTRIES.map((industry) => (
          <Card
            key={industry.id}
            className={`cursor-pointer transition-colors hover:border-primary hover:bg-accent ${
              selectedIndustry === industry.id ? 'border-primary bg-accent' : ''
            }`}
            onClick={() => onIndustrySelect(industry.id)}
            data-testid={`card-industry-${industry.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <i className={`${industry.icon} text-2xl text-primary`}></i>
                <div>
                  <h4 className="font-semibold">{industry.name}</h4>
                  <p className="text-sm text-muted-foreground">{industry.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
