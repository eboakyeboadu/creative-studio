import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toBlob } from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { PromptEnhancer } from './components/PromptEnhancer';
import { CampaignView } from './components/CampaignView';
import { 
  Home, FileText, BarChart2, Lightbulb, MonitorPlay, Settings, 
  Search, Filter, Send, Bot, User, Loader2, Sparkles, ChevronDown, Activity, Mic, RefreshCw,
  ArrowRight, AlertTriangle, CheckCircle2, XCircle, Moon, Upload, Paperclip,
  Download, FileSpreadsheet, Presentation as PresentationIcon, Users, Settings2, Plus,
  ChevronLeft, ChevronRight, Trash2, Menu, PanelLeftClose, PanelLeftOpen,
  LayoutDashboard, PieChart, Bell, LogOut, PlusCircle, Building2, Check, Sun, Monitor,
  Info, Sparkle, HelpCircle, Globe, CreditCard, Key, BellRing, UserCircle, ShieldCheck,
  Newspaper, MessageCircle, Target, Zap, BarChart3, Video, Youtube, Smartphone, Copy,
  Mail, Lock, Github, Maximize2, Minimize2, Layers, MonitorDot, ClipboardCheck, History, X, ArrowUpRight, ArrowDownRight, TrendingUp, Palette, Leaf, Clapperboard,
  Calendar as CalendarIcon, CheckSquare, List, Tag, Folder, Clock, MoreVertical, ChevronUp, ListTodo,
  Timer, Pause, Play, RotateCcw, Brain, Coffee, Languages, Image as ImageIcon, Square, Edit2, Hourglass, Music, Volume2, MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LocalLoginView } from './components/LocalLoginView';
import { LocalSignupView } from './components/LocalSignupView';
import { SettingsView } from './components/SettingsView';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import * as pdfjs from 'pdfjs-dist';
import pptxgen from 'pptxgenjs';
import { Chat, GoogleGenAI, Type } from '@google/genai';
import { NO_KEY_MESSAGE, createChatSession, withRetry, generateContentWithRetry, getGeminiAI, streamContentWithRetry, enhancePrompt, enhanceDictation, transcribeAudio } from './lib/gemini';
import { REVIEW_SYSTEM_PROMPT } from './lib/reviewPrompt';
import { EDITORIAL_GUIDELINES } from './lib/editorialGuidelines';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}
import { Button } from './components/ui/button';
import { CommandResponse } from './services/aiRouterService';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { FeatureShaderCard } from './components/ui/feature-shader-card';
import { ScrollArea } from './components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from './components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from './components/ui/select';
import { Toaster, toast } from 'sonner';
import { cn } from './lib/utils';
import SidebarItem from './components/SidebarItem';
import { SlidePreview } from './components/SlidePreview';
import { STUDIO_LOGO_RED, STUDIO_LOGO_WHITE, STUDIO_ICON_RED } from './constants';
import { generatePresentation, PresentationData, Slide, generateSlideImage, generatePresentationPlan, editPresentationPlan, generateGambit } from './services/geminiService';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart as RePieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

import TranscribeView from './components/TranscribeView';
import TasksView from './components/TasksView';
import CalendarView from './components/CalendarView';
import AIStudioView from './components/AIStudioView';
import CapabilitiesGuide from './components/CapabilitiesGuide';
import { DataVisualizationView } from './components/DataVisualizationView';
import { StoryboardView } from './components/StoryboardView';
import TTSView from './components/TTSView';
import { WorldClockView } from './components/WorldClockView';
import { NotificationBell } from './components/NotificationBell';
import { HomeView } from './components/HomeView';
import { ChatInterface } from './components/ChatInterface';
import { FocusView, FOCUS_MUSIC_TRACKS } from './components/FocusView';
import { Sidebar } from './components/Sidebar';
import { ConversationSidebar } from './components/ConversationSidebar';

import type { Notification, ViewType, Task, CalendarEvent, StructuredTranscript, ChatMessage, TranscriptionResult } from './types';

type ActivityItem = {
  id: string;
  type: 'plan' | 'analyze' | 'presentation' | 'chat' | 'marketing' | 'transcribe' | 'visualize' | 'storyboard' | 'tts';
  title: string;
  timestamp: Date;
  details: string;
  view?: ViewType;
  itemId?: string;
};

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: Date;
  isError?: boolean;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  chatSession: Chat | null;
  uploadedFile: { name: string; content: string } | null;
  timestamp: Date;
  presentation?: PresentationData;
  isLoading?: boolean;
  progressMessage?: string;
  presentationPlan?: string;
  gambitOutput?: { opening?: string; closing?: string };
  isGeneratingGambit?: boolean;
};

interface ViewState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  input: string;
  currentMessage?: string;
  storyboardPrompt?: string;
  uploadedFile: { name: string; content: string } | null;
  activeTab?: string;
  focusScope?: 'today' | 'week' | 'month';
  campaignDraft?: string;
  campaignResult?: string;
  campaignAnalysis?: any;
  numSlides?: number;
  translationSourceLang?: string;
  translationTargetLang?: string;
  translationTargetCountry?: string;
  translationResult?: string;
  styleReference?: { name: string; content: string } | null;
  stylePreset?: string;
  tasks?: Task[];
  calendarEvents?: CalendarEvent[];
  history?: any[];
  results?: any[];
}

const initialViewState: ViewState = {
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  input: '',
  uploadedFile: null,
  styleReference: null,
  stylePreset: 'Light',
  activeTab: 'profile'
};


import { useAuth } from './contexts/FirebaseContext';
import { LoginView } from './components/LoginView';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  serverTimestamp,
  getDocs,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';

export default function App() {
  const { user, loading: authLoading, userProfile, logout: firebaseLogout } = useAuth();

  // Firestore Sync Effect
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setCalendarEvents([]);
      setRecentActivity([]);
      return;
    }

    const tasksQuery = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'), limit(100));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Task[];
      setTasks(taskList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`));

    const eventsQuery = query(collection(db, 'users', user.uid, 'calendarEvents'), orderBy('start', 'asc'), limit(100));
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start?.toDate() || new Date(),
        end: doc.data().end?.toDate() || new Date()
      })) as CalendarEvent[];
      setCalendarEvents(eventList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/calendarEvents`));

    const activitiesQuery = query(collection(db, 'users', user.uid, 'activities'), orderBy('timestamp', 'desc'), limit(100));
    const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const activityList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ActivityItem[];
      setRecentActivity(activityList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/activities`));

    const visualizationsQuery = query(collection(db, 'users', user.uid, 'visualizations'), orderBy('timestamp', 'desc'), limit(100));
    const unsubVisualizations = onSnapshot(visualizationsQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setViewStates(prev => ({
        ...prev,
        visualize: { ...prev.visualize, history: list }
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/visualizations`));

    const storyboardsQuery = query(collection(db, 'users', user.uid, 'storyboards'), orderBy('timestamp', 'desc'), limit(100));
    const unsubStoryboards = onSnapshot(storyboardsQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setViewStates(prev => ({
        ...prev,
        storyboard: { ...prev.storyboard, history: list }
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/storyboards`));

    const transcriptionsQuery = query(collection(db, 'users', user.uid, 'transcriptions'), orderBy('timestamp', 'desc'), limit(100));
    const unsubTranscriptions = onSnapshot(transcriptionsQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        // Map other fields if necessary
      })) as TranscriptionResult[];
      setViewStates(prev => ({
        ...prev,
        transcribe: { ...prev.transcribe, results: list }
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/transcriptions`));

    const conversationsQuery = query(collection(db, 'users', user.uid, 'conversations'), orderBy('timestamp', 'desc'), limit(100));
    const unsubConversations = onSnapshot(conversationsQuery, (snapshot) => {
      const convs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          view: data.view || 'home',
          timestamp: data.timestamp?.toDate() || new Date(),
          messages: data.messages?.map((m: any) => ({
            ...m,
            timestamp: m.timestamp?.toDate() || new Date()
          })) || []
        } as any;
      });

      setViewStates(prev => {
        const next = { ...prev };
        const grouped: Record<string, any[]> = {};
        convs.forEach((c: any) => {
          if (!grouped[c.view]) grouped[c.view] = [];
          grouped[c.view].push(c);
        });

                Object.keys(next).forEach(v => {
          if (grouped[v]) {
            const remoteConvs = grouped[v];
            const updatedConvs = remoteConvs.map(remoteConv => {
              const existingConv = next[v].conversations?.find((c: any) => c.id === remoteConv.id);
              if (existingConv) {
                // Determine if we should keep local messages
                // We keep local messages IF locally is loading OR if local messages is longer than remote (sync lag)
                const keepLocal = existingConv.isLoading || (existingConv.messages.length > remoteConv.messages.length);
                
                return {
                  ...remoteConv,
                  messages: keepLocal ? existingConv.messages : remoteConv.messages.map((m: any) => ({
                    ...m,
                    timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
                  })),
                  chatSession: existingConv.chatSession || remoteConv.chatSession,
                  isLoading: existingConv.isLoading,
                  progressMessage: existingConv.progressMessage
                };
              }
              
              const brandPrompt = getBrandIdentityPrompt();
              let session = createChatSession(undefined, brandPrompt, remoteConv.messages.map((m: any) => ({
                role: m.role,
                parts: [{ text: m.content }]
              })));
              
              if (v === 'review') {
                session = createChatSession(REVIEW_SYSTEM_PROMPT, brandPrompt, remoteConv.messages.map((m: any) => ({
                  role: m.role,
                  parts: [{ text: m.content }]
                })));
              }

              return {
                ...remoteConv,
                chatSession: session
              };
            });
            
            const remoteIds = new Set(updatedConvs.map(c => c.id));
            const purelyLocal = next[v].conversations?.filter((c: any) => !remoteIds.has(c.id)) || [];
            
            next[v] = {
              ...next[v],
              conversations: [...updatedConvs, ...purelyLocal].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            };
          }
        });
        return next;
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/conversations`));

    return () => {
      unsubTasks();
      unsubEvents();
      unsubActivities();
      unsubConversations();
      unsubVisualizations();
      unsubStoryboards();
      unsubTranscriptions();
    };
  }, [user]);

  const [viewStates, setViewStates] = useState<Record<string, ViewState>>(() => {
    const base: Record<string, ViewState> = {
      chat: { ...initialViewState },
      plan: { ...initialViewState },
      analyze: { ...initialViewState },
      campaign: { ...initialViewState, activeTab: 'generate' },
      presentation: { ...initialViewState },
      home: { ...initialViewState },
      settings: { ...initialViewState },
      login: { ...initialViewState },
      signup: { ...initialViewState },
      review: { ...initialViewState },
      transcribe: { ...initialViewState },
      visualize: { ...initialViewState },
      focus: { ...initialViewState, activeTab: 'timer' },
      tasks: { ...initialViewState, tasks: [] },
      calendar: { ...initialViewState, calendarEvents: [] },
      'ai-studio': { ...initialViewState },
      notifications: { ...initialViewState },
      capabilities: { ...initialViewState },
      'world-clock': { ...initialViewState },
      storyboard: { ...initialViewState },
    };
    try {
      const saved = localStorage.getItem('studio_viewStates');
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const key in parsed) {
          if (base[key]) {
            base[key].input = parsed[key].input ?? base[key].input;
            base[key].activeConversationId = parsed[key].activeConversationId ?? base[key].activeConversationId;
            base[key].activeTab = parsed[key].activeTab ?? base[key].activeTab;
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse local viewStates", e);
    }
    return base;
  });

  useEffect(() => {
    const toSave: Record<string, any> = {};
    for (const key in viewStates) {
      toSave[key] = {
        input: viewStates[key].input,
        activeConversationId: viewStates[key].activeConversationId,
        activeTab: viewStates[key].activeTab
      };
    }
    localStorage.setItem('studio_viewStates', JSON.stringify(toSave));
  }, [viewStates]);

  const [currentView, setCurrentView] = useState<ViewType>('home');

  useEffect(() => {
    localStorage.setItem('studio_currentView', currentView);
  }, [currentView]);

  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [globalAssistantState, setGlobalAssistantState] = useState<'minimized' | 'floating_input' | 'sidebar'>('minimized');
  const [globalAssistantInput, setGlobalAssistantInput] = useState('');
  const [globalAssistantMessages, setGlobalAssistantMessages] = useState<{role: 'user'|'model', content: string, isError?: boolean}[]>(() => {
    const saved = localStorage.getItem('studio_globalAssistantMessages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isGlobalAssistantLoading, setIsGlobalAssistantLoading] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const dictationStartTimeRef = useRef<number>(0);
  const dictationActiveRef = useRef<boolean>(false);
  const dictationTargetCallbackRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    localStorage.setItem('studio_globalAssistantMessages', JSON.stringify(globalAssistantMessages));
  }, [globalAssistantMessages]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const slidePreviewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [showPresentationApproval, setShowPresentationApproval] = useState(false);

  const abortGenerationRef = useRef(false);
  const isDraggingGlobalAssistantRef = useRef(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState<string>('');
  const [editingChatTitleId, setEditingChatTitleId] = useState<string | null>(null);
  const [editedChatTitle, setEditedChatTitle] = useState<string>('');

  const handleStopGeneration = () => {
    abortGenerationRef.current = true;
    updateViewState(currentView, { isLoading: false });
  };

  const handleSaveChatTitle = (convId: string, newTitle: string) => {
    setViewStates(prev => {
      const viewState = prev[currentView];
      const convs = viewState.conversations.map(c => 
        c.id === convId ? { ...c, title: newTitle } : c
      );
      
      const updatedConv = convs.find(c => c.id === convId);
      if (updatedConv) saveConversation(currentView, updatedConv);
      
      return {
        ...prev,
        [currentView]: {
          ...viewState,
          conversations: convs
        }
      };
    });
    setEditingChatTitleId(null);
  };

  const handleEditMessageSubmit = (messageId: string, convId: string, newText: string) => {
    if (!newText.trim()) return;
    
    // Find the view state
    const state = viewStates[currentView];
    const conv = state.conversations.find((c: any) => c.id === convId);
    if (!conv) return;

    const msgIndex = conv.messages.findIndex((m: any) => m.id === messageId);
    if (msgIndex === -1) return;

    // Slice the conversation up to this message so we drop subsequent history
    const slicedMessages = conv.messages.slice(0, msgIndex);
    
    setViewStates(prev => ({
      ...prev,
      [currentView]: {
        ...prev[currentView],
        conversations: prev[currentView].conversations.map(c => 
          c.id === convId ? { ...c, messages: slicedMessages } : c
        )
      }
    }));
    
    setEditingMessageId(null);
    setEditingMessageContent('');
    
    // Slight delay to ensure state sets
    setTimeout(() => {
      handleSend(newText);
    }, 50);
  };

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        let containerWidth = containerRef.current.offsetWidth - 64; // padding
        if (showSpeakerNotes) {
          containerWidth -= 352; // 320px width + 32px gap
        }
        const containerHeight = containerRef.current.offsetHeight - 120; // controls space
        const scaleW = containerWidth / 1280;
        const scaleH = containerHeight / 720;
        const scale = Math.min(scaleW, scaleH, 1);
        setPreviewScale(scale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [currentView, presentation, showSpeakerNotes]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    // Hide history sidebar by default when switching to specific views as requested
    const viewsToHideHistory = ['plan', 'analyze', 'campaign', 'review', 'presentation', 'transcribe', 'capabilities', 'visualize', 'storyboard', 'tts', 'image-gen', 'translation', 'ai-studio'];
    if (viewsToHideHistory.includes(currentView)) {
      setIsHistoryOpen(false);
    }
  }, [currentView]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);
  const [appLanguage, setAppLanguage] = useState<'en' | 'fr-af' | 'es-la' | 'pt-af'>('en');
  const [draftLanguage, setDraftLanguage] = useState<'en' | 'fr-af' | 'es-la' | 'pt-af'>('en');
  const [appTimezone, setAppTimezone] = useState('utc');
  const [draftTimezone, setDraftTimezone] = useState('utc');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | '90d' | 'year' | 'all'>('7d');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [notificationSettings, setNotificationSettings] = useState([
    { id: 'email', title: 'Email Notifications', desc: 'Receive daily summaries and important alerts via email.', enabled: true },
    { id: 'push', title: 'Push Notifications', desc: 'Get real-time updates on your browser or mobile device.', enabled: false },
    { id: 'marketing', title: 'Marketing Updates', desc: 'Stay informed about new features and AI improvements.', enabled: true },
    { id: 'security', title: 'Security Alerts', desc: 'Critical notifications about your account security.', enabled: true, required: true },
  ]);
  const [brandIdentity, setBrandIdentity] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_brandIdentity');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      logoUrl: null as string | null,
      primaryColor: '#FF2B2B',
      secondaryColor: '#000000',
      accentColor: '#FF2B2B',
      toneOfVoice: 'Authoritative, driver-centric, persuasive, and data-driven',
      guidelines: 'Brand: Northbeam (sample ride-hailing demo brand). Audience: Ride-hailing drivers (cars/motorcycles). Core Metrics: Maximize Supply Hours (SH), increase Active Drivers, reduce churn, lower Driver Acquisition Cost (DAC). Focus Areas: CRM & Trigger Campaigns, Content Localization/Education, Community Management, Incentives & Challenges, Events & PR, Strategic Partnerships.'
    };
  });
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const addToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error' && (message.toLowerCase().includes('unavailable in your region') || message.toLowerCase().includes('region lock'))) {
      return; 
    }
  const id = Date.now().toString();
  setToasts(prev => [...prev, { id, message, type }]);
  setTimeout(() => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, 3000);
}, []);

  const translations = {
    en: {
      tasks: "Tasks",
      manageTasksDesc: "Organize and track your marketing to-dos.",
      calendar: "Calendar",
      todo: "To Do",
      done: "Done",
      home: "Home",
      marketing: "Marketing",
      plan: "Strategy & Analysis Hub",
      analyze: "Analyze Docs",
      campaign: "Marketing Campaigns",
      presentation: "Presentation",
      analytics: "Analytics",
      settings: "Settings",
      profile: "Profile",
      account: "Account Settings",
      notifications: "Notifications",
      region: "Region & Language",
      help: "Help Center",
      about: "About",
      theme: "Theme",
      logout: "Logout",
      save: "Save Changes",
      update: "Update",
      enable: "Enable",
      disable: "Disable",
      search: "Search...",
      newUpdate: "New Update",
      welcome: "Welcome",
      activeProjects: "Active Projects",
      aiInsights: "AI Insights",
      recentActivity: "Recent Activity",
      clearHistory: "Clear History",
      noActivity: "No recent activity. Start by creating a plan or analyzing a document.",
      welcomeTitle: "Welcome to Marketing Manager Studio",
      welcomeSubtitle: "Your centralized platform for data-driven marketing strategies and comprehensive marketplace intelligence that drive business growth.",
      createPlanDesc: "Generate strategies, analyze reports, and review campaigns in one unified hub.",
      analyzeDocsDesc: "Upload reports for instant data-driven insights.",
      campaignAnalysisDesc: "Generate, analyze, and localize marketing content drafts.",
      generatePresentationDesc: "Turn your plans into executive-ready slides.",
      language: "Language",
      timezone: "Timezone",
      dateFormat: "Date Format",
      twoFactor: "Two-Factor Authentication",
      password: "Password",
      emailNotifications: "Email Notifications",
      pushNotifications: "Push Notifications",
      marketingEmails: "Marketing Emails",
      securityAlerts: "Security Alerts",
      brandIdentity: "Brand Identity Vault",
      brandIdentityDesc: "Manage your brand assets, colors, and tone of voice to ensure consistency across all generated content.",
      brandLogo: "Brand Logo",
      primaryColor: "Primary Color",
      secondaryColor: "Secondary Color",
      accentColor: "Accent Color",
      toneOfVoice: "Tone of Voice",
      brandGuidelines: "Brand Guidelines",
      brandGuidelinesPlaceholder: "Describe your brand's personality, mission, and any specific rules for content generation...",
      saveBrandIdentity: "Save Brand Identity",
      brandIdentitySaved: "Brand Identity saved successfully!",
      uploadLogo: "Upload Logo",
      brandProfile: "Brand Profile",
      speakerNotes: "Speaker Notes",
      showNotes: "Show Speaker Notes",
      hideNotes: "Hide Speaker Notes",
      presentationScript: "Presentation Script",
      savePreferences: "Save Preferences",
      updateRegion: "Update Region Settings",
      cancel: "Cancel",
      profileDesc: "Update your personal information and public profile.",
      accountDesc: "Manage your security, AI preferences, and organization.",
      notificationsDesc: "Configure how and when you receive updates.",
      regionDesc: "Set your local preferences for time, date, and language.",
      fullName: "Full Name",
      email: "Email Address",
      jobTitle: "Job Title",
      bio: "Bio",
      saveProfile: "Save Profile Changes",
      security: "Security",
      updatePassword: "Update Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      aiPreferences: "AI Preferences",
      defaultModel: "Default Model",
      responseTone: "Response Tone",
      dangerZone: "Danger Zone",
      deleteOrg: "Delete Organization",
      deactivateAccount: "Deactivate Account",
      review: "Activity Review",
      reviewDesc: "Get feedback on your marketing activities and prepare for meetings.",
      reviewActivity: "Review Activity",
      reviewPrompt: "Upload a presentation or report for expert feedback...",
      reviewAchieved: "What you achieved",
      reviewCritique: "Critique & Improvements",
      reviewQuestions: "Likely Meeting Questions",
      reviewAnswers: "Brainstormed Answers",
      reviewPositives: "Positives",
      reviewSuggestions: "Suggestions for Improvement",
      history: "History",
      newChat: "New Chat",
      noHistory: "No history",
      clear: "Clear",
      export: "Export",
      slides: "Slides",
      howCanIHelp: "How can I help you today?",
      uploadDocsDesc: "Upload documents, provide context, or ask me to generate marketing plans.",
      enterpriseShield: "Enterprise Shield",
      active: "Active",
      dataPrivacyDesc: "Your data is encrypted and never used to train public models. Enterprise-grade security is enabled by default.",
      dataPrivacyLevel: "Data Privacy Level",
      professionalAnalytical: "Professional & Analytical",
      creativeBold: "Creative & Bold",
      conciseExecutive: "Concise & Executive",
      addNewAccount: "Add New Account",
      switchAccount: "Switch Account",
      lastChanged: "Last changed 3 months ago.",
      dangerZoneDesc: "Once you delete your account or organization, there is no going back. Please be certain.",
      twoFactorDesc: "Add an extra layer of security to your account.",
      growth: "Growth",
      visualImpact: "Visual Impact",
      portfolioLogic: "Portfolio Logic",
      aiIndustry: "AI Industry",
      contents: "CONTENTS",
      generate: "Generate",
      switchAccountLabel: "Switch Account",
      hideHistory: "Hide History",
      showHistory: "Show History",
      organization: "Organization",
      phoneNumber: "Phone Number",
      changeAvatar: "Change Avatar",
      avatarSizeDesc: "JPG, GIF or PNG. Max size of 800K",
      lastChangedPassword: "Last changed 3 months ago.",
      generatingPresentation: "Generating your presentation...",
      slideCopied: "Slide design copied to clipboard!",
      failedCopySlide: "Failed to copy slide design",
      copySlide: "Copy Slide",
      fullScreen: "Full Screen",
      readyToGenerateSlides: "Ready to generate slides",
      readyToGenerateSlidesDesc: "Upload a marketing plan, an analysis report, or provide context to automatically generate a structured presentation.",
      presentationTopic: "Presentation Topic / Context",
      presentationTopicPlaceholder: "Enter a topic, key metrics, or detailed context for your presentation...",
      presentationTopicTip: "Tip: You can paste long reports or multiple paragraphs here. Press Enter for new lines.",
      numberOfSlides: "Number of Slides",
      autoAiDecide: "Auto (AI will decide)",
      numberOfSlidesDesc: "Specify a number or leave blank for a comprehensive presentation (usually 10-15 slides).",
      changeDocument: "Change Document",
      uploadSourceDocument: "Upload Source Document",
      generateFromDocument: "Generate from Document",
      autoGenerate: "Auto-Generate",
      planTitle: "Strategy & Analysis Hub",
      planDesc: "Generate marketing plans, analyze marketing data, and review marketing activities in one place.",
      planPlaceholder: "E.g., 'Generate a marketing plan for...', 'Analyze this dataset...', or 'Review my recent campaigns...'",
      analyzeTitle: "Document Analysis",
      analyzeDesc: "Upload Excel reports, supply-side data, or driver metrics for AI-driven insights.",
      analyzePlaceholder: "Upload a file or ask 'Analyze the Driver Acquisition Cost (DAC)...'",
      presentationTitle: "Generate Presentation",
      presentationDesc: "Turn insights and plans into presentation slides.",
      worldClock: "World Clock",
      newPresentation: "New Presentation",
      slideOf: "Slide {current} of {total}",
      noResultsFound: "No results found",
      signInToContinue: "Sign in to your account to continue",
      signingIn: "Signing in...",
      signIn: "Sign In",
      orContinueWith: "Or continue with",
      successfullySignedIn: "Successfully signed in!",
      analyticsDashboard: "Analytics Dashboard",
      analyticsDesc: "Real-time performance metrics and AI efficiency insights.",
      last7Days: "Last 7 Days",
      last30Days: "Last 30 Days",
      last90Days: "Last 90 Days",
      last24Hours: "Last 24 Hours",
      lastYear: "Last Year",
      allTime: "All Time",
      aiActivityOverTime: "AI Activity Over Time",
      aiActivityDesc: "Daily volume of plans, docs, presentations, campaigns, and reviews.",
      plans: "Plans",
      docs: "Docs",
      campaigns: "Campaigns",
      reviews: "Reviews",
      totalPlans: "Total Plans",
      docsAnalyzed: "Docs Analyzed",
      presentations: "Presentations",
      timeSaved: "Time Saved",
      campaignRoi: "Campaign ROI",
      marketingPlans: "Marketing Plans",
      docAnalysis: "Doc Analysis",
      contentMix: "Content Mix",
      contentMixDesc: "Distribution of AI-generated assets.",
      totalAssets: "Total Assets",
      efficiencyGain: "Efficiency Gain (Hours)",
      efficiencyDesc: "Manual vs. AI-assisted workflow time comparison.",
      faster: "Faster",
      totalManualTime: "Total Manual Time",
      totalAiTime: "Total AI Time",
      manualProcess: "Manual Process",
      aiAssisted: "AI-Assisted",
      recentSystemEvents: "Recent System Events",
      recentEventsDesc: "Latest actions performed across the platform.",
      viewAll: "View All",
      event: "Event",
      user: "User",
      status: "Status",
      time: "Time",
      welcomeBack: "Welcome Back",
      success: "Success",
      error: "Error",
      editor: "Editor",
      owner: "Owner",
      admin: "Admin",
      preferencesSaved: "Preferences Saved",
      profileSaved: "Profile Saved",
      driverAcquisition: "Driver Acquisition (DAC)",
      driverAcquisitionDesc: "Plan for increasing supply side",
      driverAcquisitionPrompt: "Create a marketing plan to reduce DAC by 15% in Q3.",
      riderRetention: "Rider Retention",
      riderRetentionDesc: "Campaign to boost active users",
      riderRetentionPrompt: "Draft a re-engagement campaign plan for riders who haven't used the app in 30 days.",
      marketLaunch: "Market Launch",
      marketLaunchDesc: "Go-to-market strategy",
      marketLaunchPrompt: "Generate a go-to-market plan for launching services in a new mid-sized city.",
      budgetAllocation: "Budget Allocation",
      budgetAllocationDesc: "Optimize ad spend",
      budgetAllocationPrompt: "Propose a budget allocation plan for a $500k quarterly marketing budget focusing on performance channels.",
      analyzeCac: "Analyze DAC/UAC",
      analyzeCacDesc: "Review Acquisition Costs (DAC/UAC)",
      analyzeCacPrompt: "Analyze the uploaded Driver Acquisition Cost (DAC) report and identify the most efficient channels.",
      supplyVsDemand: "Supply vs Demand",
      supplyVsDemandDesc: "Balance metrics",
      supplyVsDemandPrompt: "Compare the supply side (drivers) vs demand side (riders) metrics to find bottlenecks.",
      churnAnalysis: "Churn Analysis",
      churnAnalysisDesc: "Understand user drop-off",
      churnAnalysisPrompt: "Analyze the rider churn data and suggest 3 areas for immediate improvement.",
      roiCalculation: "ROI Calculation",
      roiCalculationDesc: "Measure campaign success",
      roiCalculationPrompt: "Calculate the ROI of the recent referral program based on the provided data.",
      analyzeActivity: "Analyze Activity",
      analyzeActivityDesc: "Upload your report and get expert feedback on your marketing activity.",
      analyzeActivityPrompt: "I've uploaded my activity report. Please analyze what I achieved and provide an expert perspective on the results.",
      meetingPrep: "Meeting Prep",
      meetingPrepDesc: "Prepare for your weekly sync with likely questions and brainstormed answers.",
      meetingPrepPrompt: "I have a weekly marketing meeting coming up. Based on my activity report, what are some likely questions I'll be asked, and how should I answer them?",
      critiqueImprove: "Critique & Improve",
      critiqueImproveDesc: "Get a rigorous critique of your presentation and suggestions for improvement.",
      critiqueImprovePrompt: "Please provide a critique of my presentation. What are the positives, and what should I change or add to make it more impactful?",
      businessImpact: "Business Impact",
      businessImpactDesc: "Understand how your activity impacts long-term business metrics.",
      businessImpactPrompt: "How is this marketing activity impacting our core business metrics and long-term goals?",
      profileChangesSaved: "Profile changes saved successfully!",
      notificationPreferencesSaved: "Notification preferences saved!",
      passwordUpdated: "Password updated successfully!",
      fillAllFields: "Please fill in all fields.",
      passwordsDoNotMatch: "Passwords do not match!",
      passwordTooShort: "Password must be at least 8 characters.",
      analyticsExported: "Analytics data exported successfully!",
      copiedToClipboard: "Copied to clipboard!",
      signInSuccess: "Successfully signed in!",
      signInWithSuccess: "Successfully signed in with {provider}!",
      connectingTo: "Connecting to {provider}...",
      campaignAnalysis: "Marketing Campaigns",
      campaignAnalysisSubtitle: "Generate, analyze, and localize high-impact marketing content.",
      generateContent: "Generate Content",
      analyzeDraft: "Analyze Draft",
      translate: "Translate",
      addEmojis: "Add Emojis",
      sourceLanguage: "Source Language",
      targetLanguage: "Target Language",
      targetCountry: "Target Country",
      translateContent: "Translate Content",
      translating: "Translating...",
      translationResult: "Translation Result",
      selectLanguage: "Select Language",
      selectCountry: "Select Country",
      emojiAdded: "Emojis added successfully!",
      configuration: "Configuration",
      contentFormat: "Content Format",
      description: "Description",
      generateMarketingText: "Generate Marketing Text",
      generatedResult: "Generated Result",
      copyToClipboard: "Copy to Clipboard",
      analyzeThisResult: "Analyze this result",
      newsFeed: "News Feed",
      pushNotification: "Push Notification",
      whatsapp: "WhatsApp",
      tiktokScript: "TikTok Script",
      youtubeScript: "YouTube Script",
      smsText: "SMS/Text",
      descriptionPlaceholder: "Describe your campaign goal (e.g., 'Incentivize partner drivers to increase supply in Accra during morning peak hours')...",
      noResultGenerated: "No content generated yet. Configure and click generate.",
      analysisResult: "Analysis Result",
      editorialCompliance: "Editorial Compliance",
      actionability: "Actionability",
      clarity: "Clarity",
      conciseness: "Conciseness",
      overallScore: "Overall Score",
      suggestionsForImprovement: "Suggestions for Improvement",
      analyzeDraftButton: "Analyze Draft",
      analyzing: "Analyzing...",
      using: "Using",
      overallWinnability: "Overall Winnability",
      overallWinnabilityDesc: "Based on AI predictive modeling",
      draftAnalysis: "Draft Analysis",
      pasteDraft: "Paste your draft",
      pasteDraftPlaceholder: "Paste the marketing text you want to analyze...",
      startAiAnalysis: "Start AI Analysis",
      contentFormatOptional: "Content Format (Optional)",
      yourGeneratedContent: "Your generated content will appear here.",
      engagement: "Engagement",
      outcomeProbability: "Outcome Probability",
      rewriteToImprove: "Rewrite to Improve (Target 100%)",
      rewriteToImproveDesc: "This will automatically apply all AI feedback to your draft.",
      analysisResultsAppearHere: "Analysis results will appear here after processing.",
      translationResultsAppearHere: "Translation results will appear here after processing.",
      thinking: "Thinking...",
      you: "You",
      studioAi: "Assistant",
      copy: "Copy",
      removeFile: "Remove File",
      styleReference: "Style Reference",
      uploadStyleReference: "Upload Style Reference",
      styleReferenceDesc: "Upload a presentation to use its style (fonts, colors, tone) as a reference.",
      usingStyle: "Using style from",
      changeStyle: "Change Style",
      signUp: "Sign Up",
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: "Already have an account?",
      createAccount: "Create Account",
      creatingAccount: "Creating account...",
      marketingPlanGen: "Marketing Plan Gen",
      docAnalysisEvent: "Doc Analysis",
      presentationExport: "Presentation Export",
      apiKeyRotated: "API Key Rotated",
      newDatasetUpload: "New Dataset Upload",
      datePeriod: "Date/Period",
      alert: "Alert",
      gmt: "GMT (Greenwich Mean Time)",
      cet: "CET (Central European Time)",
      eet: "EET (Eastern European Time)",
      ast: "AST (Arabia Standard Time)",
      ist: "IST (Israel Standard Time)",
      azt: "AZT (Azerbaijan Time)",
      trt: "TRT (Turkey Time)",
      category: "Category",
      manualTime: "Manual Time",
      aiTime: "AI Time",
      transcribe: "Transcribe",
      transcribeDesc: "Convert audio recordings and live feeds into text for your markets.",
      transcribeTitle: "Audio Transcription",
      visualize: "Visualize Data",
      visualizeDesc: "Create interactive and professional charts from your marketing data.",
      storyboard: "Storyboard",
      storyboardDesc: "Generate cinematic scene-by-scene scripts and visual frames for video generation.",
      storyboardTitle: "Video Storyboard Studio",
      tts: "Text to Speech",
      ttsDesc: "Convert text to natural, expressive voice in multiple languages.",
      ttsTitle: "Text to Speech Generation",
      focus: "Focus",
      focusDesc: "Lock in and work without distraction with a pomodoro timer.",
      
      // Data Visualization Translations
      dataVisualizationTitle: "Data Visualization",
      dataVisualizationDesc: "Transform marketing data and metrics into professional, modern charts for your presentations.",
      dataset: "Dataset",
      rawData: "Raw Data",
      uploadCsvOrExcel: "CSV/Excel",
      chartTypePreference: "Chart Type Preference",
      selectChartType: "Select Chart Type",
      barChart: "Bar Chart",
      lineGraph: "Line Graph",
      areaChart: "Area Chart",
      pieChart: "Pie Chart",
      visualizationRequest: "Visualization Request",
      visualizationPlaceholder: "e.g. Create a bar chart showing churn rate over the last 6 months",
      generateChart: "Generate Chart",
      generating: "Generating...",
      ideas: "Ideas",
      ideasItem1: "Q3 Revenue vs Targets",
      ideasItem1Prompt: "Show Q3 revenue vs targets across regions as a bar chart",
      ideasItem2: "Market Share Breakdown",
      ideasItem2Prompt: "Create a pie chart for market share breakdown",
      ideasItem3: "Website Traffic Trends",
      ideasItem3Prompt: "Visualize website traffic trends over the last year as an area chart",
      noVisualizationGenerated: "No Visualization Generated",
      noVisualizationDesc: "Provide data or describe what you want to visualize, and AI will create a modern, presentation-ready chart for you.",
      exportFailed: "Export failed",
      failedToGenerateVisualization: "Failed to generate visualization",
      visualizationGenerated: "Visualization Generated",
      chartExported: "Chart Exported",
      dataUploaded: "Data Uploaded",
      failedToParseFile: "Failed to parse file. Make sure it's a valid CSV or Excel file.",

      // Storyboard Translations
      storyboardSubtitle: "Create cinematic, scene-by-scene video scripts for Veo 3.1",
      newProject: "New Project",
      step1of2: "Step 1 of 2",
      step2of2: "Step 2 of 2",
      visualIdentityDesign: "Visual Identity Design",
      visualIdentityDesc: "Establish the main character's physical identity. This prompt will be used to ensure absolute consistency across every video scene.",
      initializeScript: "Initialize Script",
      initializeScriptDesc: "Describe your concept, audience, and preferred style. We'll build the 8s scene sequences.",
      protagonistName: "Protagonist Name",
      protagonistNamePlaceholder: "e.g. Ama",
      refinePrompt: "Refine Prompt",
      mainCharacterPrompt: "Main Character Prompt (Visualization)",
      mainCharacterPlaceholder: "Describe exact physical traits: age, skin tone, hair style, specific facial features, and attire...",
      technicalGuidance: "Technical Guidance",
      technicalGuidanceDesc: "This character prompt is the source of truth. It will be injected into every generated scene. Use the Global Image Generator in the sidebar to test your character's look before finalizing this prompt.",
      globalImageGenerator: "Global Image Generator",
      targetAudienceStr: "Target Audience",
      targetAudiencePlaceholder: "e.g. Young professionals in Accra",
      aspectRatioStr: "Aspect Ratio",
      commercialConcept: "Commercial Concept",
      commercialConceptPlaceholder: "A cinematic 30-second commercial for premium rides in Accra, showing smooth travel from high-rise offices to vibrant dinner spots. Focus on luxury and reliability.",
      backButton: "Back",
      nextConfigureScript: "Next: Configure Script",
      generateStoryboardBtn: "Generate Storyboard",
      scenesChronology: "Scenes Chronology",
      sceneStr: "Scene",
      narrativeScript: "Narrative Script",
      timecodeStr: "Timecode",
      fixed8sInterval: "Fixed 8s Interval",
      technicalPrompt: "Veo 3.1 Technical Prompt",
      previousScene: "Previous Scene",
      approveScene: "Approve Scene",
      nextScene: "Next Scene",
      overallProgress: "Overall Progress",
      generateInGoogleFlow: "Generate in Google Flow",
      scriptMightExceed: "Script might exceed 8s (approx. 22 words max).",
      promptCopied: "Prompt copied to clipboard!",
      sceneApprovedToast: "Scene approved!",
      storyboardGeneratedToast: "Storyboard Generated",
      generationFailed: "Generation failed. Please try again.",
      charPromptRefined: "Character prompt refined!",
      refiningFailed: "Failed to refine character prompt.",
      
      focusTimer: "Focus Timer",
      presets: "Presets",
      customDuration: "Custom Duration",
      minutes: "minutes",
      focusComplete: "Focus session complete! Take a break.",
      workTime: "Work Time",
      breakTime: "Break Time",
      longBreak: "Long Break",
      pomodoroTechnique: "Pomodoro Technique",
      pomodoroDescription: "A time management method developed by Francesco Cirillo. It uses a timer to break work into intervals, typically 25 minutes, separated by short breaks to improve mental agility.",
      focusPhase: "Focus Phase",
      restPhase: "Rest Phase",
      productivityScore: "Productivity Score",
      weeklyFocus: "Weekly Focus Activity",
      focusMode: "Focus Mode",
      timer: "Timer",
      stats: "Stats",
      noSessionsYet: "No focus sessions completed yet. Start working!",
      focusGoal: "What are you working on?",
      startFocus: "Start Focus Session",
      pauseFocus: "Pause Session",
      resetFocus: "Reset Timer",
      focusHistory: "History",
      totalFocusTime: "Total Focus Time",
      sessionsCompleted: "Sessions Completed",
      focusStats: "Focus Stats",
      focusSessionHistory: "Focus Session History",
      today: "Today",
      week: "Week",
      month: "Month",
      activity: "Activity",
      hours: "hours",
      sessions: "sessions",
      totalTranscriptions: "Total Transcriptions",
      transcriptions: "Transcriptions",
      totalTranslations: "Total Translations",
      totalImagesGenerated: "Images Created",
      translations: "Translations",
      generatedImages: "Generated Images",
      imageGeneration: "Image Generation",
      uac: "User Acquisition Cost (UAC)",
      dac: "Driver Acquisition Cost (DAC)",
    },
    'fr-af': {
      home: "Accueil",
      marketing: "Marketing",
      plan: "Plan de Marketing",
      analyze: "Analyser Docs",
      campaign: "Campagnes Marketing",
      presentation: "Présentation",
      analytics: "Analytique",
      settings: "Paramètres",
      profile: "Profil",
      account: "Paramètres du Compte",
      notifications: "Notifications",
      region: "Région et Langue",
      help: "Centre d'Aide",
      about: "À propos",
      theme: "Thème",
      logout: "Déconnexion",
      save: "Enregistrer les modifications",
      update: "Mettre à jour",
      enable: "Activer",
      disable: "Désactiver",
      search: "Rechercher...",
      newUpdate: "Nouvelle mise à jour",
      welcome: "Bienvenue",
      activeProjects: "Projets actifs",
      aiInsights: "Insights IA",
      recentActivity: "Activité récente",
      clearHistory: "Effacer l'historique",
      noActivity: "Aucune activité récente. Commencez par créer un plan ou analyser un document.",
      welcomeTitle: "Bienvenue dans Marketing Manager Studio",
      welcomeSubtitle: "Votre plateforme centralisée pour des stratégies marketing basées sur les données et une intelligence de mercado complète qui stimule la croissance de l'entreprise.",
      createPlanDesc: "Rédigez des stratégies complètes avec l'aide de l'IA.",
      analyzeDocsDesc: "Téléchargez des rapports pour des insights instantanés basés sur les données.",
      campaignAnalysisDesc: "Générez, analysez et localisez des brouillons de contenu marketing.",
      generatePresentationDesc: "Transformez vos plans en diapositives prêtes pour les cadres.",
      language: "Langue",
      timezone: "Fuseau horaire",
      dateFormat: "Format de date",
      twoFactor: "Authentification à deux facteurs",
      password: "Mot de passe",
      emailNotifications: "Notifications par e-mail",
      pushNotifications: "Notifications push",
      marketingEmails: "E-mails marketing",
      securityAlerts: "Alertes de sécurité",
      brandIdentity: "Coffre d'identité de marque",
      brandIdentityDesc: "Gérez vos actifs de marque, vos couleurs et votre ton de voix pour assurer la cohérence de tout le contenu généré.",
      brandLogo: "Logo de la marque",
      primaryColor: "Couleur primaire",
      secondaryColor: "Couleur secondaire",
      accentColor: "Couleur d'accentuation",
      toneOfVoice: "Ton de voix",
      brandGuidelines: "Directives de marque",
      brandGuidelinesPlaceholder: "Décrivez la personnalité de votre marque, sa mission et toutes les règles spécifiques pour la génération de contenu...",
      saveBrandIdentity: "Enregistrer l'identité de la marque",
      brandIdentitySaved: "Identité de la marque enregistrée avec succès !",
      uploadLogo: "Télécharger le logo",
      brandProfile: "Profil de marque",
      speakerNotes: "Notes du présentateur",
      showNotes: "Afficher les notes",
      hideNotes: "Masquer les notes",
      presentationScript: "Script de présentation",
      savePreferences: "Enregistrer les préférences",
      updateRegion: "Mettre à jour les paramètres régionaux",
      cancel: "Annuler",
      profileDesc: "Mettez à jour vos informations personnelles et votre profil public.",
      accountDesc: "Gérez votre sécurité, vos préférences IA et votre organisation.",
      notificationsDesc: "Configurez comment et quand vous recevez des mises à jour.",
      regionDesc: "Définissez vos préférences locales pour l'heure, la date et la langue.",
      fullName: "Nom complet",
      email: "Adresse e-mail",
      jobTitle: "Titre du poste",
      bio: "Bio",
      saveProfile: "Enregistrer les modifications du profil",
      security: "Sécurité",
      updatePassword: "Mettre à jour le mot de passe",
      currentPassword: "Mot de passe actuel",
      newPassword: "Nouveau mot de passe",
      confirmPassword: "Confirmer le nouveau mot de passe",
      aiPreferences: "Préférences IA",
      defaultModel: "Modèle par défaut",
      responseTone: "Ton de réponse",
      dangerZone: "Zone de danger",
      deleteOrg: "Supprimer l'organisation",
      deactivateAccount: "Désactiver le compte",
      review: "Révision d'Activité",
      reviewDesc: "Obtenez des commentaires sur vos activités marketing et préparez-vous aux réunions.",
      reviewActivity: "Réviser l'Activité",
      reviewPrompt: "Téléchargez une présentation ou un rapport pour des commentaires d'experts...",
      reviewAchieved: "Ce que vous avez accompli",
      reviewCritique: "Critique et Améliorations",
      reviewQuestions: "Questions Probables de Réunion",
      reviewAnswers: "Réponses Brainstormées",
      reviewPositives: "Points Positifs",
      reviewSuggestions: "Suggestions d'Amélioration",
      history: "Historique",
      newChat: "Nouveau Chat",
      noHistory: "Aucun historique",
      clear: "Effacer",
      export: "Exporter",
      slides: "Diapositives",
      howCanIHelp: "Comment puis-je vous aider aujourd'hui ?",
      uploadDocsDesc: "Téléchargez des documents, fournissez du contexte ou demandez-moi de générer des plans marketing.",
      enterpriseShield: "Bouclier Entreprise",
      active: "Actif",
      dataPrivacyDesc: "Vos données sont cryptées et jamais utilisées pour entraîner des modèles publics. La sécurité de niveau entreprise est activée par défaut.",
      dataPrivacyLevel: "Niveau de Confidentialité des Données",
      professionalAnalytical: "Professionnel et Analytique",
      creativeBold: "Créatif et Audacieux",
      conciseExecutive: "Concis et Exécutif",
      addNewAccount: "Ajouter un Nouveau Compte",
      switchAccount: "Changer de Compte",
      lastChanged: "Modifié il y a 3 mois.",
      dangerZoneDesc: "Une fois que vous supprimez votre compte ou organisation, il n'y a pas de retour en arrière. Soyez-en sûr.",
      twoFactorDesc: "Ajoutez une couche de sécurité supplémentaire à votre compte.",
      growth: "Croissance",
      visualImpact: "Impact Visuel",
      portfolioLogic: "Logique de Portefeuille",
      aiIndustry: "Industrie de l'IA",
      contents: "SOMMAIRE",
      generate: "Générer",
      switchAccountLabel: "Changer de compte",
      hideHistory: "Masquer l'historique",
      showHistory: "Afficher l'historique",
      organization: "Organisation",
      phoneNumber: "Numéro de téléphone",
      changeAvatar: "Changer d'avatar",
      avatarSizeDesc: "JPG, GIF ou PNG. Taille max de 800K",
      lastChangedPassword: "Modifié il y a 3 mois.",
      generatingPresentation: "Génération de votre présentation...",
      slideCopied: "Design de la diapositive copié dans le presse-papiers !",
      failedCopySlide: "Échec de la copie du design de la diapositive",
      copySlide: "Copier la diapositive",
      fullScreen: "Plein écran",
      readyToGenerateSlides: "Prêt à générer des diapositives",
      readyToGenerateSlidesDesc: "Téléchargez un plan marketing, un rapport d'analyse ou fournissez du contexte pour générer automatiquement une présentation structurée.",
      presentationTopic: "Sujet / Contexte de la présentation",
      presentationTopicPlaceholder: "Entrez un sujet, des métriques clés ou un contexte détaillé pour votre présentation...",
      presentationTopicTip: "Astuce : vous pouvez coller de longs rapports ou plusieurs paragraphes ici. Appuyez sur Entrée pour de nouvelles lignes.",
      numberOfSlides: "Nombre de diapositives",
      autoAiDecide: "Auto (l'IA déciderá)",
      numberOfSlidesDesc: "Spécifiez un nombre ou laissez vide pour une présentation complète (généralement 10-15 diapositives).",
      changeDocument: "Changer de document",
      uploadSourceDocument: "Télécharger le document source",
      generateFromDocument: "Générer à partir du document",
      autoGenerate: "Génération automatique",
      planTitle: "Générateur de plan marketing",
      planDesc: "Fournissez du contexte ou téléchargez des documents pour générer un plan marketing structuré.",
      planPlaceholder: "Ex : 'Développer une stratégie d'acquisition de chauffeurs pour le T4 à Casablanca en se concentrant sur les réseaux sociaux...'",
      analyzeTitle: "Analyse de documents",
      analyzeDesc: "Téléchargez des rapports Excel, des données sur l'offre ou des métriques sur les chauffeurs pour des insights basés sur l'IA.",
      analyzePlaceholder: "Téléchargez un fichier ou demandez 'Analysez le Coût d'Acquisition Chauffeur (DAC)...'",
      presentationTitle: "Générer une présentation",
      presentationDesc: "Transformez les insights et les plans en diapositives de présentation.",
      worldClock: "Horloge mondiale",
      newPresentation: "Nouvelle présentation",
      slideOf: "Diapositive {current} sur {total}",
      noResultsFound: "Aucun résultat trouvé",
      signInToContinue: "Connectez-vous à votre compte pour continuer",
      signingIn: "Connexion en cours...",
      signIn: "Se connecter",
      orContinueWith: "Ou continuer avec",
      successfullySignedIn: "Connecté avec succès !",
      analyticsDashboard: "Tableau de bord analytique",
      analyticsDesc: "Métriques de performance en temps réel et insights d'efficacité de l'IA.",
      last7Days: "7 derniers jours",
      last30Days: "30 derniers jours",
      last90Days: "90 derniers jours",
      last24Hours: "Dernières 24 heures",
      lastYear: "L'année dernière",
      allTime: "Tout le temps",
      aiActivityOverTime: "Activité de l'IA au fil du temps",
      aiActivityDesc: "Volume quotidien de plans, documents, présentations, campagnes et avis.",
      plans: "Plans",
      docs: "Docs",
      campaigns: "Campagnes",
      reviews: "Avis",
      totalPlans: "Plans totaux",
      docsAnalyzed: "Docs analysés",
      presentations: "Présentations",
      timeSaved: "Temps gagné",
      campaignRoi: "ROI de campagne",
      marketingPlans: "Plans marketing",
      docAnalysis: "Analyse de docs",
      contentMix: "Mix de contenu",
      contentMixDesc: "Distribution des actifs générés par l'IA.",
      totalAssets: "Actifs totaux",
      efficiencyGain: "Gain d'efficacité (Heures)",
      efficiencyDesc: "Comparaison du temps de flux de travail manuel vs assisté par l'IA.",
      faster: "Plus rapide",
      totalManualTime: "Temps manuel total",
      totalAiTime: "Temps IA total",
      manualProcess: "Processus manuel",
      aiAssisted: "Assisté par l'IA",
      recentSystemEvents: "Événements système récents",
      recentEventsDesc: "Dernières actions effectuées sur la plateforme.",
      viewAll: "Voir tout",
      event: "Événement",
      user: "Utilisateur",
      status: "Statut",
      time: "Temps",
      welcomeBack: "Bon retour",
      success: "Succès",
      error: "Erreur",
      editor: "Éditeur",
      owner: "Propriétaire",
      admin: "Administrateur",
      preferencesSaved: "Préférences enregistrées",
      profileSaved: "Profil enregistré",
      driverAcquisition: "Acquisition de chauffeurs (DAC)",
      driverAcquisitionDesc: "Plan pour augmenter l'offre",
      driverAcquisitionPrompt: "Créer un plan marketing pour réduire le DAC de 15 % au T3.",
      riderRetention: "Rétention des passagers",
      riderRetentionDesc: "Campagne pour booster les utilisateurs actifs",
      riderRetentionPrompt: "Rédiger un plan de campagne de réengagement pour les passagers qui n'ont pas utilisé l'application depuis 30 jours.",
      marketLaunch: "Lancement sur le marché",
      marketLaunchDesc: "Stratégie de mise sur le marché",
      marketLaunchPrompt: "Générez un plan de mise sur le marché pour lancer les services dans une nouvelle ville de taille moyenne.",
      budgetAllocation: "Allocation budgétaire",
      budgetAllocationDesc: "Optimiser les dépenses publicitaires",
      budgetAllocationPrompt: "Proposer un plan d'allocation budgétaire pour un budget marketing trimestriel de 500 000 $ en se concentrant sur les canaux de performance.",
      analyzeCac: "Analyser le DAC/UAC",
      analyzeCacDesc: "Réviser les coûts d'acquisition (DAC/UAC)",
      analyzeCacPrompt: "Analyser le rapport de Coût d'Acquisition Chauffeur (DAC) téléchargé et identifier les canaux les plus efficaces.",
      supplyVsDemand: "Offre vs Demande",
      supplyVsDemandDesc: "Équilibrer les métriques",
      supplyVsDemandPrompt: "Comparer les métriques de l'offre (chauffeurs) par rapport à la demande (passagers) pour trouver les goulots d'étranglement.",
      churnAnalysis: "Analyse de l'attrition",
      churnAnalysisDesc: "Comprendre le départ des utilisateurs",
      churnAnalysisPrompt: "Analyser les données d'attrition des passagers et suggérer 3 domaines d'amélioration immédiate.",
      roiCalculation: "Calcul du ROI",
      roiCalculationDesc: "Mesurer le succès de la campagne",
      roiCalculationPrompt: "Calculer le ROI du récent programme de parrainage basé sur les données fournies.",
      analyzeActivity: "Analyser l'activité",
      analyzeActivityDesc: "Téléchargez votre rapport et obtenez des commentaires d'experts sur votre activité marketing.",
      analyzeActivityPrompt: "J'ai téléchargé mon rapport d'activité. Veuillez analyser ce que j'ai accompli et fournir une perspective d'expert sur les résultats.",
      meetingPrep: "Prép. de réunion",
      meetingPrepDesc: "Préparez-vous pour votre synchronisation hebdomadaire avec des questions probables et des réponses brainstormées.",
      meetingPrepPrompt: "J'ai une réunion marketing hebdomadaire à venir. Sur la base de mon rapport d'activité, quelles sont les questions probables que l'on me posera et comment devrais-je y répondre ?",
      critiqueImprove: "Critique et Amélioration",
      critiqueImproveDesc: "Obtenez une critique rigoureuse de votre présentation et des suggestions d'amélioration.",
      critiqueImprovePrompt: "Veuillez fournir une critique de ma présentation. Quels sont les points positifs et que devrais-je changer ou ajouter pour la rendre plus percutante ?",
      businessImpact: "Impact commercial",
      businessImpactDesc: "Comprendre comment votre activité impacte les métriques commerciales à long terme.",
      businessImpactPrompt: "Comment cette activité marketing impacte-t-elle nos métriques commerciales de base et nos objectifs à long terme ?",
      profileChangesSaved: "Modifications du profil enregistrées avec succès !",
      notificationPreferencesSaved: "Préférences de notification enregistrées !",
      passwordUpdated: "Mot de passe mis à jour avec succès !",
      fillAllFields: "Veuillez remplir tous les champs.",
      passwordsDoNotMatch: "Les mots de passe ne correspondent pas !",
      passwordTooShort: "Le mot de passe doit comporter au moins 8 caractères.",
      analyticsExported: "Données analytiques exportées avec succès !",
      copiedToClipboard: "Copié dans le presse-papiers !",
      signInSuccess: "Connexion réussie !",
      signInWithSuccess: "Connexion réussie avec {provider} !",
      connectingTo: "Connexion à {provider}...",
      campaignAnalysis: "Campagnes Marketing",
      campaignAnalysisSubtitle: "Générez, analysez et localisez du contenu marketing à fort impact.",
      generateContent: "Générer du contenu",
      analyzeDraft: "Analyser le brouillon",
      translate: "Traduire",
      addEmojis: "Ajouter des emojis",
      sourceLanguage: "Langue source",
      targetLanguage: "Langue cible",
      targetCountry: "Pays cible",
      translateContent: "Traduire le contenu",
      translating: "Traduction...",
      translationResult: "Résultat de la traduction",
      selectLanguage: "Choisir la langue",
      selectCountry: "Choisir le pays",
      emojiAdded: "Emojis ajoutés avec succès !",
      configuration: "Configuration",
      contentFormat: "Format de contenu",
      description: "Description",
      generateMarketingText: "Générer du texte marketing",
      generatedResult: "Résultat généré",
      copyToClipboard: "Copier dans le presse-papiers",
      analyzeThisResult: "Analyser ce résultat",
      newsFeed: "Fil d'actualité",
      pushNotification: "Notification push",
      whatsapp: "WhatsApp",
      tiktokScript: "Script TikTok",
      youtubeScript: "Script YouTube",
      smsText: "SMS/Texte",
      descriptionPlaceholder: "Décrivez l'objectif de votre campagne (ex : 'Inciter les chauffeurs partenaires à augmenter l'offre à Dakar pendant les heures de pointe du matin')...",
      noResultGenerated: "Aucun contenu généré pour le moment. Configurez et cliquez sur générer.",
      analysisResult: "Résultat de l'analyse",
      editorialCompliance: "Conformité éditoriale",
      actionability: "Actionnabilité",
      clarity: "Clarté",
      conciseness: "Concision",
      overallScore: "Score global",
      suggestionsForImprovement: "Suggestions d'amélioration",
      analyzeDraftButton: "Analyser le brouillon",
      analyzing: "Analyse en cours...",
      using: "Utilisation de",
      overallWinnability: "Potentiel de succès global",
      overallWinnabilityDesc: "Basé sur la modélisation prédictive de l'IA",
      draftAnalysis: "Analyse de brouillon",
      pasteDraft: "Collez votre brouillon",
      pasteDraftPlaceholder: "Collez le texte marketing que vous souhaitez analyser...",
      startAiAnalysis: "Démarrer l'analyse IA",
      contentFormatOptional: "Format de contenu (Optionnel)",
      yourGeneratedContent: "Votre contenu généré apparaîtra ici.",
      engagement: "Engagement",
      outcomeProbability: "Probabilité de résultat",
      rewriteToImprove: "Réécrire pour améliorer (Cible 100%)",
      rewriteToImproveDesc: "Cela appliquera automatiquement tous les commentaires de l'IA à votre brouillon.",
      analysisResultsAppearHere: "Les résultats de l'analyse apparaîtront ici après le traitement.",
      translationResultsAppearHere: "Les résultats de la traduction apparaîtront ici après le traitement.",
      thinking: "Réflexion...",
      you: "Vous",
      studioAi: "Assistant",
      copy: "Copier",
      removeFile: "Supprimer le fichier",
      styleReference: "Référence de style",
      uploadStyleReference: "Télécharger la référence de style",
      styleReferenceDesc: "Téléchargez une présentation pour utiliser son style (polices, couleurs, ton) comme référence.",
      usingStyle: "Utilisation du style de",
      changeStyle: "Changer de style",
      signUp: "S'inscrire",
      dontHaveAccount: "Vous n'avez pas de compte ?",
      alreadyHaveAccount: "Vous avez déjà un compte ?",
      createAccount: "Créer un compte",
      creatingAccount: "Création du compte...",
      marketingPlanGen: "Gén. de plan marketing",
      docAnalysisEvent: "Analyse de doc",
      presentationExport: "Exportation de présentation",
      apiKeyRotated: "Clé API pivotée",
      newDatasetUpload: "Nouveau téléchargement de données",
      datePeriod: "Date/Période",
      alert: "Alerte",
      gmt: "GMT (Temps moyen de Greenwich)",
      cet: "CET (Heure d'Europe centrale)",
      eet: "EET (Heure d'Europe de l'Est)",
      ast: "AST (Heure standard d'Arabie)",
      ist: "IST (Heure standard d'Israël)",
      azt: "AZT (Heure de l'Azerbaïdjan)",
      trt: "TRT (Heure de la Turquie)",
      category: "Catégorie",
      manualTime: "Temps manuel",
      aiTime: "Temps IA",
      tasks: "Tâches",
      manageTasksDesc: "Organisez et suivez vos tâches marketing.",
      calendar: "Calendrier",
      todo: "À faire",
      done: "Terminé",
      transcribe: "Transcrire",
      transcribeDesc: "Convertissez les enregistrements audio et les flux en direct en texte pour vos marchés.",
      transcribeTitle: "Transcription Audio",
      visualize: "Visualiser",
      visualizeDesc: "Transformez les données en magnifiques graphiques prêts pour la présentation.",
      storyboard: "Storyboard",
      storyboardDesc: "Générez des scripts de scènes cinématographiques et des cadres visuels pour la génération de vidéos.",
      storyboardTitle: "Video Storyboard Studio",
      tts: "Texte vers Parole",
      ttsDesc: "Convertissez le texte en voix naturelle dans plusieurs langues.",
      ttsTitle: "Création Audio",
      focus: "Focus",
      focusDesc: "Concentrez-vous et travaillez sans distraction avec un minuteur pomodoro.",
      
      // Data Visualization Translations
      dataVisualizationTitle: "Visualisation des Données",
      dataVisualizationDesc: "Transformez les données et les métriques marketing en graphiques professionnels et modernes pour vos présentations.",
      dataset: "Jeu de données",
      rawData: "Données Brutes",
      uploadCsvOrExcel: "CSV/Excel",
      chartTypePreference: "Préférence de Type de Graphique",
      selectChartType: "Sélectionner le Type de Graphique",
      barChart: "Graphique à Barres",
      lineGraph: "Graphique Linéaire",
      areaChart: "Graphique en Aires",
      pieChart: "Graphique Circulaire",
      visualizationRequest: "Demande de Visualisation",
      visualizationPlaceholder: "ex: Créer un graphique à barres montrant le taux d'attrition sur les 6 derniers mois",
      generateChart: "Générer le Graphique",
      generating: "Génération...",
      ideas: "Idées",
      ideasItem1: "Revenus Q3 vs Objectifs",
      ideasItem1Prompt: "Afficher les revenus du T3 par rapport aux objectifs par région sous forme de graphique à barres",
      ideasItem2: "Répartition des Parts de Marché",
      ideasItem2Prompt: "Créer un diagramme circulaire pour la répartition des parts de marché",
      ideasItem3: "Tendances du Trafic Web",
      ideasItem3Prompt: "Visualiser les tendances du trafic du site web sur la dernière année sous forme de graphique en aires",
      noVisualizationGenerated: "Aucune Visualisation Générée",
      noVisualizationDesc: "Fournissez des données ou décrivez ce que vous souhaitez visualiser, et l'IA créera pour vous un graphique moderne, prêt à être présenté.",
      exportFailed: "Le téléchargement a échoué",
      failedToGenerateVisualization: "Échec de la génération de la visualisation",
      visualizationGenerated: "Visualisation Générée",
      chartExported: "Graphique Exporté",
      dataUploaded: "Données Téléchargées",
      failedToParseFile: "Échec de l'analyse du fichier. Assurez-vous qu'il s'agit d'un fichier CSV ou Excel valide.",

      // Storyboard Translations
      storyboardSubtitle: "Créez des scripts vidéo cinématographiques scène par scène pour Veo 3.1",
      newProject: "Nouveau Projet",
      step1of2: "Étape 1 sur 2",
      step2of2: "Étape 2 sur 2",
      visualIdentityDesign: "Design de l'Identité Visuelle",
      visualIdentityDesc: "Établissez l'identité physique du personnage principal. Cette commande garantira une cohérence absolue à travers chaque scène vidéo.",
      initializeScript: "Initialisation du Script",
      initializeScriptDesc: "Décrivez votre concept, public cible et style. Nous construirons des séquences de 8s.",
      protagonistName: "Nom du Protagoniste",
      protagonistNamePlaceholder: "ex: Ama",
      refinePrompt: "Affiner le Prompt",
      mainCharacterPrompt: "Prompt du Personnage Principal",
      mainCharacterPlaceholder: "Décrivez les traits physiques exacts : âge, teint, coiffure, traits du visage spécifiques et tenue...",
      technicalGuidance: "Conseils Techniques",
      technicalGuidanceDesc: "Ce prompt de personnage est la source de vérité. Il sera injecté dans chaque scène générée.",
      globalImageGenerator: "Générateur d'Images Global",
      targetAudienceStr: "Public Cible",
      targetAudiencePlaceholder: "ex: Jeunes professionnels à Accra",
      aspectRatioStr: "Ratio d'Aspect",
      commercialConcept: "Concept Commercial",
      commercialConceptPlaceholder: "Une publicité cinématographique de 30 secondes pour les trajets premium à Accra, montrant un voyage sans stress depuis les bureaux jusqu'aux restaurants animés.",
      backButton: "Retour",
      nextConfigureScript: "Suivant : Configurer le Script",
      generateStoryboardBtn: "Générer le Storyboard",
      scenesChronology: "Chronologie des Scènes",
      sceneStr: "Scène",
      narrativeScript: "Script Narratif",
      timecodeStr: "Timecode",
      fixed8sInterval: "Intervalle Fixe de 8s",
      technicalPrompt: "Prompt Technique Veo 3.1",
      previousScene: "Scène Précédente",
      approveScene: "Approuver la Scène",
      nextScene: "Scène Suivante",
      overallProgress: "Progression Globale",
      generateInGoogleFlow: "Générer dans Google Flow",
      scriptMightExceed: "Le script pourrait dépasser 8s.",
      promptCopied: "Prompt copié dans le presse-papiers !",
      sceneApprovedToast: "Scène approuvée !",
      storyboardGeneratedToast: "Storyboard Généré",
      generationFailed: "Échec de la génération. Veuillez réessayer.",
      charPromptRefined: "Prompt affiné !",
      refiningFailed: "Échec du raffinement du prompt.",

      focusTimer: "Minuteur de focus",
      presets: "Préréglages",
      customDuration: "Durée personnalisée",
      minutes: "minutes",
      focusComplete: "Session de focus terminée ! Faites une pause.",
      workTime: "Temps de travail",
      breakTime: "Temps de pause",
      longBreak: "Pause longue",
      pomodoroTechnique: "Technique Pomodoro",
      pomodoroDescription: "Une méthode de gestion du temps développée par Francesco Cirillo. Elle utilise un minuteur pour diviser le travail en intervalles, généralement de 25 minutes, séparés par de courtes pauses pour améliorer la concentration.",
      focusPhase: "Phase de Concentration",
      restPhase: "Phase de Repos",
      productivityScore: "Score de Productivité",
      weeklyFocus: "Activité Hebdomadaire Focus",
      focusMode: "Mode focus",
      timer: "Timer",
      stats: "Stats",
      noSessionsYet: "Aucune session de concentration terminée pour le moment. Commencez à travailler !",
      focusGoal: "Sur quoi travaillez-vous ?",
      startFocus: "Démarrer la session de concentration",
      pauseFocus: "Pause",
      resetFocus: "Réinitialiser",
      focusHistory: "Historique",
      totalFocusTime: "Temps total de concentration",
      sessionsCompleted: "Sessions terminées",
      focusStats: "Stats de concentration",
      focusSessionHistory: "Historique des sessions",
      today: "Aujourd'hui",
      week: "Semaine",
      month: "Mois",
      activity: "Activité",
      hours: "heures",
      sessions: "sessions",
      totalTranscriptions: "Total des transcriptions",
      transcriptions: "Transcriptions",
      totalTranslations: "Traductions totales",
      totalImagesGenerated: "Images créées",
      translations: "Traductions",
      generatedImages: "Images générées",
      imageGeneration: "Génération d'images",
      uac: "Coût d'acquisition utilisateur (UAC)",
      dac: "Coût d'acquisition chauffeur (DAC)",
    },
    'es-la': {
      home: "Inicio",
      marketing: "Marketing",
      plan: "Plan de Marketing",
      analyze: "Analizar Docs",
      campaign: "Campañas de Marketing",
      presentation: "Presentación",
      analytics: "Analítica",
      settings: "Ajustes",
      profile: "Perfil",
      account: "Ajustes de Cuenta",
      notifications: "Notificaciones",
      region: "Región e Idioma",
      help: "Centro de Ayuda",
      about: "Acerca de",
      theme: "Tema",
      logout: "Cerrar sesión",
      save: "Guardar cambios",
      update: "Actualizar",
      enable: "Habilitar",
      disable: "Deshabilitar",
      search: "Buscar...",
      newUpdate: "Nueva actualización",
      welcome: "Bienvenido",
      activeProjects: "Proyectos activos",
      aiInsights: "Perspectivas de IA",
      recentActivity: "Actividad reciente",
      clearHistory: "Borrar historial",
      noActivity: "No hay actividad reciente. Comience creando un plan o analizando un documento.",
      totalTranslations: "Traducciones totales",
      totalImagesGenerated: "Imágenes creadas",
      translations: "Traducciones",
      generatedImages: "Imágenes generadas",
      imageGeneration: "Generación de imágenes",
      uac: "Costo de Adquisición de Usuarios (UAC)",
      dac: "Costo de Adquisición de Conductores (DAC)",
      welcomeTitle: "Bienvenido a Marketing Manager Studio",
      welcomeSubtitle: "Su plataforma centralizada para estrategias de marketing basadas en datos e inteligencia de mercado integral que impulsa el crecimiento empresarial.",
      createPlanDesc: "Redacte estrategias integrales con guía de IA.",
      analyzeDocsDesc: "Suba informes para obtener información instantánea basada en datos.",
      campaignAnalysisDesc: "Genere, analice y localice borradores de contenido de marketing.",
      generatePresentationDesc: "Convierta sus planes en diapositivas listas para ejecutivos.",
      language: "Idioma",
      timezone: "Zona horaria",
      dateFormat: "Formato de fecha",
      twoFactor: "Autenticación de dos factores",
      password: "Contraseña",
      emailNotifications: "Notificaciones por correo",
      pushNotifications: "Notificaciones push",
      marketingEmails: "Correos de marketing",
      securityAlerts: "Alertas de seguridad",
      brandIdentity: "Bóveda de identidad de marca",
      brandIdentityDesc: "Administre sus activos de marca, colores y tono de voz para garantizar la coherencia en todo el contenido generado.",
      brandLogo: "Logotipo de la marca",
      primaryColor: "Color primario",
      secondaryColor: "Color secundario",
      accentColor: "Color de acento",
      toneOfVoice: "Tono de voz",
      brandGuidelines: "Pautas de marca",
      brandGuidelinesPlaceholder: "Describa la personalidad de su marca, su misión y cualquier regla específica para la generación de contenido...",
      saveBrandIdentity: "Guardar identidad de marca",
      brandIdentitySaved: "¡Identidad de marca guardada con éxito!",
      uploadLogo: "Cargar logotipo",
      brandProfile: "Perfil de marca",
      speakerNotes: "Notas del orador",
      showNotes: "Mostrar notas",
      hideNotes: "Ocultar notas",
      presentationScript: "Guion de presentación",
      savePreferences: "Guardar preferencias",
      updateRegion: "Actualizar ajustes de región",
      cancel: "Cancelar",
      profileDesc: "Actualice su información personal y perfil público.",
      accountDesc: "Gestione su seguridad, preferencias de IA y organización.",
      notificationsDesc: "Configure cómo y cuándo recibe actualizaciones.",
      regionDesc: "Establezca sus preferencias locales de hora, fecha e idioma.",
      fullName: "Nombre completo",
      email: "Correo electrónico",
      jobTitle: "Título del puesto",
      bio: "Biografía",
      saveProfile: "Guardar cambios del perfil",
      security: "Seguridad",
      updatePassword: "Actualizar contraseña",
      currentPassword: "Contraseña actual",
      newPassword: "Nueva contraseña",
      confirmPassword: "Confirmar nueva contraseña",
      aiPreferences: "Preferencias de IA",
      defaultModel: "Modelo predeterminado",
      responseTone: "Tono de respuesta",
      dangerZone: "Zona de peligro",
      deleteOrg: "Eliminar organización",
      deactivateAccount: "Desactivar cuenta",
      review: "Revisión de Actividad",
      reviewDesc: "Obtenga comentarios sobre sus actividades de marketing y prepárese para reuniones.",
      reviewActivity: "Revisar Actividad",
      reviewPrompt: "Suba una presentación o informe para recibir comentarios de expertos...",
      reviewAchieved: "Lo que logró",
      reviewCritique: "Crítica y Mejoras",
      reviewQuestions: "Preguntas Probables de la Reunión",
      reviewAnswers: "Respuestas Lluvia de Ideas",
      reviewPositives: "Positivos",
      reviewSuggestions: "Sugerencias de Mejora",
      history: "Historial",
      newChat: "Nuevo Chat",
      noHistory: "Sin historial",
      clear: "Borrar",
      export: "Exportar",
      slides: "Diapositivas",
      howCanIHelp: "¿Cómo puedo ayudarte hoy?",
      uploadDocsDesc: "Suba documentos, proporcione contexto o pídame que genere planes de marketing.",
      enterpriseShield: "Escudo Empresarial",
      active: "Activo",
      dataPrivacyDesc: "Tus datos están encriptados y nunca se usan para entrenar modelos públicos. La seguridad de nivel empresarial está habilitada por defecto.",
      dataPrivacyLevel: "Nivel de Privacidad de Datos",
      professionalAnalytical: "Profesional y Analítico",
      creativeBold: "Creativo y Audaz",
      conciseExecutive: "Conciso y Ejecutivo",
      addNewAccount: "Agregar Nueva Cuenta",
      switchAccount: "Cambiar Cuenta",
      lastChanged: "Cambiado hace 3 meses.",
      dangerZoneDesc: "Una vez que elimines tu cuenta u organización, no hay vuelta atrás. Por favor, asegúrate.",
      twoFactorDesc: "Agrega una capa extra de seguridad a tu cuenta.",
      growth: "Crecimiento",
      visualImpact: "Impacto Visual",
      portfolioLogic: "Lógica de Portafolio",
      aiIndustry: "Industria de IA",
      contents: "CONTENIDO",
      generate: "Generar",
      switchAccountLabel: "Cambiar cuenta",
      hideHistory: "Ocultar historial",
      showHistory: "Mostrar historial",
      organization: "Organización",
      phoneNumber: "Número de teléfono",
      changeAvatar: "Cambiar avatar",
      avatarSizeDesc: "JPG, GIF o PNG. Tamaño máx. de 800K",
      lastChangedPassword: "Cambiado hace 3 meses.",
      generatingPresentation: "Generando su presentación...",
      slideCopied: "¡Diseño de diapositiva copiado al portapapeles!",
      failedCopySlide: "Error al copiar el diseño de la diapositiva",
      copySlide: "Copiar diapositiva",
      fullScreen: "Pantalla completa",
      readyToGenerateSlides: "Listo para generar diapositivas",
      readyToGenerateSlidesDesc: "Suba un plan de marketing, un informe de análisis o proporcione contexto para generar automáticamente una presentación estructurada.",
      presentationTopic: "Tema / Contexto de la presentación",
      presentationTopicPlaceholder: "Ingrese un tema, métricas clave o contexto detallado para su presentación...",
      presentationTopicTip: "Sugerencia: puede pegar informes largos o varios párrafos aquí. Presione Enter para nuevas líneas.",
      numberOfSlides: "Número de diapositivas",
      autoAiDecide: "Auto (la IA decidirá)",
      numberOfSlidesDesc: "Especifique un número o déjelo en blanco para una presentación completa (generalmente 10-15 diapositivas).",
      changeDocument: "Cambiar documento",
      uploadSourceDocument: "Subir documento fuente",
      generateFromDocument: "Generar desde documento",
      autoGenerate: "Generación automática",
      planTitle: "Generador de plan de marketing",
      planDesc: "Proporcione contexto o suba documentos para generar un plan de marketing estructurado.",
      planPlaceholder: "Ej.: 'Desarrollar una estrategia de adquisición de conductores para el cuarto trimestre en Ciudad de México enfocada en canales digitales...'",
      analyzeTitle: "Análisis de documentos",
      analyzeDesc: "Suba informes de Excel, datos de oferta o métricas de conductores para obtener información impulsada por IA.",
      analyzePlaceholder: "Suba un archivo o pregunte 'Analice los costos de adquisición de conductores (DAC)...'",
      presentationTitle: "Generar presentación",
      presentationDesc: "Convierta ideas y planes en diapositivas de presentación.",
      worldClock: "Reloj mundial",
      newPresentation: "Nueva presentación",
      slideOf: "Diapositiva {current} de {total}",
      noResultsFound: "No se encontraron resultados",
      signInToContinue: "Inicie sesión en su cuenta para continuar",
      signingIn: "Iniciando sesión...",
      signIn: "Iniciar sesión",
      orContinueWith: "O continuar con",
      successfullySignedIn: "¡Sesión iniciada con éxito!",
      analyticsDashboard: "Panel de analítica",
      analyticsDesc: "Métricas de rendimiento en tiempo real e información sobre la eficiencia de la IA.",
      last7Days: "Últimos 7 días",
      last30Days: "Últimos 30 días",
      last90Days: "Últimos 90 días",
      last24Hours: "Últimas 24 horas",
      lastYear: "El año pasado",
      allTime: "Todo el tiempo",
      aiActivityOverTime: "Actividad de IA a lo largo del tiempo",
      aiActivityDesc: "Volumen diario de planes, documentos, presentaciones, campañas y revisiones.",
      plans: "Planes",
      docs: "Docs",
      campaigns: "Campañas",
      reviews: "Revisiones",
      totalPlans: "Planes totales",
      docsAnalyzed: "Docs analizados",
      presentations: "Presentaciones",
      timeSaved: "Tiempo ahorrado",
      campaignRoi: "ROI de campaña",
      marketingPlans: "Planes de marketing",
      docAnalysis: "Análisis de docs",
      contentMix: "Mezcla de contenido",
      contentMixDesc: "Distribución de activos generados por IA.",
      totalAssets: "Activos totales",
      efficiencyGain: "Ganancia de eficiencia (Horas)",
      efficiencyDesc: "Comparación del tiempo de flujo de trabajo manual vs asistido por IA.",
      faster: "Más rápido",
      totalManualTime: "Tiempo manual total",
      totalAiTime: "Tiempo IA total",
      manualProcess: "Proceso manual",
      aiAssisted: "Asistido por IA",
      recentSystemEvents: "Eventos recientes del sistema",
      recentEventsDesc: "Últimas acciones realizadas en la plataforma.",
      viewAll: "Ver todo",
      event: "Evento",
      user: "Usuario",
      status: "Estado",
      time: "Tiempo",
      welcomeBack: "Bienvenido de nuevo",
      success: "Éxito",
      error: "Error",
      editor: "Editor",
      owner: "Propietario",
      admin: "Administrador",
      preferencesSaved: "Preferencias guardadas",
      profileSaved: "Perfil guardado",
      riderAcquisition: "Adquisición de usuarios (UAC)",
      driverAcquisition: "Adquisición de conductores (DAC)",
      driverAcquisitionDesc: "Plan para aumentar el lado de la oferta",
      driverAcquisitionPrompt: "Crear un plan de marketing para reducir el DAC en un 15% en el tercer trimestre.",
      riderRetention: "Retención de pasajeros",
      riderRetentionDesc: "Campaña para impulsar usuarios activos",
      riderRetentionPrompt: "Redactar un plan de campaña de re-engagement para pasajeros que no han usado la aplicación en 30 días.",
      marketLaunch: "Lanzamiento al mercado",
      marketLaunchDesc: "Estrategia de entrada al mercado",
      marketLaunchPrompt: "Generar un plan de entrada al mercado para lanzar los servicios en una nueva ciudad de tamaño medio.",
      budgetAllocation: "Asignación de presupuesto",
      budgetAllocationDesc: "Optimizar el gasto en publicidad",
      budgetAllocationPrompt: "Proponer un plan de asignación de presupuesto para un presupuesto de marketing trimestral de $500k centrándose en canales de rendimiento.",
      analyzeCac: "Analizar CAC",
      analyzeCacDesc: "Revisar costos de adquisición",
      analyzeCacPrompt: "Analizar el informe de costo de adquisición de conductores subido e identificar los canales más eficientes.",
      supplyVsDemand: "Oferta vs Demanda",
      supplyVsDemandDesc: "Equilibrar métricas",
      supplyVsDemandPrompt: "Comparar las métricas del lado de la oferta (conductores) frente al lado de la demanda (pasajeros) para encontrar cuellos de botella.",
      churnAnalysis: "Análisis de deserción",
      churnAnalysisDesc: "Entender el abandono de usuarios",
      churnAnalysisPrompt: "Analizar los datos de deserción de pasajeros y sugerir 3 áreas de mejora inmediata.",
      roiCalculation: "Cálculo de ROI",
      roiCalculationDesc: "Medir el éxito de la campaña",
      roiCalculationPrompt: "Calcular el ROI del programa de referidos reciente basado en los datos proporcionados.",
      analyzeActivity: "Analizar actividad",
      analyzeActivityDesc: "Sube tu informe y obtén comentarios de expertos sobre tu actividad de marketing.",
      analyzeActivityPrompt: "He subido mi informe de actividad. Por favor, analice lo que logré y proporcione una perspectiva experta sobre los resultados.",
      meetingPrep: "Prep. de reunión",
      meetingPrepDesc: "Prepárate para tu sincronización semanal con preguntas probables y respuestas pensadas.",
      meetingPrepPrompt: "Tengo una reunión de marketing semanal próximamente. Basado en mi informe de actividad, ¿cuáles son algunas preguntas probables que me harán y cómo debería responderlas?",
      critiqueImprove: "Crítica y Mejora",
      critiqueImproveDesc: "Obtén una crítica rigurosa de tu presentación y sugerencias de mejora.",
      critiqueImprovePrompt: "Por favor, proporcione una crítica de mi presentación. ¿Cuáles son los aspectos positivos y qué debería cambiar o agregar para que sea más impactante?",
      businessImpact: "Impacto en el negocio",
      businessImpactDesc: "Entender cómo su actividad impacta las métricas de negocio a largo plazo.",
      businessImpactPrompt: "¿Cómo está impactando esta actividad de marketing nuestras métricas de negocio principales y objetivos a largo plazo?",
      profileChangesSaved: "¡Cambios de perfil guardados con éxito!",
      notificationPreferencesSaved: "¡Preferencias de notificación guardadas!",
      passwordUpdated: "¡Contraseña actualizada con éxito!",
      fillAllFields: "Por favor, complete todos los campos.",
      passwordsDoNotMatch: "¡Las contraseñas no coinciden!",
      passwordTooShort: "La contraseña debe tener al menos 8 caracteres.",
      analyticsExported: "¡Datos analíticos exportados con éxito!",
      copiedToClipboard: "¡Copiado al portapapeles!",
      signInSuccess: "¡Inicio de sesión exitoso!",
      signInWithSuccess: "¡Inicio de sesión exitoso con {provider}!",
      connectingTo: "Conectando a {provider}...",
      campaignAnalysis: "Campañas de Marketing",
      campaignAnalysisSubtitle: "Genere, analice y localice contenido de marketing de alto impacto.",
      generateContent: "Generar contenido",
      analyzeDraft: "Analizar borrador",
      translate: "Traducir",
      addEmojis: "Agregar emojis",
      sourceLanguage: "Idioma de origen",
      targetLanguage: "Idioma de destino",
      targetCountry: "País de destino",
      translateContent: "Traducir contenido",
      translating: "Traduciendo...",
      translationResult: "Resultado de la traducción",
      selectLanguage: "Seleccionar idioma",
      selectCountry: "Seleccionar país",
      emojiAdded: "¡Emojis agregados con éxito!",
      configuration: "Configuración",
      contentFormat: "Formato de contenido",
      description: "Descripción",
      generateMarketingText: "Generar texto de marketing",
      generatedResult: "Resultado generado",
      copyToClipboard: "Copiar al portapapeles",
      analyzeThisResult: "Analizar este resultado",
      newsFeed: "Noticias",
      pushNotification: "Notificación push",
      whatsapp: "WhatsApp",
      tiktokScript: "Guion de TikTok",
      youtubeScript: "Guion de YouTube",
      smsText: "SMS/Texto",
      descriptionPlaceholder: "Describa el objetivo de su campaña (ej.: 'Incentivar a los conductores socios para aumentar la oferta en Lima durante las horas pico de la mañana')...",
      noResultGenerated: "Aún no se ha generado contenido. Configure y haga clic en generar.",
      analysisResult: "Resultado del análisis",
      editorialCompliance: "Cumplimiento editorial",
      actionability: "Accionabilidad",
      clarity: "Claridad",
      conciseness: "Concisión",
      overallScore: "Puntuación general",
      suggestionsForImprovement: "Sugerencias de mejora",
      analyzeDraftButton: "Analizar borrador",
      analyzing: "Analizando...",
      using: "Usando",
      overallWinnability: "Potencial de éxito general",
      overallWinnabilityDesc: "Basado en modelos predictivos de IA",
      draftAnalysis: "Análisis de borrador",
      pasteDraft: "Pegue su borrador",
      pasteDraftPlaceholder: "Pegue el texto de marketing que desea analizar...",
      startAiAnalysis: "Iniciar análisis de IA",
      contentFormatOptional: "Formato de contenido (Opcional)",
      yourGeneratedContent: "Su contenido generado aparecerá aquí.",
      engagement: "Compromiso",
      outcomeProbability: "Probabilidad de resultado",
      rewriteToImprove: "Reescribir para mejorar (Objetivo 100%)",
      rewriteToImproveDesc: "Esto aplicará automáticamente todos los comentarios de la IA a su borrador.",
      analysisResultsAppearHere: "Los resultados del análisis aparecerán aquí después del procesamiento.",
      translationResultsAppearHere: "Los resultados de la traducción aparecerán aquí después del procesamiento.",
      thinking: "Pensando...",
      you: "Tú",
      studioAi: "IA Asistente",
      copy: "Copiar",
      removeFile: "Eliminar archivo",
      styleReference: "Referencia de estilo",
      uploadStyleReference: "Cargar referencia de estilo",
      styleReferenceDesc: "Cargue una presentación para usar su estilo (fuentes, colores, tono) como referencia.",
      usingStyle: "Usando el estilo de",
      changeStyle: "Cambiar estilo",
      signUp: "Registrarse",
      dontHaveAccount: "¿No tienes una cuenta?",
      alreadyHaveAccount: "¿Ya tienes una cuenta?",
      createAccount: "Crear cuenta",
      creatingAccount: "Creando cuenta...",
      marketingPlanGen: "Gen. de plan de marketing",
      docAnalysisEvent: "Análisis de doc",
      presentationExport: "Exportación de presentación",
      apiKeyRotated: "Clave API rotada",
      newDatasetUpload: "Carga de nuevo conjunto de datos",
      datePeriod: "Fecha/Periodo",
      alert: "Alerta",
      gmt: "GMT (Hora media de Greenwich)",
      cet: "CET (Hora de Europa Central)",
      eet: "EET (Hora de Europa del Este)",
      ast: "AST (Hora estándar de Arabia)",
      ist: "IST (Hora estándar de Israel)",
      azt: "AZT (Hora de Azerbaiyán)",
      trt: "TRT (Hora de Turquía)",
      category: "Categoría",
      manualTime: "Tiempo manual",
      aiTime: "Tiempo IA",
      tasks: "Tareas",
      manageTasksDesc: "Organice y realice un seguimiento de sus tareas de marketing.",
      calendar: "Calendario",
      todo: "Por hacer",
      done: "Hecho",
      transcribe: "Transcribir",
      transcribeDesc: "Convierta grabaciones de audio y transmisiones en vivo en texto para sus mercados.",
      transcribeTitle: "Transcripción de Audio",
      visualize: "Visualizar",
      visualizeDesc: "Convierta datos en hermosos gráficos listos para presentaciones.",
      storyboard: "Storyboard",
      storyboardDesc: "Genera guiones cinemáticos escena por escena y cuadros visuales para la generación de video.",
      storyboardTitle: "Estudio de Storyboard de Video",
      tts: "Texto a Voz",
      ttsDesc: "Convierta texto en voz natural e idiomas múltiples.",
      ttsTitle: "Generador de Voz",
      focus: "Enfoque",
      focusDesc: "Concéntrate y trabaja sin distracciones con un temporizador pomodoro.",
      
      // Data Visualization Translations
      dataVisualizationTitle: "Visualización de Datos",
      dataVisualizationDesc: "Transforme los datos de marketing y las métricas en gráficos profesionales y modernos para sus presentaciones.",
      dataset: "Conjunto de Datos",
      rawData: "Datos sin Procesar",
      uploadCsvOrExcel: "CSV/Excel",
      chartTypePreference: "Preferencia de Tipo de Gráfico",
      selectChartType: "Seleccionar Tipo de Gráfico",
      barChart: "Gráfico de Barras",
      lineGraph: "Gráfico de Líneas",
      areaChart: "Gráfico de Áreas",
      pieChart: "Gráfico Circular",
      visualizationRequest: "Solicitud de Visualización",
      visualizationPlaceholder: "ej. Crear un gráfico de barras que muestre la tasa de abandono en los últimos 6 meses",
      generateChart: "Generar Gráfico",
      generating: "Generando...",
      ideas: "Ideas",
      ideasItem1: "Ingresos Q3 vs Objetivos",
      ideasItem1Prompt: "Mostrar los ingresos del Q3 frente a los objetivos por región como un gráfico de barras",
      ideasItem2: "Desglose de Cuota de Mercado",
      ideasItem2Prompt: "Crear un gráfico circular para el desglose de la cuota de mercado",
      ideasItem3: "Tendencias de Tráfico Web",
      ideasItem3Prompt: "Visualizar las tendencias del tráfico del sitio web durante el último año como un gráfico de áreas",
      noVisualizationGenerated: "No hay visualización generada",
      noVisualizationDesc: "Proporcione datos o describa lo que desea visualizar, y la IA creará un gráfico moderno y listo para su presentación.",
      exportFailed: "Error al exportar",
      failedToGenerateVisualization: "Error al generar visualización",
      visualizationGenerated: "Visualización Generada",
      chartExported: "Gráfico Exportado",
      dataUploaded: "Datos Subidos",
      failedToParseFile: "Error al analizar el archivo. Asegúrese de que sea un archivo CSV o Excel válido.",

      // Storyboard Translations
      storyboardSubtitle: "Cree guiones de video cinemáticos escena por escena para Veo 3.1",
      newProject: "Nuevo Proyecto",
      step1of2: "Paso 1 de 2",
      step2of2: "Paso 2 de 2",
      visualIdentityDesign: "Diseño de Identidad Visual",
      visualIdentityDesc: "Establezca la identidad física del personaje principal. Este mensaje garantizará una coherencia absoluta en todas las escenas.",
      initializeScript: "Inicializar Guión",
      initializeScriptDesc: "Describa su concepto, audiencia y estilo preferido. Construiremos secuencias de 8 segundos.",
      protagonistName: "Nombre del Protagonista",
      protagonistNamePlaceholder: "ej. Ama",
      refinePrompt: "Refinar Instrucción",
      mainCharacterPrompt: "Instrucción del Personaje Principal",
      mainCharacterPlaceholder: "Describa rasgos físicos exactos: edad, tono de piel, peinado, atuendo...",
      technicalGuidance: "Orientación Técnica",
      technicalGuidanceDesc: "Esta instrucción del personaje es la fuente de verdad. Se inyectará en cada escena generada.",
      globalImageGenerator: "Generador de Imágenes Global",
      targetAudienceStr: "Público Objetivo",
      targetAudiencePlaceholder: "ej. Jóvenes profesionales en Accra",
      aspectRatioStr: "Relación de Aspecto",
      commercialConcept: "Concepto Comercial",
      commercialConceptPlaceholder: "Un comercial cinemático de 30 segundos para viajes premium en Accra.",
      backButton: "Atrás",
      nextConfigureScript: "Siguiente: Configurar Guión",
      generateStoryboardBtn: "Generar Storyboard",
      scenesChronology: "Cronología de Escenas",
      sceneStr: "Escena",
      narrativeScript: "Guión Narrativo",
      timecodeStr: "Código de Tiempo",
      fixed8sInterval: "Intervalo Fijo de 8s",
      technicalPrompt: "Instrucción Técnica Veo 3.1",
      previousScene: "Escena Anterior",
      approveScene: "Aprobar Escena",
      nextScene: "Siguiente Escena",
      overallProgress: "Progreso General",
      generateInGoogleFlow: "Generar en Google Flow",
      scriptMightExceed: "El guión podría superar los 8 segundos.",
      promptCopied: "¡Instrucción copiada al portapapeles!",
      sceneApprovedToast: "¡Escena aprobada!",
      storyboardGeneratedToast: "Storyboard Generado",
      generationFailed: "Error al generar. Inténtalo de nuevo.",
      charPromptRefined: "¡Instrucción del personaje refinada!",
      refiningFailed: "Error al refinar la instrucción del personaje.",

      focusTimer: "Temporizador de enfoque",
      presets: "Ajustes preestablecidos",
      customDuration: "Duración personalizada",
      minutes: "minutos",
      focusComplete: "¡Sesión de enfoque completada! Tómate un descanso.",
      workTime: "Tiempo de trabajo",
      breakTime: "Tiempo de descanso",
      longBreak: "Descanso largo",
      pomodoroTechnique: "Técnica Pomodoro",
      pomodoroDescription: "Un método de gestión del tiempo desarrollado por Francesco Cirillo. Utiliza un temporizador para dividir el trabajo en intervalos, normalmente de 25 minutos, separados por breves descansos.",
      focusPhase: "Fase de Enfoque",
      restPhase: "Fase de Descanso",
      productivityScore: "Puntaje de Productividad",
      weeklyFocus: "Actividad Semanal de Enfoque",
      focusMode: "Modo de enfoque",
      timer: "Timer",
      stats: "Estadísticas",
      noSessionsYet: "Aún no se han completado sesiones de enfoque. ¡Empieza a trabajar!",
      focusGoal: "¿En qué estás trabajando?",
      startFocus: "Iniciar Sesión de Enfoque",
      pauseFocus: "Pausar Sesión",
      resetFocus: "Reiniciar Temporizador",
      focusHistory: "Historial",
      totalFocusTime: "Tiempo Total de Enfoque",
      sessionsCompleted: "Sesiones Completadas",
      focusStats: "Estadísticas de Enfoque",
      focusSessionHistory: "Historial de Sesiones de Enfoque",
      today: "Hoy",
      week: "Semana",
      month: "Mes",
      activity: "Actividad",
      hours: "horas",
      sessions: "sesiones",
      totalTranscriptions: "Transcripciones totales",
      transcriptions: "Transcripciones",
    },
    'pt-af': {
      home: "Início",
      marketing: "Marketing",
      plan: "Plano de Marketing",
      analyze: "Analisar Docs",
      campaign: "Campanhas de Marketing",
      presentation: "Apresentação",
      analytics: "Analítica",
      settings: "Configurações",
      profile: "Perfil",
      account: "Configurações de Conta",
      notifications: "Notificações",
      region: "Região e Idioma",
      help: "Centro de Ajuda",
      about: "Sobre",
      theme: "Tema",
      logout: "Sair",
      save: "Salvar alterações",
      update: "Atualizar",
      enable: "Ativar",
      disable: "Desativar",
      search: "Pesquisar...",
      newUpdate: "Nova atualização",
      welcome: "Bem-vindo",
      activeProjects: "Projetos ativos",
      aiInsights: "Insights de IA",
      recentActivity: "Atividade recente",
      clearHistory: "Limpar histórico",
      noActivity: "Nenhuma atividade recente. Comece criando um plano ou analisando um documento.",
      welcomeTitle: "Bem-vindo ao Marketing Manager Studio",
      welcomeSubtitle: "Sua plataforma centralizada para estratégias de marketing baseadas em dados e inteligência de mercado abrangente que impulsionam o crescimento dos negócios.",
      createPlanDesc: "Elabore estratégias abrangentes com orientação de IA.",
      analyzeDocsDesc: "Faça upload de relatórios para insights instantâneos baseados em dados.",
      campaignAnalysisDesc: "Gere, analise e localize rascunhos de conteúdo de marketing.",
      generatePresentationDesc: "Transforme seus planos em slides prontos para executivos.",
      language: "Idioma",
      timezone: "Fuso horário",
      dateFormat: "Formato de data",
      twoFactor: "Autenticação de dois fatores",
      password: "Senha",
      emailNotifications: "Notificações por e-mail",
      pushNotifications: "Notificações push",
      marketingEmails: "E-mails de marketing",
      securityAlerts: "Alertas de segurança",
      brandIdentity: "Cofre de Identidade de Marca",
      brandIdentityDesc: "Gerencie seus ativos de marca, cores e tom de voz para garantir a consistência em todo o conteúdo gerado.",
      brandLogo: "Logotipo da Marca",
      primaryColor: "Cor Primária",
      secondaryColor: "Cor Secundária",
      accentColor: "Cor de Destaque",
      toneOfVoice: "Tom de Voz",
      brandGuidelines: "Diretrizes da Marca",
      brandGuidelinesPlaceholder: "Descreva a personalidade da sua marca, missão e quaisquer regras específicas para a geração de conteúdo...",
      saveBrandIdentity: "Salvar Identidade de Marca",
      brandIdentitySaved: "Identidade de Marca salva com sucesso!",
      uploadLogo: "Carregar Logotipo",
      brandProfile: "Perfil de Marca",
      speakerNotes: "Notas do Orador",
      showNotes: "Mostrar Notas",
      hideNotes: "Ocultar Notas",
      presentationScript: "Roteiro da Apresentação",
      savePreferences: "Salvar preferências",
      updateRegion: "Atualizar configurações de região",
      cancel: "Cancelar",
      profileDesc: "Atualize suas informações pessoais e perfil público.",
      accountDesc: "Gerencie sua segurança, preferências de IA e organização.",
      notificationsDesc: "Configure como e quando você recebe atualizações.",
      regionDesc: "Defina suas preferências locais de hora, data e idioma.",
      fullName: "Nome completo",
      email: "Endereço de e-mail",
      jobTitle: "Cargo",
      bio: "Bio",
      saveProfile: "Salvar alterações de perfil",
      security: "Segurança",
      updatePassword: "Atualizar senha",
      currentPassword: "Senha atual",
      newPassword: "Nova senha",
      confirmPassword: "Confirmar nova senha",
      aiPreferences: "Preferências de IA",
      defaultModel: "Modelo padrão",
      responseTone: "Tom de resposta",
      dangerZone: "Zona de perigo",
      deleteOrg: "Excluir organização",
      deactivateAccount: "Desativar conta",
      review: "Revisão de Atividade",
      reviewDesc: "Receba feedback sobre suas atividades de marketing e prepare-se para reuniões.",
      reviewActivity: "Revisar Atividade",
      reviewPrompt: "Faça upload de uma apresentação ou relatório para feedback de especialistas...",
      reviewAchieved: "O que você alcançou",
      reviewCritique: "Crítica e Melhorias",
      reviewQuestions: "Perguntas Prováveis da Reunião",
      reviewAnswers: "Respostas Brainstorming",
      reviewPositives: "Positivos",
      reviewSuggestions: "Sugestões de Melhoria",
      history: "Histórico",
      newChat: "Novo Chat",
      noHistory: "Sem histórico",
      clear: "Limpar",
      export: "Exportar",
      slides: "Slides",
      howCanIHelp: "Como posso ajudar você hoje?",
      uploadDocsDesc: "Faça upload de documentos, forneça contexto ou peça-me para gerar planos de marketing.",
      enterpriseShield: "Escudo Empresarial",
      active: "Ativo",
      dataPrivacyDesc: "Seus dados são criptografados e nunca usados para treinar modelos públicos. A segurança de nível empresarial está ativada por padrão.",
      dataPrivacyLevel: "Nível de Privacidade de Dados",
      professionalAnalytical: "Profissional e Analítico",
      creativeBold: "Criativo e Ousado",
      conciseExecutive: "Conciso e Executivo",
      addNewAccount: "Adicionar Nova Conta",
      switchAccount: "Trocar Conta",
      lastChanged: "Alterado há 3 meses.",
      dangerZoneDesc: "Depois de excluir sua conta ou organização, não há volta. Por favor, tenha certeza.",
      twoFactorDesc: "Adicione uma camada extra de segurança à sua conta.",
      growth: "Crescimento",
      visualImpact: "Impacto Visual",
      portfolioLogic: "Lógica de Portfólio",
      aiIndustry: "Indústria de IA",
      contents: "CONTEÚDO",
      generate: "Gerar",
      switchAccountLabel: "Trocar conta",
      hideHistory: "Ocultar histórico",
      showHistory: "Mostrar histórico",
      organization: "Organização",
      phoneNumber: "Número de telefone",
      changeAvatar: "Alterar avatar",
      avatarSizeDesc: "JPG, GIF ou PNG. Tamanho máx. de 800K",
      lastChangedPassword: "Alterado há 3 meses.",
      generatingPresentation: "Gerando sua apresentação...",
      slideCopied: "Design do slide copiado para a área de transferência!",
      failedCopySlide: "Falha ao copiar o design do slide",
      copySlide: "Copiar slide",
      fullScreen: "Tela cheia",
      readyToGenerateSlides: "Pronto para gerar slides",
      readyToGenerateSlidesDesc: "Faça upload de um plano de marketing, um relatório de análise ou forneça contexto para gerar automaticamente uma apresentação estruturada.",
      presentationTopic: "Tópico / Contexto da apresentação",
      presentationTopicPlaceholder: "Insira um tópico, métricas principais ou contexto detalhado para sua apresentação...",
      presentationTopicTip: "Dica: você pode colar relatórios longos ou vários parágrafos aqui. Pressione Enter para novas linhas.",
      numberOfSlides: "Número de slides",
      autoAiDecide: "Auto (a IA decidirá)",
      numberOfSlidesDesc: "Especifique um número ou deixe em branco para uma apresentação abrangente (geralmente 10-15 slides).",
      changeDocument: "Alterar documento",
      uploadSourceDocument: "Fazer upload do documento de origem",
      generateFromDocument: "Gerar a partir do documento",
      autoGenerate: "Geração automática",
      planTitle: "Gerador de plano de marketing",
      planDesc: "Forneça contexto ou faça upload de documentos para gerar um plano de marketing estruturado.",
      planPlaceholder: "Ex: 'Desenvolver uma estratégia de aquisição de motoristas para o quarto trimestre em Luanda focada em canais de alto desempenho...'",
      analyzeTitle: "Análise de documentos",
      analyzeDesc: "Faça upload de relatórios do Excel, dados do lado da oferta ou métricas de motoristas para insights baseados em IA.",
      analyzePlaceholder: "Faça upload de um arquivo ou pergunte 'Analise o Custo de Aquisição de Motoristas (DAC)...'",
      presentationTitle: "Gerar apresentação",
      presentationDesc: "Transforme insights e planos em slides de apresentação.",
      worldClock: "Relógio Mundial",
      newPresentation: "Nova apresentação",
      slideOf: "Slide {current} de {total}",
      noResultsFound: "Nenhum resultado encontrado",
      signInToContinue: "Faça login na sua conta para continuar",
      signingIn: "Entrando...",
      signIn: "Entrar",
      orContinueWith: "Ou continuar com",
      successfullySignedIn: "Login efetuado com sucesso!",
      analyticsDashboard: "Painel de Análise",
      analyticsDesc: "Métricas de desempenho em tempo real e insights de eficiência de IA.",
      last7Days: "Últimos 7 dias",
      last30Days: "Últimos 30 dias",
      last90Days: "Últimos 90 dias",
      last24Hours: "Últimas 24 horas",
      lastYear: "Último ano",
      allTime: "Todo o tempo",
      aiActivityOverTime: "Atividade de IA ao longo do tempo",
      aiActivityDesc: "Volume diário de planos, documentos, apresentações, campanhas e avaliações.",
      plans: "Planos",
      docs: "Docs",
      campaigns: "Campanhas",
      reviews: "Avaliações",
      totalPlans: "Planos totais",
      docsAnalyzed: "Docs analisados",
      presentations: "Apresentações",
      timeSaved: "Tempo economizado",
      campaignRoi: "ROI de campanha",
      marketingPlans: "Planos de marketing",
      docAnalysis: "Análise de docs",
      contentMix: "Mix de Conteúdo",
      contentMixDesc: "Distribuição de ativos gerados por IA.",
      totalAssets: "Ativos Totais",
      efficiencyGain: "Ganho de Eficiência (Horas)",
      efficiencyDesc: "Comparação de tempo de fluxo de trabalho manual vs assistido por IA.",
      faster: "Mais rápido",
      totalManualTime: "Tempo Manual Total",
      totalAiTime: "Tempo IA Total",
      manualProcess: "Processo Manual",
      aiAssisted: "Assistido por IA",
      recentSystemEvents: "Eventos Recentes do Sistema",
      recentEventsDesc: "Últimas ações realizadas na plataforma.",
      viewAll: "Ver Tudo",
      event: "Evento",
      user: "Usuário",
      status: "Status",
      time: "Tempo",
      welcomeBack: "Bem-vindo de volta",
      success: "Sucesso",
      error: "Erro",
      editor: "Editor",
      owner: "Proprietário",
      admin: "Administrador",
      preferencesSaved: "Preferências salvas",
      profileSaved: "Perfil salvo",
      riderAcquisition: "Aquisição de usuários (UAC)",
      driverAcquisition: "Aquisição de motoristas (DAC)",
      driverAcquisitionDesc: "Plano para aumentar o lado da oferta",
      driverAcquisitionPrompt: "Criar um plano de marketing para reduzir o DAC em 15% no terceiro trimestre.",
      riderRetention: "Retenção de passageiros",
      riderRetentionDesc: "Campanha para impulsionar usuários ativos",
      riderRetentionPrompt: "Redigir um plano de campanha de reengajamento para passageiros que não usam o aplicativo há 30 dias.",
      marketLaunch: "Lançamento no mercado",
      marketLaunchDesc: "Estratégia de entrada no mercado",
      marketLaunchPrompt: "Gerar um plano de entrada no mercado para o lançamento dos serviços em uma nova cidade de médio porte.",
      budgetAllocation: "Alocação de orçamento",
      budgetAllocationDesc: "Otimizar gastos com anúncios",
      budgetAllocationPrompt: "Propor um plano de alocação de orçamento para um orçamento de marketing trimestral de US$ 500 mil com foco em canais de desempenho.",
      analyzeCac: "Analisar DAC/UAC",
      analyzeCacDesc: "Revisar custos de aquisição (DAC/UAC)",
      analyzeCacPrompt: "Analisar o relatório DAC enviado e identificar os canais mais eficientes.",
      supplyVsDemand: "Oferta vs Demanda",
      supplyVsDemandDesc: "Equilibrar métricas",
      supplyVsDemandPrompt: "Comparar as métricas do lado da oferta (motoristas) vs lado da demanda (passageiros) para encontrar gargalos.",
      churnAnalysis: "Análise de rotatividade",
      churnAnalysisDesc: "Entender a desistência de usuários",
      churnAnalysisPrompt: "Analisar os dados de rotatividade de passageiros e sugerir 3 áreas para melhoria imediata.",
      roiCalculation: "Cálculo de ROI",
      roiCalculationDesc: "Medir o sucesso da campanha",
      roiCalculationPrompt: "Calcular o ROI do programa de indicação recente com base nos dados fornecidos.",
      analyzeActivity: "Analisar atividade",
      analyzeActivityDesc: "Faça upload do seu relatório e receba feedback de especialistas sobre sua atividade de marketing.",
      analyzeActivityPrompt: "Fiz upload do meu relatório de atividade. Analise o que alcancei e forneça uma perspectiva de especialista sobre os resultados.",
      meetingPrep: "Prep. de reunião",
      meetingPrepDesc: "Prepare-se para sua sincronização semanal com perguntas prováveis e respostas brainstormed.",
      meetingPrepPrompt: "Tenho uma reunião de marketing semanal chegando. Com base no meu relatório de atividade, quais são algumas perguntas prováveis que me farão e como devo respondê-las?",
      critiqueImprove: "Crítica e Melhoria",
      critiqueImproveDesc: "Obtenha uma crítica rigorosa da sua apresentação e sugestões de melhoria.",
      critiqueImprovePrompt: "Forneça uma crítica da minha apresentação. Quais são os pontos positivos e o que devo alterar ou adicionar para torná-la mais impactante?",
      businessImpact: "Impacto nos negócios",
      businessImpactDesc: "Entenda como sua atividade impacta as métricas de negócios de longo prazo.",
      businessImpactPrompt: "Como essa atividade de marketing está impactando nossas principais métricas de negócios e objetivos de longo prazo?",
      profileChangesSaved: "Alterações de perfil salvas com sucesso!",
      notificationPreferencesSaved: "Preferências de notificação salvas!",
      passwordUpdated: "Senha atualizada com sucesso!",
      fillAllFields: "Por favor, preencha todos os campos.",
      passwordsDoNotMatch: "As senhas não coincidem!",
      passwordTooShort: "A senha deve ter pelo menos 8 caracteres.",
      analyticsExported: "Dados analíticos exportados com sucesso!",
      copiedToClipboard: "Copiado para a área de transferência!",
      signInSuccess: "Login realizado com sucesso!",
      signInWithSuccess: "Login realizado com sucesso com {provider}!",
      connectingTo: "Conectando a {provider}...",
      campaignAnalysis: "Campanhas de Marketing",
      campaignAnalysisSubtitle: "Gere, analise e localize conteúdo de marketing de alto impacto.",
      generateContent: "Gerar conteúdo",
      analyzeDraft: "Analisar rascunho",
      translate: "Traduzir",
      addEmojis: "Adicionar emojis",
      sourceLanguage: "Idioma de origem",
      targetLanguage: "Idioma de destino",
      targetCountry: "País de destino",
      translateContent: "Traduzir conteúdo",
      translating: "Traduzindo...",
      translationResult: "Resultado da tradução",
      selectLanguage: "Selecionar idioma",
      selectCountry: "Selecionar país",
      emojiAdded: "Emojis adicionados com sucesso!",
      configuration: "Configuração",
      contentFormat: "Formato de conteúdo",
      description: "Descrição",
      generateMarketingText: "Gerar texto de marketing",
      generatedResult: "Resultado gerado",
      copyToClipboard: "Copiar para a área de transferência",
      analyzeThisResult: "Analisar este resultado",
      newsFeed: "Feed de notícias",
      pushNotification: "Notificação push",
      whatsapp: "WhatsApp",
      tiktokScript: "Roteiro do TikTok",
      youtubeScript: "Roteiro do YouTube",
      smsText: "SMS/Texto",
      descriptionPlaceholder: "Descreva o objetivo da sua campanha (ex: 'Incentivar motoristas parceiros a aumentar a oferta em Maputo durante o horário de pico da manhã')...",
      noResultGenerated: "Nenhum conteúdo gerado ainda. Configure e clique em gerar.",
      analysisResult: "Resultado da análise",
      editorialCompliance: "Conformidade editorial",
      actionability: "Capacidade de ação",
      clarity: "Clareza",
      conciseness: "Concisão",
      overallScore: "Pontuação geral",
      suggestionsForImprovement: "Sugestões de melhoria",
      analyzeDraftButton: "Analisar rascunho",
      analyzing: "Analisando...",
      using: "Usando",
      overallWinnability: "Potencial de sucesso geral",
      overallWinnabilityDesc: "Com base em modelagem preditiva de IA",
      draftAnalysis: "Análise de rascunho",
      pasteDraft: "Cole seu rascunho",
      pasteDraftPlaceholder: "Cole o texto de marketing que você deseja analisar...",
      startAiAnalysis: "Iniciar análise de IA",
      contentFormatOptional: "Formato de conteúdo (Opcional)",
      yourGeneratedContent: "Seu conteúdo gerado aparecerá aqui.",
      engagement: "Engajamento",
      outcomeProbability: "Probabilidade de resultado",
      rewriteToImprove: "Reescrever para melhorar (Meta 100%)",
      rewriteToImproveDesc: "Isso aplicará automaticamente todos os comentários da IA ao seu rascunho.",
      analysisResultsAppearHere: "Os resultados da análise aparecerão aqui após o processamento.",
      translationResultsAppearHere: "Os resultados da tradução aparecerão aqui após o processamento.",
      thinking: "Pensando...",
      you: "Você",
      studioAi: "Assistente de IA",
      copy: "Copiar",
      removeFile: "Remover arquivo",
      styleReference: "Referência de estilo",
      uploadStyleReference: "Carregar referência de estilo",
      styleReferenceDesc: "Carregue uma apresentação para usar seu estilo (fontes, cores, tom) como referência.",
      usingStyle: "Usando o estilo de",
      changeStyle: "Alterar estilo",
      signUp: "Inscrever-se",
      dontHaveAccount: "Não tem uma conta?",
      alreadyHaveAccount: "Já tem uma conta?",
      createAccount: "Criar conta",
      creatingAccount: "Criando conta...",
      marketingPlanGen: "Gen. de plano de marketing",
      docAnalysisEvent: "Análise de doc",
      presentationExport: "Exportação de apresentação",
      apiKeyRotated: "Chave API rotacionada",
      newDatasetUpload: "Upload de novo conjunto de dados",
      datePeriod: "Data/Período",
      alert: "Alerta",
      gmt: "GMT (Tempo Médio de Greenwich)",
      cet: "CET (Hora da Europa Central)",
      eet: "EET (Hora da Europa Oriental)",
      ast: "AST (Hora Padrão da Arábia)",
      ist: "IST (Hora Padrão de Israel)",
      azt: "AZT (Hora do Azerbaijão)",
      trt: "TRT (Hora da Turquia)",
      category: "Categoria",
      manualTime: "Tempo manual",
      aiTime: "Tempo IA",
      tasks: "Tarefas",
      manageTasksDesc: "Organize e acompanhe suas tarefas de marketing.",
      calendar: "Calendário",
      todo: "A fazer",
      done: "Concluído",
      transcribe: "Transcrever",
      transcribeDesc: "Converta gravações de áudio e feeds ao vivo em texto para seus mercados.",
      transcribeTitle: "Transcrição de Áudio",
      visualize: "Visualizar",
      visualizeDesc: "Transforme dados em belos gráficos prontos para apresentações.",
      storyboard: "Storyboard",
      storyboardDesc: "Gere guiões cena-a-cena cinematográficos e quadros visuais para a geração de vídeo.",
      storyboardTitle: "Estúdio de Storyboard de Vídeo",
      tts: "Texto para Fala",
      ttsDesc: "Converta texto em voz natural em vários idiomas.",
      ttsTitle: "Geração de Fala",
      focus: "Foco",
      focusDesc: "Concentre-se e trabalhe sem distrações com um temporizador pomodoro.",
      
      // Data Visualization Translations
      dataVisualizationTitle: "Visualização de Dados",
      dataVisualizationDesc: "Transforme dados de marketing e métricas em gráficos profissionais e modernos para as suas apresentações.",
      dataset: "Conjunto de Dados",
      rawData: "Dados Brutos",
      uploadCsvOrExcel: "CSV/Excel",
      chartTypePreference: "Preferência de Tipo de Gráfico",
      selectChartType: "Selecionar Tipo de Gráfico",
      barChart: "Gráfico de Barras",
      lineGraph: "Gráfico de Linhas",
      areaChart: "Gráfico de Áreas",
      pieChart: "Gráfico Circular",
      visualizationRequest: "Pedido de Visualização",
      visualizationPlaceholder: "ex. Criar um gráfico de barras mostrando a taxa de abandono nos últimos 6 meses",
      generateChart: "Gerar Gráfico",
      generating: "A gerar...",
      ideas: "Ideias",
      ideasItem1: "Receitas Q3 vs Objetivos",
      ideasItem1Prompt: "Mostrar as receitas do Q3 vs objetivos por região como un gráfico de barras",
      ideasItem2: "Distribuição da Quota de Mercado",
      ideasItem2Prompt: "Criar um gráfico circular para a distribuição da quota de mercado",
      ideasItem3: "Tendências de Tráfego Web",
      ideasItem3Prompt: "Visualizar as tendências de tráfego do site ao longo do último ano como um gráfico de áreas",
      noVisualizationGenerated: "Nenhuma Visualização Gerada",
      noVisualizationDesc: "Forneça dados ou descreva o que deseja visualizar e a IA criará um gráfico moderno, pronto a apresentar.",
      exportFailed: "Erro ao exportar",
      failedToGenerateVisualization: "Erro ao gerar a visualização",
      visualizationGenerated: "Visualização Gerada",
      chartExported: "Gráfico Exportado",
      dataUploaded: "Dados Carregados",
      failedToParseFile: "Falha ao analisar o ficheiro. Certifique-se de que é um ficheiro CSV ou Excel válido.",

      // Storyboard Translations
      storyboardSubtitle: "Crie guiões de vídeo cinematográficos cena-a-cena para Veo 3.1",
      newProject: "Novo Projeto",
      step1of2: "Passo 1 de 2",
      step2of2: "Passo 2 de 2",
      visualIdentityDesign: "Design de Identidade Visual",
      visualIdentityDesc: "Estabeleça a identidade física do personagem principal. Este comando garantirá consistência absoluta em todas as cenas.",
      initializeScript: "Inicializar Guião",
      initializeScriptDesc: "Descreva o seu conceito, público e estilo preferido. Construiremos sequências de 8s.",
      protagonistName: "Nome do Protagonista",
      protagonistNamePlaceholder: "ex. Ama",
      refinePrompt: "Refinar Instrução",
      mainCharacterPrompt: "Instrução do Personagem Principal",
      mainCharacterPlaceholder: "Descreva traços físicos exatos: idade, tom de pele, penteado, roupa...",
      technicalGuidance: "Orientação Técnica",
      technicalGuidanceDesc: "Este comando de personagem é a fonte da verdade. Será injetado em cada cena gerada.",
      globalImageGenerator: "Gerador Global de Imagens",
      targetAudienceStr: "Público-Alvo",
      targetAudiencePlaceholder: "ex. Jovens profissionais em Acra",
      aspectRatioStr: "Proporção da Tela",
      commercialConcept: "Conceito Comercial",
      commercialConceptPlaceholder: "Um anúncio cinematográfico de 30 segundos para viagens premium em Acra...",
      backButton: "Voltar",
      nextConfigureScript: "Seguinte: Configurar Guião",
      generateStoryboardBtn: "Gerar Storyboard",
      scenesChronology: "Cronologia das Cenas",
      sceneStr: "Cena",
      narrativeScript: "Guião Narrativo",
      timecodeStr: "Timecode",
      fixed8sInterval: "Intervalo Fixo de 8s",
      technicalPrompt: "Instrução Técnica Veo 3.1",
      previousScene: "Cena Anterior",
      approveScene: "Aprovar Cena",
      nextScene: "Cena Seguinte",
      overallProgress: "Progresso Geral",
      generateInGoogleFlow: "Gerar no Google Flow",
      scriptMightExceed: "O guião pode exceder 8s.",
      promptCopied: "Comando copiado para a área de transferência!",
      sceneApprovedToast: "Cena aprovada!",
      storyboardGeneratedToast: "Storyboard Gerado",
      generationFailed: "Erro ao gerar. Tente novamente.",
      charPromptRefined: "Instrução do personagem refinada!",
      refiningFailed: "Erro ao refinar a instrução do personagem.",

      focusTimer: "Temporizador de Foco",
      presets: "Predefinições",
      customDuration: "Duração Personalizada",
      minutes: "minutos",
      focusComplete: "Sessão de foco concluída! Faça uma pausa.",
      workTime: "Tempo de Trabalho",
      breakTime: "Tempo de Pausa",
      longBreak: "Pausa Longa",
      pomodoroTechnique: "Técnica Pomodoro",
      pomodoroDescription: "Um método de gestão de tempo desenvolvido por Francesco Cirillo. Ele usa um cronômetro para dividir o trabalho em intervalos, geralmente de 25 minutos, separados por pequenas pausas.",
      focusPhase: "Fase de Foco",
      restPhase: "Fase de Descanso",
      productivityScore: "Pontuação de Produtividade",
      weeklyFocus: "Atividade Semanal de Foco",
      focusMode: "Modo de Foco",
      timer: "Timer",
      stats: "Estatísticas",
      noSessionsYet: "Nenhuma sessão de foco concluída ainda. Comece a trabalhar!",
      focusGoal: "Em que você está trabalhando?",
      startFocus: "Iniciar Sessão de Foco",
      pauseFocus: "Pausar Sessão",
      resetFocus: "Reiniciar Cronômetro",
      focusHistory: "Histórico",
      totalFocusTime: "Tempo Total de Foco",
      sessionsCompleted: "Sessões Concluídas",
      focusStats: "Estatísticas de Foco",
      focusSessionHistory: "Histórico de Sessões de Foco",
      today: "Hoje",
      week: "Semana",
      month: "Mês",
      activity: "Atividade",
      hours: "horas",
      sessions: "sessões",
      totalTranscriptions: "Transcrições Totais",
      transcriptions: "Transcrições",
      totalTranslations: "Total de Traduções",
      totalImagesGenerated: "Imagens Criadas",
      translations: "Traduções",
      generatedImages: "Imagens Geradas",
      imageGeneration: "Geração de imagens",
      uac: "Custo de Aquisição de Usuários (UAC)",
      dac: "Custo de Aquisição de Motoristas (DAC)",
    }
  };

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleTokens, setGoogleTokens] = useState<any>(null);

  useEffect(() => {
    // Load tokens from local storage on mount
    const savedTokens = localStorage.getItem('studio_google_tokens');
    if (savedTokens) {
      try {
        setGoogleTokens(JSON.parse(savedTokens));
      } catch (e) {
        console.error("Failed to parse saved Google tokens", e);
      }
    }
  }, []);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Task Due Soon',
      message: 'Q4 Marketing Strategy Review is due in 2 hours.',
      timestamp: new Date(),
      read: false,
      type: 'task',
      priority: 'high',
      relatedId: '1'
    },
    {
      id: '2',
      title: 'Meeting Reminder',
      message: 'Strategy Review meeting starts in 15 minutes.',
      timestamp: new Date(Date.now() - 3600000),
      read: true,
      priority: 'medium',
      type: 'event'
    }
  ]);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const [transcriptionResults, setTranscriptionResults] = useState<TranscriptionResult[]>([]);
  const [searchTarget, setSearchTarget] = useState<{ type: string, id: string } | null>(null);

  // Premium Toast Helper
  const showPremiumToast = (title: string, message: string, type: 'task' | 'error' | 'success' | 'warning' | 'info' = 'info', priority: 'high' | 'medium' | 'low' = 'medium') => {
    const Icon = type === 'success' ? CheckCircle2 : (type === 'warning' || type === 'error' ? AlertTriangle : Bell);
    const iconColor = priority === 'high' ? 'text-primary' : (priority === 'medium' ? 'text-orange-500' : 'text-emerald-500');
    const iconBg = priority === 'high' ? 'bg-primary/10' : (priority === 'medium' ? 'bg-orange-500/10' : 'bg-emerald-500/10');

    toast.custom((t) => (
      <div className="w-[360px] bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex items-stretch animate-in fade-in slide-in-from-right-4 duration-500">
        <div className={`w-1.5 shrink-0 ${priority === 'high' ? 'bg-primary' : priority === 'medium' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
        <div className="flex items-center p-4 gap-4 w-full">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner", iconBg)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold tracking-tight">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
          </div>
          <button 
            onClick={() => toast.dismiss(t)}
            className="p-1 hover:bg-muted rounded-full transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    ), { duration: type === 'warning' ? 10000 : 6000 });
  };

  // Notification logic for upcoming deadlines
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.status === 'completed' || !task.dueDate) return;
        
        const timeDiff = task.dueDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Notify if deadline is in 2 hours or 24 hours
        if (hoursDiff > 0 && hoursDiff <= 2 && !task.notified2h) {
          showPremiumToast(
            'Deadline Approaching', 
            `Task "${task.title}" is due in less than 2 hours.`,
            'warning',
            'high'
          );
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, notified2h: true } : t));
          setNotifications(prev => [
            {
              id: Math.random().toString(36).substr(2, 9),
              title: 'Deadline Approaching',
              message: `Task "${task.title}" is due in less than 2 hours.`,
              timestamp: new Date(),
              read: false,
              type: 'task',
              priority: 'high',
              relatedId: task.id
            },
            ...prev
          ]);
        } else if (hoursDiff > 0 && hoursDiff <= 24 && !task.notified24h) {
          showPremiumToast(
            'Upcoming Task', 
            `Task "${task.title}" is due within 24 hours.`,
            'info',
            'medium'
          );
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, notified24h: true } : t));
          setNotifications(prev => [
            {
              id: Math.random().toString(36).substr(2, 9),
              title: 'Upcoming Task',
              message: `Task "${task.title}" is due within 24 hours.`,
              timestamp: new Date(),
              read: false,
              type: 'task',
              priority: 'medium',
              relatedId: task.id
            },
            ...prev
          ]);
        }
      });
    };

    const interval = setInterval(checkDeadlines, 60000); // Check every minute
    checkDeadlines(); // Initial check
    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    // Check Google Auth Status with small retry logic for resilience
    const checkAuthStatus = async (retries = 3) => {
      try {
        const res = await fetch('/api/auth/google/status', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: googleTokens }),
          credentials: 'include' 
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Status: ${res.status} - ${text}`);
        }
        const data = await res.json();
        setIsGoogleConnected(data.connected);
      } catch (err) {
        if (retries > 0) {
          // If it's a transient failure, retry after a short delay
          setTimeout(() => checkAuthStatus(retries - 1), 2000);
        } else {
          console.error("Error checking Google status after retries:", err);
        }
      }
    };

    checkAuthStatus();

    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from this app, .run.app, or localhost
      const origin = event.origin;
      if (
        origin !== window.location.origin &&
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost')
      ) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const tokens = event.data.tokens;
        if (tokens) {
          setGoogleTokens(tokens);
          localStorage.setItem('studio_google_tokens', JSON.stringify(tokens));
        }

        setIsGoogleConnected(true);
        toast.success("Google Calendar connected successfully!", {
          description: "You can now sync your tasks and events."
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [googleTokens]);

  const connectGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/auth/google/url', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'google_oauth', 'width=600,height=700');
      if (!authWindow) {
        toast.error("Popup blocked", {
          description: "Please allow popups to connect Google Calendar."
        });
      }
    } catch (error) {
      console.error('OAuth error:', error);
      toast.error("Connection failed", {
        description: "Could not connect to Google Calendar."
      });
    }
  };

  const syncToGoogleCalendar = async () => {
    if (!isGoogleConnected) {
      connectGoogleCalendar();
      return;
    }

    toast.promise(
      fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          events: calendarEvents, 
          tasks,
          googleTokens: googleTokens
        })
      }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
          if (data.connected === false) {
            setIsGoogleConnected(false);
            setGoogleTokens(null);
            localStorage.removeItem('studio_google_tokens');
          }
          const errorMessage = data.details || data.error || 'Server returned an error without details';
          throw new Error(errorMessage);
        }

        // Save new tokens if they were refreshed
        if (data.newTokens) {
          setGoogleTokens(data.newTokens);
          localStorage.setItem('studio_google_tokens', JSON.stringify(data.newTokens));
        }

        return data;
      }),
      {
        loading: 'Syncing with Google Calendar...',
        success: (data) => {
          addActivity('marketing', 'Calendar Sync', `Synced ${data.count} items to Google Calendar.`);
          return `Successfully synced ${data.count} items!`;
        },
        error: (err) => `Failed to sync: ${err.message || 'Unknown error'}`
      }
    );
  };

  const t = translations[appLanguage];

  // Focus Timer State
  const [isFocusActive, setIsFocusActive] = useState(() => {
    try { return localStorage.getItem('isFocusActive') === 'true'; } catch { return false; }
  });
  const [focusDuration, setFocusDuration] = useState(() => {
    try { return parseInt(localStorage.getItem('focusDuration') || '25', 10); } catch { return 25; }
  });
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(() => {
    try {
      const active = localStorage.getItem('isFocusActive') === 'true';
      const endTimeStr = localStorage.getItem('focusEndTime');
      if (active && endTimeStr) {
        const endTime = parseInt(endTimeStr, 10);
        const remaining = Math.round((endTime - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
      return parseInt(localStorage.getItem('focusTimeRemaining') || String(25 * 60), 10);
    } catch { return 25 * 60; }
  });
  const [showFocusWidget, setShowFocusWidget] = useState(false);
  const [focusWidgetSize, setFocusWidgetSize] = useState<'normal' | 'compact' | 'mini'>('normal');
  const [focusTask, setFocusTask] = useState(() => {
    try { return localStorage.getItem('focusTask') || 'Work session'; } catch { return 'Work session'; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('focusTask', focusTask);
      localStorage.setItem('focusDuration', focusDuration.toString());
      localStorage.setItem('isFocusActive', isFocusActive.toString());
      localStorage.setItem('focusTimeRemaining', focusTimeRemaining.toString());
      
      if (isFocusActive) {
        localStorage.setItem('focusEndTime', (Date.now() + focusTimeRemaining * 1000).toString());
      } else {
        localStorage.removeItem('focusEndTime');
      }
    } catch (e) {
      console.warn('Failed to save focus state', e);
    }
  }, [isFocusActive, focusDuration, focusTimeRemaining, focusTask]);

  const [focusHistory, setFocusHistory] = useState<{ id: string, task: string, duration: number, completedAt: number }[]>(() => {
    try {
      const saved = localStorage.getItem('focusHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [focusMusicId, setFocusMusicId] = useState<string | null>(null);
  const [focusVolume, setFocusVolume] = useState<number>(50);
  const focusAudioRef = useRef<HTMLAudioElement | null>(null);

  

  useEffect(() => {
    if (focusMusicId && isFocusActive) {
      const track = FOCUS_MUSIC_TRACKS.find(t => t.id === focusMusicId);
      if (track) {
        if (!focusAudioRef.current) {
          focusAudioRef.current = new Audio(track.url);
          focusAudioRef.current.loop = true;
        } else if (!focusAudioRef.current.src.includes(track.url)) {
          focusAudioRef.current.pause();
          focusAudioRef.current.src = track.url;
          focusAudioRef.current.load();
        }
        focusAudioRef.current.volume = focusVolume / 100;
        focusAudioRef.current.play().catch(console.error);
      }
    } else {
      focusAudioRef.current?.pause();
    }
  }, [focusMusicId, isFocusActive, focusVolume]);

  useEffect(() => {
    return () => {
      focusAudioRef.current?.pause();
      focusAudioRef.current = null;
    };
  }, []);

  const addFocusTime = (minutes: number) => {
    setFocusTimeRemaining(prev => prev + minutes * 60);
    // Also update duration for potential reset
    setFocusDuration(prev => prev + minutes);
    toast.success(`+${minutes} minutes added`);
  };

  const playFocusAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = (time: number, freq: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, time);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.3, time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
        oscillator.start(time);
        oscillator.stop(time + 0.5);
      };

      // Play a repeated sequence for 8 seconds
      for (let i = 0; i < 8; i++) {
        playBeep(audioCtx.currentTime + i, 880);
        playBeep(audioCtx.currentTime + i + 0.5, 660);
      }
    } catch (e) {
      console.error("Failed to play alarm sound", e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFocusActive && focusTimeRemaining > 0) {
      interval = setInterval(() => {
        setFocusTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (focusTimeRemaining === 0 && isFocusActive) {
      setIsFocusActive(false);
      addToast(t.focusComplete, 'success');
      playFocusAlarm();
      
      const newSession = {
        id: Date.now().toString(),
        task: focusTask || 'Focus session',
        duration: focusDuration,
        completedAt: Date.now()
      };
      
      setFocusHistory(prev => {
        const updated = [newSession, ...prev].slice(0, 50);
        localStorage.setItem('focusHistory', JSON.stringify(updated));
        return updated;
      });

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Focus', { body: t.focusComplete });
      }
    }
    return () => clearInterval(interval);
  }, [isFocusActive, focusTimeRemaining, t.focusComplete, focusTask, focusDuration]);

  const [activeAccount, setActiveAccount] = useState({
    id: 'acc-1',
    name: 'Global',
    email: 'demo.user@example.com',
    logo: 'G',
    role: t.owner
  });
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      fullName: 'Laurie Elki',
      email: 'demo.user@example.com',
      jobTitle: 'Marketing Director',
      organization: 'Global',
      phoneNumber: '+1 (555) 000-0000',
      avatarUrl: '',
      userContext: ''
    };
  });

  // Persist profile and brandIdentity to localStorage
  useEffect(() => {
    localStorage.setItem('studio_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('studio_brandIdentity', JSON.stringify(brandIdentity));
  }, [brandIdentity]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleFileInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  
  const currentBrandIdentity = { ...brandIdentity, userContext: profile.userContext };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrandLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // If file is > 500KB, we should definitely compress it for Firestore/LocalStorage
      if (file.size > 500 * 1024) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimension 800px for brand logos
            const MAX_DIM = 800;
            if (width > height) {
              if (width > MAX_DIM) {
                height *= MAX_DIM / width;
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width *= MAX_DIM / height;
                height = MAX_DIM;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Output as a more compressed jpeg if it's really large, otherwise png
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setBrandIdentity(prev => ({ ...prev, logoUrl: dataUrl }));
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBrandIdentity(prev => ({ ...prev, logoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveBrandIdentity = async () => {
    console.log("handleSaveBrandIdentity CALLED. user:", !!user, "brandIdentity:", brandIdentity);
    
    // Provide immediate feedback
    addToast(t.brandIdentitySaved, "success");
    addActivity('marketing', 'Brand Identity Updated', 'User updated the Brand Identity Vault.');

    // Always update localStorage immediately
    try {
      localStorage.setItem('studio_brandIdentity', JSON.stringify(brandIdentity));
    } catch (e) {
      console.error("Failed to save brand identity to localStorage (likely quota exceeded)", e);
      addToast("Logo might be too large for local cache.", "info");
    }

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          brandIdentity: brandIdentity,
          updatedAt: serverTimestamp()
        });
        console.log("updateDoc successful");
      } catch (err: any) {
        console.error("Failed to update brand identity", err);
        if (err.message && err.message.includes('too large')) {
          addToast("Brand Identity data is too large for cloud storage. Try a smaller logo.", "error");
        } else {
          addToast("Failed to sync with cloud. Changes saved locally.", "info");
        }
      }
    } else {
      console.log("No user object. Updating active account.");
      if (activeAccount) {
         setActiveAccount(prev => {
            if (!prev) return prev;
            return {
               ...prev,
               brandIdentity
            };
         });
      }
    }
  };

  const getBrandIdentityPrompt = () => {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'fr-af': 'French (African localization)',
      'es-la': 'Spanish (Latin American localization)',
      'pt-af': 'Portuguese (African localization)'
    };
    const targetLang = languageMap[appLanguage] || 'English';

    return `
      CRITICAL LANGUAGE MANDATE:
      You MUST generate all content, responses, slides, and marketing copy strictly in ${targetLang}. 
      Do NOT generate content in any other language unless explicitly requested by the user.

      BRAND COLORS:
      - Primary: ${currentBrandIdentity.primaryColor}
      - Secondary: ${currentBrandIdentity.secondaryColor}
      - Accent: ${currentBrandIdentity.accentColor}
      
      TONE OF VOICE: 
      - Current Setting: ${currentBrandIdentity.toneOfVoice}
      
      ADDITIONAL BRAND GUIDELINES:
      ${currentBrandIdentity.guidelines || "No additional guidelines provided. Follow the current tone of voice setting."}

      PERSONAL AI CONTEXT (USER PROFILE):
      ${profile.userContext || "No personalized context provided."}
      
      ADOPTION RULES:
      1. Align your vocabulary, sentence structure, and level of formality with the "Tone of Voice" and Personal AI Context.
      2. If guidelines specify restricted topics or preferred phrasing, follow them exactly.
      3. For any marketing copy, ensure it feels like it was written by this brand.
      4. Personalize your response based on the Personal AI Context (user's role, preferences, ways of working).
    `.trim();
  };

  const handleSaveProfile = async () => {
    setActiveAccount(prev => ({
      ...prev,
      name: profile.fullName,
      email: profile.email,
      logo: profile.fullName.charAt(0).toUpperCase()
    }));
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          fullName: profile.fullName,
          email: profile.email,
          jobTitle: profile.jobTitle,
          organization: profile.organization,
          phoneNumber: profile.phoneNumber,
          userContext: profile.userContext,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to update profile", err);
        addToast("Failed to sync profile with cloud, but saved locally.", "info");
      }
    } else {
      localStorage.setItem('studio_profile', JSON.stringify(profile));
    }
    addToast("Profile changes saved successfully!", "success");
    addActivity('marketing', 'Profile Updated', 'User updated their profile information.');
  };

  const handleSavePreferences = async () => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          theme: resolvedTheme,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to update preferences", err);
      }
    }
    addToast("Notification preferences saved!", "success");
    addActivity('marketing', 'Preferences Saved', 'User updated notification settings.');
  };

  const handleUpdateRegion = async () => {
    setAppLanguage(draftLanguage);
    setAppTimezone(draftTimezone);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          language: draftLanguage,
          timezone: draftTimezone,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to update region", err);
      }
    }
    addToast(`Region settings updated successfully`, "success");
    addActivity('marketing', 'Region Updated', `Language changed to ${draftLanguage}, Timezone to ${draftTimezone}`);
  };
  const [accounts, setAccounts] = useState([
    { id: 'acc-1', name: 'Global', email: 'demo.user@example.com', logo: 'G', role: 'Owner' },
    { id: 'acc-2', name: 'Local', email: 'demo.user@example.com', logo: 'L', role: 'Admin' },
    { id: 'acc-3', name: 'Enterprise', email: 'demo.user@example.com', logo: 'E', role: 'Member' }
  ]);
  
  useEffect(() => {
    if (userProfile) {
      if (userProfile.theme && userProfile.theme !== theme) setTheme(userProfile.theme);
      if (userProfile.language && userProfile.language !== appLanguage) {
        setAppLanguage(userProfile.language);
        setDraftLanguage(userProfile.language);
      }
      if (userProfile.timezone && userProfile.timezone !== appTimezone) {
        setAppTimezone(userProfile.timezone);
        setDraftTimezone(userProfile.timezone);
      }
      if (userProfile.brandIdentity) {
        setBrandIdentity(prev => {
          // If we have a local logo but cloud is empty, don't overwrite if cloud was never set
          // This protects against data loss when Firestore fails due to size but local is fine
          if (prev.logoUrl && !userProfile.brandIdentity.logoUrl && !userProfile.brandIdentity.hasExplicitlyRemovedLogo) {
             return { ...userProfile.brandIdentity, logoUrl: prev.logoUrl };
          }
          return { ...prev, ...userProfile.brandIdentity };
        });
      }
      setProfile({
        fullName: userProfile.fullName || userProfile.displayName || '',
        email: userProfile.email || '',
        jobTitle: userProfile.jobTitle || 'Marketing Director',
        organization: userProfile.organization || 'Global',
        phoneNumber: userProfile.phoneNumber || '+1 (555) 000-0000',
        avatarUrl: userProfile.photoUrl || '',
        userContext: userProfile.userContext || ''
      });
      if (userProfile.notificationSettings) {
        setNotificationSettings(userProfile.notificationSettings);
      }
    }
  }, [userProfile]);

  const currentViewState = viewStates[currentView] || initialViewState;
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateViewState = React.useCallback((view: string, updates: Partial<ViewState>) => {
    setViewStates(prev => ({
      ...prev,
      [view]: { ...prev[view], ...updates }
    }));
  }, []);

  const generateCampaignContent = async (description: string, format: string) => {
    const brandPrompt = getBrandIdentityPrompt();
    const tone = currentBrandIdentity.toneOfVoice; 
    
    updateViewState('campaign', { isLoading: true });
    try {
      let prompt = "";
      const context = `Target Audience: Drivers (sample driver app). Context: Marketing for a ride-hailing/logistics platform.
      
      CRITICAL BRAND MANDATE:
      ${brandPrompt}

      CRITICAL: You MUST strictly adhere to the following editorial guidelines for all driver communications:
      ${EDITORIAL_GUIDELINES}`;
      
      switch(format) {
        case 'newsfeed':
          prompt = `${context} Generate a crisp, concise in-app news feed message (max 150 characters) for drivers. Description: ${description}. Tone: ${tone}.`;
          break;
        case 'push':
          prompt = `${context} Generate an extremely short and punchy push notification (max 60 characters) for drivers. Description: ${description}. Tone: ${tone}.`;
          break;
        case 'whatsapp':
          prompt = `${context} Generate 3 bite-sized WhatsApp messages for drivers. Keep them short and actionable. Description: ${description}. Tone: ${tone}.`;
          break;
        case 'tiktok':
          prompt = `${context} Generate a short, high-energy script for a 15-30 second TikTok video targeting drivers. Include visual cues. Description: ${description}. Tone: ${tone}.`;
          break;
        case 'youtube':
          prompt = `${context} Generate a concise script for a 60-second YouTube video or Short targeting drivers. Description: ${description}. Tone: ${tone}.`;
          break;
        default:
          prompt = `${context} Generate marketing text for ${format}. Description: ${description}. Tone: ${tone}. Keep it concise and professional.`;
      }

      const finalResult = await streamContentWithRetry(
        prompt + " Return ONLY the generated content without any preamble.",
        (chunkText) => {
          updateViewState('campaign', { campaignResult: chunkText });
        }
      );
      
      updateViewState('campaign', { isLoading: false });
      addActivity('marketing', 'Campaign Generated', `New ${format} content created.`);
      
      // Save to history
      const id = Date.now().toString();
      const newConv: Conversation = {
        id,
        title: description.length > 30 ? description.substring(0, 30) + '...' : description,
        messages: [
          { id: '1', role: 'user', content: `Generate ${format}: ${description}` },
          { id: '2', role: 'model', content: finalResult }
        ],
        chatSession: null,
        uploadedFile: null,
        timestamp: new Date()
      };
      
      setViewStates(prev => ({
        ...prev,
        campaign: {
          ...prev.campaign,
          conversations: [newConv, ...prev.campaign.conversations],
          activeConversationId: id
        }
      }));
    } catch (error: any) {
      console.error("Campaign generation failed:", String(error?.message || error));
      let errMsg = "Failed to generate campaign.";
      const errStr = String(error?.message || error).toLowerCase();
      if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("resource_exhausted") || errStr.includes("high demand") || errStr.includes("503")) errMsg = "AI service is currently busy. Please try again in a moment.";
      else if (errStr.includes("prepayment credits")) errMsg = "AI Studio prepayment credits depleted.";
      addToast(errMsg, 'error');
      updateViewState('campaign', { isLoading: false });
    }
  };

  const analyzeCampaignContent = async (draft: string, format?: string) => {
    const brandPrompt = getBrandIdentityPrompt();
    updateViewState('campaign', { isLoading: true });
    try {
      const formatContext = format ? `This draft is for a ${format} format.` : '';
      const ai = getGeminiAI();
      const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `Analyze the following marketing draft intended for drivers (sample driver app): ${draft}. 
          ${formatContext}
          
          CRITICAL: Evaluate this draft strictly against the editorial guidelines:
          ${EDITORIAL_GUIDELINES}
          
          AND against these BRAND IDENTITY parameters:
          ${brandPrompt}
          
          Evaluate it based on:
          1. Clarity to the driver audience (is it simple and direct?).
          2. Likelihood of high engagement rates (is it actionable?).
          3. Brand Consistency (Does it follow the tone and guidelines provided?).
          4. Likelihood of positive outcomes (e.g., more rides, better performance).
          Provide a score (0-100) and detailed feedback for each.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                clarity: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                  }
                },
                engagement: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                  }
                },
                brandConsistency: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                  }
                },
                outcomes: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                  }
                },
                overallScore: { type: Type.NUMBER }
              }
            }
          }
        });
      });
      
      const analysis = JSON.parse(response.text);
      updateViewState('campaign', { campaignAnalysis: analysis, isLoading: false });
      addActivity('marketing', 'Campaign Analyzed', 'Marketing draft analysis completed.');

      // Save to history
      const id = Date.now().toString();
      const newConv: Conversation = {
        id,
        title: `Analysis: ${draft.substring(0, 20)}...`,
        messages: [
          { id: '1', role: 'user', content: `Analyze: ${draft}` },
          { id: '2', role: 'model', content: `Score: ${analysis.overallScore}\n\nClarity: ${analysis.clarity.feedback}\nEngagement: ${analysis.engagement.feedback}\nOutcomes: ${analysis.outcomes.feedback}` }
        ],
        chatSession: null,
        uploadedFile: null,
        timestamp: new Date()
      };
      
      setViewStates(prev => ({
        ...prev,
        campaign: {
          ...prev.campaign,
          conversations: [newConv, ...prev.campaign.conversations],
          activeConversationId: id
        }
      }));
    } catch (error: any) {
      console.error("Campaign analysis failed:", String(error?.message || error));
      let errMsg = "Failed to analyze campaign.";
      const errStr = String(error?.message || error).toLowerCase();
      if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("resource_exhausted") || errStr.includes("high demand") || errStr.includes("503")) errMsg = "AI service is currently busy. Please try again in a moment.";
      else if (errStr.includes("prepayment credits")) errMsg = "AI Studio prepayment credits depleted.";
      addToast(errMsg, 'error');
      updateViewState('campaign', { isLoading: false });
    }
  };

  const rewriteCampaignContent = async () => {
    const campaignState = viewStates.campaign;
    const draft = campaignState.campaignDraft;
    const analysis = campaignState.campaignAnalysis;
    const format = campaignState.input;

    if (!draft || !analysis) return;

    updateViewState('campaign', { isLoading: true });
    try {
      const formatContext = format ? `This draft is for a ${format} format.` : '';
      const prompt = `You are a world-class marketing expert.
      ${formatContext}
      Original Draft: ${draft}
      
      Analysis Feedback:
      - Clarity: ${analysis.clarity.feedback}
      - Engagement: ${analysis.engagement.feedback}
      - Outcomes: ${analysis.outcomes.feedback}
      
      CRITICAL: Rewrite this draft to be 100% effective, crisp, concise, and highly actionable for the driver audience, strictly following these editorial guidelines:
      ${EDITORIAL_GUIDELINES}
      
      CRITICAL: You MUST address all the feedback points provided above and implement all recommendations to maximize winnability. 
      The tone should be professional yet energetic, suitable for the specified format.
      Return ONLY the rewritten text without any preamble or quotes.`;

      const finalRewrittenText = await streamContentWithRetry(
        prompt,
        (chunkText) => {
          updateViewState('campaign', { campaignResult: chunkText });
        }
      );
      
      updateViewState('campaign', { 
        campaignDraft: finalRewrittenText, 
        campaignResult: finalRewrittenText,
        activeTab: 'generate',
        isLoading: false 
      });
      addActivity('marketing', 'Campaign Rewritten', 'AI optimized the content based on analysis feedback.');
    } catch (error: any) {
      console.error("Campaign rewrite failed:", String(error?.message || error));
      let errMsg = "Failed to rewrite campaign.";
      const errStr = String(error?.message || error).toLowerCase();
      if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("resource_exhausted") || errStr.includes("high demand") || errStr.includes("503")) errMsg = "AI service is currently busy. Please try again in a moment.";
      else if (errStr.includes("prepayment credits")) errMsg = "AI Studio prepayment credits depleted.";
      addToast(errMsg, 'error');
      updateViewState('campaign', { isLoading: false });
    }
  };

  const addEmojisToCampaign = async () => {
    const campaignState = viewStates.campaign;
    const content = campaignState.campaignResult || campaignState.campaignDraft;

    if (!content) return;

    updateViewState('campaign', { isLoading: true });
    try {
      const prompt = `Add appropriate, engaging, and attractive emojis to the following marketing text for drivers. 
      The emojis should be placed intelligently to enhance the message without cluttering it.
      Text: ${content}
      Return ONLY the updated text with emojis.`;

      const response = await generateContentWithRetry(prompt);
      
      updateViewState('campaign', { 
        campaignResult: response.text,
        campaignDraft: response.text,
        isLoading: false 
      });
      addToast(t.emojiAdded, 'success');
    } catch (error: any) {
      console.error("Adding emojis failed:", String(error?.message || error));
      let errMsg = "Failed to add emojis.";
      const errStr = String(error?.message || error).toLowerCase();
      if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("resource_exhausted") || errStr.includes("high demand") || errStr.includes("503")) errMsg = "AI service is currently busy. Please try again in a moment.";
      else if (errStr.includes("prepayment credits")) errMsg = "AI Studio prepayment credits depleted.";
      addToast(errMsg, 'error');
      updateViewState('campaign', { isLoading: false });
    }
  };

  const translateCampaignContent = async () => {
    const campaignState = viewStates.campaign;
    const content = campaignState.campaignDraft || campaignState.campaignResult;
    const sourceLang = campaignState.translationSourceLang;
    const targetLang = campaignState.translationTargetLang;
    const targetCountry = campaignState.translationTargetCountry;

    if (!content || !targetLang) return;

    updateViewState('campaign', { isLoading: true });
    try {
      const prompt = `Translate the following marketing text accurately for drivers.
      Source Language: ${sourceLang || 'Auto-detect'}
      Target Language: ${targetLang}
      Target Country/Region: ${targetCountry || 'General'}
      
      CRITICAL: The translation MUST be STRICTLY in ${targetLang}. 
      Do NOT add any localized French or any other language unless explicitly requested. 
      Use professional and culturally appropriate terminology for the selected language.
      
      Requirements for specific languages:
      - Spanish: Use professional marketing Spanish.
      - Urdu (Traditional): Use the traditional Arabic-based script.
      - Urdu (Roman): Use the Romanized phonetic spelling of Urdu.
      - Turkish: Use professional marketing Turkish.
      
      Text to translate: ${content}
      
      Return ONLY the translated text without preamble or explanations.`;

      const response = await generateContentWithRetry(prompt);
      
      const resultText = response.text;
      updateViewState('campaign', { 
        translationResult: resultText,
        isLoading: false 
      });
      addActivity('marketing', 'Campaign Translated', `Content translated to ${targetLang}.`);

      // Save to history
      const id = Date.now().toString();
      const newConv: Conversation = {
        id,
        title: `Translation (${targetLang}): ${content.substring(0, 20)}...`,
        messages: [
          { id: '1', role: 'user', content: `Translate to ${targetLang}: ${content}` },
          { id: '2', role: 'model', content: resultText }
        ],
        chatSession: null,
        uploadedFile: null,
        timestamp: new Date()
      };
      
      setViewStates(prev => ({
        ...prev,
        campaign: {
          ...prev.campaign,
          conversations: [newConv, ...prev.campaign.conversations],
          activeConversationId: id
        }
      }));
    } catch (error: any) {
      console.error("Translation failed:", String(error?.message || error));
      let errMsg = "Failed to translate campaign.";
      const errStr = String(error?.message || error).toLowerCase();
      if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("resource_exhausted")) errMsg = "Rate limit exceeded. Please try again later.";
      else if (errStr.includes("prepayment credits")) errMsg = "AI Studio prepayment credits depleted.";
      addToast(errMsg, 'error');
      updateViewState('campaign', { isLoading: false });
    }
  };

  // Stable component definition to prevent blinking
  const FocusTimerWidget = useMemo(() => {
    if (!showFocusWidget) return null;
    
    const displayMinutes = Math.floor(focusTimeRemaining / 60);
    const displaySeconds = focusTimeRemaining % 60;

    const isNormal = focusWidgetSize === 'normal';
    const isCompact = focusWidgetSize === 'compact';
    const isMini = focusWidgetSize === 'mini';

    return (
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={() => document.body.style.userSelect = 'none'}
        onDragEnd={() => document.body.style.userSelect = ''}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          width: isNormal ? 256 : isCompact ? 180 : 110
        }}
        className={`fixed bottom-24 right-8 z-[100] glass-card shadow-2xl border-white/10 cursor-move overflow-hidden transition-[width] duration-300 ${isNormal ? 'p-4 rounded-3xl' : isCompact ? 'p-3 rounded-2xl' : 'p-2 rounded-xl'}`}
      >
        {/* Header - Hidden in Mini mode */}
        {!isMini && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer className={`text-primary transition-all ${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              {!isCompact && <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">{t.focusMode}</span>}
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-white/10" 
                onClick={() => setFocusWidgetSize(isNormal ? 'compact' : isCompact ? 'mini' : 'normal')}
              >
                {isNormal ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={() => setShowFocusWidget(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className={isNormal ? "space-y-4" : isCompact ? "space-y-3" : "flex items-center gap-2"}>
          {isNormal && (
            <Input 
              value={focusTask}
              onChange={(e) => setFocusTask(e.target.value)}
              className="h-7 text-[10px] bg-white/5 border-none font-bold placeholder:opacity-50 rounded-lg"
              placeholder="What's the goal?"
            />
          )}

          <div className="text-center group relative flex-1">
            {!isFocusActive ? (
              <div className="flex justify-center items-center gap-0.5">
                <Input 
                  type="number" 
                  value={displayMinutes} 
                  onChange={(e) => {
                    const m = parseInt(e.target.value) || 0;
                    const s = focusTimeRemaining % 60;
                    setFocusTimeRemaining(Math.max(0, m * 60 + s));
                  }}
                  className={`${isNormal ? 'h-16 text-5xl' : isCompact ? 'h-10 text-3xl' : 'h-8 text-xl'} font-black text-center bg-transparent border-none p-0 focus-visible:ring-0 tabular-nums border-b border-primary/20 rounded-none w-full`}
                />
                <span className={isNormal ? "text-3xl font-black" : isCompact ? "text-xl font-black" : "text-lg font-black"}>:</span>
                <Input 
                  type="number" 
                  max="59"
                  value={displaySeconds} 
                  onChange={(e) => {
                    const s = parseInt(e.target.value) || 0;
                    const m = Math.floor(focusTimeRemaining / 60);
                    setFocusTimeRemaining(Math.max(0, m * 60 + Math.min(s, 59)));
                  }}
                  className={`${isNormal ? 'h-16 text-5xl' : isCompact ? 'h-10 text-3xl' : 'h-8 text-xl'} font-black text-center bg-transparent border-none p-0 focus-visible:ring-0 tabular-nums border-b border-primary/20 rounded-none w-full`}
                />
              </div>
            ) : (
              <div className={`${isNormal ? 'text-6xl text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.2)]' : isCompact ? 'text-4xl' : 'text-2xl'} font-black tracking-tighter tabular-nums ${isNormal ? 'py-1' : ''}`}>
                {displayMinutes}:{displaySeconds.toString().padStart(2, '0')}
              </div>
            )}
            {isNormal && (
              <div className="flex flex-col items-center gap-3 mt-4">
                <div className="flex items-center gap-2">
                  {[1, 5].map(mins => (
                    <Button 
                      key={mins}
                      size="sm" 
                      variant="outline"
                      className="h-7 px-3 rounded-lg border-white/10 hover:bg-primary/20 text-[9px] font-black"
                      onClick={() => addFocusTime(mins)}
                    >
                      +{mins}
                    </Button>
                  ))}
                </div>
                <div className="text-[8px] uppercase tracking-[0.2em] font-black opacity-30">
                  {isFocusActive ? 'Current Session' : 'Set Duration'}
                </div>
              </div>
            )}
          </div>

          <div className={`flex items-center justify-center ${isMini ? 'gap-1' : 'gap-2'}`}>
            <Button 
              size="sm" 
              className={`rounded-full shadow-lg transition-all ${isFocusActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary/90'} ${isNormal ? 'h-10 w-10' : isCompact ? 'h-8 w-8' : 'h-6 w-6'}`}
              onClick={() => setIsFocusActive(!isFocusActive)}
            >
              {isFocusActive ? 
                <Pause className={isNormal ? "w-5 h-5" : isCompact ? "w-4 h-4" : "w-3 h-3"} /> : 
                <Play className={`${isNormal ? "w-5 h-5 ml-0.5" : isCompact ? "w-4 h-4 ml-0.5" : "w-3 h-3 ml-0.5"}`} />
              }
            </Button>
            {!isMini && (
              <Button 
                variant="outline" 
                size="sm" 
                className={`rounded-full border-white/10 hover:bg-white/5 ${isNormal ? 'h-10 w-10' : 'h-8 w-8'}`}
                onClick={() => {
                  setIsFocusActive(false);
                  setFocusTimeRemaining(focusDuration * 60);
                }}
              >
                <RotateCcw className={isNormal ? "w-4 h-4" : "w-3 h-3"} />
              </Button>
            )}
            {isMini && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-white/10" 
                onClick={() => setFocusWidgetSize('normal')}
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }, [showFocusWidget, focusTimeRemaining, isFocusActive, focusTask, focusDuration, focusWidgetSize]);


  const addActivity = async (type: ActivityItem['type'], title: string, details: string, view?: ViewType, itemId?: string) => {
    if (!user) return;
    try {
      const activityData: any = {
        type,
        title,
        details,
        timestamp: serverTimestamp()
      };
      if (view !== undefined) activityData.view = view;
      if (itemId !== undefined) activityData.itemId = itemId;

      await addDoc(collection(db, 'users', user.uid, 'activities'), activityData);
    } catch (error) {
      console.error("Error adding activity:", error);
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/activities`);
    }
  };

  const stableSetCurrentView = React.useCallback((view: ViewType) => {
    setCurrentView(view);
  }, []);

  const stableSetIsMobileMenuOpen = React.useCallback((open: boolean) => {
    setIsMobileMenuOpen(open);
  }, []);

  const toggleExpand = React.useCallback((item: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }, []);

  const filteredActivity = recentActivity.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'style' = 'source') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    try {
      const onFileParsed = (content: string) => {
        // Sanitize content from extreme whitespace or weird chars
        const sanitizedContent = content
          .replace(/[^\x20-\x7E\t\n\r]/g, '') // Keep standard printable ASCII
          .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
          .trim();

        if (sanitizedContent.length > 500000) {
          addToast("Large document detected. It will be truncated for analysis context.", "info");
        }
        
        const fileObj = { 
          name: file.name, 
          content: sanitizedContent.substring(0, 500000) // Safety limit
        };
        
        // Update general view state
        updateViewState(currentView, { [type === 'source' ? 'uploadedFile' : 'styleReference']: fileObj });
        
        // If there's an active conversation, update it specifically so handleSend can find it
        if (type === 'source') {
          const activeConvId = viewStates[currentView].activeConversationId;
          if (activeConvId) {
            setViewStates(prev => ({
              ...prev,
              [currentView]: {
                ...prev[currentView],
                conversations: prev[currentView].conversations.map(c => 
                  c.id === activeConvId ? { ...c, uploadedFile: fileObj } : c
                )
              }
            }));
          }
        }
        
        const activityCategory = currentView === 'plan' ? 'marketing' : 'analyze';
        addActivity(activityCategory as any, 'File Uploaded', `Uploaded ${file.name}`);
        addToast(`${type === 'source' ? 'Source' : 'Style reference'} document "${file.name}" uploaded successfully!`, 'success');
      };

      if (fileName.endsWith('.docx')) {
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          onFileParsed(result.value);
        };
        reader.readAsArrayBuffer(file);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Using JSON for better structure preservation for AI analysis
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const textContent = jsonData
              .filter((row: any) => row.length > 0)
              .map((row: any) => row.join('\t'))
              .join('\n');
              
            onFileParsed(textContent);
          } catch (err: any) {
            console.error("Excel parsing error:", err);
            addToast(`Failed to parse Excel file: ${err.message || "Unknown error"}`, 'error');
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (fileName.endsWith('.pptx')) {
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const zip = await JSZip.loadAsync(arrayBuffer);
          let fullText = "";
          
          const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
          for (const slideFile of slideFiles) {
            const content = await zip.file(slideFile)?.async('text');
            if (content) {
              const matches = content.match(/<a:t>([^<]+)<\/a:t>/g);
              if (matches) {
                const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
                fullText += `Slide: ${slideText}\n\n`;
              }
            }
          }
          onFileParsed(fullText);
        };
        reader.readAsArrayBuffer(file);
      } else if (fileName.endsWith('.pdf')) {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const loadingTask = pdfjs.getDocument({ 
              data: arrayBuffer
            });
            const pdf = await loadingTask.promise;
            console.log(`PDF loaded: ${pdf.numPages} pages`);
            
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              try {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += `Page ${i}:\n${pageText}\n\n`;
              } catch (pageError) {
                console.warn(`Error extraction text from PDF page ${i}:`, pageError);
              }
            }
            
            if (fullText.trim().length === 0) {
              addToast("PDF text extraction resulted in no content. The PDF might be image-based.", "info");
            }
            
            onFileParsed(fullText);
          } catch (err: any) {
            console.error("PDF parsing error:", err);
            addToast(`Failed to parse PDF: ${err.message || "Unknown error"}`, 'error');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onFileParsed(content);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      addToast("Failed to parse the file. Please try a different format.", 'error');
    }
  };

  const handleGeneratePresentationPlan = async () => {
    const { input, uploadedFile, numSlides } = currentViewState;
    const targetConvId = currentViewState.activeConversationId;
    if (!targetConvId) return;

    setViewStates(prev => {
      const view = 'presentation';
      const convs = prev[view].conversations.map(c => 
        c.id === targetConvId ? { ...c, isLoading: true, progressMessage: "Architecting presentation structure..." } : c
      );
      return { ...prev, [view]: { ...prev[view], conversations: convs } };
    });

    try {
      const prompt = input || (uploadedFile ? `Outline a presentation from this document: "${uploadedFile.name}".` : "A general overview of our recent performance and Q4 goals.");
      
      const systemInstruction = `
      You are an expert presentation structural architect.
      Your job is to outline a detailed, slide-by-slide plan for a presentation.
      
      ARCHITECTURAL STYLE: ${currentViewState.stylePreset || 'Light'}

      BRAND CONTEXT:
      - Tone of Voice: ${currentBrandIdentity.toneOfVoice}
      ${currentBrandIdentity.guidelines ? `- Brand Guidelines: ${currentBrandIdentity.guidelines}` : ""}
      
      PERSONAL AI CONTEXT:
      ${currentBrandIdentity.userContext ? `- User Profile/Preferences: ${currentBrandIdentity.userContext}` : ""}

      For each slide, specify:
      - The Slide Number
      - The internal title or topic
      - The key message or takeaway
      - A brief description of what visuals or data might be shown
      
      Keep the output in clear, readable Markdown format.
      ${numSlides ? `Generate a plan for EXACTLY ${numSlides} slides.` : "Generate a plan for a reasonable number of slides (at least 8-10)."}
    `;

      const fullPrompt = uploadedFile?.content
        ? `Based on the following document content, create a presentation plan about: ${prompt}\n\nDocument Content:\n${uploadedFile.content}`
        : `Create a presentation plan about: ${prompt}`;

      const finalPlan = await streamContentWithRetry(
        fullPrompt,
        (chunkText) => {
          setViewStates(prev => {
            const view = 'presentation';
            const convs = prev[view].conversations.map(c => 
              c.id === targetConvId 
                ? { ...c, presentationPlan: chunkText, title: prompt.substring(0, 30) } 
                : c
            );
            return { ...prev, [view]: { ...prev[view], conversations: convs } };
          });
        },
        systemInstruction,
        "gemini-3.1-pro-preview"
      );

      setViewStates(prev => {
        const view = 'presentation';
        const convs = prev[view].conversations.map(c => 
          c.id === targetConvId 
            ? { ...c, presentationPlan: finalPlan, isLoading: false } 
            : c
        );
        return { ...prev, [view]: { ...prev[view], conversations: convs, input: '' } };
      });
      addToast("Presentation plan generated! Review and approve it.", "success");
    } catch (error: any) {
      console.error("Error generating presentation plan:", error);
      setViewStates(prev => {
        const view = 'presentation';
        const convs = prev[view].conversations.map(c => 
          c.id === targetConvId ? { ...c, isLoading: false } : c
        );
        return { ...prev, [view]: { ...prev[view], conversations: convs } };
      });
      addToast(error?.message || "Failed to generate presentation plan.", 'error');
    }
  };

  const handleUpdatePresentationPlan = async (feedback: string) => {
    const targetConvId = currentViewState.activeConversationId;
    if (!targetConvId) return;
    const activeConv = currentViewState.conversations.find(c => c.id === targetConvId);
    if (!activeConv?.presentationPlan) return;

    // Handle "all good" case - if feedback is purely positive/confirmation, don't change the plan
    const lowerFeedback = feedback.toLowerCase().trim();
    const isApproval = ['all good', 'looks good', 'let\'s go', 'ok', 'approve', 'perfect', 'fine', 'good to go'].some(phrase => lowerFeedback.includes(phrase)) && lowerFeedback.length < 30;

    if (isApproval) {
      setViewStates(prev => {
        const view = 'presentation';
        return { ...prev, [view]: { ...prev[view], input: '' } };
      });
      addToast("Plan confirmed!", "success");
      return;
    }

    setViewStates(prev => {
      const view = 'presentation';
      const convs = prev[view].conversations.map(c => 
        c.id === targetConvId ? { ...c, isLoading: true, progressMessage: "Refining presentation plan..." } : c
      );
      return { ...prev, [view]: { ...prev[view], conversations: convs } };
    });

    try {
      const currentPlan = activeConv.presentationPlan;
      const systemInstruction = `
      You are an expert presentation structural architect.
      The user is providing feedback or a new draft to modify the existing presentation plan.

      BRAND CONTEXT:
      - Tone of Voice: ${currentBrandIdentity.toneOfVoice}
      ${currentBrandIdentity.guidelines ? `- Brand Guidelines: ${currentBrandIdentity.guidelines}` : ""}
      
      PERSONAL AI CONTEXT:
      ${currentBrandIdentity.userContext ? `- User Profile/Preferences: ${currentBrandIdentity.userContext}` : ""}

      If the user provides a line of instruction or feedback, apply those changes to the current plan.
      If the user provides a completely rewritten draft or plan, use their provided draft as the new plan, formatting it properly.
      Output ONLY the updated, complete Markdown plan. Do not include introductory text.
    `;

      const promptText = `CURRENT PLAN:\n${currentPlan}\n\nUSER FEEDBACK:\n${feedback}`;

      const updatedPlan = await streamContentWithRetry(
        promptText,
        (chunkText) => {
          setViewStates(prev => {
            const view = 'presentation';
            const convs = prev[view].conversations.map(c => 
              c.id === targetConvId ? { ...c, presentationPlan: chunkText } : c
            );
            return { ...prev, [view]: { ...prev[view], conversations: convs } };
          });
        },
        systemInstruction,
        "gemini-3.1-pro-preview"
      );

      setViewStates(prev => {
        const view = 'presentation';
        const convs = prev[view].conversations.map(c => 
          c.id === targetConvId 
            ? { ...c, presentationPlan: updatedPlan, isLoading: false } 
            : c
        );
        return { ...prev, [view]: { ...prev[view], conversations: convs, input: '' } };
      });
      addToast("Presentation plan updated!", "success");
    } catch (error: any) {
      console.error("Error updating presentation plan:", error);
      setViewStates(prev => {
        const view = 'presentation';
        const convs = prev[view].conversations.map(c => 
          c.id === targetConvId ? { ...c, isLoading: false } : c
        );
        return { ...prev, [view]: { ...prev[view], conversations: convs } };
      });
      addToast(error?.message || "Failed to update presentation plan.", 'error');
    }
  };

  const handleGenerateGambit = async (type: 'opening' | 'closing') => {
    const targetConvId = currentViewState.activeConversationId;
    if (!targetConvId) return;
    const activeConv = currentViewState.conversations.find(c => c.id === targetConvId);
    if (!activeConv || (!activeConv.presentation && !activeConv.uploadedFile)) {
      addToast("Please upload a presentation or generate one first.", "error");
      return;
    }

    setViewStates(prev => {
      const view = 'presentation';
      const convs = prev[view].conversations.map(c => 
        c.id === targetConvId ? { ...c, isGeneratingGambit: true } : c
      );
      return { ...prev, [view]: { ...prev[view], conversations: convs } };
    });

    try {
      let contentToUse = "";
      if (activeConv.presentation) {
        contentToUse = JSON.stringify(activeConv.presentation.slides.map(s => ({ title: s.title, subtitle: s.subtitle, content: s.content })));
      } else if (activeConv.uploadedFile) {
        contentToUse = activeConv.uploadedFile.content;
      }
      
      const gambitStr = await generateGambit(contentToUse, type, currentBrandIdentity);
      
      setViewStates(prev => {
        const view = 'presentation';
        const convs = prev[view].conversations.map(c => 
          c.id === targetConvId 
            ? { ...c, isGeneratingGambit: false, gambitOutput: { ...c.gambitOutput, [type]: gambitStr } } 
            : c
        );
        return { ...prev, [view]: { ...prev[view], conversations: convs } };
      });
      addToast(`${type === 'opening' ? 'Opening' : 'Closing'} gambit generated!`, "success");
    } catch (error: any) {
      console.error("Error generating gambit:", error);
      setViewStates(prev => {
        const view = 'presentation';
        const convs = prev[view].conversations.map(c => 
          c.id === targetConvId ? { ...c, isGeneratingGambit: false } : c
        );
        return { ...prev, [view]: { ...prev[view], conversations: convs } };
      });
      addToast(error?.message || `Failed to generate ${type} gambit.`, 'error');
    }
  };

  const handleGeneratePresentation = async () => {
    const { input, uploadedFile, numSlides, styleReference } = currentViewState;
    const targetConvId = currentViewState.activeConversationId;
    if (!targetConvId) return;

    // Set loading for the specific conversation
    setViewStates(prev => {
      const view = 'presentation';
      const convs = prev[view].conversations.map(c => 
        c.id === targetConvId ? { ...c, isLoading: true, progressMessage: "Architecting slide content..." } : c
      );
      return { ...prev, [view]: { ...prev[view], conversations: convs } };
    });

    try {
      const activeConv = currentViewState.conversations.find(c => c.id === targetConvId);
      const planToUse = activeConv?.presentationPlan;
      
      let prompt = '';
      if (planToUse) {
        prompt = `Generate presentation strictly according to this plan:\n${planToUse}`;
        if (input) {
          prompt += `\n\nAdditionally, adhere to these explicit user instructions for the generation: ${input}`;
        }
      } else {
        prompt = input || (uploadedFile ? `Summarize the document "${uploadedFile.name}" into a presentation.` : "A general overview of our recent marketing performance and Q4 goals.");
      }
      
      const genPresentation = await generatePresentation(prompt, uploadedFile?.content, numSlides, styleReference?.content, currentBrandIdentity, !!planToUse, currentViewState.stylePreset);
      
      // Generate images for slides that have imagePrompt - SEQUENTIAL to avoid rate limits
      let quotaExceeded = false;
      const slidesWithImages: Slide[] = [];
      const totalSlides = genPresentation.slides.length;
      
      for (let i = 0; i < totalSlides; i++) {
        const slide = genPresentation.slides[i];
        
        // Update progress for visuals
        setViewStates(prev => {
          const view = 'presentation';
          const convs = prev[view].conversations.map(c => 
            c.id === targetConvId ? { ...c, progressMessage: `Generating visual for slide ${i + 1} of ${totalSlides}...` } : c
          );
          return { ...prev, [view]: { ...prev[view], conversations: convs } };
        });

        // Automatically skip generating images and use placeholders per user request
        slidesWithImages.push(slide);
      }

      const finalPresentation = { ...genPresentation, slides: slidesWithImages };
      
      // Update the target conversation
      setViewStates(prev => {
        const view = 'presentation';
        const convs = prev[view].conversations.map(c => 
          c.id === targetConvId 
            ? { ...c, title: finalPresentation.title, presentation: finalPresentation, isLoading: false, progressMessage: undefined } 
            : c
        );
        
        // Save the updated conversation to Firestore
        const updatedConv = convs.find(c => c.id === targetConvId);
        if (updatedConv) saveConversation(view, updatedConv);
        
        return { ...prev, [view]: { ...prev[view], conversations: convs, input: '' } };
      });
      
      addActivity('presentation', 'Presentation Generated', `Generated presentation: ${genPresentation.title}`, 'presentation', targetConvId);
      addToast("Presentation generated successfully!", "success");
    } catch (error: any) {
      const errorStr = String(error?.message || error || '');
      const isQuota = error?.status === 429 || errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED');
      const isCreditsDepleted = !isQuota && (errorStr.includes('prepayment credits') || errorStr.includes('insufficient_credits'));
      
      if (isCreditsDepleted) {
        console.error("Presentation Generation: AI Studio prepayment credits depleted.");
      } else {
        console.error("Error generating presentation:", errorStr);
      }
      
      let errorMessage = "Failed to generate presentation. Please try again.";
      
      if (isCreditsDepleted) {
        errorMessage = "Your AI Studio prepayment credits are depleted. Please check your billing.";
      } else if (isQuota) {
        errorMessage = "AI service quota exceeded. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Reset loading for the target conversation
      setViewStates(prev => {
        const view = 'presentation';
        const convs = prev[view].conversations.map(c => 
          c.id === targetConvId ? { ...c, isLoading: false } : c
        );
        return { ...prev, [view]: { ...prev[view], conversations: convs } };
      });
      
      addToast(errorMessage, 'error');
    }
  };

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // Initialize an empty conversation for each chat view if none exists
    const viewsToInit: ViewType[] = ['plan', 'analyze', 'presentation', 'home', 'review', 'campaign', 'transcribe'];
    viewsToInit.forEach(view => {
      if (viewStates[view].conversations.length === 0) {
        createNewConversation(view);
      }
    });
  }, []);

  useEffect(() => {
    const activeConv = viewStates[currentView]?.conversations.find(c => c.id === viewStates[currentView]?.activeConversationId);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentViewState.activeConversationId]);

  useEffect(() => {
    if (currentView === 'presentation') {
      const activeConv = viewStates.presentation.conversations.find(c => c.id === viewStates.presentation.activeConversationId);
      if (activeConv?.presentation) {
        setPresentation(activeConv.presentation);
        setCurrentSlideIndex(0);
      } else {
        setPresentation(null);
      }
    }
  }, [currentView, viewStates.presentation.activeConversationId, viewStates.presentation.conversations]);

  const sanitizeForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj instanceof Date) return obj;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    const result: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        result[key] = sanitizeForFirestore(obj[key]);
      }
    }
    return result;
  };

  const saveConversation = async (view: ViewType, conversation: Conversation) => {
    if (!user) return;
    try {
      const { chatSession, isLoading, progressMessage, ...rest } = conversation;
      const dataToSave = {
        ...rest,
        view,
        timestamp: conversation.timestamp instanceof Date ? conversation.timestamp : new Date(),
        messages: conversation.messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp instanceof Date ? m.timestamp : new Date()
        }))
      };

      // Safeguard against Firestore 1MB document limit
      if (dataToSave.uploadedFile?.content) {
         // Omit large content from uploaded document to save space
         dataToSave.uploadedFile = { ...dataToSave.uploadedFile, content: '' };
      }
      
      if (dataToSave.presentation?.slides) {
         dataToSave.presentation = {
            ...dataToSave.presentation,
            slides: dataToSave.presentation.slides.map((s: any) => ({
                ...s,
                // Omit very large base64 images that would break Firestore
                imageUrl: s.imageUrl && s.imageUrl.length > 50000 ? null : s.imageUrl
            }))
         };
      }

      const sanitizedData = sanitizeForFirestore(dataToSave);
      await setDoc(doc(db, 'users', user.uid, 'conversations', conversation.id), sanitizedData);
    } catch (error) {
      console.error("Error saving conversation:", error);
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/conversations`);
    }
  };

  const createNewConversation = (view: ViewType, initialText?: string) => {
    const id = Date.now().toString();
    const brandPrompt = getBrandIdentityPrompt();
    let session = createChatSession(undefined, brandPrompt);
    if (view === 'review') {
      session = createChatSession(REVIEW_SYSTEM_PROMPT, brandPrompt);
    }
    
    const newConv: Conversation = {
      id,
      title: view === 'presentation' ? t.newPresentation : (initialText ? (initialText.length > 30 ? initialText.substring(0, 30) + '...' : initialText) : ''),
      messages: [],
      chatSession: session,
      uploadedFile: viewStates[view].uploadedFile,
      timestamp: new Date()
    };

    if (view === 'presentation') {
      setPresentation(null);
      // Clear inputs for new presentation
      setViewStates(prev => ({
        ...prev,
        [view]: { 
          ...prev[view], 
          input: '', 
          uploadedFile: null, 
          numSlides: undefined,
          conversations: [newConv, ...prev[view].conversations],
          activeConversationId: id
        }
      }));
    } else {
      setViewStates(prev => ({
        ...prev,
        [view]: {
          ...prev[view],
          conversations: [newConv, ...prev[view].conversations],
          activeConversationId: id,
          uploadedFile: null
        }
      }));
    }
    
    saveConversation(view, newConv);
    return newConv;
  };

  const deleteConversation = async (view: ViewType, convId: string) => {
    setViewStates(prev => {
      const newConvs = prev[view].conversations.filter(c => c.id !== convId);
      let newActiveId = prev[view].activeConversationId;
      if (newActiveId === convId) {
        newActiveId = newConvs[0]?.id || null;
      }
      return {
        ...prev,
        [view]: {
          ...prev[view],
          conversations: newConvs,
          activeConversationId: newActiveId
        }
      };
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'conversations', convId));
      } catch (error) {
        console.error("Error deleting conversation from Firestore:", error);
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/conversations`);
      }
    }
  };

  const [pendingGlobalAction, setPendingGlobalAction] = useState<{ type: string, payload: any } | null>(null);

  const handleGlobalAction = (result: CommandResponse) => {
    switch (result.action) {
      case 'navigate':
        if (result.view) setCurrentView(result.view as ViewType);
        break;
      case 'schedule_event':
        setPendingGlobalAction(null);
        setTimeout(() => {
          setPendingGlobalAction({ type: 'schedule_event', payload: result.payload });
          setCurrentView('calendar');
        }, 50);
        break;
      case 'create_task':
        setPendingGlobalAction(null);
        setTimeout(() => {
          setPendingGlobalAction({ type: 'create_task', payload: result.payload });
          setCurrentView('tasks');
        }, 50);
        break;
      case 'start_timer':
        setCurrentView('focus');
        if (result.payload) {
          if (result.payload.duration) {
            setFocusDuration(Number(result.payload.duration));
            setFocusTimeRemaining(Number(result.payload.duration) * 60);
          }
          if (result.payload.task) {
            setFocusTask(String(result.payload.task));
          }
          setIsFocusActive(true);
        }
        break;
      case 'setup_image_generation':
        setCurrentView('image-gen');
        if (result.payload && result.payload.prompt) {
          updateViewState('ai-studio', { currentMessage: result.payload.prompt });
        }
        break;
      case 'setup_storyboard':
        setCurrentView('storyboard');
        if (result.payload && result.payload.prompt) {
          updateViewState('storyboard', { storyboardPrompt: result.payload.prompt });
        }
        break;
      case 'setup_marketing_plan':
        setCurrentView('plan');
        if (result.payload && result.payload.prompt) {
          updateViewState('plan', { currentMessage: result.payload.prompt });
        }
        break;
      case 'setup_marketing_campaign':
        setCurrentView('campaign');
        updateViewState('campaign', { activeTab: 'generate' });
        if (result.payload && result.payload.prompt) {
          updateViewState('campaign', { campaignDraft: result.payload.prompt });
        }
        break;
      case 'translate':
        setCurrentView('translation');
        if (result.payload && result.payload.prompt) {
          updateViewState('ai-studio', { currentMessage: result.payload.prompt });
        }
        break;
    }
  };

  const globalAssistantChatRef = useRef<any>(null);

  const handleEnhanceGlobalPrompt = async () => {
    if (!globalAssistantInput.trim() || isEnhancingPrompt) return;
    setIsEnhancingPrompt(true);
    try {
      const toastId = toast.loading("Enhancing prompt...");
      const enhanced = await enhancePrompt(globalAssistantInput, 'general');
      setGlobalAssistantInput(enhanced);
      toast.success("Prompt enhanced successfully", { id: toastId });
    } catch (e: any) {
      toast.error("Failed to enhance prompt: " + e.message);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const startDictation = async (onTranscribe?: (text: string) => void) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Standard audio recording is not supported in this browser.");
      return;
    }

    if (typeof onTranscribe === 'function') {
      dictationTargetCallbackRef.current = onTranscribe;
    } else {
      dictationTargetCallbackRef.current = null;
    }

    // Set active states immediately so the click is completely visual-latency free!
    setIsDictating(true);
    dictationActiveRef.current = true;
    dictationStartTimeRef.current = Date.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If the user cancelled/stopped while mic permission was prompting/resolving
      if (!dictationActiveRef.current) {
        stream.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
        return;
      }

      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      // Create browser-appropriate MediaRecorder
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder: MediaRecorder;
      try {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mediaRecorder = new MediaRecorder(stream, options);
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
        } else {
          mediaRecorder = new MediaRecorder(stream);
        }
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      const initialInput = globalAssistantInput.trim();

      mediaRecorder.onstop = async () => {
        setIsDictating(false);
        dictationActiveRef.current = false;

        if (audioChunksRef.current.length === 0) {
          console.error("No audio data was recorded.");
          return;
        }

        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Ensure we actually recorded something non-trivial
        const duration = Date.now() - dictationStartTimeRef.current;
        if (duration < 300 || audioBlob.size < 100) {
          console.log(`Recording too short: duration=${duration}ms, size=${audioBlob.size}`);
          toast.error("No speech or voice detected. Please speak clearly into your microphone.", { id: "dictation-error" });
          return;
        }

        setIsTranscribing(true);

        try {
          // Convert Blob to Base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.includes(',') ? result.split(',')[1] : result);
            };
            reader.onerror = reject;
          });
          reader.readAsDataURL(audioBlob);
          const base64Data = await base64Promise;

          // Call our reliable transcribeAudio directly utilizing Gemini 2.5-flash!
          const rawTranscription = await transcribeAudio(base64Data, mimeType);
          const cleanTranscription = rawTranscription.trim();

          const lowerTranscription = cleanTranscription.toLowerCase();
          const isNoSpeech = 
            !cleanTranscription || 
            lowerTranscription === 'no_speech_detected' || 
            lowerTranscription.includes('no_speech_detected') ||
            lowerTranscription.includes('no speech or voice detected') ||
            lowerTranscription.includes('please provide the audio') ||
            lowerTranscription.includes('do not see a file') ||
            lowerTranscription.includes('no audio file') ||
            lowerTranscription.includes('audio file you would like') ||
            lowerTranscription.includes('cannot transcribe') ||
            lowerTranscription.includes('there is no audio') ||
            lowerTranscription.includes('there is no speech') ||
            lowerTranscription.includes('i do not see any');

          if (isNoSpeech) {
            toast.error("No speech or voice detected. Please speak clearly into your microphone.", { id: "dictation-error" });
          } else {
            if (typeof dictationTargetCallbackRef.current === 'function') {
              try {
                dictationTargetCallbackRef.current(cleanTranscription);
              } catch (cbErr) {
                console.error("Error executing dictation callback:", cbErr);
              }
            }
            setGlobalAssistantInput(initialInput + (initialInput ? ' ' : '') + cleanTranscription);
          }
        } catch (error: any) {
          console.error("Transcription error:", error);
          toast.error("Could not transcribe audio. Please try speaking again.", { id: "dictation-error" });
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(200); // chunk every 200ms

    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      const errMsg = (err.name || err.message || String(err)).toLowerCase();
      
      if (
        errMsg.includes('allow') || 
        errMsg.includes('permission') || 
        errMsg.includes('deny') || 
        errMsg.includes('denied') || 
        errMsg.includes('notallowed') || 
        errMsg.includes('security') ||
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        toast.error("Microphone access denied. Because browsers restrict microphone access inside iframes, please click the 'Open in new tab' icon/button in the top right of this preview to grant permission and speak!", { id: "dictation-error", duration: 10000 });
      } else {
        toast.error(`Microphone error: ${err.message || err.name || err}. Please try opening the app in a new tab.`, { id: "dictation-error", duration: 8000 });
      }
      setIsDictating(false);
      dictationActiveRef.current = false;
    }
  };

  const stopDictation = () => {
    dictationActiveRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping MediaRecorder:", e);
      }
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch(e) {}
      });
      audioStreamRef.current = null;
    }
    setIsDictating(false);
  };

  const toggleDictation = (onTranscribe?: (text: string) => void) => {
    if (isDictating) {
        stopDictation();
    } else {
        startDictation(onTranscribe);
    }
  };

  const handleGlobalAssistantSend = async (text: string, startNew: boolean = false) => {
    if (!text.trim() || isGlobalAssistantLoading) return;
    
    setIsGlobalAssistantLoading(true);
    if (globalAssistantState !== 'sidebar') {
      setGlobalAssistantState('sidebar');
    }

    if (startNew) {
      setGlobalAssistantMessages([]);
      localStorage.removeItem('studio_globalAssistantMessages');
      globalAssistantChatRef.current = null;
    }

    const newMessage = { role: 'user' as const, content: text };
    setGlobalAssistantMessages(prev => startNew ? [newMessage] : [...prev, newMessage]);
    setGlobalAssistantInput('');

    try {
      if (!globalAssistantChatRef.current) {
        const history = startNew ? [] : globalAssistantMessages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));
        const instruction = `You are Studio AI Assistant, a helpful assistant integrated into the Creative Studio platform. You are aware of the following platform features and functionalities (use the ID in parentheses to navigate):
- Home / Dashboard (home)
- Assistant Chat (chat)
- Strategy & Analysis Hub (plan)
- Data Visualization (visualize)
- Campaign Creator (campaign)
- Presentation Builder (presentation)
- Activity Review (review)
- Audio Transcription (transcribe)
- Video Storyboard (storyboard)
- Text-to-Speech Voiceover (tts)
- Translation Engine (translation)
- Image Generation (image-gen)
- Task Management (tasks)
- Marketing Calendar (calendar)
- Settings (settings)
- World Clock (world-clock)
- Capabilities Guide (capabilities)

CRITICAL INSTRUCTION: If the user asks you to take them to, navigate to, or open a specific section, you MUST output a special tag anywhere in your response exactly like this: [NAVIGATE_TO:viewID] where viewID is one of the exact IDs listed in parentheses above. For example: [NAVIGATE_TO:image-gen] or [NAVIGATE_TO:plan].

You can answer general questions, discuss marketing strategies, and help the user navigate or understand parts of the platform and these specific features. Currently, the user is looking at the "${currentView}" view. Be concise.`;
        globalAssistantChatRef.current = createChatSession(instruction, getBrandIdentityPrompt(), history);
      }

      setGlobalAssistantMessages(prev => [...prev, { role: 'model' as const, content: '' }]);

      const stream = await globalAssistantChatRef.current.sendMessageStream({ message: text });
      let fullResponse = "";
      let hasNavigated = false;
      const navigateRegex = /\[NAVIGATE_TO:([a-zA-Z0-9-]+)\]/g;

      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponse += chunk.text;
          
          if (!hasNavigated) {
            const match = /\[NAVIGATE_TO:([a-zA-Z0-9-]+)\]/.exec(fullResponse);
            if (match && match[1]) {
              const viewId = match[1] as any;
              setCurrentView(viewId);
              hasNavigated = true;
            }
          }

          setGlobalAssistantMessages(prev => {
            const newM = [...prev];
            newM[newM.length - 1].content = fullResponse.replace(navigateRegex, '').trim();
            return newM;
          });
        }
      }
      
      addActivity('chat', 'Global Assistant Chat', `Asked: ${text}`, 'home');
    } catch (e: any) {
      console.error(e);
      const errStr = String(e?.message || e).toLowerCase();
      const isRegionLock = errStr.includes('unavailable in your region') || errStr.includes('user location is not supported');
      if (isRegionLock) {
        toast("AI Region Lock", {
          description: "AI generation is currently unavailable in your region. Please continue using other parts of the platform or consider connecting to a VPN.",
          icon: "🌍",
          duration: 8000,
          className: "bg-background/90 backdrop-blur-xl border border-red-500/30 shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)] !rounded-2xl p-4 gap-3",
        });
      } else {
        addToast(e.message || "Failed to communicate with assistant", "error");
      }
      setGlobalAssistantMessages(prev => {
        const newM = [...prev];
        newM[newM.length - 1].content = isRegionLock 
          ? "AI generation is currently unavailable in your region." 
          : "Sorry, I encountered an error answering your question.";
        newM[newM.length - 1].isError = isRegionLock;
        return newM;
      });
    } finally {
      setIsGlobalAssistantLoading(false);
    }
  };

  const clearGlobalAssistant = () => {
    setGlobalAssistantMessages([]);
    localStorage.removeItem('studio_globalAssistantMessages');
    globalAssistantChatRef.current = null;
  };

  const handleSend = async (text: string) => {
    abortGenerationRef.current = false;
    let activeView = currentView;
    if (currentView === 'home') {
      activeView = 'chat';
      setCurrentView('chat');
    }

    const state = viewStates[activeView];
    const { conversations, activeConversationId, isLoading } = state;
    if (!text.trim() || isLoading) return;

    let activeConv = conversations.find(c => c.id === activeConversationId);
    if (!activeConv || (activeView === 'chat' && currentView === 'home')) {
      activeConv = createNewConversation(activeView, text);
    }

      const { chatSession, messages, id: convId } = activeConv;
    if (!chatSession) {
      console.error("No chat session found for conversation:", activeConv.id);
      addToast("Error: Chat session could not be initialized.", "error");
      return;
    }

    // Determine what to send to the model
    // Priorities: 
    // 1. If conversation has its own file, use it.
    // 2. Otherwise usage the view's current uploaded file.
    const fileToUse = activeConv.uploadedFile || state.uploadedFile;
    let messageToSend = text;
    
    if (fileToUse) {
      // Check if we've already introduced this specific file content in the history
      const alreadyIntroduced = messages.some(m => m.content.includes(`file named "${fileToUse.name}"`));
      
      if (!alreadyIntroduced || messages.length === 0) {
        messageToSend = `I have uploaded a file named "${fileToUse.name}". Here is its content:\n\n${fileToUse.content}\n\nMy question/task is: ${text}`;
      } else if (messages.length > 0) {
        // Just a subtle reminder to maintain focus on the document if it's been a while
        messageToSend = `Continuing discussion about "${fileToUse.name}":\n\n${text}`;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
    };

    const newMessages = [...messages, userMessage];
    
    // Update active conversation with user message
    setViewStates(prev => ({
      ...prev,
      [activeView]: {
        ...prev[activeView],
        isLoading: true,
        input: '',
        uploadedFile: null,
        conversations: prev[activeView].conversations.map(c => 
          c.id === convId ? { ...c, messages: newMessages, uploadedFile: null, title: (!c.title || c.title.trim() === '') ? (text.length > 30 ? text.substring(0, 30) + '...' : text) : c.title } : c
        )
      }
    }));

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);

    try {
      // Use withRetry for the initial session request
      const responseStream = await withRetry(async () => {
        return await chatSession.sendMessageStream({ message: messageToSend });
      });

      const activityType = activeView === 'review' ? 'marketing' : 'chat';
      addActivity(activityType, activeView === 'review' ? 'Activity Reviewed' : 'Message Sent', text.length > 30 ? text.substring(0, 30) + '...' : text, activeView, convId);
      
      const modelMessageId = (Date.now() + 1).toString();
      const messagesWithModel: Message[] = [
        ...newMessages,
        { id: modelMessageId, role: 'model' as const, content: '' },
      ];
      
      setViewStates(prev => ({
        ...prev,
        [activeView]: {
          ...prev[activeView],
          conversations: prev[activeView].conversations.map(c => 
            c.id === convId ? { ...c, messages: messagesWithModel } : c
          )
        }
      }));

      let fullResponse = '';
      let hasNavigated = false;
      const navigateRegex = /\[NAVIGATE_TO:([a-zA-Z0-9-]+)\]/g;
      
      try {
        for await (const chunk of responseStream) {
          if (abortGenerationRef.current) break;
          if (chunk.text) {
            fullResponse += chunk.text;
            
            if (!hasNavigated) {
              const match = /\[NAVIGATE_TO:([a-zA-Z0-9-]+)\]/.exec(fullResponse);
              if (match && match[1]) {
                const viewId = match[1] as any;
                setCurrentView(viewId);
                hasNavigated = true;
              }
            }
            
            const processedResponse = fullResponse.replace(navigateRegex, '').trim();

            setViewStates(prev => ({
              ...prev,
              [activeView]: {
                ...prev[activeView],
                conversations: prev[activeView].conversations.map(c => 
                  c.id === convId ? { 
                    ...c, 
                    messages: c.messages.map(msg => 
                      msg.id === modelMessageId ? { ...msg, content: processedResponse } : msg
                    ) 
                  } : c
                )
              }
            }));
          }
        }
      } catch (streamError: any) {
        console.error("Stream interrupted:", streamError);
        // If stream fails partially, we still keep what we got
        if (!fullResponse) throw streamError;
      }
    } catch (error: any) {
      const errorStr = String(error?.message || error);
      const isQuota = error?.status === 429 || errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED');
      const isCreditsDepleted = !isQuota && (errorStr.includes('prepayment credits') || errorStr.includes('insufficient_credits'));
      
      if (isCreditsDepleted) {
        console.error("Chat: AI Studio prepayment credits depleted.");
      } else {
        console.error("Error sending message:", errorStr);
      }
      
      let errorMessage = 'Sorry, I encountered an error processing your request. Please try again.';
      
      // Provide more specific feedback if possible
      const isSafety = errorStr.includes('SAFETY') || errorStr.includes('blocked');
      const isLarge = errorStr.includes('InvalidArgument') || errorStr.includes('too large') || errorStr.includes('limit');
      const isRegionLock = errorStr.includes('unavailable in your region') || errorStr.includes('user location is not supported');
      
      let isErrorMsg = false;
      if (errorStr.includes(NO_KEY_MESSAGE)) {
        errorMessage = `${NO_KEY_MESSAGE} I can't generate a response in this demo, and retrying won't change that. Set GEMINI_API_KEY to turn AI features on.`;
      } else if (isRegionLock) {
        errorMessage = 'AI generation is currently unavailable in your region.';
        isErrorMsg = true;
        toast("AI Region Lock", {
          description: "AI generation is currently unavailable in your region. Please continue using other parts of the platform or consider connecting to a VPN.",
          icon: "🌍",
          duration: 8000,
          className: "bg-background/90 backdrop-blur-xl border border-red-500/30 shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)] !rounded-2xl p-4 gap-3",
        });
      } else if (isCreditsDepleted) {
        errorMessage = 'Your AI Studio prepayment credits are depleted. Please go to https://ai.studio/projects to manage your billing.';
        addToast("Credits depleted. Check your AI Studio billing.", "error");
      } else if (isQuota) {
        errorMessage = 'AI service is currently busy (Rate Limit reached). Please wait a few seconds and try again.';
        addToast("Rate limit exceeded. Please wait a moment.", "error");
      } else if (isSafety) {
        errorMessage = 'I apologize, but I cannot process this specific content due to safety guidelines.';
        addToast("Request blocked by safety filters.", "info");
      } else if (isLarge) {
        errorMessage = 'The document or prompt is too large for analysis. Please try a smaller file or chunk the text.';
        addToast("Payload too large.", "error");
      } else {
        // Detailed error for debugging - will help the user tell us what's wrong
        const cleanError = errorStr.replace(/[\{\}]/g, '').replace(/\\n/g, ' ').substring(0, 200);
        errorMessage = `I encountered a technical error: "${cleanError}". Please try clearing the conversation and trying again.`;
      }

      setViewStates(prev => ({
        ...prev,
        [activeView]: {
          ...prev[activeView],
          isLoading: false,
          conversations: prev[activeView].conversations.map(c => 
            c.id === convId ? { 
              ...c, 
              messages: [
                ...newMessages, // Keep user message
                {
                  id: Date.now().toString(),
                  role: 'model' as const,
                  content: errorMessage,
                  isError: isErrorMsg,
                },
              ] 
            } : c
          )
        }
      }));
    } finally {
      setViewStates(prev => {
        const updatedConvs = prev[activeView].conversations.map(c => 
          c.id === convId ? { ...c, isLoading: false } : c
        );
        const finalConv = updatedConvs.find(c => c.id === convId);
        if (finalConv) {
          saveConversation(activeView, finalConv);
        }
        return { ...prev, [activeView]: { ...prev[activeView], isLoading: false, conversations: updatedConvs } };
      });
    }
  };

  const handleClearChat = () => {
    setViewStates(prev => {
      const viewState = prev[currentView];
      if (!viewState) return prev;
      
      const activeId = viewState.activeConversationId;
      const updatedConvs = viewState.conversations.map(conv => {
        if (conv.id === activeId) {
          let session = createChatSession();
          if (currentView === 'plan') {
            // we can just use default session or whatever.
          }
          const clearedConv = {
            ...conv,
            messages: [],
            chatSession: session,
            uploadedFile: null
          };
          // Schedule background save
          setTimeout(() => saveConversation(currentView, clearedConv), 100);
          return clearedConv;
        }
        return conv;
      });

      return {
        ...prev,
        [currentView]: {
          ...viewState,
          conversations: updatedConvs
        }
      };
    });
    addToast("Conversation history cleared", "info");
  };

  const stripMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
      .replace(/([*_])(.*?)\1/g, '$2') // Remove italic
      .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, function(match) { return match.replace(/```[a-z]*\n?/g, '').replace(/```/g, ''); }) // Remove code blocks
      .replace(/^\s*>\s+/gm, '') // Remove blockquotes
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/^---+$/gm, '') // Remove hr
      .replace(/^\*\*\*+$/gm, '');
  };

  const handleExport = async (format: 'pptx' | 'json' = 'pptx') => {
    const activeConv = currentViewState.conversations.find(c => c.id === currentViewState.activeConversationId);
    
    if (currentView === 'presentation' && presentation) {
      const brandRed = 'FF2B2B';
      const brandBlack = '000000';
      const brandWhite = 'FFFFFF';
      const styleName = presentation.styleName;
      const isTech = styleName === "Modern Dynamic";
      const isGem = styleName === "Gem";
      const isStrategic = styleName === "Strategic Elite";
      const isBold = styleName === "Dark";
      const isExecutive = styleName === "Light" || styleName === "Dark";

      if (format === 'pptx') {
        const pres = new pptxgen();
        pres.title = presentation.title;
        pres.layout = 'LAYOUT_16x9';

        presentation.slides.forEach((slideData, index) => {
          const slide = pres.addSlide();
          
          // Background logic
          if (isTech) {
            slide.background = { color: '0F172A' }; // Slate 900
          } else if (isBold) {
            slide.background = { color: brandBlack };
          } else if (isGem) {
            slide.background = { color: 'F4F1EB' }; // Wax paper / sand
          } else {
            slide.background = { color: brandWhite };
          }

          const titleColor = (isTech || isBold) ? brandWhite : (isGem ? '2D302C' : brandBlack);
          const bodyColor = (isTech || isBold) ? 'EEEEEE' : (isGem ? '4D524A' : '666666');
          const cardBgColor = (isTech || isBold) ? '1E293B' : (isGem ? 'EBE7DF' : 'FFFFFF');
          const cardTextColor = (isTech || isBold) ? 'FFFFFF' : (isGem ? '2D302C' : '333333');
          const shapeColor = isBold ? brandWhite : (isGem ? '2D302C' : brandBlack);
          const bodyFont = isGem ? 'Georgia' : 'Arial';
          const titleFont = 'Impact';
          const highlightColor = isGem ? 'FF2B2B' : brandRed;

          
          if (isGem) {
            switch (slideData.layout) {
              case 'title':
                slide.addText(slideData.title.toUpperCase(), {
                  x: 1.5, y: 1.5, w: 7, h: 2,
                  fontSize: 64, bold: false, align: 'left', color: '2D302C', fontFace: 'Impact'
                });
                if (slideData.subtitle) {
                  slide.addText(slideData.subtitle, {
                    x: 1.5, y: 3.5, w: 7, h: 1,
                    fontSize: 24, bold: false, align: 'left', color: '4D524A', fontFace: 'Arial'
                  });
                }
                break;
              case 'contents':
                slide.addText('CONTENTS', {
                  x: 0.5, y: 0.8, w: 3, h: 1,
                  fontSize: 48, bold: false, color: '2D302C', fontFace: 'Impact'
                });
                slideData.content.slice(0, 6).forEach((item, i) => {
                  slide.addText((i + 1).toString().padStart(2, '0'), {
                    x: 3.5, y: 0.8 + (i * 0.7), w: 0.8, h: 0.5,
                    fontSize: 24, color: 'FF2B2B', fontFace: 'Arial'
                  });
                  slide.addText(item, {
                    x: 4.5, y: 0.8 + (i * 0.7), w: 5, h: 0.5,
                    fontSize: 24, color: '2D302C', fontFace: 'Georgia'
                  });
                  slide.addShape(pres.ShapeType.line, { 
                    x: 4.5, y: 1.3 + (i * 0.7), w: 5, h: 0, 
                    line: { color: 'EBE7DF', width: 1 } 
                  });
                });
                break;
              case 'split':
                slide.addText(slideData.title.toUpperCase(), {
                  x: 0.5, y: 0.5, w: 4, h: 1.5,
                  fontSize: 40, bold: false, color: '2D302C', fontFace: 'Impact'
                });
                slideData.content.slice(0, 3).forEach((point, i) => {
                  slide.addText(point, {
                    x: 0.5, y: 2.2 + (i * 0.8), w: 4, h: 0.6,
                    fontSize: 16, color: '4D524A', fontFace: 'Arial'
                  });
                });
                if (slideData.imageUrl) {
                  slide.addImage({ path: slideData.imageUrl, x: 5, y: 0, w: 5, h: 5.625, sizing: { type: 'cover', w: 5, h: 5.625 } });
                } else {
                  slide.addShape(pres.ShapeType.rect, { x: 5, y: 0, w: 5, h: 5.625, fill: { color: 'EBE7DF' } });
                }
                break;
              case 'grid':
                slide.addText(slideData.title.toUpperCase(), {
                  x: 0.5, y: 0.5, w: 5, h: 1.5,
                  fontSize: 48, bold: false, color: '2D302C', fontFace: 'Impact'
                });
                slideData.content.slice(0, 4).forEach((item, i) => {
                  const col = i % 2;
                  const row = Math.floor(i / 2);
                  const x = 0.5 + col * 4.5;
                  const y = 2.5 + row * 1.5;
                  slide.addShape(pres.ShapeType.line, { x, y, w: 4, h: 0, line: { color: '4D524A', width: 1 } });
                  slide.addText(String(i + 1).padStart(2, '0'), {
                    x, y: y + 0.1, w: 4, h: 0.4,
                    fontSize: 16, color: 'FF2B2B', fontFace: 'Arial'
                  });
                  slide.addText(item, {
                    x, y: y + 0.5, w: 4, h: 0.8,
                    fontSize: 18, color: '2D302C', fontFace: 'Georgia'
                  });
                });
                break;
              case 'feature':
                slide.addText(slideData.title.toUpperCase(), {
                  x: 1, y: 1, w: 8, h: 1.5,
                  fontSize: 56, bold: false, align: 'center', color: '2D302C', fontFace: 'Impact'
                });
                slideData.content.slice(0, 3).forEach((item, i) => {
                  const x = 1 + (i * 2.8);
                  slide.addShape(pres.ShapeType.line, { x, y: 3, w: 0.5, h: 0, line: { color: 'FF2B2B', width: 2 } });
                  slide.addText(item, {
                    x, y: 3.2, w: 2.5, h: 1.5,
                    fontSize: 16, color: '2D302C', fontFace: 'Arial'
                  });
                });
                break;
              case 'timeline':
              case 'steps':
                slide.addText(slideData.title.toUpperCase(), {
                  x: 0.5, y: 0.5, w: 9, h: 1,
                  fontSize: 40, bold: false, color: '2D302C', fontFace: 'Impact'
                });
                slideData.content.slice(0, 4).forEach((item, i) => {
                  const x = 0.5 + (i * 2.3);
                  slide.addText("0" + (i+1), {
                    x, y: 2, w: 2, h: 0.8,
                    fontSize: 36, color: 'FF2B2B', fontFace: 'Georgia'
                  });
                  slide.addShape(pres.ShapeType.line, { x, y: 2.8, w: 2, h: 0, line: { color: '4D524A', width: 1 } });
                  slide.addText(item, {
                    x, y: 3, w: 2, h: 1.5,
                    fontSize: 14, color: '2D302C', fontFace: 'Arial'
                  });
                });
                break;
              case 'chart':
                slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 4, h: 5.625, fill: { color: 'EBE7DF' } });
                slide.addText(slideData.title.toUpperCase(), {
                  x: 0.5, y: 1.5, w: 3, h: 1.5,
                  fontSize: 40, bold: false, color: '2D302C', fontFace: 'Impact'
                });
                slide.addText(slideData.content[0] || "Metrics analysis and overview.", {
                  x: 0.5, y: 3, w: 3, h: 1,
                  fontSize: 16, color: '4D524A', fontFace: 'Arial'
                });
                const chartData = slideData.data || [
                  { label: 'Q1', value: 340 },
                  { label: 'Q2', value: 410 },
                  { label: 'Q3', value: 580 },
                  { label: 'Q4', value: 720 },
                ];
                const maxVal = Math.max(...chartData.map(v => v.value));
                chartData.forEach((d, i) => {
                  const x = 4.5 + (i * 1.3);
                  const h = (d.value / maxVal) * 3; // Max height 3 inches
                  
                  slide.addShape(pres.ShapeType.rect, {
                    x: x + 0.2, y: 4.8 - h, w: 0.6, h: h, fill: { color: '2D302C' }
                  });
                  slide.addText(d.value.toString(), {
                    x: x, y: 4.8 - h - 0.6, w: 1, h: 0.6,
                    fontSize: 24, color: 'FF2B2B', fontFace: 'Georgia', align: 'center', bold: true
                  });
                  slide.addText(d.label, {
                    x: x, y: 5.0, w: 1, h: 0.4,
                    fontSize: 12, color: '4D524A', fontFace: 'Arial', align: 'center'
                  });
                });
                break;
              case 'quote':
                slide.background = { color: '2D302C' };
                slide.addText('"', {
                  x: 0.5, y: 0.5, w: 1, h: 1,
                  fontSize: 80, color: 'FF2B2B', fontFace: 'Georgia'
                });
                slide.addText(slideData.content[0], {
                  x: 1, y: 1.5, w: 8, h: 2,
                  fontSize: 40, color: 'F4F1EB', fontFace: 'Georgia'
                });
                slide.addText(slideData.title.toUpperCase(), {
                  x: 1, y: 3.5, w: 8, h: 0.5,
                  fontSize: 14, color: 'A0A49E', fontFace: 'Arial'
                });
                break;
              case 'image':
                slide.addText(slideData.title.toUpperCase(), {
                  x: 0.5, y: 1, w: 3.5, h: 1.5,
                  fontSize: 40, bold: false, color: '2D302C', fontFace: 'Impact'
                });
                slideData.content.slice(0, 3).forEach((point, i) => {
                  slide.addShape(pres.ShapeType.line, { x: 0.5, y: 3 + (i * 0.8), w: 0, h: 0.6, line: { color: 'EBE7DF', width: 2 } });
                  slide.addText(point, {
                    x: 0.7, y: 3 + (i * 0.8), w: 3, h: 0.6,
                    fontSize: 14, color: '2D302C', fontFace: 'Arial'
                  });
                });
                if (slideData.imageUrl) {
                  slide.addImage({ path: slideData.imageUrl, x: 4.5, y: 0, w: 5.5, h: 5.625, sizing: { type: 'cover', w: 5.5, h: 5.625 } });
                } else {
                  slide.addShape(pres.ShapeType.rect, { x: 4.5, y: 0, w: 5.5, h: 5.625, fill: { color: 'EBE7DF' } });
                }
                break;
              default:
                slide.addText(slideData.title.toUpperCase(), {
                  x: 0.5, y: 0.8, w: 6, h: 1.5,
                  fontSize: 40, bold: false, color: '2D302C', fontFace: 'Impact'
                });
                slideData.content.slice(0, 2).forEach((point, i) => {
                  const x = 0.5 + (i * 4.5);
                  slide.addShape(pres.ShapeType.line, { x, y: 2.5, w: 4, h: 0, line: { color: 'EBE7DF', width: 1 } });
                  slide.addText(point, {
                    x, y: 2.7, w: 4, h: 1.5,
                    fontSize: 20, color: '2D302C', fontFace: 'Georgia'
                  });
                });
                break;
            }
            if (slideData.speakerNotes) { slide.addNotes(slideData.speakerNotes); }
            return; // Skip standard processing for Gem
          }

          switch (slideData.layout) {
            case 'title':
              if (isTech) {
                slide.addShape(pres.ShapeType.ellipse, { x: 7, y: -1, w: 4, h: 4, fill: { color: highlightColor, transparency: 80 } });
              } else if (isExecutive) {
                slide.addShape(pres.ShapeType.rect, { x: 6, y: 0, w: 4, h: 5.625, fill: { color: shapeColor } });
              } else {
                slide.addShape(pres.ShapeType.ellipse, { x: 6, y: -2, w: 6, h: 6, fill: { color: highlightColor, transparency: 90 } });
              }
              
              slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 1.2, w: 1.5, h: 0.08, fill: { color: highlightColor } });
              
              slide.addText(slideData.title.toUpperCase(), {
                x: 0.8, y: 1.5, w: 5, h: 2,
                fontSize: 60, bold: true, align: 'left', color: titleColor, fontFace: titleFont
              });
              if (slideData.subtitle) {
                slide.addText(slideData.subtitle, {
                  x: 0.8, y: 3.5, w: 5, h: 0.5,
                  fontSize: 22, bold: false, align: 'left', color: bodyColor, fontFace: bodyFont
                });
              }
              break;

            case 'contents':
              slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 2.5, h: 5.625, fill: { color: isBold ? highlightColor : (isTech ? '0F172A' : shapeColor) } });
              slide.addText(t.contents || 'CONTENTS', {
                x: -1, y: 2.5, w: 4.5, h: 0.8,
                fontSize: 36, bold: true, color: isBold ? shapeColor : cardBgColor, fontFace: titleFont, rotate: 270, align: 'center'
              });
              slideData.content.forEach((item, i) => {
                const row = i % 6;
                const col = Math.floor(i / 6);
                slide.addText((i + 1).toString().padStart(2, '0'), {
                  x: 3 + (col * 3.5), y: 0.8 + (row * 0.7), w: 0.6, h: 0.4,
                  fontSize: 24, bold: true, color: highlightColor, fontFace: bodyFont
                });
                slide.addText(item, {
                  x: 3.7 + (col * 3.5), y: 0.8 + (row * 0.7), w: 2.8, h: 0.4,
                  fontSize: 16, bold: true, color: titleColor, fontFace: titleFont
                });
                slide.addShape(pres.ShapeType.line, { x: 3.7 + (col * 3.5), y: 1.2 + (row * 0.7), w: 2.8, h: 0, line: { color: (isTech || isBold) ? '334155' : 'EEEEEE', width: 1 } });
              });
              break;

            case 'split':
              slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 0.6, w: 0.8, h: 0.08, fill: { color: highlightColor } });
              slide.addText(slideData.title.toUpperCase(), {
                x: 0.5, y: 0.8, w: 4.2, h: 1.2,
                fontSize: 32, bold: true, color: titleColor, fontFace: titleFont, valign: 'top'
              });
              slideData.content.forEach((point, i) => {
                slide.addText(point, {
                  x: 0.8, y: 2.2 + (i * 0.5), w: 3.8, h: 0.4,
                  fontSize: 14, color: bodyColor, bullet: { code: '2022' }, fontFace: bodyFont
                });
              });
              
              if (slideData.imageUrl) {
                slide.addImage({ path: slideData.imageUrl, x: 5.2, y: 0.5, w: 4.3, h: 4.6, sizing: { type: 'cover', w: 4.3, h: 4.6 } });
              } else {
                slide.addShape(pres.ShapeType.rect, { x: 5.2, y: 0.5, w: 4.3, h: 4.6, fill: { color: cardBgColor } });
                slide.addText('IMAGE PLACEHOLDER', {
                  x: 5.2, y: 2.4, w: 4.3, h: 0.8,
                  fontSize: 16, bold: true, color: (isTech || isBold) ? '334155' : '94A3B8', align: 'center'
                });
              }
              break;

            case 'grid':
              slide.addText(slideData.title.toUpperCase(), {
                x: 0.5, y: 0.4, w: 9, h: 0.6,
                fontSize: 28, bold: true, color: titleColor, fontFace: titleFont
              });
              slide.addShape(pres.ShapeType.line, { x: 0.5, y: 1.0, w: 9, h: 0, line: { color: highlightColor, width: 2 } });
              
              const is2xGrid = slideData.content.length === 4 || slideData.content.length === 2;
              const gridCols = is2xGrid ? 2 : (slideData.content.length === 1 ? 1 : 3);
              const colWidth = is2xGrid ? 4.0 : 2.8;
              const colSpacing = is2xGrid ? 4.5 : 3.1;

              slideData.content.slice(0, 6).forEach((item, i) => {
                const col = i % gridCols;
                const row = Math.floor(i / gridCols);
                slide.addShape(pres.ShapeType.rect, {
                  x: 0.5 + (col * colSpacing), y: 1.3 + (row * 1.8), w: colWidth, h: 1.6,
                  fill: { color: isBold ? '111111' : cardBgColor }, line: { color: (isTech || isBold) ? '334155' : 'E2E8F0', width: 1 }
                });
                slide.addText((i + 1).toString().padStart(2, '0'), {
                  x: 0.5 + (col * colSpacing), y: 1.3 + (row * 1.8), w: 0.5, h: 0.4,
                  fontSize: 12, bold: true, color: isBold ? shapeColor : cardBgColor, fill: { color: isBold ? cardBgColor : (isTech ? '334155' : '333333') }, align: 'center'
                });
                slide.addText(item, {
                  x: 0.6 + (col * colSpacing), y: 1.4 + (row * 1.8), w: colWidth - 0.2, h: 1.4,
                  fontSize: is2xGrid ? 14 : 12, bold: true, color: titleColor, align: 'center', fontFace: bodyFont, valign: 'middle'
                });
              });
              break;

            case 'feature':
              slide.addText(slideData.title.toUpperCase(), {
                x: 0.5, y: 0.5, w: 9, h: 0.8,
                fontSize: 28, bold: true, color: titleColor, fontFace: titleFont, align: 'center'
              });
              if (slideData.subtitle) {
                slide.addText(slideData.subtitle, {
                  x: 1, y: 1.2, w: 8, h: 0.4,
                  fontSize: 14, color: bodyColor, fontFace: bodyFont, align: 'center'
                });
              }

              const featItems = slideData.content.slice(0, 4);
              const featCols = featItems.length === 3 ? 3 : featItems.length === 1 ? 1 : 2;
              const fWidth = featCols === 3 ? 2.8 : (featCols === 1 ? 7 : 4);
              const fSpacing = featCols === 3 ? 3 : (featCols === 1 ? 0 : 4.5);
              const startX = featCols === 3 ? 0.5 : (featCols === 1 ? 1.5 : 0.75);

              featItems.forEach((item, i) => {
                const col = i % featCols;
                const row = Math.floor(i / featCols);
                const y = 2.0 + (row * 1.5);
                slide.addShape(pres.ShapeType.rect, {
                  x: startX + (col * fSpacing), y: y, w: fWidth, h: 1.2,
                  fill: { color: isBold ? '111111' : cardBgColor },
                  line: { color: highlightColor, width: 1 }
                });
                slide.addText(item, {
                  x: startX + (col * fSpacing) + 0.2, y: y, w: fWidth - 0.4, h: 1.2,
                  fontSize: 14, bold: true, color: titleColor, align: 'center', valign: 'middle'
                });
              });
              break;

            case 'timeline':
              slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 0.4, w: 0.1, h: 0.6, fill: { color: highlightColor } });
              slide.addText(slideData.title.toUpperCase(), {
                x: 0.7, y: 0.4, w: 8.8, h: 0.6,
                fontSize: 32, bold: true, color: titleColor, fontFace: titleFont
              });
              
              slide.addShape(pres.ShapeType.line, { x: 0.5, y: 3, w: 9, h: 0, line: { color: isTech ? '334155' : 'EEEEEE', width: 2 } });
              slideData.content.forEach((item, i) => {
                const x = 0.5 + i * (9 / slideData.content.length);
                const itemX = x + (9 / slideData.content.length - 2) / 2;
                
                // Year Badge
                slide.addShape(pres.ShapeType.rect, {
                  x: itemX + 0.5, y: 2.0, w: 1, h: 0.4,
                  fill: { color: (isTech || isBold) ? '334155' : shapeColor }
                });
                slide.addText((i + 1).toString().padStart(2, '0'), {
                  x: itemX + 0.5, y: 2.0, w: 1, h: 0.4,
                  fontSize: 12, bold: true, color: cardBgColor, align: 'center', valign: 'middle'
                });

                // Dot
                slide.addShape(pres.ShapeType.ellipse, { x: itemX + 0.9, y: 2.9, w: 0.2, h: 0.2, fill: { color: highlightColor } });
                
                // Text
                slide.addText(item, {
                  x: itemX, y: 3.3, w: 2, h: 0.8,
                  fontSize: 11, bold: true, align: 'center', color: titleColor, fontFace: bodyFont, valign: 'top'
                });
              });
              break;

            case 'chart':
              slide.addText(slideData.title.toUpperCase(), {
                x: 0.5, y: 0.4, w: 9, h: 0.6,
                fontSize: 32, bold: true, color: titleColor, fontFace: titleFont
              });
              const chartData = slideData.data || [
                { label: '2022', value: 400 },
                { label: '2023', value: 450 },
                { label: '2024', value: 520 },
                { label: '2025', value: 610 },
                { label: '2026', value: 750 },
              ];
              
              chartData.forEach((d, i) => {
                const maxVal = Math.max(...chartData.map(v => v.value));
                const h = (d.value / maxVal) * 3;
                slide.addShape(pres.ShapeType.rect, {
                  x: 1.5 + i * 1.4, y: 4.5 - h, w: 0.8, h, 
                  fill: { color: highlightColor },
                  line: { color: cardBgColor, width: 1 }
                });
                slide.addText(d.label, {
                  x: 1.5 + i * 1.4, y: 4.6, w: 0.8, h: 0.3,
                  fontSize: 11, bold: true, align: 'center', color: (isTech || isBold) ? cardBgColor : '333333'
                });
                slide.addText(d.value.toString(), {
                  x: 1.5 + i * 1.4, y: 4.5 - h - 0.3, w: 0.8, h: 0.3,
                  fontSize: 10, bold: true, align: 'center', color: highlightColor
                });
              });
              break;

            case 'quote':
              if (isTech || isBold) {
                slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: isBold ? shapeColor : '020617' } });
              }
              slide.addText('"', { x: 0.5, y: -0.5, w: 2, h: 2, color: highlightColor, fontSize: 180, bold: true, transparency: 80, align: 'left', fontFace: 'Georgia' });
              slide.addText(slideData.content[0], { 
                x: 1, y: 1.2, w: 8, h: 2.8, 
                color: titleColor, fontSize: 30, italic: true, align: 'center', fontFace: titleFont, valign: 'middle' 
              });
              slide.addShape(pres.ShapeType.rect, { x: 4.5, y: 4.2, w: 1, h: 0.05, fill: { color: highlightColor } });
              slide.addText(slideData.title.toUpperCase(), { 
                x: 1, y: 4.4, w: 8, h: 0.4, 
                color: titleColor, fontSize: 14, bold: true, align: 'center', fontFace: bodyFont, charSpacing: 2 
              });
              break;

            case 'image':
              // Left half background for image/placeholder
              // We'll give it a light gray background (for placeholder)
              slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 5, h: 5.625, fill: { color: 'F1F5F9' } });
              
              if (slideData.imageUrl) {
                slide.addImage({ path: slideData.imageUrl, x: 0, y: 0, w: 5, h: 5.625, sizing: { type: 'cover', w: 5, h: 5.625 } });
              } else {
                // Placeholder
                slide.addText('IMAGE PLACEHOLDER', {
                  x: 0, y: 2.5, w: 5, h: 0.625,
                  fontSize: 16, bold: true, color: '94A3B8', align: 'center', valign: 'middle'
                });
              }

              // Right side bg
              slide.addShape(pres.ShapeType.rect, { x: 5, y: 0, w: 5, h: 5.625, fill: { color: isBold ? '111111' : (isTech ? '0F172A' : 'FAFAFA') } });

              slide.addText(slideData.title.toUpperCase(), {
                x: 5.5, y: 0.5, w: 4.0, h: 1.2,
                fontSize: 36, bold: true, color: titleColor, fontFace: titleFont, valign: 'bottom'
              });

              slideData.content.slice(0, 4).forEach((point, i) => {
                const y = 2.0 + (i * 0.8);
                // Box
                slide.addShape(pres.ShapeType.rect, {
                  x: 5.4, y: y, w: 4.2, h: 0.6,
                  fill: { color: (isTech || isBold) ? '1E293B' : 'FFFFFF' },
                  line: { color: 'E2E8F0', width: 1 } // light border
                });
                // Small red dot
                slide.addShape(pres.ShapeType.ellipse, {
                  x: 5.6, y: y + 0.22, w: 0.15, h: 0.15,
                  fill: { color: highlightColor }
                });
                // Text
                slide.addText(point, {
                  x: 5.9, y: y, w: 3.6, h: 0.6,
                  fontSize: 14, bold: true, color: (isTech || isBold) ? 'CBD5E1' : '334155', fontFace: bodyFont, valign: 'middle'
                });
              });
              break;

            case 'steps':
              slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 0.4, w: 0.1, h: 0.6, fill: { color: highlightColor } });
              slide.addText(slideData.title.toUpperCase(), {
                x: 0.7, y: 0.4, w: 9, h: 0.6,
                fontSize: 32, bold: true, color: titleColor, fontFace: titleFont
              });
              
              // Horizontal Line
              slide.addShape(pres.ShapeType.line, { x: 0.5, y: 2.6, w: 9, h: 0, line: { color: 'E2E8F0', width: 2 } });

              slideData.content.forEach((step, i) => {
                const stepWidth = 9 / slideData.content.length;
                const x = 0.5 + i * stepWidth;
                const boxW = stepWidth * 0.85; // 85% of available width slot
                const boxX = x + (stepWidth - boxW) / 2;

                slide.addShape(pres.ShapeType.rect, {
                  x: boxX, y: 1.6, w: boxW, h: 2.4,
                  fill: { color: isBold ? '111111' : (isTech ? '1E293B' : 'FAFAFA') }, line: { color: (isTech || isBold) ? '334155' : 'E2E8F0', width: 1 }
                });
                
                // Number Badge
                slide.addShape(pres.ShapeType.rect, {
                  x: boxX, y: 1.6, w: 0.6, h: 0.6,
                  fill: { color: highlightColor }
                });
                slide.addText((i + 1).toString().padStart(2, '0'), {
                  x: boxX, y: 1.6, w: 0.6, h: 0.6,
                  fontSize: 14, bold: true, color: cardBgColor, align: 'center', valign: 'middle'
                });

                // Step Text
                slide.addText(step, {
                  x: boxX + 0.1, y: 2.4, w: boxW - 0.2, h: 1.4,
                  fontSize: 14, align: 'center', color: titleColor, fontFace: bodyFont, valign: 'top'
                });
              });
              break;

            default:
              slide.addText(slideData.title.toUpperCase(), {
                x: 0.5, y: 0.4, w: 9, h: 0.6,
                fontSize: 32, bold: true, color: titleColor, fontFace: titleFont
              });
              slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.1, w: 1.5, h: 0.08, fill: { color: highlightColor } });
              slideData.content.forEach((point, i) => {
                const y = 1.6 + (i * 0.7);
                slide.addShape(pres.ShapeType.rect, {
                  x: 0.5, y: y, w: 9, h: 0.6,
                  fill: { color: isBold ? '111111' : (isTech ? '1E293B' : 'F5F5F5') }
                });
                slide.addText((i + 1).toString(), {
                  x: 0.6, y: y + 0.1, w: 0.4, h: 0.4,
                  fontSize: 14, bold: true, color: cardBgColor, fill: { color: isBold ? highlightColor : shapeColor }, align: 'center'
                });
                slide.addText(point, {
                  x: 1.1, y: y, w: 8.3, h: 0.6,
                  fontSize: 16, color: titleColor, fontFace: bodyFont, valign: 'middle', bold: true
                });
              });
              break;
          }

          // Add Speaker Notes
          if (slideData.speakerNotes) {
            slide.addNotes(slideData.speakerNotes);
          }
        });

        pres.writeFile({ fileName: `${presentation.title.replace(/\s+/g, '_')}.pptx` });
        addActivity('presentation', 'Presentation Exported', `Exported "${presentation.title}" as PPTX`);
        addToast("Presentation exported successfully", "success");
        return;
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(presentation, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", `${presentation.title.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addToast("Presentation exported successfully", "success");
      return;
    }
    
    // Export chat history
    const messages = activeConv?.messages || [];
    
    // Instead of HTML, let's export it as a clean PDF
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #fff;">
        <h1 style="text-align: center; color: #111; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; font-weight: 900;">Chat History</h1>
        ${messages.map(m => `
          <div style="margin-bottom: 20px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); ${m.role === 'user' ? 'background: #111; color: #fff; margin-left: 30px;' : 'background: #f9fafb; border: 1px solid #e5e7eb; margin-right: 30px;'}">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; opacity: 0.7;">${m.role === 'user' ? 'You' : 'Assistant'}</div>
            <div style="white-space: pre-wrap; font-size: 14px;">${stripMarkdown(m.content)}</div>
          </div>
        `).join('')}
      </div>
    `;
    
    setIsExporting(true);
    addToast("Generating PDF...", "success");
    
    import('html2pdf.js').then((html2pdfModule) => {
      const html2pdf = html2pdfModule.default;
      const opt = {
        margin:       10,
        filename:     `chat_history_${Date.now()}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      
      html2pdf().set(opt).from(htmlContent).save().then(() => {
        setIsExporting(false);
        addToast("Chat exported successfully", "success");
      });
    }).catch(err => {
      console.error(err);
      setIsExporting(false);
      addToast("Failed to export PDF", "error");
    });
  };

  const renderChatInterface = (title: string, description: string, placeholder: string, emptyStateIcon: React.ReactNode, emptyStateSuggestions: {title: string, desc: string, prompt: string, icon?: any, color?: string}[]) => {
    return (
      <ChatInterface
        title={title}
        description={description}
        placeholder={placeholder}
        emptyStateIcon={emptyStateIcon}
        emptyStateSuggestions={emptyStateSuggestions}
        currentView={currentView}
        currentViewState={currentViewState}
        viewStates={viewStates}
        initialViewState={initialViewState}
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        t={t}
        createNewConversation={createNewConversation}
        updateViewState={updateViewState}
        deleteConversation={deleteConversation}
        editingChatTitleId={editingChatTitleId}
        setEditingChatTitleId={setEditingChatTitleId}
        editedChatTitle={editedChatTitle}
        setEditedChatTitle={setEditedChatTitle}
        handleSaveChatTitle={handleSaveChatTitle}
        handleClearChat={handleClearChat}
        handleExport={handleExport}
        scrollRef={scrollRef}
        handleFileUpload={handleFileUpload}
        editingMessageId={editingMessageId}
        setEditingMessageId={setEditingMessageId}
        editingMessageContent={editingMessageContent}
        setEditingMessageContent={setEditingMessageContent}
        handleEditMessageSubmit={handleEditMessageSubmit}
        userProfile={userProfile}
        fileInputRef={fileInputRef}
        handleSend={handleSend}
        handleStopGeneration={handleStopGeneration}
        setViewStates={setViewStates}
        saveConversation={saveConversation}
        addToast={addToast}
      />
    );  };

  if (authLoading) {
    return (
      <div className={`flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
        {/* Sidebar Skeleton */}
        <div className="bg-card border-r flex-col hidden lg:flex lg:w-64 inset-y-0 left-0 animate-pulse">
          <div className="h-16 flex items-center px-4 border-b border-border/50">
             <div className="h-8 w-8 bg-muted rounded-full"></div>
             <div className="ml-3 h-5 w-24 bg-muted rounded"></div>
          </div>
          <div className="flex-1 px-4 py-6 space-y-8">
             <div>
               <div className="h-3 w-16 bg-muted rounded mb-4"></div>
               <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex flex-row items-center h-8">
                      <div className="w-5 h-5 bg-muted rounded mr-3"></div>
                      <div className="h-4 bg-muted rounded flex-1"></div>
                    </div>
                  ))}
               </div>
             </div>
             <div>
               <div className="h-3 w-16 bg-muted rounded mt-6 mb-4"></div>
               <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-row items-center h-8">
                      <div className="w-5 h-5 bg-muted rounded mr-3"></div>
                      <div className="h-4 bg-muted rounded flex-1"></div>
                    </div>
                  ))}
               </div>
             </div>
          </div>
          <div className="p-4 border-t border-border/50 hidden lg:block">
             <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-muted"></div>
                <div className="ml-3 flex-1">
                   <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                   <div className="h-3 bg-muted rounded w-32"></div>
                </div>
             </div>
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
          {/* Header Skeleton */}
          <div className="h-16 border-b border-border/50 bg-card/30 flex items-center justify-between px-4 lg:px-6 animate-pulse">
             <div className="flex items-center">
                 <div className="lg:hidden w-8 h-8 bg-muted rounded mr-4"></div>
                 <div className="h-6 w-32 bg-muted rounded cursor-pointer"></div>
             </div>
             <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 bg-muted rounded-full hidden sm:block"></div>
                 <div className="w-8 h-8 bg-muted rounded-full hidden sm:block"></div>
                 <div className="w-8 h-8 bg-muted rounded-full"></div>
                 <div className="lg:hidden w-8 h-8 rounded-full bg-muted"></div>
             </div>
          </div>
          
          {/* Main Area Skeleton */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 animate-pulse overflow-hidden flex flex-col gap-6">
             {/* Greeting */}
             <div className="flex flex-col gap-2 mb-2 w-full lg:w-1/2">
                <div className="h-8 lg:h-10 w-48 lg:w-64 bg-muted rounded"></div>
                <div className="h-4 w-64 lg:w-96 bg-muted rounded"></div>
             </div>
             
             {/* Stats or Cards row */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-muted/40 rounded-xl border border-border/50"></div>
                 ))}
             </div>
             
             {/* Big Content Area */}
             <div className="flex-1 bg-muted/40 rounded-xl border border-border/50 mt-2 min-h-[300px]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || (!user.emailVerified && user.providerData.some(p => p.providerId === 'password'))) {
    return <LoginView />;
  }

  return (
    <TooltipProvider>
      <div className={`flex h-screen bg-background text-foreground overflow-hidden font-sans ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          isSidebarCollapsed={isSidebarCollapsed}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          setCurrentView={setCurrentView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          t={t}
          tasks={tasks}
          calendarEvents={calendarEvents}
          transcriptionResults={transcriptionResults}
          viewStates={viewStates}
          recentActivity={recentActivity}
          setSearchTarget={setSearchTarget}
          expandedItems={expandedItems}
          toggleExpand={toggleExpand}
          stableSetCurrentView={stableSetCurrentView}
          stableSetIsMobileMenuOpen={stableSetIsMobileMenuOpen}
          isThemePopoverOpen={isThemePopoverOpen}
          setIsThemePopoverOpen={setIsThemePopoverOpen}
          theme={theme}
          setTheme={setTheme}
          updateViewState={updateViewState}
          userProfile={userProfile}
          user={user}
          firebaseLogout={firebaseLogout}
        />

        {/* Focus Timer Widget */}
        {FocusTimerWidget}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden relative bg-background transition-all duration-300">
          {/* Subtle Ambient Mesh Gradient for Premium Glassmorphism Feel */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20 flex mix-blend-multiply dark:mix-blend-screen" style={{ filter: 'blur(100px)' }}>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/30 rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full" />
            <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-orange-500/20 rounded-full" />
          </div>

          {/* Static Header */}
          <header className="h-16 border-b border-red-700 bg-red-600 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 shadow-xl relative overflow-hidden">
            {/* Glossy overlay for the red header */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/20 z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
            
            <div className="flex items-center gap-3 md:gap-4 relative z-20">
              <div className="flex items-center gap-3">
                {/* Mobile Menu Button - Moved inside the Flex flow for better alignment */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl lg:hidden bg-white/10 hover:bg-white/20 text-white border border-white/10 shrink-0"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                
                {/* Visual Separator if needed when mobile button is present */}
                <div className="lg:hidden h-4 w-px bg-white/30 ml-1" />
              </div>

              <h1 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90 truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">
                {currentView === 'home' ? 'Dashboard' : 
                 currentView === 'plan' ? 'Strategy & Analysis Hub' :
                 currentView === 'campaign' ? 'Campaign Creator' :
                 currentView === 'presentation' ? 'Presentation Builder' :
                 currentView === 'tasks' ? 'Task Management' :
                 currentView === 'calendar' ? 'Marketing Calendar' :
                 currentView === 'transcribe' ? 'Audio Transcription' :
                 currentView === 'visualize' ? 'Data Visualization' :
                 currentView === 'storyboard' ? 'Storyboard Studio' :
                 currentView === 'tts' ? 'Text to Speech Engine' :
                 currentView === 'settings' ? 'System Settings' :
                 currentView === 'image-gen' ? 'Image Generation' :
                 currentView === 'translation' ? 'Translation Engine' :
                 currentView === 'capabilities' ? 'Platform Guide' :
                 currentView === 'world-clock' ? 'World Clock Real Time Conversion' :
                 currentView === 'focus' ? t.focus : 'Review'}
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center bg-black/20 backdrop-blur-md rounded-2xl p-1 gap-1 border border-white/5 mr-2 sm:mr-4 ring-1 ring-white/10 shadow-lg">
                <Tooltip>
                  <TooltipTrigger render={(props) => (
                    <Button 
                      {...props}
                      variant="ghost" 
                      size="sm" 
                      className={`h-9 px-2 sm:px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all group ${currentView === 'focus' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                      onClick={() => {
                        setCurrentView('focus');
                        updateViewState('focus', { activeTab: 'timer' });
                      }}
                    >
                      <Timer className={`w-4 h-4 transition-transform ${currentView === 'focus' ? 'scale-110' : 'group-hover:rotate-12'}`} />
                      <span className="hidden sm:inline ml-2">Focus Timer</span>
                    </Button>
                  )} />
                  <TooltipContent side="bottom" className="bg-white/90 text-black border-none font-bold">Open Full Focus Interface</TooltipContent>
                </Tooltip>

                <div className="w-px h-4 bg-white/20" />
                
                <Tooltip>
                  <TooltipTrigger render={(props) => (
                    <Button 
                      {...props}
                      variant="ghost" 
                      size="icon" 
                      className={`h-9 w-9 rounded-xl transition-all ${showFocusWidget ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-red-600' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                      onClick={() => setShowFocusWidget(!showFocusWidget)}
                    >
                      <MonitorDot className="w-4 h-4" />
                    </Button>
                  )} />
                  <TooltipContent side="bottom" className="bg-white/90 text-black border-none font-bold">Mini Overlay Timer</TooltipContent>
                </Tooltip>
              </div>
              <NotificationBell 
                notifications={notifications} 
                setNotifications={setNotifications} 
                setCurrentView={setCurrentView} 
              />
            </div>
          </header>

          {/* Abstract background pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>

        {currentView === 'home' && (
          <HomeView
            t={t}
            handleSend={handleSend}
            isDictating={isDictating}
            isTranscribing={isTranscribing}
            toggleDictation={toggleDictation}
            isGlobalAssistantLoading={isGlobalAssistantLoading}
            setCurrentView={setCurrentView}
            recentActivity={recentActivity}
            setRecentActivity={setRecentActivity}
            updateViewState={updateViewState}
          />
        )}

          <div style={{ display: currentView === 'transcribe' ? 'flex' : 'none', flex: 1, minHeight: 0, width: '100%' }}>
            <TranscribeView results={transcriptionResults} setResults={setTranscriptionResults} addActivity={addActivity} />
          </div>
          <div style={{ display: currentView === 'visualize' ? 'flex' : 'none', flex: 1, minHeight: 0, width: '100%' }}>
            <DataVisualizationView t={t} brandIdentity={currentBrandIdentity} addActivity={addActivity} />
          </div>
          <div style={{ display: currentView === 'storyboard' ? 'flex' : 'none', flex: 1, minHeight: 0, width: '100%' }}>
            <StoryboardView t={t} brandIdentity={currentBrandIdentity} addActivity={addActivity} />
          </div>
          <div style={{ display: currentView === 'tts' ? 'flex' : 'none', flex: 1, minHeight: 0, width: '100%' }}>
            <TTSView />
          </div>

          {currentView === 'tasks' && (
            <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1600px] mx-auto border-x">
              <TasksView 
                t={t} 
                tasks={tasks} 
                setTasks={setTasks} 
                initialTaskId={searchTarget?.type === 'tasks' ? searchTarget.id : undefined} 
                pendingTaskData={pendingGlobalAction?.type === 'create_task' ? pendingGlobalAction.payload : undefined}
              />
            </div>
          )}
          {currentView === 'calendar' && (
            <CalendarView 
              tasks={tasks} 
              setTasks={setTasks} 
              events={calendarEvents} 
              setEvents={setCalendarEvents} 
              initialEventId={searchTarget?.type === 'events' ? searchTarget.id : undefined}
              pendingEventData={pendingGlobalAction?.type === 'schedule_event' ? pendingGlobalAction.payload : undefined}
              isGoogleConnected={isGoogleConnected}
              onGoogleConnect={connectGoogleCalendar}
              onGoogleSync={syncToGoogleCalendar}
            />
          )}
          {currentView === 'world-clock' && (
            <div className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-card/50 backdrop-blur-xl z-10 relative overflow-hidden">
              <WorldClockView />
            </div>
          )}
          {currentView === 'focus' && (
            <FocusView
              viewStates={viewStates}
              updateViewState={updateViewState}
              resolvedTheme={resolvedTheme}
              t={t}
              showFocusWidget={showFocusWidget}
              setShowFocusWidget={setShowFocusWidget}
              isFocusActive={isFocusActive}
              setIsFocusActive={setIsFocusActive}
              focusTimeRemaining={focusTimeRemaining}
              setFocusTimeRemaining={setFocusTimeRemaining}
              focusDuration={focusDuration}
              setFocusDuration={setFocusDuration}
              focusHistory={focusHistory}
              setFocusHistory={setFocusHistory}
              focusTask={focusTask}
              setFocusTask={setFocusTask}
              focusVolume={focusVolume}
              setFocusVolume={setFocusVolume}
              focusMusicId={focusMusicId}
              setFocusMusicId={setFocusMusicId}
              addFocusTime={addFocusTime}
            />
          )}
          {currentView === 'capabilities' && (
            <div className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-card/50 backdrop-blur-xl z-10 relative overflow-hidden">
              <ScrollArea className="flex-1 h-full">
                <CapabilitiesGuide setActiveView={setCurrentView} />
              </ScrollArea>
            </div>
          )}
        {currentView === 'chat' && renderChatInterface(
          "Assistant Chat",
          "Chat with your AI assistant about anything",
          "What's on your mind? Start chatting...",
          <div className="vibrant-icon-container w-20 h-20 vibrant-icon-blue">
            <Bot className="w-10 h-10 text-foreground" />
          </div>,
          [
            { title: "Brainstorm Ideas", desc: "Get creative suggestions", prompt: "Help me brainstorm some new ideas for...", icon: Sparkles, color: 'vibrant-icon-purple' },
            { title: "Explain a Concept", desc: "Learn something new", prompt: "Can you explain how [topic] works in simple terms?", icon: Lightbulb, color: 'vibrant-icon-amber' },
            { title: "Draft an Email", desc: "Write professional correspondence", prompt: "Draft a professional email to my team about...", icon: MessageSquare, color: 'vibrant-icon-green' },
            { title: "Solve a Problem", desc: "Get logical step-by-step help", prompt: "I'm trying to solve a problem with...", icon: Activity, color: 'vibrant-icon-red' }
          ]
        )}
        {currentView === 'plan' && renderChatInterface(
          t.planTitle,
          t.planDesc,
          t.planPlaceholder,
          <div className="vibrant-icon-container w-20 h-20 vibrant-icon-red">
            <Lightbulb className="w-10 h-10 text-foreground" />
          </div>,
          [
            { title: "Generate Marketing Plan", desc: "Create structured strategies and campaigns", prompt: "Generate a comprehensive marketing plan based on the uploaded data...", icon: FileText, color: 'vibrant-icon-blue' },
            { title: "Analyze Document", desc: "Extract insights from reports and data", prompt: "Analyze the uploaded document for key metrics and insights...", icon: BarChart2, color: 'vibrant-icon-orange' },
            { title: "Review Activities", desc: "Evaluate recent marketing performance", prompt: "Review my recent marketing activities and suggest improvements...", icon: History, color: 'vibrant-icon-green' },
            { title: "Market Launch", desc: "Go-to-market strategy", prompt: "Develop a go-to-market strategy for...", icon: Globe, color: 'vibrant-icon-amber' }
          ]
        )}
        {currentView === 'campaign' && (
          <div className="flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto border-x bg-white/40 dark:bg-card/50 backdrop-blur-xl z-10 relative shadow-2xl">
            <ConversationSidebar view="campaign"
          viewStates={viewStates}
          initialViewState={initialViewState}
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          t={t}
          createNewConversation={createNewConversation}
          updateViewState={updateViewState}
          deleteConversation={deleteConversation}
/>
            <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
              <CampaignView 
                campaignState={viewStates.campaign}
                updateViewState={updateViewState}
                isHistoryOpen={isHistoryOpen}
                setIsHistoryOpen={setIsHistoryOpen}
                t={t}
                generateCampaignContent={generateCampaignContent}
                addEmojisToCampaign={addEmojisToCampaign}
                addToast={addToast}
                analyzeCampaignContent={analyzeCampaignContent}
                rewriteCampaignContent={rewriteCampaignContent}
                translateCampaignContent={translateCampaignContent}
              />
            </div>
          </div>
        )}
        {currentView === 'presentation' && (
          <div className="flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto border-x bg-white/40 dark:bg-card/50 backdrop-blur-xl z-10 relative shadow-2xl">
            <ConversationSidebar view="presentation"
          viewStates={viewStates}
          initialViewState={initialViewState}
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          t={t}
          createNewConversation={createNewConversation}
          updateViewState={updateViewState}
          deleteConversation={deleteConversation}
/>
            <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
              <div className="flex-1 flex flex-col overflow-hidden bg-transparent w-full mx-auto shadow-sm">
            <header className="px-4 lg:px-8 py-4 border-b bg-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 gap-2">
              <div className="flex items-center gap-4 min-w-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg hidden lg:flex shrink-0" 
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  title={isHistoryOpen ? t.hideHistory : t.showHistory}
                >
                  {isHistoryOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                </Button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <MonitorPlay className="w-5 h-5 md:w-6 md:h-6 text-foreground shrink-0 hidden md:block" />
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight truncate font-heading text-foreground">
                      {presentation ? presentation.title : t.presentationTitle}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 mt-1">
                    <p className="text-[10px] md:text-[11px] text-muted-foreground italic serif opacity-80 truncate">
                      {presentation ? t.slideOf.replace('{current}', (currentSlideIndex + 1).toString()).replace('{total}', presentation.slides.length.toString()) : t.presentationDesc}
                    </p>
                    {presentation?.styleName && (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] md:text-[10px] font-bold uppercase tracking-wider h-4 md:h-5 px-1.5 shrink-0">
                        <Palette className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" /> {presentation.styleName}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 md:gap-3 shrink-0 items-center">
                <Button variant="outline" size="sm" className="h-9 px-3 md:px-4 text-xs font-bold rounded-full border-foreground/15 hover:bg-muted/50 transition-colors" onClick={() => createNewConversation('presentation')}>
                  <Plus className="w-4 h-4 mr-2" /> <span className="hidden md:inline uppercase tracking-wide">New Presentation</span>
                </Button>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    className={`h-9 px-4 md:px-6 text-xs font-black uppercase tracking-widest rounded-full transition-all duration-500 cursor-pointer ${presentation ? 'bg-[#FF2B2B] hover:bg-red-600 text-white shadow-[0_0_20px_rgba(255,43,43,0.6)] hover:shadow-[0_0_30px_rgba(255,43,43,0.8)] ring-2 ring-offset-1 ring-background ring-offset-[#FF2B2B] animate-in zoom-in-95' : 'bg-muted hover:bg-muted text-muted-foreground opacity-50'}`} 
                    onClick={() => handleExport('pptx')} 
                    disabled={!presentation}
                  >
                    <Download className={`w-4 h-4 mr-2 ${presentation ? 'animate-bounce' : ''}`} style={{ animationDuration: '2s' }} /> <span className="hidden md:inline">Export To PPTX</span>
                  </Button>
                </div>
              </div>
            </header>
            
            <div ref={containerRef} className="flex-1 flex flex-col items-center p-4 lg:p-6 overflow-y-auto pb-20 lg:pb-32">
              {(() => {
                const activeConv = viewStates.presentation.conversations.find(c => c.id === viewStates.presentation.activeConversationId);
                const isConvLoading = activeConv?.isLoading;
                
                let activeStep = 0;
                if (presentation) {
                  activeStep = 2; // Generated Presentation
                } else if (activeConv?.presentationPlan) {
                  activeStep = 1; // Outline Review
                } else {
                  activeStep = 0; // Context Input
                }
                
                return (
                  <>
                    {/* Stepper */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-10 w-full animate-in fade-in duration-500">
                      <div className={`px-4 py-1.5 md:px-6 md:py-2 border rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${activeStep >= 0 ? (activeStep === 0 ? 'bg-primary/10 text-foreground border-primary/30' : 'bg-muted text-muted-foreground border-border') : 'border-transparent text-muted-foreground'}`}>
                        {activeStep === 0 ? '[ACTIVE: INPUT CONTEXT]' : 'INPUT CONTEXT'}
                      </div>
                      <div className={`px-4 py-1.5 md:px-6 md:py-2 border rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${activeStep >= 1 ? (activeStep === 1 ? 'bg-primary/10 text-foreground border-primary/30' : 'bg-muted text-muted-foreground border-border') : 'border-transparent text-muted-foreground'}`}>
                        {activeStep === 1 ? '[ACTIVE: OUTLINE REVIEW]' : 'OUTLINE REVIEW'}
                      </div>
                      <div className={`px-4 py-1.5 md:px-6 md:py-2 border rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${activeStep === 2 ? 'bg-primary/10 text-foreground border-primary/30' : 'border-transparent text-muted-foreground'}`}>
                        {activeStep === 2 ? '[ACTIVE: GENERATED PRESENTATION]' : 'GENERATED PRESENTATION'}
                      </div>
                    </div>
                
                    {isConvLoading && (
                      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                        <Loader2 className="w-10 h-10 lg:w-16 lg:h-16 animate-spin text-foreground" />
                        <p className="text-base lg:text-lg font-medium">{activeConv?.progressMessage || t.generatingPresentation || "Generating your presentation..."}</p>
                      </div>
                    )}
                    
                    {!isConvLoading && presentation && (
                      <div className="flex flex-col items-center gap-8 w-full">
                        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1600px] justify-center items-start">
                          <div 

                            className="bg-black/20 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0"
                            style={{ 
                              width: `${1280 * previewScale}px`, 
                              height: `${720 * previewScale}px`, 
                              position: 'relative'
                            }}
                          >
                            <div
                              style={{
                                width: '1280px',
                                height: '720px',
                                transform: `scale(${previewScale})`,
                                transformOrigin: 'top left',
                                position: 'absolute',
                                top: 0,
                                left: 0
                              }}
                            >
                              <SlidePreview 
                                previewRef={slidePreviewRef}
                                slide={presentation.slides[currentSlideIndex]} 
                                presentationTitle={presentation.title}
                                index={currentSlideIndex}
                                total={presentation.slides.length}
                                t={t}
                                styleName={presentation.styleName}
                              />
                            </div>
                          </div>

                          {showSpeakerNotes && (
                            <div 
                              className="w-full lg:w-96 shrink-0 bg-card border shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom lg:slide-in-from-right-8 duration-300 rounded-2xl"
                              style={{ 
                                height: window.innerWidth >= 1024 
                                  ? `${Math.max(500, 720 * previewScale)}px` 
                                  : '450px',
                                minHeight: '400px'
                              }}
                            >
                              <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
                                <h3 className="font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2 opacity-80">
                                  <FileText className="w-4 h-4 text-primary" strokeWidth={3} />
                                  {t.speakerNotes}
                                </h3>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-500/10 hover:text-red-600 transition-colors" onClick={() => setShowSpeakerNotes(false)}>
                                  <XCircle className="w-5 h-5" />
                                </Button>
                              </div>
                              <ScrollArea className="flex-1">
                                <div className="p-8 pb-20">
                                  <div className="prose prose-sm dark:prose-invert max-w-none serif text-foreground/90 leading-relaxed font-serif text-lg">
                                    {currentSlideIndex === 0 && activeConv?.gambitOutput?.opening && (
                                      <div className="mb-10 p-6 bg-primary/5 border-l-4 border-primary rounded-r-2xl not-italic font-sans">
                                        <h4 className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><Mic className="w-4 h-4" /> Opening Gambit</h4>
                                        <p className="text-base font-bold italic leading-relaxed text-foreground">"{activeConv.gambitOutput.opening}"</p>
                                      </div>
                                    )}
                                    {currentSlideIndex === presentation.slides.length - 1 && activeConv?.gambitOutput?.closing && (
                                      <div className="mb-10 p-6 bg-primary/10 border-l-4 border-primary rounded-r-2xl not-italic font-sans">
                                        <h4 className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><Mic className="w-4 h-4" /> Closing Gambit</h4>
                                        <p className="text-base font-bold italic leading-relaxed text-foreground">"{activeConv.gambitOutput.closing}"</p>
                                      </div>
                                    )}
                                    {presentation.slides[currentSlideIndex].speakerNotes ? (
                                      <div className="space-y-6">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {presentation.slides[currentSlideIndex].speakerNotes}
                                        </ReactMarkdown>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center pt-20 opacity-20 text-center">
                                        <FileText className="w-12 h-12 mb-4" />
                                        <p className="text-sm font-bold uppercase tracking-widest">No Notes</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      
                      <div className="flex items-center gap-6 bg-card/50 backdrop-blur-md p-4 rounded-2xl border shadow-lg">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-10 px-4 text-xs uppercase tracking-widest font-bold text-muted-foreground hover:text-primary"
                          onClick={async () => {
                            if (slidePreviewRef.current) {
                              try {
                                const element = slidePreviewRef.current;
                                window.focus();
                                const blobPromise = toBlob(element, {
                                  width: 1280,
                                  height: 720,
                                  style: {
                                    transform: 'scale(1)',
                                    transformOrigin: 'top left'
                                  }
                                }).then(blob => {
                                  if (!blob) throw new Error("Failed to generate image");
                                  return blob;
                                });

                                // @ts-ignore - Safari/Chrome support Promise in ClipboardItem
                                const item = new ClipboardItem({ "image/png": blobPromise });
                                await navigator.clipboard.write([item]);
                                addToast(t.slideCopied || 'Slide design copied to clipboard!', 'success');
                              } catch (err) {
                                console.error('Failed to copy slide, falling back to download:', err);
                                try {
                                  const blob = await toBlob(slidePreviewRef.current, {
                                    width: 1280,
                                    height: 720,
                                    style: { transform: 'scale(1)', transformOrigin: 'top left' }
                                  });
                                  if (blob) {
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.download = `slide-${new Date().getTime()}.png`;
                                    link.href = url;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                    addToast('Could not copy to clipboard. Slide downloaded instead.', 'success');
                                  }
                                } catch (downloadErr) {
                                  addToast(t.failedCopySlide || 'Failed to copy slide design', 'error');
                                }
                              }
                            }
                          }}
                        >
                          <Copy className="w-5 h-5 mr-2" /> {t.copySlide || "Copy Slide"}
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-10 px-4 text-xs uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground"
                          onClick={() => setIsFullscreen(true)}
                        >
                          <Maximize2 className="w-5 h-5 mr-2" /> {t.fullScreen || "Full Screen"}
                        </Button>
    
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-10 px-4 text-xs uppercase tracking-widest font-bold transition-colors ${showSpeakerNotes ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                          onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                        >
                          <FileText className="w-5 h-5 mr-2" /> {showSpeakerNotes ? t.hideNotes : t.showNotes}
                        </Button>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-10 px-4 text-xs font-bold" onClick={() => handleGenerateGambit('opening')} disabled={activeConv?.isGeneratingGambit}>
                            {activeConv?.isGeneratingGambit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mic className="w-4 h-4 mr-2" />} Opening Gambit
                          </Button>
                          <Button size="sm" variant="outline" className="h-10 px-4 text-xs font-bold" onClick={() => handleGenerateGambit('closing')} disabled={activeConv?.isGeneratingGambit}>
                            {activeConv?.isGeneratingGambit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mic className="w-4 h-4 mr-2" />} Closing Gambit
                          </Button>
                        </div>

                        <div className="h-6 w-px bg-border" />
    
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl"
                            disabled={currentSlideIndex === 0}
                            onClick={() => setCurrentSlideIndex(prev => prev - 1)}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </Button>
                          <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-sm font-black text-primary">
                              {currentSlideIndex + 1} / {presentation.slides.length}
                            </span>
                            <div className="w-full h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300" 
                                style={{ width: `${((currentSlideIndex + 1) / presentation.slides.length) * 100}%` }}
                              />
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl"
                            disabled={currentSlideIndex === presentation.slides.length - 1}
                            onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!isConvLoading && !presentation && activeConv?.presentationPlan && (
                    <div className="w-full max-w-4xl mx-auto flex flex-col items-center animate-in fade-in duration-500 gap-6">
                      <div className="text-center">
                        <h3 className="text-xl lg:text-2xl font-bold mb-2 text-foreground">Review Presentation Plan</h3>
                        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                          Review the proposed slide outline. You can approve it to generate the final slides, or suggest changes below.
                        </p>
                      </div>
                      
                      <div className="w-full bg-card/80 backdrop-blur-md rounded-2xl border shadow-lg overflow-hidden flex flex-col" style={{ height: '50vh' }}>
                        <ScrollArea className="flex-1 p-6">
                          <div className="prose prose-sm dark:prose-invert max-w-none text-left">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {activeConv.presentationPlan}
                            </ReactMarkdown>
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="w-full bg-card/50 p-4 rounded-2xl border shadow-sm flex flex-col gap-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Suggest Edits (Optional)</label>
                        <Textarea 
                          placeholder="e.g. Add a slide about competitor pricing, make it 12 slides instead of 8..."
                          className="min-h-[80px] rounded-xl text-sm"
                          value={currentViewState.input}
                          onChange={(e) => updateViewState('presentation', { input: e.target.value })}
                        />
                        <div className="flex items-center justify-end gap-3">
                          <Button 
                            variant="secondary" 
                            className="rounded-xl px-5"
                            disabled={!currentViewState.input.trim() || isConvLoading}
                            onClick={() => handleUpdatePresentationPlan(currentViewState.input)}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" /> Update Plan
                          </Button>
                          <Button 
                            className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                            onClick={() => setShowPresentationApproval(true)}
                            disabled={isConvLoading}
                          >
                            <Sparkles className="w-4 h-4 mr-2" /> Approve & Generate Slides
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!isConvLoading && !presentation && !activeConv?.presentationPlan && (
                  <div className="w-full flex-1 flex flex-col items-center pt-8 pb-10 animate-in fade-in duration-500 overflow-y-auto">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-foreground tracking-tight text-center">Welcome to AI Presentation Prep</h1>
                    <p className="text-base md:text-lg text-muted-foreground mb-8 text-center max-w-lg">Upload a marketing plan, an analysis report, or provide context.</p>

                    <div className="w-full max-w-3xl space-y-8 px-4">
                      {/* Topic Input */}
                      <div className="flex flex-col gap-2 relative">
                        <label className="text-xs font-bold uppercase tracking-widest">Presentation Topic / Context</label>
                        <div className="relative group">
                          <Textarea 
                            value={currentViewState.input} 
                            onChange={(e) => updateViewState(currentView, { input: e.target.value })}
                            className="relative w-full min-h-[140px] md:h-40 text-base md:text-lg rounded-2xl border-input focus-visible:ring-1 focus-visible:ring-primary p-5 md:p-6 resize-none placeholder:text-muted-foreground/60 transition-all font-medium" 
                            placeholder="Define your topic, key metrics, or paste raw content...&#10;the AI is listening and preparing to structure." 
                          />
                          <div className="absolute top-4 right-4 z-10">
                            <PromptEnhancer 
                              value={currentViewState.input} 
                              onEnhance={(val) => updateViewState('presentation', { input: val })}
                              context="presentation"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1 text-left">Tip: You can paste long reports or multiple paragraphs here. Press Enter for new lines.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        {/* Number of Slides */}
                        <div className="flex flex-col items-start gap-2">
                          <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Number of Slides</label>
                          <Input 
                            type="number" 
                            min={1}
                            placeholder="0"
                            value={currentViewState.numSlides || ''}
                            onChange={(e) => updateViewState(currentView, { numSlides: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="w-full h-12 rounded-xl text-lg font-medium"
                          />
                          <p className="text-[10px] md:text-xs text-muted-foreground italic opacity-80 text-left">
                            Specify a number or leave blank for a comprehensive presentation (usually 10-15 slides).
                          </p>
                        </div>

                        {/* Design Aesthetic */}
                        <div className="flex flex-col items-start gap-2">
                          <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Design Aesthetic</label>
                          <div className="grid grid-cols-3 gap-2 w-full">
                            {/* Option 1: Light */}
                            <div 
                              onClick={() => updateViewState(currentView, { stylePreset: 'Light' })}
                              className={`flex flex-col gap-1 cursor-pointer group`}
                            >
                              <div className={`w-full aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all ${currentViewState.stylePreset === 'Light' ? 'border-[#FF2B2B] shadow-[0_0_15px_rgba(255,43,43,0.3)] scale-105' : 'border-border opacity-70 group-hover:opacity-100 group-hover:border-foreground/50'}`}>
                                <div className="w-full h-full bg-white flex relative overflow-hidden">
                                  <div className="w-1/2 h-full p-2 flex flex-col justify-center">
                                    <div className="w-4 h-[1px] bg-[#FF2B2B] mb-1"></div>
                                    <div className="w-full h-1 bg-black mb-0.5"></div>
                                    <div className="w-2/3 h-1 bg-black"></div>
                                  </div>
                                  <div className="w-1/2 h-full bg-black" style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)' }}>
                                    <div className="w-full h-full bg-[#FF2B2B]/20 ml-2" style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)' }}></div>
                                  </div>
                                </div>
                              </div>
                              <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-center mt-1 ${currentViewState.stylePreset === 'Light' ? 'text-foreground' : 'text-muted-foreground'}`}>Light</span>
                            </div>

                            {/* Option 2: Dark */}
                            <div 
                              onClick={() => updateViewState(currentView, { stylePreset: 'Dark' })}
                              className={`flex flex-col gap-1 cursor-pointer group`}
                            >
                              <div className={`w-full aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all ${currentViewState.stylePreset === 'Dark' ? 'border-[#FF2B2B] shadow-[0_0_15px_rgba(255,43,43,0.3)] scale-105' : 'border-border opacity-70 group-hover:opacity-100 group-hover:border-foreground/50'}`}>
                                <div className="w-full h-full bg-[#000000] flex flex-col items-center justify-center p-2 relative overflow-hidden">
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-[0.5px] border-[#FF2B2B]/20 rounded-full"></div>
                                  <div className="w-1/2 h-1 bg-white mb-1 z-10"></div>
                                  <div className="w-1/3 h-1 bg-white/60 z-10"></div>
                                  <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-[#FF2B2B]"></div>
                                </div>
                              </div>
                              <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-center mt-1 ${currentViewState.stylePreset === 'Dark' ? 'text-foreground' : 'text-muted-foreground'}`}>Dark</span>
                            </div>

                            {/* Option 3: Gem */}
                            <div 
                              onClick={() => updateViewState(currentView, { stylePreset: 'Gem' })}
                              className={`flex flex-col gap-1 cursor-pointer group`}
                            >
                              <div className={`w-full aspect-[16/10] rounded-xl overflow-hidden border-[0.5px] transition-all ${currentViewState.stylePreset === 'Gem' ? 'border-[#FF2B2B] shadow-[0_0_15px_rgba(255,43,43,0.3)] scale-105' : 'border-border/50 opacity-70 group-hover:opacity-100 group-hover:border-foreground/50'}`}>
                                <div className="w-full h-full bg-[#f4f1eb] flex relative overflow-hidden p-1.5">
                                  {/* Asymmetric lookbook vibe UI representation */}
                                  <div className="absolute right-2 top-2 text-[4px] font-mono tracking-tighter text-[#333]">01</div>
                                  <div className="flex flex-col justify-end w-2/3 h-full pb-1">
                                    <div className="w-3/4 h-2 bg-[#2d302c] mb-0.5"></div>
                                    <div className="w-1/2 h-2 bg-[#2d302c] mb-2"></div>
                                    <div className="w-full h-0.5 bg-[#4d524a] mb-0.5"></div>
                                    <div className="w-5/6 h-0.5 bg-[#4d524a]"></div>
                                  </div>
                                  <div className="absolute top-1/4 right-3 w-4 h-6 bg-[#FF2B2B]/80"></div>
                                </div>
                              </div>
                              <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-center mt-1 ${currentViewState.stylePreset === 'Gem' ? 'text-foreground' : 'text-muted-foreground'}`}>Gem</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
    
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mt-10">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileUpload(e, 'source')}
                        className="hidden"
                        accept=".txt,.md,.csv,.json,.docx,.xlsx,.xls,.pptx,.pdf"
                      />
                      <Button variant="outline" className="h-12 px-8 rounded-full text-sm font-semibold tracking-wide border-foreground/15 hover:bg-muted/50" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-5 h-5 mr-3" /> {currentViewState.uploadedFile ? t.changeDocument : t.uploadSourceDocument}
                      </Button>
                      <Button className="h-12 px-10 rounded-full text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] border border-red-400 hover:scale-105 transition-all duration-300" onClick={handleGeneratePresentationPlan}>
                        <Sparkles className="w-5 h-5 mr-3" /> {(currentViewState.input || currentViewState.uploadedFile) ? t.generate : t.autoGenerate}
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-col items-center gap-4">
                      {currentViewState.uploadedFile && (
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
                            <FileText className="w-5 h-5" /> {t.using}: {currentViewState.uploadedFile.name}
                          </p>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-destructive" onClick={() => updateViewState(currentView, { uploadedFile: null })}>
                            <Trash2 className="w-4 h-4 mr-2" /> {t.removeFile}
                          </Button>
                        </div>
                      )}
                    </div>
                    {viewStates.presentation.conversations.filter(c => c.presentation).length > 0 && (
                      <div className="mt-12 w-full max-w-xl mx-auto">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
                          <History className="w-3.5 h-3.5" />
                          {(t as any).recentPresentations || (t as any).presentations || "Recent Presentations"}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          {viewStates.presentation.conversations.filter(c => c.presentation).slice(0, 4).map(conv => (
                            <div
                              key={conv.id}
                              className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card/40 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group text-left min-w-0"
                              onClick={() => updateViewState('presentation', { activeConversationId: conv.id })}
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <MonitorPlay className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{conv.title}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground italic opacity-70 flex-shrink-0">
                                    {new Date(conv.timestamp).toLocaleDateString()}
                                  </span>
                                  {conv.presentation && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-widest font-bold flex-shrink-0">
                                      {conv.presentation.slides?.length || 0} Slides
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                          ))}
                        </div>
                        {viewStates.presentation.conversations.filter(c => c.presentation).length > 4 && (
                          <Button variant="ghost" size="sm" className="mt-4 text-[10px] uppercase tracking-widest font-black opacity-60 hover:opacity-100" onClick={() => setIsHistoryOpen(true)}>
                            {(t as any).viewAllHistory || "View All History"}
                          </Button>
                        )}
                      </div>
                     )}
                   </div>
                  )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    )}

          <div style={{ display: currentView === 'image-gen' ? 'flex' : 'none', flex: 1, minHeight: 0, width: '100%' }}>
            <AIStudioView 
              t={t} 
              addActivity={addActivity} 
              viewState={viewStates['ai-studio']}
              updateViewState={(updates) => updateViewState('ai-studio', updates)}
              mode="image"
            />
          </div>
          <div style={{ display: currentView === 'translation' ? 'flex' : 'none', flex: 1, minHeight: 0, width: '100%' }}>
            <AIStudioView 
              t={t} 
              addActivity={addActivity} 
              viewState={viewStates['ai-studio']}
              updateViewState={(updates) => updateViewState('ai-studio', updates)}
              mode="translation"
            />
          </div>
        {currentView === 'settings' && (
          <SettingsView 
            currentViewState={viewStates['settings']}
            t={t}
            profile={profile} setProfile={setProfile} handleAvatarChange={handleAvatarChange}
            fileInputRef={fileInputRef} handleSaveProfile={handleSaveProfile}
            brandIdentity={brandIdentity} setBrandIdentity={setBrandIdentity}
            handleBrandLogoChange={handleBrandLogoChange} brandLogoInputRef={brandLogoInputRef}
            handleSaveBrandIdentity={handleSaveBrandIdentity}
            notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings}
            handleSavePreferences={handleSavePreferences}
            draftLanguage={draftLanguage} setDraftLanguage={setDraftLanguage}
            draftTimezone={draftTimezone} setDraftTimezone={setDraftTimezone}
            handleUpdateRegion={handleUpdateRegion}
            is2FAEnabled={is2FAEnabled} setIs2FAEnabled={setIs2FAEnabled}
            addToast={addToast}
            isPasswordModalOpen={isPasswordModalOpen} setIsPasswordModalOpen={setIsPasswordModalOpen}
            passwordForm={passwordForm} setPasswordForm={setPasswordForm}
          />
        )}
        {currentView === 'login' && <LocalLoginView t={t} setCurrentView={setCurrentView} setAccounts={setAccounts} setActiveAccount={setActiveAccount} addToast={addToast} />}
        {currentView === 'signup' && <LocalSignupView t={t} setCurrentView={setCurrentView} setAccounts={setAccounts} setActiveAccount={setActiveAccount} addToast={addToast} />}
      </main>

      {/* Global Assistant Sidebar */}
      {globalAssistantState === 'sidebar' && (
        <div className="fixed inset-0 z-50 sm:relative sm:z-auto w-full sm:w-[400px] sm:shrink-0 bg-white/90 dark:bg-black/90 sm:bg-card/50 backdrop-blur-2xl border-l border-foreground/10 shadow-2xl sm:shadow-none flex flex-col transform transition-all duration-300 animate-in slide-in-from-right">
          <header className="p-4 border-b border-foreground/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">AI Assistant</h3>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Always here to help</p>
              </div>
            </div>
            <div className="flex gap-1">
              {globalAssistantMessages.length > 0 && (
                <Button variant="ghost" size="sm" className="h-[28px] px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg font-bold uppercase tracking-widest" onClick={clearGlobalAssistant} title="Clear Chat">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> CLEAR
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-[28px] px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg font-bold uppercase tracking-widest" onClick={() => setGlobalAssistantState('minimized')} title="Minimize">
                HIDE
              </Button>
            </div>
          </header>
          
          <ScrollArea className="flex-1 p-4">
            {globalAssistantMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary opacity-80" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">How can I help you today?</p>
                  <p className="text-xs">Ask me anything about the platform, marketing, or your current view.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {globalAssistantMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.isError ? (
                      <div className="w-full flex items-center px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm font-medium mb-1 shadow-sm">
                        <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
                        <span>{m.content}</span>
                      </div>
                    ) : (
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary text-secondary-foreground rounded-bl-sm border border-foreground/5'}`}>
                        <div className="markdown-body">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <span className="text-sm leading-relaxed">{children}</span>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mt-2 mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mt-2 mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="text-sm">{children}</li>,
                              h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                              a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{children}</a>,
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isGlobalAssistantLoading && (
                  <div className="flex justify-start">
                     <div className="bg-secondary text-secondary-foreground rounded-2xl px-4 py-3 rounded-bl-sm border border-foreground/5 flex items-center gap-2 shadow-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-widest opacity-70">Thinking...</span>
                     </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 bg-card border-t border-foreground/10 shrink-0">
            <div className="relative flex items-center bg-background rounded-xl shadow-inner border border-foreground/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <Textarea 
                value={globalAssistantInput}
                onChange={(e) => setGlobalAssistantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGlobalAssistantSend(globalAssistantInput);
                  }
                }}
                className="min-h-[50px] resize-none pr-24 pl-4 py-3 border-0 focus-visible:ring-0 text-sm bg-transparent"
                placeholder="Ask me anything..."
                rows={1}
                disabled={isGlobalAssistantLoading || isTranscribing}
              />
              <div className="absolute right-1 bottom-1 flex items-center gap-1">
                <Button 
                  onClick={() => toggleDictation()}
                  disabled={isTranscribing}
                  size="icon"
                  variant="ghost"
                  className={cn("w-8 h-8 rounded-lg text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10", isDictating && "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50")}
                >
                  {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : (
                    isDictating ? <Square className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> : <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  onClick={() => handleGlobalAssistantSend(globalAssistantInput)} 
                  disabled={!globalAssistantInput.trim() || isGlobalAssistantLoading || isTranscribing}
                  size="icon"
                  className="w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-transform active:scale-95 z-10"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-in slide-in-from-right-4 duration-300 ${
              toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 
              toast.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 
              'bg-blue-500/10 border-blue-500/20 text-blue-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
             toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : 
             <Info className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      </div>
      {isFullscreen && presentation && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-8 right-8 text-white hover:bg-white/10 h-12 w-12 rounded-full"
            onClick={() => setIsFullscreen(false)}
          >
            <XCircle className="w-8 h-8" />
          </Button>

          <div className="flex-1 flex items-center justify-center w-full">
            <div 
              style={{ 
                width: '1280px', 
                height: '720px', 
                transform: `scale(${Math.min((window.innerWidth - 100) / 1280, (window.innerHeight - 200) / 720)})`,
                transformOrigin: 'center center'
              }}
            >
              <SlidePreview 
                slide={presentation.slides[currentSlideIndex]} 
                presentationTitle={presentation.title}
                index={currentSlideIndex}
                total={presentation.slides.length}
                t={t}
                styleName={presentation.styleName}
              />
            </div>
          </div>

          <div className="flex items-center gap-12 mt-8 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-14 w-14 rounded-2xl text-white hover:bg-white/20"
              disabled={currentSlideIndex === 0}
              onClick={() => setCurrentSlideIndex(prev => prev - 1)}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            <div className="flex flex-col items-center min-w-[120px]">
              <span className="text-2xl font-black text-primary italic">
                {currentSlideIndex + 1} / {presentation.slides.length}
              </span>
              <div className="w-full h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${((currentSlideIndex + 1) / presentation.slides.length) * 100}%` }}
                />
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-14 w-14 rounded-2xl text-white hover:bg-white/20"
              disabled={currentSlideIndex === presentation.slides.length - 1}
              onClick={() => setCurrentSlideIndex(prev => prev + 1)}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>
        </div>
      )}

      {/* Presentation Approval Confirmation Popup */}
      <AnimatePresence>
        {showPresentationApproval && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPresentationApproval(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border shadow-2xl rounded-3xl p-6 md:p-8 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-foreground tracking-tight">Approve Plan?</h2>
              <p className="text-muted-foreground mb-8 text-sm md:text-base leading-relaxed">
                Are you sure you are satisfied with this plan and want to approve?
              </p>
              
              <div className="w-full flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl text-sm font-semibold"
                  onClick={() => setShowPresentationApproval(false)}
                >
                  <X className="w-4 h-4 mr-2" /> Go Back & Review
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => {
                    setShowPresentationApproval(false);
                    handleGeneratePresentation();
                  }}
                >
                  <Check className="w-4 h-4 mr-2" /> Yes, Generate
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Global Assistant Floating Container (Draggable) */}
      <AnimatePresence>
        {(globalAssistantState === 'minimized' || globalAssistantState === 'floating_input') && (
          <motion.div 
            key="global-assistant-draggable"
            drag
            dragMomentum={false}
            onDragStart={() => { 
              isDraggingGlobalAssistantRef.current = true;
              document.body.style.userSelect = 'none';
            }}
            onDragEnd={() => { 
              setTimeout(() => { isDraggingGlobalAssistantRef.current = false; }, 150);
              document.body.style.userSelect = '';
            }}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-4 z-50 flex flex-col justify-end items-end cursor-move"
          >
            {globalAssistantState === 'minimized' ? (
              <div className="animate-in fade-in zoom-in duration-300">
                <Button 
                  size="icon" 
                  className="w-14 h-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground group relative pointer-events-auto"
                  onClick={(e) => {
                    if (isDraggingGlobalAssistantRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    setGlobalAssistantState('floating_input');
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100" style={{ animationDuration: '3s' }} />
                  <Sparkles className="w-6 h-6" />
                </Button>
              </div>
            ) : (
              <div 
                className="w-[360px] animate-in fade-in zoom-in duration-300 cursor-default"
                onPointerDownCapture={(e) => {
                  // Only allow dragging from the header/background, not from interactive elements
                  if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
                    e.stopPropagation();
                  }
                }}
              >
                <div className="bg-card/90 backdrop-blur-2xl border border-foreground/10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-2">
                  <div className="flex items-center justify-between mb-2 px-2 pt-1 cursor-move">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pointer-events-none">
                      <Sparkles className="w-3 h-3 text-primary" /> Assistant
                    </span>
                    <div className="flex items-center gap-1">
                      {globalAssistantMessages.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Open full chat"
                          className="h-6 w-auto px-2 rounded-full hover:bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest" 
                          onClick={() => setGlobalAssistantState('sidebar')}
                        >
                          Continue Chat
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground" onClick={() => setGlobalAssistantState('minimized')}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  {globalAssistantMessages.length > 0 && (
                    <div className="px-2 pb-2 mb-2 border-b border-foreground/5 pointer-events-none">
                      <p className="text-xs text-muted-foreground line-clamp-1 truncate">
                        <span className="font-semibold text-foreground/70">Last message:</span> {globalAssistantMessages[globalAssistantMessages.length - 1].content.split('\n')[0].replace(/[#*_`]/g, '')}
                      </p>
                    </div>
                  )}

                  <div className="relative flex items-center bg-background rounded-xl border border-foreground/10 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 pl-3">
                    <Input 
                       value={globalAssistantInput}
                       onChange={(e) => setGlobalAssistantInput(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           handleGlobalAssistantSend(globalAssistantInput, globalAssistantMessages.length > 0);
                         }
                       }}
                       placeholder={globalAssistantMessages.length > 0 ? "Start new chat..." : "Chat about anything..."}
                       className="flex-1 border-0 focus-visible:ring-0 shadow-none bg-transparent text-sm h-10 px-0 pointer-events-auto"
                       autoFocus
                       disabled={isGlobalAssistantLoading || isTranscribing}
                    />
                    <div className="flex items-center gap-1 mx-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("w-8 h-8 rounded-lg pointer-events-auto hover:bg-primary/10 transition-colors", isDictating && "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50")}
                        onClick={() => toggleDictation()}
                        disabled={isTranscribing}
                      >
                        {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : (
                          isDictating ? <Square className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> : <Mic className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                    </div>
                    <Button 
                       onClick={() => handleGlobalAssistantSend(globalAssistantInput, globalAssistantMessages.length > 0)}
                       disabled={!globalAssistantInput.trim() || isGlobalAssistantLoading || isTranscribing}
                       size="icon"
                       className="w-8 h-8 rounded-lg shrink-0 pointer-events-auto"
                    >
                       <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster 
        position="bottom-right" 
        expand={true}
        closeButton 
        theme="system"
        toastOptions={{
          classNames: {
            toast: "bg-background border border-border shadow-lg rounded-xl",
            description: "text-muted-foreground",
            actionButton: "bg-primary text-primary-foreground",
            cancelButton: "bg-muted text-muted-foreground",
          }
        }}
      />
    </TooltipProvider>
  );
}



