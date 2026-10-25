import React, { useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { FeatureShaderCard } from './ui/feature-shader-card';
import { Card, CardContent } from './ui/card';
import { 
  FileText, Zap, Mic, PieChart, MonitorPlay, Video, Volume2, ImageIcon, 
  Languages, ListTodo, Activity, Bot, BarChart2, ClipboardCheck, Loader2, Square 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ViewType } from '../types';

export interface HomeViewProps {
  t: any;
  handleSend: (input: string) => void;
  isDictating: boolean;
  isTranscribing: boolean;
  toggleDictation: (onTranscribe?: (text: string) => void) => void;
  isGlobalAssistantLoading: boolean;
  setCurrentView: (view: ViewType) => void;
  recentActivity: any[];
  setRecentActivity: (activity: any[]) => void;
  updateViewState: (view: ViewType, updates: any) => void;
}

export function HomeView({
  t,
  handleSend,
  isDictating,
  isTranscribing,
  toggleDictation,
  isGlobalAssistantLoading,
  setCurrentView,
  recentActivity,
  setRecentActivity,
  updateViewState
}: HomeViewProps) {
  const [homeInput, setHomeInput] = useState('');

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden relative">
      <ScrollArea className="flex-1">
        <div className="max-w-[1600px] mx-auto w-full space-y-6 pt-6 px-4 lg:px-8 pb-16">
          <header className="mb-4 mt-2 space-y-2 relative">
            <div className="absolute -left-4 top-0 w-1 h-full bg-primary/20 rounded-full" />
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 text-balance">
              {t.welcomeTitle}
            </h2>
            <p className="text-muted-foreground text-base max-w-3xl leading-relaxed font-medium">
              {t.welcomeSubtitle}
            </p>
          </header>

          <div className="relative group max-w-3xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative flex items-center bg-card rounded-2xl shadow-sm border border-foreground/10 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all p-2 pl-4">
               <Input 
                 value={homeInput}
                 onChange={(e) => setHomeInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     handleSend(homeInput);
                     setHomeInput('');
                   }
                 }}
                 placeholder="Want to chat about anything else? Start here..."
                 className="flex-1 border-0 focus-visible:ring-0 shadow-none bg-transparent text-base h-12 px-0"
               />
               <div className="flex items-center gap-1 pr-2">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className={cn("w-10 h-10 rounded-xl hover:bg-primary/10 transition-colors", isDictating && "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50")}
                   onClick={() => toggleDictation((transcribedText) => {
                     setHomeInput(prev => prev ? `${prev} ${transcribedText}` : transcribedText);
                   })}
                   disabled={isTranscribing}
                 >
                   {isTranscribing ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : (
                     isDictating ? <Square className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" /> : <Mic className="w-5 h-5 text-primary" />
                   )}
                 </Button>
               </div>
               <Button 
                 onClick={() => {
                   handleSend(homeInput);
                   setHomeInput('');
                 }}
                 disabled={!homeInput.trim() || isGlobalAssistantLoading}
                 className="h-12 px-8 rounded-xl font-bold tracking-wide"
               >
                 Ask
               </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <FeatureShaderCard 
              title={t.plan} 
              description={t.createPlanDesc} 
              icon={<FileText className="w-6 h-6" />}
              onClick={() => setCurrentView('plan')}
              colorIndex={0}
            />
            <FeatureShaderCard 
              title={t.campaign} 
              description={t.campaignAnalysisDesc} 
              icon={<Zap className="w-6 h-6" />}
              onClick={() => setCurrentView('campaign')}
              colorIndex={2}
            />
            <FeatureShaderCard 
              title={t.transcribe} 
              description={t.transcribeDesc} 
              icon={<Mic className="w-6 h-6" />}
              onClick={() => setCurrentView('transcribe')}
              colorIndex={3}
            />
            <FeatureShaderCard 
              title={t.visualize} 
              description={t.visualizeDesc} 
              icon={<PieChart className="w-6 h-6" />}
              onClick={() => setCurrentView('visualize')}
              colorIndex={4}
            />
            <FeatureShaderCard 
              title={t.presentation} 
              description={t.presentationDesc} 
              icon={<MonitorPlay className="w-6 h-6" />}
              onClick={() => setCurrentView('presentation')}
              colorIndex={5}
            />
            <FeatureShaderCard 
              title={t.storyboardTitle} 
              description={t.storyboardDesc} 
              icon={<Video className="w-6 h-6" />}
              onClick={() => setCurrentView('storyboard')}
              colorIndex={0}
            />
            <FeatureShaderCard 
              title={t.tts} 
              description={t.ttsDesc} 
              icon={<Volume2 className="w-6 h-6" />}
              onClick={() => setCurrentView('tts')}
              colorIndex={1}
            />
            <FeatureShaderCard 
              title="Image Generation" 
              description="Generate stunning brand-aligned visuals and art locally." 
              icon={<ImageIcon className="w-6 h-6" />}
              onClick={() => setCurrentView('image-gen')}
              colorIndex={2}
            />
            <FeatureShaderCard 
              title="Translation Engine" 
              description="Translate your marketing materials instantly across 50+ languages." 
              icon={<Languages className="w-6 h-6" />}
              onClick={() => setCurrentView('translation')}
              colorIndex={3}
            />
            <FeatureShaderCard 
              title={t.tasks} 
              description={t.manageTasksDesc} 
              icon={<ListTodo className="w-6 h-6" />}
              onClick={() => setCurrentView('tasks')}
              colorIndex={4}
            />
          </div>

        <div className="mt-8 border-t pt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2 font-heading">
              <Activity className="w-5 h-5 text-primary" /> {t.recentActivity}
            </h3>
            {recentActivity.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setRecentActivity([])} className="h-8 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                {t.clearHistory}
              </Button>
            )}
          </div>
          
          {recentActivity.length === 0 ? (
            <Card className="premium-card border-dashed border-2 bg-transparent">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4 mx-auto border border-primary/10">
                  <Activity className="w-8 h-8 text-primary opacity-40" />
                </div>
                <p className="text-muted-foreground font-medium italic serif">{t.noActivity}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="premium-card overflow-hidden">
              <ScrollArea className="h-[450px]">
                <div className="p-4 space-y-3">
                  {recentActivity.map((activity) => (
                    <Card 
                      key={activity.id} 
                      className={`premium-card border-l-4 border-l-primary/30 hover:border-l-primary hover:bg-card/60 transition-all ${activity.view ? 'cursor-pointer' : 'cursor-default'}`}
                      onClick={() => {
                        if (activity.view) {
                          setCurrentView(activity.view);
                          if (activity.itemId) {
                            updateViewState(activity.view, { activeConversationId: activity.itemId });
                          }
                        }
                      }}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`vibrant-icon-container w-10 h-10 shrink-0 shadow-sm ${
                          activity.type === 'plan' ? 'vibrant-icon-red' :
                          activity.type === 'analyze' ? 'vibrant-icon-orange' :
                          activity.type === 'presentation' ? 'vibrant-icon-red' :
                          activity.type === 'chat' ? 'vibrant-icon-blue' :
                          'vibrant-icon-green'
                        }`}>
                          {activity.type === 'plan' && <FileText className="w-5 h-5 text-foreground" />}
                          {activity.type === 'analyze' && <BarChart2 className="w-5 h-5 text-foreground" />}
                          {activity.type === 'presentation' && <MonitorPlay className="w-5 h-5 text-foreground" />}
                          {activity.type === 'chat' && <Bot className="w-5 h-5 text-foreground" />}
                          {activity.type === 'marketing' && <ClipboardCheck className="w-5 h-5 text-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5 gap-2">
                            <h4 className="font-bold text-sm truncate">{activity.title}</h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 font-medium">
                              {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate opacity-70 italic serif">{activity.details}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      </div>
    </ScrollArea>
  </div>
  );
}

