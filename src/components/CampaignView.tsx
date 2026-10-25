import React from 'react';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Zap, 
  Newspaper, 
  Bell, 
  MessageCircle, 
  Video, 
  Youtube, 
  Smartphone,
  Sparkles,
  Loader2,
  Sparkle,
  Copy,
  BarChart3,
  Bot,
  Target,
  ArrowRight,
  Globe
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { PromptEnhancer } from './PromptEnhancer';

interface CampaignViewProps {
  campaignState: any;
  updateViewState: (view: string, updates: any) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  t: any;
  generateCampaignContent: (draft: string, input: string) => void;
  addEmojisToCampaign: () => void;
  addToast: (msg: string, type: string) => void;
  analyzeCampaignContent: (draft: string, input: string) => void;
  rewriteCampaignContent: () => void;
  translateCampaignContent: () => void;
}

export function CampaignView({
  campaignState,
  updateViewState,
  isHistoryOpen,
  setIsHistoryOpen,
  t,
  generateCampaignContent,
  addEmojisToCampaign,
  addToast,
  analyzeCampaignContent,
  rewriteCampaignContent,
  translateCampaignContent
}: CampaignViewProps) {
  const activeTab = campaignState.activeTab || 'generate';

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-background w-full max-w-[1600px] mx-auto border-x shadow-sm">
      <header className="pl-16 pr-4 lg:px-8 py-4 border-b bg-card w-full sticky top-0 z-20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-xl hidden lg:flex shrink-0" 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            title={isHistoryOpen ? t.hideHistory : t.showHistory}
          >
            {isHistoryOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </Button>
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight truncate font-heading">{t.campaignAnalysis}</h2>
            <p className="text-[10px] md:text-sm text-muted-foreground italic serif truncate">{t.campaignAnalysisSubtitle}</p>
          </div>
        </div>
        
        <div className="flex gap-2 shrink-0 overflow-x-auto no-scrollbar pb-1 max-w-full">
          <Button 
            variant={activeTab === 'generate' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => updateViewState('campaign', { activeTab: 'generate' })}
            className="text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap px-2 md:px-3"
          >
            {t.generateContent}
          </Button>
          <Button 
            variant={activeTab === 'analyze' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => updateViewState('campaign', { activeTab: 'analyze' })}
            className="text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap px-2 md:px-3"
          >
            {t.analyzeDraft}
          </Button>
          <Button 
            variant={activeTab === 'translate' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => updateViewState('campaign', { activeTab: 'translate' })}
            className="text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap px-2 md:px-3"
          >
            {t.translate}
          </Button>
        </div>
      </header>

      <div className="p-6 w-full space-y-8 pb-32">
        {activeTab === 'generate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.configuration}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.contentFormat}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'newsfeed', label: t.newsFeed, icon: Newspaper },
                        { id: 'push', label: t.pushNotification, icon: Bell },
                        { id: 'whatsapp', label: t.whatsapp, icon: MessageCircle },
                        { id: 'tiktok', label: t.tiktokScript, icon: Video },
                        { id: 'youtube', label: t.youtubeScript, icon: Youtube },
                        { id: 'sms', label: t.smsText, icon: Smartphone }
                      ].map((format) => (
                        <Button
                          key={format.id}
                          variant={campaignState.input === format.id ? 'default' : 'outline'}
                          className="flex flex-col h-auto py-3 gap-2"
                          onClick={() => updateViewState('campaign', { input: format.id })}
                        >
                          <format.icon className="w-5 h-5" />
                          <span className="text-[10px]">{format.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.description}</label>
                      <PromptEnhancer 
                        value={campaignState.campaignDraft || ''} 
                        onEnhance={(val) => updateViewState('campaign', { campaignDraft: val })}
                      />
                    </div>
                    <div className="relative">
                      <textarea
                        className="w-full h-32 bg-background/50 border border-border rounded-xl p-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder={t.descriptionPlaceholder}
                        value={campaignState.campaignDraft || ''}
                        onChange={(e) => updateViewState('campaign', { campaignDraft: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full font-mono text-[10px] uppercase tracking-widest h-12"
                    disabled={campaignState.isLoading || !campaignState.campaignDraft || !campaignState.input}
                    onClick={() => generateCampaignContent(campaignState.campaignDraft || '', campaignState.input)}
                  >
                    {campaignState.isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                    {t.generateMarketingText}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="premium-card h-full min-h-[400px] flex flex-col">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.generatedResult}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-8">
                  {campaignState.campaignResult ? (
                    <div className="prose prose-invert max-w-none">
                      <div className="p-8 glass-card border-primary/20 rounded-2xl relative group shadow-sm">
                        <p className="text-base font-medium leading-relaxed whitespace-pre-wrap text-foreground/90">{campaignState.campaignResult}</p>
                        <div className="absolute top-4 right-4 flex gap-2">
                          {['newsfeed', 'push', 'whatsapp'].includes(campaignState.input) && (
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="h-8 text-[10px] uppercase tracking-widest font-bold shadow-sm bg-primary/10 text-primary hover:bg-primary/20 border-none"
                              onClick={addEmojisToCampaign}
                              disabled={campaignState.isLoading}
                            >
                              <Sparkle className="w-4 h-4 mr-2" /> {t.addEmojis}
                            </Button>
                          )}
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 text-[10px] uppercase tracking-widest font-bold shadow-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(campaignState.campaignResult || '');
                              addToast(t.copiedToClipboard, 'success');
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" /> {t.copyToClipboard}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-8 flex justify-center">
                        <Button 
                          variant="outline" 
                          className="text-[10px] uppercase tracking-widest h-10 px-6"
                          onClick={() => updateViewState('campaign', { activeTab: 'analyze', campaignDraft: campaignState.campaignResult })}
                        >
                          <BarChart3 className="w-5 h-5 mr-2" />
                          {t.analyzeThisResult}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                      <div className="p-4 bg-secondary/30 rounded-full">
                        <Bot className="w-8 h-8" />
                      </div>
                      <p className="text-sm italic serif">{t.yourGeneratedContent}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : activeTab === 'analyze' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.draftAnalysis}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.contentFormatOptional}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'newsfeed', label: t.newsFeed, icon: Newspaper },
                        { id: 'push', label: t.pushNotification, icon: Bell },
                        { id: 'whatsapp', label: t.whatsapp, icon: MessageCircle },
                        { id: 'tiktok', label: t.tiktokScript, icon: Video },
                        { id: 'youtube', label: t.youtubeScript, icon: Youtube },
                        { id: 'sms', label: t.smsText, icon: Smartphone }
                      ].map((format) => (
                        <Button
                          key={format.id}
                          variant={campaignState.input === format.id ? 'default' : 'outline'}
                          className="flex flex-col h-auto py-3 gap-2"
                          onClick={() => updateViewState('campaign', { input: format.id })}
                        >
                          <format.icon className="w-5 h-5" />
                          <span className="text-[10px]">{format.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.pasteDraft}</label>
                    <textarea
                      className="w-full h-48 bg-secondary/10 border border-border rounded-xl p-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder={t.pasteDraftPlaceholder}
                      value={campaignState.campaignDraft || ''}
                      onChange={(e) => updateViewState('campaign', { campaignDraft: e.target.value })}
                    />
                  </div>

                  <Button 
                    className="w-full font-mono text-[10px] uppercase tracking-widest h-12"
                    disabled={campaignState.isLoading || !campaignState.campaignDraft}
                    onClick={() => analyzeCampaignContent(campaignState.campaignDraft || '', campaignState.input)}
                  >
                    {campaignState.isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <BarChart3 className="w-5 h-5 mr-2" />}
                    {t.startAiAnalysis}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {campaignState.campaignAnalysis ? (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  <Card className="premium-card border-primary/10">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">{t.overallWinnability}</h4>
                          <p className="text-xs text-muted-foreground">{t.overallWinnabilityDesc}</p>
                        </div>
                        <div className="text-5xl font-black text-primary drop-shadow-sm">{campaignState.campaignAnalysis.overallScore}%</div>
                      </div>
                      
                      <div className="space-y-8">
                        {[
                          { label: t.clarity, data: campaignState.campaignAnalysis.clarity, icon: Target, color: 'text-foreground', vibrant: 'vibrant-icon-blue' },
                          { label: t.engagement, data: campaignState.campaignAnalysis.engagement, icon: Zap, color: 'text-foreground', vibrant: 'vibrant-icon-orange' },
                          { label: t.outcomeProbability, data: campaignState.campaignAnalysis.outcomes, icon: ArrowRight, color: 'text-foreground', vibrant: 'vibrant-icon-green' }
                        ].map((metric, i) => (
                          <div key={i} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`vibrant-icon-container w-10 h-10 ${metric.vibrant}`}>
                                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{metric.label}</span>
                              </div>
                              <span className="text-xs font-bold">{metric.data.score}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden border border-white/5">
                              <div 
                                className={`h-full transition-all duration-1000 ${metric.color.replace('text', 'bg')}`}
                                style={{ width: `${metric.data.score}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic serif px-1">{metric.data.feedback}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-10 pt-8 border-t border-border">
                        <Button 
                          className="w-full font-mono text-[10px] uppercase tracking-widest h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                          disabled={campaignState.isLoading}
                          onClick={rewriteCampaignContent}
                        >
                          {campaignState.isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                          {t.rewriteToImprove}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
                          {t.rewriteToImproveDesc}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="premium-card h-full min-h-[400px] flex flex-col">
                  <CardContent className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <div className="p-4 bg-secondary/30 rounded-full">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <p className="text-sm italic serif">{t.analysisResultsAppearHere}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.translateContent}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.sourceLanguage}</label>
                      <Select 
                        value={campaignState.translationSourceLang || 'auto'} 
                        onValueChange={(val) => updateViewState('campaign', { translationSourceLang: val === 'auto' ? '' : val })}
                      >
                        <SelectTrigger className="w-full bg-background/50 border-white/10 rounded-xl">
                          <SelectValue placeholder="Auto-detect" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="auto">Auto-detect</SelectItem>
                          {['English', 'French', 'Spanish', 'Portuguese', 'Arabic', 'Russian', 'Amharic', 'Urdu (Traditional)', 'Urdu (Roman)', 'Nepali', 'Turkish', 'Azerbaijani'].sort().map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.targetLanguage}</label>
                      <Select 
                        value={campaignState.translationTargetLang || ''} 
                        onValueChange={(val) => updateViewState('campaign', { translationTargetLang: val })}
                      >
                        <SelectTrigger className="w-full bg-background/50 border-white/10 rounded-xl">
                          <SelectValue placeholder={t.selectLanguage} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {['English', 'French', 'Spanish', 'Portuguese', 'Arabic', 'Russian', 'Amharic', 'Urdu (Traditional)', 'Urdu (Roman)', 'Nepali', 'Turkish', 'Azerbaijani'].sort().map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.targetCountry}</label>
                    <Select 
                      value={campaignState.translationTargetCountry || ''} 
                      onValueChange={(val) => updateViewState('campaign', { translationTargetCountry: val })}
                    >
                      <SelectTrigger className="w-full bg-background/50 border-white/10 rounded-xl">
                        <SelectValue placeholder={t.selectCountry} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {['Senegal', 'Cameroon', 'Ivory Coast', 'DR Congo', 'Morocco', 'Peru', 'Bolivia', 'Colombia', 'Venezuela', 'Guatemala', 'Angola', 'Mozambique', 'Ethiopia', 'Pakistan', 'Nepal', 'Ghana', 'Zambia', 'Namibia', 'UAE', 'Turkey', 'Azerbaijan', 'Russia'].sort().map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.description}</label>
                      <PromptEnhancer 
                        value={campaignState.campaignDraft || campaignState.campaignResult || ''} 
                        onEnhance={(val) => updateViewState('campaign', { campaignDraft: val })}
                      />
                    </div>
                    <textarea
                      className="w-full h-48 bg-secondary/10 border border-border rounded-xl p-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder={t.pasteDraftPlaceholder}
                      value={campaignState.campaignDraft || campaignState.campaignResult || ''}
                      onChange={(e) => updateViewState('campaign', { campaignDraft: e.target.value })}
                    />
                  </div>

                  <Button 
                    className="w-full font-mono text-[10px] uppercase tracking-widest h-12"
                    disabled={campaignState.isLoading || !(campaignState.campaignDraft || campaignState.campaignResult) || !campaignState.translationTargetLang}
                    onClick={translateCampaignContent}
                  >
                    {campaignState.isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Globe className="w-5 h-5 mr-2" />}
                    {t.translateContent}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="premium-card h-full min-h-[400px] flex flex-col">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.translationResult}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-8">
                  {campaignState.translationResult ? (
                    <div className="prose prose-invert max-w-none">
                      <div className="p-8 glass-card border-primary/20 rounded-2xl relative group shadow-sm">
                        <p className="text-base font-medium leading-relaxed whitespace-pre-wrap text-foreground/90">{campaignState.translationResult}</p>
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 text-[10px] uppercase tracking-widest font-bold shadow-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(campaignState.translationResult || '');
                              addToast(t.copiedToClipboard, 'success');
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" /> {t.copyToClipboard}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                      <div className="p-4 bg-secondary/30 rounded-full">
                        <Globe className="w-8 h-8" />
                      </div>
                      <p className="text-sm italic serif">{t.translationResultsAppearHere}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

