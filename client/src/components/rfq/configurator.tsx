import { useState, useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { SKU } from '@shared/schema';
import { UNITS, PRIORITIES, TOLERANCES, SURFACE_FINISHES, INSPECTION_TYPES, PACKAGING_TYPES, FINISHING_OPTIONS, HEAT_TREATMENT_TYPES, CERTIFICATION_TYPES, SOURCING_PACKAGING_OPTIONS } from '@/lib/constants';
import { Upload, X } from 'lucide-react';

const rfqItemSchema = z.object({
  itemTitle: z.string().min(1, 'Item title is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  targetDeliveryDate: z.string().optional(),
  leadTimeDays: z.number().optional(),
  priority: z.string(),
  material: z.string().optional(),
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
  // Add-ons
  finishing: z.string().optional(),
  heatTreatment: z.string().optional(),
  certification: z.string().optional(),
  sourcingPackaging: z.string().optional(),
  sourcingNotes: z.string().optional(),
  targetUnitPrice: z.number().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  ndaRequired: z.boolean(),
  confidential: z.boolean(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  files: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    data: z.string()
  })).optional(),
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
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, size: number, type: string, data: string}[]>([]);
  const { toast } = useToast();
  
  // File upload refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<RFQItemForm>({
    resolver: zodResolver(rfqItemSchema),
    defaultValues: {
      priority: 'standard',
      toolingRequired: false,
      sampleRequired: false,
      ndaRequired: false,
      confidential: false,
      termsAccepted: false,
      inspection: 'basic',
      packaging: 'standard',
      finishing: 'none',
      heatTreatment: 'none',
      certification: 'none',
      sourcingPackaging: 'reels',
      surfaceFinish: [],
      files: [],
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

  const handleFileUpload = async () => {
    const input = fileInputRef.current;
    if (!input) return;

    input.click();
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type for CAD/engineering files
        const allowedTypes = [
          'application/pdf',
          'image/jpeg', 'image/jpg', 'image/png',
          'application/step', 'model/step', 'application/stp',
          'application/iges', 'model/iges',
          'model/stl', 'application/sla',
          'image/vnd.dwg', 'application/dwg',
          'image/vnd.dxf', 'application/dxf',
          'application/zip',
          'text/plain'
        ];
        
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'step', 'stp', 'iges', 'igs', 'stl', 'dwg', 'dxf', 'zip', 'txt'];
        
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
          toast({
            title: "Invalid file type",
            description: "Please select CAD files (STEP, IGES, STL, DWG, DXF), documents (PDF), images (JPG, PNG), or ZIP files.",
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (50MB max for CAD files, 10MB for others)
        const isCadFile = ['step', 'stp', 'iges', 'igs', 'stl', 'dwg', 'dxf'].includes(fileExtension || '');
        const maxSize = isCadFile ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        
        if (file.size > maxSize) {
          const maxSizeMB = maxSize / (1024 * 1024);
          toast({
            title: "File too large",
            description: `Please select a file smaller than ${maxSizeMB}MB for ${isCadFile ? 'CAD files' : 'documents/images'}.`,
            variant: "destructive",
          });
          continue;
        }

        try {
          // Convert file to base64
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            const newFile = {
              name: file.name,
              size: file.size,
              type: file.type,
              data: base64
            };
            
            setUploadedFiles(prev => {
              const updated = [...prev, newFile];
              // Update form data
              form.setValue('files', updated);
              return updated;
            });
            
            toast({
              title: "File uploaded successfully",
              description: `${file.name} has been added to your RFQ.`,
            });
          };
          reader.readAsDataURL(file);
        } catch (error) {
          toast({
            title: "Upload failed",
            description: "Failed to process the file.",
            variant: "destructive",
          });
        }
      }
      
      // Reset input
      (e.target as HTMLInputElement).value = '';
    };
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      form.setValue('files', updated);
      return updated;
    });
    
    toast({
      title: "File removed",
      description: "File has been removed from your RFQ.",
    });
  };

  const handleSubmit = (data: RFQItemForm) => {
    // Include uploaded files in submission data
    const submissionData = {
      ...data,
      files: uploadedFiles
    };
    onSubmit(submissionData);
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
                        <FormLabel>Item Title *</FormLabel>
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
                          <FormLabel>Quantity *</FormLabel>
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
                          <FormLabel>Unit *</FormLabel>
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
                    <Label>CAD Files & Technical Drawings</Label>
                    <div className="mt-2 border-dashed border-2 border-border rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">
                        Upload CAD files, technical drawings, specifications, or reference images
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supported: STEP, IGES, STL, DWG, DXF, PDF, JPG, PNG, ZIP (up to 50MB for CAD files)
                      </p>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={handleFileUpload}
                        data-testid="button-upload-files"
                      >
                        Select Files
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept=".step,.stp,.iges,.igs,.stl,.dwg,.dxf,.pdf,.jpg,.jpeg,.png,.zip,.txt"
                        style={{ display: 'none' }}
                        data-testid="input-file-upload"
                      />
                    </div>
                    
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</Label>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                  <Upload className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(index)}
                                data-testid={`button-remove-file-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                  <FormField
                    control={form.control}
                    name="finishing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metal Finishing</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-finishing">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FINISHING_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name="heatTreatment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heat Treatment</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-heat-treatment">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HEAT_TREATMENT_TYPES.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name="certification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inspection & Certification</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-certification">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CERTIFICATION_TYPES.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name="sourcingPackaging"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Component Sourcing & Kitting Packaging</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-sourcing-packaging">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SOURCING_PACKAGING_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name="sourcingNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sourcing Notes (BOM, vendors, alternates)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide BOM summary, approved vendors, alternates, etc."
                            {...field}
                            data-testid="textarea-sourcing-notes"
                          />
                        </FormControl>
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
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Review Your RFQ</h3>
                  
                  {/* Basic Information */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p><strong>Item:</strong> {form.getValues('itemTitle')}</p>
                      <p><strong>Process:</strong> {selectedSKU.processName}</p>
                      <p><strong>Quantity:</strong> {form.getValues('quantity')} {form.getValues('unit')}</p>
                      <p><strong>Material:</strong> {form.getValues('material')}</p>
                      <p><strong>Priority:</strong> {form.getValues('priority')}</p>
                      {form.getValues('targetDeliveryDate') && (
                        <p><strong>Delivery Date:</strong> {form.getValues('targetDeliveryDate')}</p>
                      )}
                    </div>
                  </div>

                  {/* Files Section */}
                  {uploadedFiles.length > 0 && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Attached Files ({uploadedFiles.length})</h4>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center space-x-3 text-sm">
                            <Upload className="h-4 w-4 text-primary" />
                            <span>{file.name}</span>
                            <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Material & Specifications */}
                  {(form.getValues('materialGrade') || form.getValues('tolerance') || form.getValues('specialRequirements')) && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Material & Specifications</h4>
                      <div className="space-y-1 text-sm">
                        {form.getValues('materialGrade') && <p><strong>Grade:</strong> {form.getValues('materialGrade')}</p>}
                        {form.getValues('tolerance') && <p><strong>Tolerance:</strong> {form.getValues('tolerance')}</p>}
                        {form.getValues('specialRequirements') && (
                          <p><strong>Special Requirements:</strong> {form.getValues('specialRequirements')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Options */}
                  {(form.getValues('toolingRequired') || form.getValues('sampleRequired') || form.getValues('ndaRequired') || form.getValues('confidential')) && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Additional Options</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {form.getValues('toolingRequired') && <p>✓ Tooling Required</p>}
                        {form.getValues('sampleRequired') && <p>✓ Sample Required</p>}
                        {form.getValues('ndaRequired') && <p>✓ NDA Required</p>}
                        {form.getValues('confidential') && <p>✓ Confidential RFQ</p>}
                      </div>
                    </div>
                  )}

                  {/* Budget Range */}
                  {(form.getValues('budgetMin') || form.getValues('budgetMax') || form.getValues('targetUnitPrice')) && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Budget Information</h4>
                      <div className="space-y-1 text-sm">
                        {form.getValues('targetUnitPrice') && <p><strong>Target Unit Price:</strong> ₹{form.getValues('targetUnitPrice')}</p>}
                        {(form.getValues('budgetMin') && form.getValues('budgetMax')) && (
                          <p><strong>Budget Range:</strong> ₹{form.getValues('budgetMin')} - ₹{form.getValues('budgetMax')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-terms"
                            />
                          </FormControl>
                          <div>
                            <FormLabel className="text-sm cursor-pointer">
                              I agree to the Terms & Conditions and anti-disintermediation policy *
                            </FormLabel>
                            <p className="text-xs text-muted-foreground mt-1">
                              By submitting this RFQ, I confirm that all information provided is accurate and complete.
                            </p>
                            <FormMessage />
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
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
              <Button 
                type="button" 
                data-testid="button-submit-rfq"
                onClick={async (e) => {
                  // Validate the form
                  const isValid = await form.trigger();
                  const formData = form.getValues();
                  
                  if (isValid) {
                    handleSubmit(formData);
                  } else {
                    toast({
                      title: "Please complete all required fields",
                      description: "Check the form for any missing or invalid information.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Submit RFQ
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
