import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { setPreferredCurrency, getPreferredCurrency, type SupportedCurrency } from '@/lib/utils';
import { LifeBuoy, Mail, MessageSquare, Save } from 'lucide-react';

export default function AdminSupport() {
  const [currency, setCurrency] = useState<SupportedCurrency>('INR');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(()=>{ setCurrency(getPreferredCurrency()); },[]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support & Preferences</h1>
        <p className="text-muted-foreground">Update admin preferences and reach support</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5"/> Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Currency</label>
              <Select value={currency} onValueChange={(v)=>setCurrency(v as SupportedCurrency)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select currency"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={()=>setPreferredCurrency(currency)} className="mt-2"><Save className="h-4 w-4 mr-1"/>Save Preferences</Button>
            <p className="text-xs text-muted-foreground">Applied to all amounts shown in this browser.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5"/> Contact Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} />
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Message</label>
              <textarea className="w-full border rounded-md p-2 bg-background" rows={5} value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Describe your issue..."/>
            </div>
            <Button disabled={!subject.trim() || !message.trim()}><MessageSquare className="h-4 w-4 mr-1"/>Send</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
