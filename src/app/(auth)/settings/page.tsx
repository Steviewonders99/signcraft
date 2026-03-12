'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SignaturePad } from '@/components/signing/SignaturePad';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [defaultSignature, setDefaultSignature] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email || '');
    });

    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((data) => {
        setEmailEnabled(data.email_enabled ?? true);
        setSmsEnabled(data.sms_enabled ?? false);
        setPhoneNumber(data.phone_number || '');
      });
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_enabled: emailEnabled,
        sms_enabled: smsEnabled,
        phone_number: phoneNumber || null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card style={{ backgroundColor: 'var(--bg-card)' }}>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Default Signature */}
      <Card style={{ backgroundColor: 'var(--bg-card)' }}>
        <CardHeader>
          <CardTitle className="text-base">Default Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <SignaturePad onChange={setDefaultSignature} />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card style={{ backgroundColor: 'var(--bg-card)' }}>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">Get notified when contracts are signed</p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">SMS notifications</p>
              <p className="text-xs text-muted-foreground">Receive text messages via Twilio</p>
            </div>
            <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
          </div>
          {smsEnabled && (
            <div className="space-y-2">
              <Label>Phone Number (E.164 format)</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+19545551234"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4 mr-2" />
        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
