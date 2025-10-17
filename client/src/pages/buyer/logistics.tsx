import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { authenticatedApiClient } from '@/lib/supabase';

export default function BuyerLogisticsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    source: '',
    destination: '',
    weightKg: '',
    size: '',
    insuranceRequired: false,
    notes: '',
    pickupDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = async () => {
    if (!form.source || !form.destination || !form.weightKg || !form.size) {
      toast({ title: 'Missing fields', description: 'Please fill source, destination, weight and size.' , variant: 'destructive'});
      return;
    }
    setLoading(true);
    try {
      await authenticatedApiClient.post('/api/protected/logistics', {
        source: form.source,
        destination: form.destination,
        weightKg: parseFloat(form.weightKg),
        size: form.size,
        insuranceRequired: form.insuranceRequired,
        notes: form.notes || undefined,
        pickupDate: form.pickupDate || undefined,
      });
      setSuccess(true);
    } catch (e: any) {
      toast({ title: 'Submission failed', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Logicwerk Logistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold">AI + Human are doing the magic.</p>
            <p>Your Transport Vehicle will be assigned soon.</p>
            <Button className="mt-4" onClick={() => setSuccess(false)}>Create another request</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Logicwerk Logistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Source</Label>
              <Input name="source" value={form.source} onChange={handleChange} placeholder="City / Address" />
            </div>
            <div>
              <Label>Destination</Label>
              <Input name="destination" value={form.destination} onChange={handleChange} placeholder="City / Address" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Total Weight (kg)</Label>
              <Input name="weightKg" type="number" step="0.01" value={form.weightKg} onChange={handleChange} placeholder="e.g., 120.5" />
            </div>
            <div>
              <Label>Size</Label>
              <Input name="size" value={form.size} onChange={handleChange} placeholder="e.g., 1.2m x 0.8m x 0.6m or pallet count" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Pickup Date</Label>
              <Input name="pickupDate" type="date" value={form.pickupDate} onChange={handleChange} />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox id="insurance" checked={form.insuranceRequired} onCheckedChange={(v) => setForm(prev => ({ ...prev, insuranceRequired: Boolean(v) }))} />
              <Label htmlFor="insurance">Insurance Required</Label>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Special instructions" />
          </div>
          <Button onClick={submit} disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
