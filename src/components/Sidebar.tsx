import React from 'react';
import { 
  Home, LayoutDashboard, Target, Globe, FileText, Bot, Search, Play, Settings, Menu, Bell, Loader2, Sparkles, Wand2, X, AlertCircle, TrendingUp, History, ListTodo, Presentation, LineChart, Megaphone, Video, Mic, Share2, Plus, GripVertical, CheckSquare, Clock, ArrowRight, Zap, Target as TargetIcon, Brain, Network, BarChart2, Calendar as CalendarIcon, PieChart, PanelLeftClose, UserCircle, MessageSquare, Briefcase, Mail, Building, MapPin, Phone, Hash, ChevronDown, Check, Download, GripHorizontal, Columns, LayoutGrid, Type, Image as ImageIcon, BoxSelect, Maximize2, MonitorPlay, Clapperboard, StopCircle, RefreshCw, Smartphone, Monitor, ChevronRight, PanelRightClose, PlusCircle, CreditCard, BellRing, Settings2, ShieldCheck, Sun, Moon, Link, Palette, Layout, Link2, MonitorDot, Music as MusicIcon, Coffee, BrainCircuit, Headphones, CirclePlay, Wind, Trash2, Languages, Volume2, Key, Info, HelpCircle, LogOut
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import SidebarItem from './SidebarItem';
import { ViewType } from '../types';

export interface SidebarProps {
  currentView: ViewType;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  setCurrentView: (view: ViewType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  t: any;
  tasks: any[];
  calendarEvents: any[];
  transcriptionResults: any[];
  viewStates: any;
  recentActivity: any[];
  setSearchTarget: (target: {type: string, id: string}) => void;
  expandedItems: Set<string>;
  toggleExpand: (label: string) => void;
  stableSetCurrentView: (view: ViewType) => void;
  stableSetIsMobileMenuOpen: (open: boolean) => void;
  isThemePopoverOpen: boolean;
  setIsThemePopoverOpen: (open: boolean) => void;
  theme: string;
  setTheme: (theme: any) => void;
  updateViewState: (view: ViewType, updates: any) => void;
  userProfile: any;
  user: any;
  firebaseLogout: () => void;
}

export function Sidebar({
  currentView,
  isSidebarCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  t,
  tasks,
  calendarEvents,
  transcriptionResults,
  viewStates,
  recentActivity,
  setSearchTarget,
  expandedItems,
  toggleExpand,
  stableSetCurrentView,
  stableSetIsMobileMenuOpen,
  isThemePopoverOpen,
  setIsThemePopoverOpen,
  theme,
  setTheme,
  updateViewState,
  userProfile,
  user,
  firebaseLogout
}: SidebarProps) {
  const widthClass = isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64';

  return (
    <aside 
      className={`bg-card border-r flex flex-col shadow-sm transition-all duration-300 ease-in-out z-50 fixed inset-y-0 left-0 lg:relative ${
        isMobileMenuOpen ? 'translate-x-0 w-64' : `-translate-x-full lg:translate-x-0 ${widthClass}`
      }`}
    >
      {/* Brand Logo & Collapse */}
      <div className="flex items-center p-4 justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            setCurrentView('home');
            setIsMobileMenuOpen(false);
          }}
        >
          {isSidebarCollapsed ? (
            <div className="h-8 w-8 bg-red-600 rounded-md flex items-center justify-center text-white font-bold">M</div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-red-600 rounded-md flex items-center justify-center text-white font-bold">M</div>
              <span className="font-bold text-lg tracking-tight">Marketing Studio</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {!isSidebarCollapsed && (
        <div className="px-4 py-3">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input 
              placeholder={`${t.search} (⌘K)`} 
              className="pl-10 h-10 text-xs bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-foreground/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {(() => {
                  const results = [
                    // Views / Functions
                    ...[
                      { label: "Data Visualization & Dashboard", view: 'visualize', icon: PieChart, category: 'Navigation' },
                      { label: "Video Storyboard & Creative", view: 'storyboard', icon: MonitorPlay, category: 'Navigation' },
                      { label: "Audio Transcription & Analysis", view: 'transcribe', icon: Mic, category: 'Navigation' },
                      { label: "Image Generation", view: 'image-gen', icon: ImageIcon, category: 'Navigation' },
                      { label: "Text to Speech (Voiceover)", view: 'tts', icon: Volume2, category: 'Navigation' },
                      { label: "Translation Engine", view: 'translation', icon: Languages, category: 'Navigation' },
                      { label: "Assistant Chat", view: 'chat', icon: Bot, category: 'Navigation' },
                      { label: "Strategy & Analysis Hub", view: 'plan', icon: FileText, category: 'Navigation' },
                      { label: "Campaign & Content Generation", view: 'campaign', icon: Sparkles, category: 'Navigation' },
                      { label: "Presentation & Slide Creator", view: 'presentation', icon: MonitorPlay, category: 'Navigation' },
                      { label: "Task Manager & Folders", view: 'tasks', icon: ListTodo, category: 'Navigation' },
                      { label: "Calendar & Marketing Events", view: 'calendar', icon: CalendarIcon, category: 'Navigation' },
                      { label: "World Clock & Time Zones", view: 'world-clock', icon: Clock, category: 'Navigation' },
                      { label: "Platform Capabilities Guide", view: 'capabilities', icon: Info, category: 'Navigation' },
                      { label: t.home, view: 'home', icon: Home, category: 'Navigation' },
                      { label: t.settings, view: 'settings', icon: Settings, category: 'Navigation' },
                      { label: "Brand Identity & Guidelines", view: 'settings', tab: 'brand', icon: Palette, category: 'Navigation' },
                      { label: "Region & Language Settings", view: 'settings', tab: 'region', icon: Globe, category: 'Navigation' },
                      { label: "Security & 2FA Settings", view: 'settings', tab: 'account', icon: ShieldCheck, category: 'Navigation' },
                    ].filter(item => 
                      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.category.toLowerCase().includes(searchQuery.toLowerCase())
                    ),
                    
                    // Tasks
                    ...tasks.filter(task => 
                      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(task => ({
                      label: task.title,
                      view: 'tasks',
                      icon: ListTodo,
                      category: 'Tasks',
                      id: task.id
                    })),

                    // Calendar Events
                    ...calendarEvents.filter(event => 
                      event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(event => ({
                      label: event.title,
                      view: 'calendar',
                      icon: CalendarIcon,
                      category: 'Events',
                      id: event.id
                    })),

                    // Transcription Results
                    ...transcriptionResults.filter(res => 
                      res.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      res.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(res => ({
                      label: res.fileName || 'Transcript',
                      view: 'transcribe',
                      icon: Mic,
                      category: 'Transcripts',
                      id: res.id
                    })),

                    // AI Studio content (Translations & Images in AI Studio view)
                    ...viewStates['ai-studio'].conversations.filter((conv: any) => 
                      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      conv.messages.some((m: any) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).map((conv: any) => ({
                      label: conv.title,
                      view: conv.title.startsWith('Image') ? 'image-gen' : 'translation',
                      icon: conv.title.startsWith('Image') ? ImageIcon : Languages,
                      category: conv.title.startsWith('Image') ? 'Images' : 'Translations',
                      id: conv.id
                    })),

                    // Visualizations
                    ...viewStates.visualize.history.filter((v: any) => 
                      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      v.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((v: any) => ({
                      label: v.title,
                      view: 'visualize',
                      icon: PieChart,
                      category: 'Visualizations',
                      id: v.id
                    })),

                    // Storyboards
                    ...viewStates.storyboard.history.filter((s: any) => 
                      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.scenes.some((sc: any) => sc.narrative.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).map((s: any) => ({
                      label: s.title,
                      view: 'storyboard',
                      icon: Clapperboard,
                      category: 'Storyboards',
                      id: s.id
                    })),

                    // Activity
                    ...recentActivity.filter(act => 
                      act.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      act.details.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(act => ({
                      label: act.title,
                      view: act.view || (
                            act.type === 'marketing' && act.title.includes('Campaign') ? 'campaign' : 
                            act.type === 'presentation' ? 'presentation' :
                            act.type === 'analyze' ? 'analyze' : 
                            act.type === 'visualize' ? 'visualize' :
                            act.type === 'storyboard' ? 'storyboard' :
                            act.type === 'transcribe' ? 'transcribe' : 'home'
                      ),
                      icon: History,
                      category: 'Activity',
                      id: act.id
                    })),

                    // AI Studio content (Translations in Campaign)
                    ...viewStates.campaign.conversations.filter((conv: any) => 
                      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      conv.messages.some((m: any) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).map((conv: any) => ({
                      label: conv.title,
                      view: 'campaign',
                      icon: Languages,
                      category: 'Translations',
                      id: conv.id
                    }))
                  ];

                  if (results.length === 0) {
                    return <div className="p-4 text-center text-[10px] text-muted-foreground">{t.noResultsFound}</div>;
                  }

                  return results.slice(0, 15).map((item, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      className="w-full justify-start text-xs h-10 px-2 group"
                      onClick={() => {
                        if (item.view) {
                          setCurrentView(item.view as ViewType);
                          if ((item as any).tab) {
                            updateViewState(item.view as ViewType, { activeTab: (item as any).tab });
                          }
                        }
                        if ((item as any).id) setSearchTarget({ type: item.category.toLowerCase(), id: (item as any).id });
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-1.5 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="flex flex-col items-start overflow-hidden">
                          <span className="font-extrabold truncate w-full">{item.label}</span>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-light">{item.category}</span>
                        </div>
                      </div>
                    </Button>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2">
          <div className="space-y-1">
            {!isSidebarCollapsed && <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 mt-2">{t.welcome}</p>}
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={Home} label={t.home} view="home" 
            />
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={LayoutDashboard} 
              label={t.marketing} 
              subItems={[
                { label: t.plan, view: "plan", icon: FileText },
                { label: t.campaign, view: "campaign", icon: Sparkles }
              ]}
            />
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={MonitorPlay} 
              label={t.presentation} 
              view="presentation"
              badge="New"
            />
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              currentView={currentView} 
              setCurrentView={stableSetCurrentView}
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={Brain} 
              label="AI Creative Studio"
              badge="Pro"
              subItems={[
                { label: "Video Storyboard", view: "storyboard", icon: Video, badge: "Beta" },
                { label: "Image Generation", view: "image-gen", icon: ImageIcon },
                { label: "Audio Transcription", view: "transcribe", icon: Mic },
                { label: "Text-to-Speech", view: "tts", icon: Volume2 }
              ]}
            />
            
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={Languages} 
              label="Translation Engine" 
              view="translation"
            />

            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={PieChart} label={t.visualize} view="visualize" 
              badge="New"
            />
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={ListTodo} label={t.tasks} view="tasks" badge="New" 
            />
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={CalendarIcon} label={t.calendar} view="calendar" 
            />
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={Globe} label={t.worldClock} view="world-clock" 
            />
          </div>

          <div className="space-y-1">
            {!isSidebarCollapsed && <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 mt-2">Resources</p>}
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={TargetIcon} label="Platform Guide" view="capabilities" badge="Docs" 
            />
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={HelpCircle} label={t.help} onClick={() => window.open('https://t.me/eboakyeboadu', '_blank')} 
            />
            <SidebarItem 
              isSidebarCollapsed={isSidebarCollapsed} 
              currentView={currentView} 
              expandedItems={expandedItems} 
              toggleExpand={toggleExpand} 
              setCurrentView={stableSetCurrentView} 
              setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
              icon={Info} label={t.about} onClick={() => window.open('#', '_self')} 
            />
          </div>
        </div>
      </ScrollArea>


      {/* Bottom Actions */}
      <div className="p-2 border-t space-y-1 mt-auto">
        <Popover open={isThemePopoverOpen} onOpenChange={setIsThemePopoverOpen}>
          <PopoverTrigger nativeButton={true} render={(props) => (
            <Button {...props} variant="ghost" className={`w-full justify-start text-sm font-medium text-muted-foreground hover:text-foreground ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-4'}`}>
              {theme === 'dark' ? <Moon className="w-5 h-5 shrink-0" /> : theme === 'light' ? <Sun className="h-5 w-5 shrink-0" /> : <Monitor className="w-5 h-5 shrink-0" />}
              {!isSidebarCollapsed && (
                <>
                  <span className="ml-3 flex-1 text-left">{t.theme}</span>
                  <span className="text-[10px] capitalize">{theme}</span>
                </>
              )}
            </Button>
          )} />
          <PopoverContent side="right" className="w-32 p-1">
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => { setTheme('light'); setIsThemePopoverOpen(false); }}>
                <Sun className="h-5 w-5" /> Light
              </Button>
              <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => { setTheme('dark'); setIsThemePopoverOpen(false); }}>
                <Moon className="h-5 w-5" /> Dark
              </Button>
              <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => { setTheme('system'); setIsThemePopoverOpen(false); }}>
                <Monitor className="h-5 w-5" /> System
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <SidebarItem 
          isSidebarCollapsed={isSidebarCollapsed} 
          currentView={currentView} 
          expandedItems={expandedItems} 
          toggleExpand={toggleExpand} 
          setCurrentView={stableSetCurrentView} 
          setIsMobileMenuOpen={stableSetIsMobileMenuOpen}
          icon={Settings} 
          label={t.settings} 
          view="settings"
          subItems={[
            { 
              label: t.profile, 
              view: "settings", 
              icon: UserCircle,
              onClick: () => {
                setCurrentView('settings');
                updateViewState('settings', { activeTab: 'profile' });
              },
              isActive: currentView === 'settings' && viewStates.settings.activeTab === 'profile'
            },
            { 
              label: t.account, 
              view: "settings", 
              icon: Settings2,
              onClick: () => {
                setCurrentView('settings');
                updateViewState('settings', { activeTab: 'account' });
              },
              isActive: currentView === 'settings' && viewStates.settings.activeTab === 'account'
            },
            { 
              label: t.notifications, 
              view: "settings", 
              icon: BellRing,
              onClick: () => {
                setCurrentView('settings');
                updateViewState('settings', { activeTab: 'notifications' });
              },
              isActive: currentView === 'settings' && viewStates.settings.activeTab === 'notifications'
            },
            { 
              label: t.brandIdentity, 
              view: "settings", 
              icon: Palette,
              onClick: () => {
                setCurrentView('settings');
                updateViewState('settings', { activeTab: 'brand' });
              },
              isActive: currentView === 'settings' && viewStates.settings.activeTab === 'brand'
            },
            { 
              label: t.region, 
              view: "settings", 
              icon: Globe,
              onClick: () => {
                setCurrentView('settings');
                updateViewState('settings', { activeTab: 'region' });
              },
              isActive: currentView === 'settings' && viewStates.settings.activeTab === 'region'
            }
          ]}
          isActive={currentView === 'settings'}
        />

        {/* Account Switcher (Moved to bottom) */}
        <div className={`p-1 flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className={`h-auto p-1 hover:bg-secondary/50 transition-all ${isSidebarCollapsed ? 'rounded-full' : 'w-full justify-start gap-3 px-4'}`} />}>
              <Avatar className="h-8 w-8 shrink-0 border border-border">
                {userProfile?.photoURL ? (
                  <AvatarImage src={userProfile.photoURL} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold uppercase">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : user?.email?.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              {!isSidebarCollapsed && (
                <div className="flex flex-col items-start overflow-hidden pointer-events-none">
                  <span className="text-sm font-semibold truncate w-full text-left">{userProfile?.displayName || user?.email?.split('@')[0]}</span>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-left uppercase tracking-tighter">{userProfile?.role || 'User'}</span>
                </div>
              )}
              {!isSidebarCollapsed && <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground pointer-events-none" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start" side="right">
              <DropdownMenuLabel>Account Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2" onClick={() => setCurrentView('settings')}>
                <UserCircle className="h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 text-destructive focus:text-destructive" onClick={() => firebaseLogout()}>
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}

