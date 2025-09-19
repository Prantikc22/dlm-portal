import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { authenticatedApiClient } from '@/lib/supabase';
import { Upload, Building2, FileCheck, Award } from 'lucide-react';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().default('India'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    pincode: z.string().min(6, 'Valid pincode is required'),
  }),
});

const profileSchema = z.object({
  capabilities: z.array(z.string()).min(1, 'Select at least one capability'),
  machines: z.array(z.string()),
  moqDefault: z.number().min(1, 'Minimum MOQ is required'),
  certifications: z.array(z.string()),
});

type CompanyForm = z.infer<typeof companySchema>;
type ProfileForm = z.infer<typeof profileSchema>;

export default function SupplierOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      country: 'India',
      address: { street: '', pincode: '' },
    },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      capabilities: [],
      machines: [],
      certifications: [],
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data: CompanyForm) =>
      authenticatedApiClient.post('/api/protected/companies', data),
    onSuccess: (company) => {
      setCompanyId(company.id);
      setCurrentStep(2);
      toast({
        title: "Company information saved",
        description: "Please complete your supplier profile.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save company information",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      authenticatedApiClient.post('/api/protected/suppliers/profile', data),
    onSuccess: () => {
      setCurrentStep(3);
      toast({
        title: "Profile created successfully",
        description: "Please upload your documents for verification.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCompanySubmit = (data: CompanyForm) => {
    createCompanyMutation.mutate(data);
  };

  const handleProfileSubmit = (data: ProfileForm) => {
    createProfileMutation.mutate(data);
  };

  const capabilities = [
    'CNC Machining',
    'Sheet Metal Fabrication',
    'Injection Molding',
    'Die Casting',
    'Forging',
    'Extrusion',
    '3D Printing',
    'PCB Assembly',
    'Cable Harness',
    'Packaging',
    'Textile Manufacturing',
    'Leather Goods',
    'Construction',
  ];

  const certifications = [
    'ISO 9001:2015',
    'ISO 14001:2015',
    'ISO 45001:2018',
    'AS9100',
    'TS 16949',
    'FDA Approved',
    'CE Marking',
    'RoHS Compliance',
    'REACH Compliance',
  ];

  const steps = [
    { number: 1, title: 'Company Information', icon: Building2 },
    { number: 2, title: 'Capabilities & Profile', icon: Award },
    { number: 3, title: 'Document Upload', icon: FileCheck },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Supplier Onboarding</h1>
        <p className="text-muted-foreground mt-2">Complete your profile to start receiving RFQ invitations</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center space-x-2">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currentStep >= step.number
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <step.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && <div className="w-16 h-px bg-border"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Company Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-6">
                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="gstin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSTIN (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter GSTIN" {...field} data-testid="input-gstin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="pan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter PAN" {...field} data-testid="input-pan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={companyForm.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter complete address" {...field} data-testid="textarea-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={companyForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state" {...field} data-testid="input-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="address.pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter pincode" {...field} data-testid="input-pincode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createCompanyMutation.isPending}
                  data-testid="button-save-company"
                >
                  {createCompanyMutation.isPending ? 'Saving...' : 'Continue to Profile Setup'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Capabilities & Profile */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Capabilities & Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                <FormField
                  control={profileForm.control}
                  name="capabilities"
                  render={() => (
                    <FormItem>
                      <FormLabel>Manufacturing Capabilities</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {capabilities.map((capability) => (
                          <FormField
                            key={capability}
                            control={profileForm.control}
                            name="capabilities"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(capability)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), capability]
                                        : (field.value || []).filter(value => value !== capability);
                                      field.onChange(updatedValue);
                                    }}
                                    data-testid={`checkbox-capability-${capability.toLowerCase().replace(/\s+/g, '-')}`}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {capability}
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
                  control={profileForm.control}
                  name="moqDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Minimum Order Quantity (MOQ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter default MOQ"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-moq"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="certifications"
                  render={() => (
                    <FormItem>
                      <FormLabel>Certifications</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {certifications.map((certification) => (
                          <FormField
                            key={certification}
                            control={profileForm.control}
                            name="certifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(certification)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), certification]
                                        : (field.value || []).filter(value => value !== certification);
                                      field.onChange(updatedValue);
                                    }}
                                    data-testid={`checkbox-certification-${certification.toLowerCase().replace(/[\s:]/g, '-')}`}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {certification}
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {createProfileMutation.isPending ? 'Saving...' : 'Continue to Document Upload'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Document Upload */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Required Documents</h3>
                
                <div className="border-dashed border-2 border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Company Registration Certificate</p>
                  <p className="text-xs text-muted-foreground mb-3">PDF, JPG, PNG (Max 5MB)</p>
                  <Button variant="outline" size="sm" data-testid="button-upload-registration">
                    Upload File
                  </Button>
                </div>

                <div className="border-dashed border-2 border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">GST Certificate</p>
                  <p className="text-xs text-muted-foreground mb-3">PDF, JPG, PNG (Max 5MB)</p>
                  <Button variant="outline" size="sm" data-testid="button-upload-gst">
                    Upload File
                  </Button>
                </div>

                <div className="border-dashed border-2 border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Bank Account Details</p>
                  <p className="text-xs text-muted-foreground mb-3">PDF, JPG, PNG (Max 5MB)</p>
                  <Button variant="outline" size="sm" data-testid="button-upload-bank">
                    Upload File
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Optional Documents</h3>
                
                <div className="border-dashed border-2 border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">ISO Certificates</p>
                  <p className="text-xs text-muted-foreground mb-3">PDF, JPG, PNG (Max 5MB)</p>
                  <Button variant="outline" size="sm" data-testid="button-upload-iso">
                    Upload File
                  </Button>
                </div>

                <div className="border-dashed border-2 border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Sample Work Photos</p>
                  <p className="text-xs text-muted-foreground mb-3">JPG, PNG (Max 10MB)</p>
                  <Button variant="outline" size="sm" data-testid="button-upload-samples">
                    Upload Files
                  </Button>
                </div>

                <div className="border-dashed border-2 border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Machine List & Capacity</p>
                  <p className="text-xs text-muted-foreground mb-3">PDF, Excel, DOC (Max 5MB)</p>
                  <Button variant="outline" size="sm" data-testid="button-upload-machines">
                    Upload File
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center pt-6 border-t">
              <Button size="lg" data-testid="button-complete-onboarding">
                Complete Onboarding
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Your profile will be reviewed by our team within 2-3 business days
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
