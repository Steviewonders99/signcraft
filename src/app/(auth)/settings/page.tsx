'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SignaturePad } from '@/components/signing/SignaturePad';
import { Save, X, Plus, Check, Sun, Moon } from 'lucide-react';
import { NavToggle } from '@/components/layout/NavToggle';
import { ACCENT_PRESETS, setAccent, setTheme } from '@/lib/theme';

export default function SettingsPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [defaultSignature, setDefaultSignature] = useState('');

  // Profile
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');

  // Appearance
  const [accentColor, setAccentColor] = useState('#22c55e');
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');

  // Notifications
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email || '');
    });

    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        setFullName(data.full_name || '');
        setCompanyName(data.company_name || '');
        setCompanyAddress(data.company_address || '');
        setCompanyWebsite(data.company_website || '');
        setServices(data.services || []);
        if (data.accent_color) setAccentColor(data.accent_color);
        if (data.theme) setThemeState(data.theme);
      })
      .catch(() => {});

    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((data) => {
        setEmailEnabled(data.email_enabled ?? true);
        setSmsEnabled(data.sms_enabled ?? false);
        setPhoneNumber(data.phone_number || '');
      })
      .catch(() => {});
  }, [supabase]);

  function handleAddService() {
    const trimmed = newService.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices((prev) => [...prev, trimmed]);
      setNewService('');
    }
  }

  function handleRemoveService(service: string) {
    setServices((prev) => prev.filter((s) => s !== service));
  }

  function handleAccentChange(hex: string) {
    setAccentColor(hex);
    setAccent(hex);
    localStorage.setItem('sc-accent', hex);
  }

  function handleThemeChange(newTheme: 'light' | 'dark') {
    setThemeState(newTheme);
    setTheme(newTheme);
    localStorage.setItem('sc-theme', newTheme);
  }

  async function handleSave() {
    setSaving(true);

    await Promise.all([
      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          company_name: companyName,
          company_address: companyAddress,
          company_website: companyWebsite,
          services,
          accent_color: accentColor,
          theme,
        }),
      }),
      fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_enabled: emailEnabled,
          sms_enabled: smsEnabled,
          phone_number: phoneNumber || null,
        }),
      }),
    ]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <NavToggle />
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your profile, company, and preferences</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-6">
          {/* Profile */}
          <Card style={{ backgroundColor: 'var(--bg-card)' }}>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled className="opacity-60" />
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card style={{ backgroundColor: 'var(--bg-card)' }}>
            <CardHeader>
              <CardTitle className="text-base">Company</CardTitle>
              <CardDescription>Used in contracts and templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <textarea
                  value={companyAddress}
                  onChange={(e) => {
                    setCompanyAddress(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  placeholder={"123 Main St, Suite 100\nSan Francisco, CA 94105"}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm leading-snug transition-colors outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  style={{ maxHeight: '120px' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card style={{ backgroundColor: 'var(--bg-card)' }}>
            <CardHeader>
              <CardTitle className="text-base">Services</CardTitle>
              <CardDescription>What your company offers — reference these in contracts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border"
                      style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                      {service}
                      <button
                        onClick={() => handleRemoveService(service)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddService();
                    }
                  }}
                  placeholder="Add a service..."
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleAddService} disabled={!newService.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">
          {/* Appearance */}
          <Card style={{ backgroundColor: 'var(--bg-card)' }}>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>Customize the look of your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme toggle */}
              <div className="space-y-3">
                <Label>Theme</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-all ${
                      theme === 'light'
                        ? 'border-foreground/30 text-foreground ring-1 ring-foreground/10'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                    }`}
                    style={theme === 'light' ? { backgroundColor: 'var(--bg-elevated)' } : undefined}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <Sun className="w-5 h-5" />
                    </div>
                    Light
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-all ${
                      theme === 'dark'
                        ? 'border-foreground/30 text-foreground ring-1 ring-foreground/10'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                    }`}
                    style={theme === 'dark' ? { backgroundColor: 'var(--bg-elevated)' } : undefined}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <Moon className="w-5 h-5" />
                    </div>
                    Dark
                  </button>
                </div>
              </div>

              {/* Accent color */}
              <div className="space-y-3">
                <Label>Accent Color</Label>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      onClick={() => handleAccentChange(preset.hex)}
                      className="relative w-10 h-10 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: preset.hex,
                        borderColor: accentColor === preset.hex ? 'white' : 'transparent',
                        boxShadow: accentColor === preset.hex ? `0 0 0 3px ${preset.hex}40` : undefined,
                      }}
                      title={preset.name}
                    >
                      {accentColor === preset.hex && (
                        <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-muted-foreground">Custom:</span>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => handleAccentChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs text-muted-foreground font-mono">{accentColor}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Default Signature */}
          <Card style={{ backgroundColor: 'var(--bg-card)' }}>
            <CardHeader>
              <CardTitle className="text-base">Default Signature</CardTitle>
              <CardDescription>Used when you countersign documents</CardDescription>
            </CardHeader>
            <CardContent>
              <SignaturePad onChange={setDefaultSignature} />
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card style={{ backgroundColor: 'var(--bg-card)' }}>
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>How you want to be notified</CardDescription>
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
        </div>
      </div>

      {/* Mobile-only save button (sticky at bottom) */}
      <div className="lg:hidden mt-6">
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
