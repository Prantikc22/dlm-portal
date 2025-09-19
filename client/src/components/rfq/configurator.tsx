import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SKU } from '@shared/schema';
import { UNITS, PRIORITIES, TOLERANCES, SURFACE_FINISHES, INSPECTION_TYPES, PACKAGING_TYPES } from '@/lib/constants';

const rfqItemSchema = z.object({
  itemTitle: z.string().min(1, 'Item title is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  targetDeliveryDate: z.string().optional(),
  leadTimeDays: z.number().optional(),
  priority: z.string(),
  material: z.string().min(1, 'Material is required'),
  materialGrade: z.string().optional(),
  tolerance: z.string().optional(),
  surfaceFinish: z.array(z.string()).optional(),
  specialRequirements: z.string().optional(),
  toolingRequired: z.boolean(),
  toolingScopeDescription: z.string().optional(),
  expectedRuns: z.number().optional(),
  sampleRequired: z.boolean(),
  sampleQty: z.number().optional(),
  sampleDeadline: z.string().optional(),
  inspection: z.string(),
  packaging: z.string(),
  targetUnitPrice: z.number().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  ndaRequired: z.boolean(),
  confidential: z.boolean(),
});

type RFQItemForm = z.infer<typeof rfqItemSchema>;

interface ConfiguratorProps {
  selectedSKU: SKU;
  onSubmit: (data: RFQItemForm) => void;
  onBack: () => void;
}

export function Configurator({ selectedSKU, onSubmit, onBack }: ConfiguratorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  const form = useForm<RFQItemForm>({
    resolver: zodResolver(rfqItemSchema),
    defaultValues: {
      priority: 'standard',
      toolingRequired: false,
      sampleRequired: false,
      ndaRequired: false,
      confidential: false,
      inspection: 'basic',
      packaging: 'standard',
      surfaceFinish: [],
    },
  });

  const { watch } = form;
  const toolingRequired = watch('toolingRequired');
  const sampleRequired = watch('sampleRequired');

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (data: RFQItemForm) => {
    onSubmit(data);
  };

  const steps = [
    { number: 1, title: 'Basics' },
    { number: 2, title: 'Files & Geometry' },
    { number: 3, title: 'Material & Specs' },
    { number: 4, title: 'Tooling & Samples' },
    { number: 5, title: 'Add-ons' },
    { number: 6, title: 'Commercial' },
    { number: 7, title: 'Review & Submit' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center space-x-2 flex-shrink-0">
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
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStep === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="itemTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Aluminum Brackets" {...field} data-testid="input-item-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-unit">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UNITS.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  {unit.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="targetDeliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Delivery Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-delivery-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORITIES.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>CAD Files</Label>
                    <div className="mt-2 border-dashed border-2 border-border rounded-lg p-8 text-center">
                      <p className="text-muted-foreground">
                        Upload CAD files (STEP, IGES, STL, DWG, DXF, ZIP, PDF)
                      </p>
                      <Button variant="outline" className="mt-2" data-testid="button-upload-files">
                        Upload Files
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Aluminum 6061, SS304, ABS" {...field} data-testid="input-material" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="materialGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Grade (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., T6, 316L" {...field} data-testid="input-material-grade" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tolerance</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tolerance">
                              <SelectValue placeholder="Select tolerance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TOLERANCES.map((tolerance) => (
                              <SelectItem key={tolerance.value} value={tolerance.value}>
                                {tolerance.label}
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
                    name="specialRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Requirements</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., RoHS compliance, UL certification, special packaging requirements"
                            {...field}
                            data-testid="textarea-special-requirements"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 4 && (
                <>
                  <FormField
                    control={form.control}
                    name="toolingRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-tooling-required"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Tooling Required</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {toolingRequired && (
                    <>
                      <FormField
                        control={form.control}
                        name="toolingScopeDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tooling Scope Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the tooling requirements"
                                {...field}
                                data-testid="textarea-tooling-scope"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expectedRuns"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Production Runs</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 10000"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-expected-runs"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="sampleRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-sample-required"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Sample Required</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {sampleRequired && (
                    <>
                      <FormField
                        control={form.control}
                        name="sampleQty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sample Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 5"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-sample-qty"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sampleDeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sample Deadline</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-sample-deadline" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </>
              )}

              {currentStep === 5 && (
                <>
                  <FormField
                    control={form.control}
                    name="inspection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quality Inspection</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-inspection">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INSPECTION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
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
                    name="packaging"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Packaging</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-packaging">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PACKAGING_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 6 && (
                <>
                  <FormField
                    control={form.control}
                    name="targetUnitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Unit Price (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="₹"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-target-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budgetMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Range Min (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="₹"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-budget-min"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Range Max (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="₹"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-budget-max"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="ndaRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-nda-required"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>NDA Required</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confidential"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-confidential"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Hide buyer identity from suppliers</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 7 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Review Your RFQ</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p><strong>Item:</strong> {form.getValues('itemTitle')}</p>
                    <p><strong>Process:</strong> {selectedSKU.processName}</p>
                    <p><strong>Quantity:</strong> {form.getValues('quantity')} {form.getValues('unit')}</p>
                    <p><strong>Material:</strong> {form.getValues('material')}</p>
                    <p><strong>Priority:</strong> {form.getValues('priority')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox required data-testid="checkbox-terms" />
                    <Label>I agree to the Terms & Conditions and anti-disintermediation policy</Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={handlePrev} data-testid="button-prev">
                Previous
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={onBack} data-testid="button-back">
                Back to Process Selection
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button type="button" onClick={handleNext} data-testid="button-next">
                Continue
              </Button>
            ) : (
              <Button type="submit" data-testid="button-submit-rfq">
                Submit RFQ
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
