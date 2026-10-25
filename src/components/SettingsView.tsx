import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Key, Bot, ShieldCheck, Building2, Upload } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { PromptEnhancer } from './PromptEnhancer';

export interface SettingsViewProps {
  currentViewState: any;
  t: any;
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleSaveProfile: () => void;
  brandIdentity: any;
  setBrandIdentity: React.Dispatch<React.SetStateAction<any>>;
  handleBrandLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  brandLogoInputRef: React.RefObject<HTMLInputElement>;
  handleSaveBrandIdentity: () => void;
  notificationSettings: any[];
  setNotificationSettings: React.Dispatch<React.SetStateAction<any[]>>;
  handleSavePreferences: () => void;
  draftLanguage: any;
  setDraftLanguage: React.Dispatch<React.SetStateAction<any>>;
  draftTimezone: string;
  setDraftTimezone: React.Dispatch<React.SetStateAction<string>>;
  handleUpdateRegion: () => void;
  is2FAEnabled: boolean;
  setIs2FAEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  addToast: (msg: string, type?: 'success'|'error'|'info') => void;
  isPasswordModalOpen: boolean;
  setIsPasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  passwordForm: any;
  setPasswordForm: React.Dispatch<React.SetStateAction<any>>;
}

export function SettingsView(props: SettingsViewProps) {
  const {
    currentViewState, t, profile, setProfile, handleAvatarChange, fileInputRef, handleSaveProfile,
    brandIdentity, setBrandIdentity, handleBrandLogoChange, brandLogoInputRef, handleSaveBrandIdentity,
    notificationSettings, setNotificationSettings, handleSavePreferences,
    draftLanguage, setDraftLanguage, draftTimezone, setDraftTimezone, handleUpdateRegion,
    is2FAEnabled, setIs2FAEnabled, addToast,
    isPasswordModalOpen, setIsPasswordModalOpen, passwordForm, setPasswordForm
  } = props;

  if (!currentViewState) return null;
  const activeTab = currentViewState.activeTab || 'profile';

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-white/40 dark:bg-card/50 backdrop-blur-xl z-10 w-full max-w-5xl mx-auto border-x shadow-sm relative">
      {/* Password Update Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md premium-card animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" /> {t.updatePassword}
              </CardTitle>
              <CardDescription>Enter your current password and choose a new one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.currentPassword}</label>
                <Input 
                  type="password" 
                  value={passwordForm?.old || ''} 
                  onChange={(e) => setPasswordForm((prev: any) => ({ ...prev, old: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.newPassword}</label>
                <Input 
                  type="password" 
                  value={passwordForm?.new || ''} 
                  onChange={(e) => setPasswordForm((prev: any) => ({ ...prev, new: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.confirmPassword}</label>
                <Input 
                  type="password" 
                  value={passwordForm?.confirm || ''} 
                  onChange={(e) => setPasswordForm((prev: any) => ({ ...prev, confirm: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsPasswordModalOpen(false)}>{t.cancel}</Button>
                <Button className="flex-1" onClick={() => {
                  if (!passwordForm.old || !passwordForm.new || !passwordForm.confirm) {
                    addToast("Please fill in all fields.", "error");
                    return;
                  }
                  if (passwordForm.new !== passwordForm.confirm) {
                    addToast("Passwords do not match!", "error");
                    return;
                  }
                  if (passwordForm.new.length < 8) {
                    addToast("Password must be at least 8 characters.", "error");
                    return;
                  }
                  addToast("Password updated successfully!", "success");
                  setIsPasswordModalOpen(false);
                  setPasswordForm({ old: '', new: '', confirm: '' });
                }}>{t.updatePassword}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="pl-16 pr-8 lg:px-8 py-4 border-b bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <h2 className="text-2xl font-bold tracking-tight">
          {activeTab === 'profile' && t.profile}
          {activeTab === 'account' && t.account}
          {activeTab === 'notifications' && t.notifications}
          {activeTab === 'region' && t.region}
          {activeTab === 'brand' && t.brandIdentity}
        </h2>
        <p className="text-muted-foreground text-sm italic serif">
          {activeTab === 'profile' && t.profileDesc}
          {activeTab === 'account' && t.accountDesc}
          {activeTab === 'notifications' && t.notificationsDesc}
          {activeTab === 'region' && t.regionDesc}
          {activeTab === 'brand' && t.brandIdentityDesc}
        </p>
      </header>
      
      <div className="p-6 w-full space-y-12 pb-32">
        {activeTab === 'profile' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="premium-card">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                    {profile.avatarUrl ? (
                      <AvatarImage src={profile.avatarUrl} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                        {profile.fullName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                    <Button size="sm" onClick={() => fileInputRef.current?.click()}>{t.changeAvatar}</Button>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.avatarSizeDesc}</p>
                  </div>
                </div>
                <Separator className="bg-white/5" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.fullName}</label>
                    <Input 
                      value={profile?.fullName || ''} 
                      onChange={(e) => setProfile((prev: any) => ({ ...prev, fullName: e.target.value }))}
                      className="bg-background/50 border-white/10" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.email}</label>
                    <Input 
                      value={profile?.email || ''} 
                      onChange={(e) => setProfile((prev: any) => ({ ...prev, email: e.target.value }))}
                      type="email" 
                      className="bg-background/50 border-white/10" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.jobTitle}</label>
                    <Input 
                      value={profile?.jobTitle || ''} 
                      onChange={(e) => setProfile((prev: any) => ({ ...prev, jobTitle: e.target.value }))}
                      className="bg-background/50 border-white/10" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.organization}</label>
                    <Input 
                      value={profile?.organization || ''} 
                      onChange={(e) => setProfile((prev: any) => ({ ...prev, organization: e.target.value }))}
                      className="bg-background/50 border-white/10" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.phoneNumber}</label>
                    <Input 
                      value={profile?.phoneNumber || ''} 
                      onChange={(e) => setProfile((prev: any) => ({ ...prev, phoneNumber: e.target.value }))}
                      className="bg-background/50 border-white/10" 
                    />
                  </div>
                </div>
                <Separator className="bg-white/5" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Personal AI Context</label>
                    <p className="text-sm text-muted-foreground">
                      Give the AI context about how you work, what you do, and your preferences to personalize your experience across the <strong>entire platform</strong>. 
                      You can generate this profile by using the <strong>sample prompt below</strong> in any AI platform like ChatGPT, Claude, or Gemini, and then pasting the result into the box below.
                    </p>
                  </div>
                  
                  <div className="bg-secondary/30 p-4 rounded-xl border border-white/5 space-y-3">
                    <p className="text-sm italic text-muted-foreground">
                      "Please summarize my profile, how I work, what I do, and any important context about me from our past conversations into a concise text that I can use to personalize another AI's interactions with me. Focus on my preferences, industry, role, and typical tasks."
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const prompt = "Please summarize my profile, how I work, what I do, and any important context about me from our past conversations into a concise text that I can use to personalize another AI's interactions with me. Focus on my preferences, industry, role, and typical tasks.";
                        navigator.clipboard.writeText(prompt);
                        addToast("Sample prompt copied to clipboard!", "success");
                      }}
                    >
                      Copy Sample Prompt
                    </Button>
                  </div>
                  
                  <Textarea 
                    value={profile.userContext || ''} 
                    onChange={(e) => setProfile((prev: any) => ({ ...prev, userContext: e.target.value }))}
                    className="bg-background/50 border-white/10 min-h-[150px]"
                    placeholder="Paste the extracted AI memory here, or manually type your own context (e.g., I am a Marketing Director at a consumer brand who prefers concise, data-driven answers and highly professional tone...)"
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveProfile}
                    className="font-mono text-[10px] uppercase tracking-widest"
                  >
                    {t.saveProfile}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {activeTab === 'account' && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AI Configuration */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Bot className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">{t.aiPreferences}</h3>
              </div>
              <Card className="premium-card">
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.defaultModel}</label>
                        <Select defaultValue="gemini-pro">
                          <SelectTrigger className="w-full rounded-xl border-white/10 bg-background/50">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="gemini-pro">Pro (Recommended)</SelectItem>
                            <SelectItem value="gemini-flash">Flash (Faster)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.responseTone}</label>
                        <Select defaultValue="professional">
                          <SelectTrigger className="w-full rounded-xl border-white/10 bg-background/50">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="professional">{t.professionalAnalytical}</SelectItem>
                            <SelectItem value="creative">{t.creativeBold}</SelectItem>
                            <SelectItem value="concise">{t.conciseExecutive}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.dataPrivacyLevel}</label>
                        <div className="p-4 bg-secondary/30 rounded-lg border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{t.enterpriseShield}</span>
                            <Badge className="bg-green-500/20 text-green-500 border-none text-[9px]">{t.active}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{t.dataPrivacyDesc}</p>
                          <div className="pt-2 border-t border-white/5 text-[9px] text-muted-foreground/80">
                            Looking for full legal details? See the <span className="text-primary font-bold">Platform Guide &gt; Privacy &amp; Security Policy</span> tab for GDPR compliance, data ownership terms, and model training isolation details.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="vibrant-icon-container w-12 h-12 vibrant-icon-blue">
                  <ShieldCheck className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">{t.security}</h3>
              </div>
              <Card className="premium-card">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t.twoFactor}</p>
                      <p className="text-xs text-muted-foreground">{t.twoFactorDesc}</p>
                    </div>
                    <Button 
                      variant={is2FAEnabled ? "secondary" : "outline"} 
                      size="sm"
                      onClick={() => {
                        setIs2FAEnabled(!is2FAEnabled);
                        addToast(`Two-Factor Authentication ${!is2FAEnabled ? 'enabled' : 'disabled'}`, "info");
                      }}
                    >
                      {is2FAEnabled ? t.disable : t.enable}
                    </Button>
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t.password}</p>
                      <p className="text-xs text-muted-foreground">{t.lastChangedPassword}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsPasswordModalOpen(true)}>{t.update}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Danger Zone */}
            <div className="pt-12">
              <div className="p-8 bg-destructive/5 rounded-2xl border border-destructive/20">
                <h3 className="text-lg font-bold text-destructive mb-2">{t.dangerZone}</h3>
                <p className="text-sm text-muted-foreground mb-6">{t.dangerZoneDesc}</p>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" className="font-mono text-[10px] uppercase tracking-widest border-destructive/20 text-destructive hover:bg-destructive/10">{t.deactivateAccount}</Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="premium-card">
              <CardContent className="p-8 space-y-8">
                {notificationSettings.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="max-w-[80%]">
                      <p className="text-sm font-medium">
                        {item.id === 'email' && t.emailNotifications}
                        {item.id === 'push' && t.pushNotifications}
                        {item.id === 'marketing' && t.marketingEmails}
                        {item.id === 'security' && t.securityAlerts}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <div 
                      onClick={() => {
                        if (item.required) return;
                        setNotificationSettings((prev: any) => prev.map((s: any) => s.id === item.id ? { ...s, enabled: !s.enabled } : s));
                      }}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${item.enabled ? 'bg-primary' : 'bg-secondary'} ${item.required ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${item.enabled ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSavePreferences} className="font-mono text-[10px] uppercase tracking-widest">{t.savePreferences}</Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {activeTab === 'region' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="premium-card">
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.language}</label>
                    <Select 
                      value={draftLanguage}
                      onValueChange={(val) => setDraftLanguage(val as any)}
                    >
                      <SelectTrigger className="w-full rounded-xl border-white/10 bg-background/50">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr-af">Français (Afrique)</SelectItem>
                        <SelectItem value="es-la">Español (Latinoamérica)</SelectItem>
                        <SelectItem value="pt-af">Português (África)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.timezone}</label>
                    <Select 
                      value={draftTimezone}
                      onValueChange={(val) => setDraftTimezone(val)}
                    >
                      <SelectTrigger className="w-full rounded-xl border-white/10 bg-background/50">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl max-w-[320px]">
                        <SelectItem value="utc">UTC (Universal)</SelectItem>
                        <SelectItem value="gmt">{t.gmt}</SelectItem>
                        <SelectItem value="cet">{t.cet}</SelectItem>
                        <SelectItem value="eet">{t.eet}</SelectItem>
                        <SelectItem value="moscow">Moscow (UTC+3)</SelectItem>
                        <SelectItem value="wat">West Africa (UTC+1)</SelectItem>
                        <SelectItem value="cat">Central Africa (UTC+2)</SelectItem>
                        <SelectItem value="eat">East Africa (UTC+3)</SelectItem>
                        <SelectItem value="sast">South Africa (UTC+2)</SelectItem>
                        <SelectItem value="ast">{t.ast}</SelectItem>
                        <SelectItem value="uae">Gulf (UTC+4)</SelectItem>
                        <SelectItem value="ist">{t.ist}</SelectItem>
                        <SelectItem value="azt">{t.azt}</SelectItem>
                        <SelectItem value="trt">{t.trt}</SelectItem>
                        <SelectItem value="pkt">Pakistan (UTC+5)</SelectItem>
                        <SelectItem value="pet">Peru (UTC-5)</SelectItem>
                        <SelectItem value="bot">Bolivia (UTC-4)</SelectItem>
                        <SelectItem value="cot">Colombia (UTC-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.dateFormat}</label>
                    <Select defaultValue="iso">
                      <SelectTrigger className="w-full rounded-xl border-white/10 bg-background/50">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="iso">YYYY-MM-DD</SelectItem>
                        <SelectItem value="us">MM/DD/YYYY</SelectItem>
                        <SelectItem value="eu">DD/MM/YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleUpdateRegion} className="font-mono text-[10px] uppercase tracking-widest">{t.updateRegion}</Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {activeTab === 'brand' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" /> {t.brandProfile}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Logo Upload */}
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32 bg-secondary/30 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative group">
                    {brandIdentity.logoUrl ? (
                      <img src={brandIdentity.logoUrl} alt="Brand Logo" className="w-full h-full object-contain p-4" />
                    ) : (
                      <Building2 className="w-12 h-12 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="ghost" className="text-white" onClick={() => brandLogoInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> {t.update}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold">{t.brandLogo}</h4>
                    <p className="text-xs text-muted-foreground">{t.avatarSizeDesc}</p>
                    <input 
                      type="file" 
                      ref={brandLogoInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleBrandLogoChange}
                    />
                    <Button size="sm" onClick={() => brandLogoInputRef.current?.click()}>{t.uploadLogo}</Button>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Colors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.primaryColor}</label>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-lg border border-white/10 shrink-0" style={{ backgroundColor: brandIdentity.primaryColor }} />
                      <Input 
                        value={brandIdentity?.primaryColor || ''} 
                        onChange={(e) => setBrandIdentity((prev: any) => ({ ...prev, primaryColor: e.target.value }))}
                        className="bg-background/50 border-white/10 font-mono" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.secondaryColor}</label>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-lg border border-white/10 shrink-0" style={{ backgroundColor: brandIdentity.secondaryColor }} />
                      <Input 
                        value={brandIdentity?.secondaryColor || ''} 
                        onChange={(e) => setBrandIdentity((prev: any) => ({ ...prev, secondaryColor: e.target.value }))}
                        className="bg-background/50 border-white/10 font-mono" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.accentColor}</label>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-lg border border-white/10 shrink-0" style={{ backgroundColor: brandIdentity.accentColor }} />
                      <Input 
                        value={brandIdentity?.accentColor || ''} 
                        onChange={(e) => setBrandIdentity((prev: any) => ({ ...prev, accentColor: e.target.value }))}
                        className="bg-background/50 border-white/10 font-mono" 
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Tone & Guidelines */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.toneOfVoice}</label>
                    <Select 
                      value={brandIdentity?.toneOfVoice || 'Professional & Analytical'}
                      onValueChange={(val) => setBrandIdentity((prev: any) => ({ ...prev, toneOfVoice: val }))}
                    >
                      <SelectTrigger className="w-full rounded-xl border-white/10 bg-background/50">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Professional & Analytical">{t.professionalAnalytical}</SelectItem>
                        <SelectItem value="Creative & Bold">{t.creativeBold}</SelectItem>
                        <SelectItem value="Concise & Executive">{t.conciseExecutive}</SelectItem>
                        <SelectItem value="Friendly & Approachable">Friendly & Approachable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.brandGuidelines}</label>
                      <PromptEnhancer 
                        value={brandIdentity?.guidelines || ''} 
                        onEnhance={(val) => setBrandIdentity((prev: any) => ({ ...prev, guidelines: val }))}
                      />
                    </div>
                    <Textarea 
                      value={brandIdentity?.guidelines || ''} 
                      onChange={(e) => setBrandIdentity((prev: any) => ({ ...prev, guidelines: e.target.value }))}
                      placeholder={t.brandGuidelinesPlaceholder}
                      className="min-h-[150px] bg-background/50 border-white/10 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveBrandIdentity}
                    className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-white"
                  >
                    Save Brand Identity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}

