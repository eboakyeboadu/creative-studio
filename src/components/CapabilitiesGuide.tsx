import React, { useRef, useState } from 'react';
import { 
  Zap, 
  Globe, 
  BarChart3, 
  MonitorPlay,
  Target,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Clock,
  Layout,
  MessageSquare,
  FileText,
  Brain,
  ListTodo,
  Mic,
  Image as ImageIcon, 
  Sparkles,
  Download,
  Info,
  HelpCircle,
  Languages,
  BellRing,
  Settings2,
  FileDown,
  History,
  Activity,
  Smile,
  Clapperboard,
  PieChart,
  Database,
  Volume2,
  Lock,
  Scale,
  Search,
  Share2,
  Fingerprint,
  EyeOff,
  Server,
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { jsPDF } from 'jspdf';
import { toCanvas } from 'html-to-image';
import { toast } from 'sonner';

const CAPABILITIES = [
  {
    title: "AI Creative Studio",
    icon: ImageIcon,
    description: "Production-grade visual and linguistic generation assets.",
    features: [
      {
        name: "Intelligent Image Generation",
        detail: "Create photorealistic, 3D, or 2D marketing assets using advanced style references and content guides.",
        value: "Cut creative production costs by 80% while maintaining brand consistency."
      },
      {
        name: "Marketing-Centric Translation",
        detail: "Strict, high-impact translation localized for your key markets. Includes large-scale document translation via direct links.",
        value: "Launch global campaigns instantly with native-level linguistic accuracy."
      },
      {
        name: "Neural Text-to-Speech Synthesis",
        detail: "Instantly convert text and translations into natural, studio-quality voiceovers across multiple languages.",
        value: "Accelerate localization for video and audio campaigns without expensive recording sessions."
      }
    ]
  },
  {
    title: "Campaign Excellence",
    icon: Rocket,
    description: "Strategic content generation and predictive quality analysis.",
    features: [
      {
        name: "Omnichannel Content Engine",
        detail: "Generate optimized copy for Push, WhatsApp, TikTok, YouTube, and in-app News Feeds.",
        value: "Scale content across 6+ channels while adhering to your editorial guidelines."
      },
      {
        name: "Predictive Quality Scoring",
        detail: "AI evaluation of draft clarity, engagement potential, and outcome probability based on historical performance.",
        value: "Reduce campaign iteration cycles by fixing weak copy before launch."
      },
      {
        name: "AI Auto-Refinement",
        detail: "One-click rewriting to reach 100% adherence to performance benchmarks and editorial standards.",
        value: "Guaranteed editorial excellence and peak engagement rates."
      },
      {
        name: "Creative Emojification",
        detail: "One-click addition of contextual emojis and formatting to make campaigns more communicative and engaging.",
        value: "Increase click-through rates by up to 25% with visually appealing content."
      }
    ]
  },
  {
    title: "Strategic Intelligence",
    icon: Brain,
    description: "Deep analytics and professional activity review.",
    features: [
      {
        name: "Expert Activity Analysis",
        detail: "Upload marketing reports and receive a 360-degree critique of achievements and gaps.",
        value: "Gain high-level management perspective on operational performance."
      },
      {
        name: "Professional Activity Review",
        detail: "Upload marketing reports to receive deep critiques on achievements, gaps, and professional recommendations.",
        value: "Elevate the quality of your work through structured expert feedback."
      },
      {
        name: "Marketing & Operations Analysis",
        detail: "Gain high-level management perspective on marketing and operational performance through deep document critique.",
        value: "Identify hidden performance gaps and growth opportunities instantly."
      },
      {
        name: "Automated Meeting Preparation",
        detail: "AI-generated likely questions and brainstormed answers for executive synchronization meetings.",
        value: "Walk into every meeting over-prepared and confident."
      },
      {
        name: "Business Impact Mapping",
        detail: "Evaluating how specific marketing activities drive long-term business objectives.",
        value: "Align every action with core company KPIs and growth targets."
      }
    ]
  },
  {
    title: "Video & Storyboarding",
    icon: Clapperboard,
    description: "End-to-end AI video pre-production and cinematic planning.",
    features: [
      {
        name: "Intelligent Scene Generation",
        detail: "Produce comprehensive 8-second video scenes with AI-generated visual and narrative descriptions.",
        value: "Cut pre-production planning time from days to seconds while maintaining narrative coherence."
      },
      {
        name: "Multi-Format Aspect Ratios",
        detail: "Native support for cinematic (16:9), social feed (1:1), and vertical format (9:16) video planning.",
        value: "Seamlessly adapt campaign ideas into any channel resolution."
      },
      {
        name: "Google Flow Deployment",
        detail: "Direct pathway to deploy storyboard sequences straight into Google's advanced rendering flows.",
        value: "Frictionless pipeline from concept visualization right to final execution."
      }
    ]
  },
  {
    title: "Data Intelligence",
    icon: PieChart,
    description: "Transforming raw metrics into interactive executive dashboards.",
    features: [
      {
        name: "Automated Visual Dashboards",
        detail: "Dynamically render unstructured datasets or CSV/JSON files into beautiful interactive charts and graphs.",
        value: "Turn complex raw data into easily digestible executive insights instantly."
      },
      {
        name: "Data Contextualization",
        detail: "AI autonomously interprets chart patterns to offer strategic next steps and observations.",
        value: "Go beyond just viewing numbers towards understanding actionable trends."
      }
    ]
  },
  {
    title: "Cloud Ecosystem",
    icon: Database,
    description: "Robust offline-first architecture powered by ultra-secure cloud syncing.",
    features: [
      {
        name: "Native Offline Resilience",
        detail: "Full capability buffering during connection drops with auto-reconnection synchronization.",
        value: "Uninterrupted marketing execution regardless of network conditions."
      },
      {
        name: "Brand Context Injection",
        detail: "Centralized settings hub for tone and editorial rules that automatically steer all AI generations.",
        value: "Eliminate repetitive prompting and guarantee exact brand alignment."
      }
    ]
  },
  {
    title: "Presentation Automation",
    icon: MonitorPlay,
    description: "Transforming plans and data into visual narratives.",
    features: [
      {
        name: "Instant Slide Generation",
        detail: "Convert marketing plans or reports into structured decks. No more staring at empty white screens; AI provides a robust structure from start.",
        value: "Eliminate manual slide crafting; go from data to deck in seconds."
      },
      {
        name: "Intelligent Speaker Notes",
        detail: "Automatically generated, context-rich notes for each slide to guide your delivery.",
        value: "Deliver polished, executive-ready presentations with zero preparation time."
      },
      {
        name: "Export to PPTX",
        detail: "Direct export to editable PPTX format with customized branding and layout logic.",
        value: "Professional presentations ready for the boardroom."
      }
    ]
  },
  {
    title: "Productivity & Operations",
    icon: Zap,
    description: "Professional tools for high-performance marketing teams.",
    features: [
      {
        name: "Dedicated Floating Assistant Bubble",
        detail: "An omnipresent, section-aware floating bubble designed for instant, context-specific interactions. Whether you need a quick clarification or strategic brainstorming about your active screen, the bubble has instant insight into what you're doing.",
        value: "Ask for help anytime and stay in your creative flow with context-aware micro-chats."
      },
      {
        name: "Smart AI-Integrated Task Management",
        detail: "Kanban board synchronized with marketing plans and AI-generated insights.",
        value: "Bridge the gap between strategic vision and daily tactical execution."
      },
      {
        name: "Automatic Deadlines",
        detail: "Time-sensitive reminders and automated scheduling integrated directly into your marketing calendar.",
        value: "Never miss a campaign milestone or critical synchronization meeting again."
      },
      {
        name: "One-Click Prompt Enhancement",
        detail: "Instantly transform simple ideas into professional-grade AI instructions across all platform tools.",
        value: "Get expert-level output even with minimal initial input."
      },
      {
        name: "Analytics & ROI Dashboard",
        detail: "Track how AI is enhancing your team's output through dedicated analytics, ROI tracking, and performance metrics.",
        value: "Measure the clear impact of AI on your daily marketing output."
      },
      {
        name: "Global Language Support",
        detail: "Change the entire platform interface into any major global language with real-time perfect localization.",
        value: "Seamless operation for international teams across all regions."
      },
      {
        name: "Deep Focus Pomodoro",
        detail: "Ambient music integration (Lo-fi, Zen, Nature) with dynamic timer controls.",
        value: "Maximize individual output and reduce burnout through structured rest."
      },
      {
        name: "Global World Clock",
        detail: "Track time zones across all major operating regions instantly from your dashboard.",
        value: "Coordinate effortlessly with international teams and avoid scheduling conflicts."
      },
      {
        name: "Audio Transcription Hub",
        detail: "Multilingual transcription of field recordings and live meetings into localized text.",
        value: "Preserve every insight from field research and stakeholder sessions."
      }
    ]
  }
];

const PRIVACY_SECTIONS = [
  {
    id: "data-ownership",
    title: "1. Core Enterprise Data Ownership",
    icon: Lock,
    subtitle: "Your data is strictly yours. We claim zero intellectual property over any assets.",
    excerpt: "Guarding raw inputs, generated copy, CSV spreadsheets, translation documents, and slide contents.",
    tags: ["ownership", "ip", "intellectual", "property", "briefs", "sheets", "documents", "portability", "export"],
    bullets: [
      {
        header: "Absolute Ownership Guarantee",
        desc: "All inputs (prompts, raw metrics, documents, transcripts) and all generated output assets (images, localized texts, slide briefs) remain the 100% exclusive intellectual property of your organization. We claim zero licensing, distribution, or ownership rights."
      },
      {
        header: "Full Data Portability",
        desc: "We provide complete data export routes. You can download and retrieve your marketing plans, video scenarios, task metrics, and saved campaign drafts in structured and system-neutral formats (JSON, CSV, PDF, PPTX) at any given moment with zero lock-in."
      },
      {
        header: "Strict Multi-Tenant Workspace Isolation",
        desc: "Each workspace is dynamically compartmentalized and isolated at the identity verification plane. Cross-tenant reads/writes are mathematically blocked, preventing configuration leaks or access anomalies across distinct operating regions."
      }
    ]
  },
  {
    id: "model-training",
    title: "2. Secure AI Execution & Training Exemption",
    icon: EyeOff,
    subtitle: "Absolute guarantee: Zero public training loops on user datasets.",
    excerpt: "Strict protection against public LLM feedback loops, with private, enterprise-tier api routers.",
    tags: ["model training", "training", "gemini", "fine-tuning", "llm", "public", "harvester", "api gateway"],
    bullets: [
      {
        header: "No Training on Your Workspace Activity",
        desc: "Your data is strictly partitioned. Prompts, document uploads, and generated outcomes (such as storyboard imagery or synthesized translation copy) are never utilized to train, retrain, or improve any public Large Language Models, third-party neural nets, or baseline foundational architectures."
      },
      {
        header: "Enterprise Private API Gateways",
        desc: "All interactions are channeled through private enterprise endpoints that feature zero-retention guidelines on the model operator plane for any purpose related to model training or generic feedback optimization."
      },
      {
        header: "Context Siloing",
        desc: "Active generation metrics operate only within localized session states, ensuring that customized tone rules or localized marketing calendars never bleed into shared global contexts."
      }
    ]
  },
  {
    id: "infrastructure-security",
    title: "3. Encrypted Infrastructure & Cloud Ecosystem",
    icon: Server,
    subtitle: "Highly resilient transport layers paired with secure, robust encryption blocks.",
    excerpt: "How our platform processes information, offline state saving buffers, and authentication boundaries.",
    tags: ["security", "encryption", "aes-256", "tls 1.3", "offline", "sync", "buffer", "firebase", "authentication"],
    bullets: [
      {
        header: "High-Grade Transport and Rest Encryption",
        desc: "All network traffic in and out of the workstation is protected with standard TLS 1.3 encryption protocols. Data stored in our cloud orchestration layer has continuous block-level AES-256 encryption enabled by default."
      },
      {
        header: "Native Offline Buffering",
        desc: "To guarantee continuous operation, we cache work-in-progress drafts locally in your secure sandboxed browser storage. This temporary buffer only exists in active client memory and is synced dynamically back via encrypted tunnels once transport connections resume."
      },
      {
        header: "Authentication & Cryptographic Tokens",
        desc: "Platform session authentication is driven by secure cryptographic state tokens and secure user directories. This verifies your identity at every micro-route, immediately rejecting untrustworthy sessions or compromised cookies."
      }
    ]
  },
  {
    id: "floating-bubble",
    title: "4. Section-Aware Assistant Transparency",
    icon: Sparkles,
    subtitle: "Privacy-first scoping of our dedicated, omnipresent floating context bubble.",
    excerpt: "How the floating assistant senses active sections without compromising system or data folders.",
    tags: ["bubble", "floating bubble", "chats", "assistant", "context", "awareness", "transient", "memory", "purge"],
    bullets: [
      {
        header: "Strict Scoping of Ambient Awareness",
        desc: "The omnipresent, section-aware floating assistant bubble only scans indicators describing what section you are currently working on (e.g. tracking that you are in Task Management or Image Generation). It does not crawl local computer directories, physical device drivers, or unauthorized secondary tabs."
      },
      {
        header: "Transient In-Memory Context Hub",
        desc: "Workspace section context is parsed dynamically into the temporary memory grid of the assistant session. It is never serialized persistently to server files or indexed in cold storage logs."
      },
      {
        header: "Manual Complete Purge",
        desc: "Users have an instant clear button. Pressing 'Clear Conversation' inside the assistant panel permanently flushes the active session registry, destroying all immediate interaction history from that session."
      }
    ]
  },
  {
    id: "global-compliance",
    title: "5. Global Compliance & Governance Standards",
    icon: Scale,
    subtitle: "Adhering to strict compliance structures, CCPA/GDPR values, and user privacy rights.",
    excerpt: "Complete control over profile deletion, right to be forgotten, and non-brokerage statements.",
    tags: ["gdpr", "ccpa", "erasure", "forgotten", "delete", "compliance", "selling", "brokerage", "soc 2"],
    bullets: [
      {
        header: "GDPR Zero-Retention & Right of Erasure",
        desc: "We strictly uphold your right to be forgotten. Users can permanently execute profile deletion directly within Settings, which programmatically forces absolute erasure of all linked briefs, campaigns, transcripts, and account files from active indexes."
      },
      {
        header: "No Data Brokerage or Commercial Sale",
        desc: "We never lease, exchange, sell, or rent your platform data, analytical profiles, target marketing guidelines, or user lists to third-party marketing networks, commercial brokers, or programmatic ad chains."
      },
      {
        header: "Continuous Compliance Readiness",
        desc: "Our structural data schemas are formatted in alignment with SOC 2 Type II audit readiness guidelines, guaranteeing secure controls, continuous threat scanning, and robust operational protection."
      }
    ]
  }
];

export default function CapabilitiesGuide({ setActiveView }: { setActiveView?: (view: any) => void }) {
  const guideRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'privacy'>('features');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('data-ownership');

  const exportToPDF = async () => {
    if (!guideRef.current || isExporting) return;
    
    setIsExporting(true);
    const toastId = toast.loading("Synthesizing PDF documentation...");
    
    try {
      const element = guideRef.current;
      
      const canvas = await toCanvas(element, {
        quality: 1,
        backgroundColor: '#FFFFFF',
        style: {
          padding: '48px',
          color: '#000000',
          '--background': '0 0% 100%',
          '--foreground': '240 10% 3.9%',
          '--card': '0 0% 100%',
          '--border': '240 5.9% 90%',
          '--muted': '240 4.8% 95.9%',
          '--muted-foreground': '240 3.8% 46.1%',
          borderRadius: '0',
          boxShadow: 'none'
        } as any,
        filter: (node) => {
          const el = node as HTMLElement;
          if (el.id === 'export-button') return false;
          if (el.id === 'capabilities-tabs') return false;
          if (el.id === 'privacy-picker') return false;
          if (el.classList?.contains('mt-24')) return false;
          return true;
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Creative-Studio-${activeTab === 'features' ? 'Framework' : 'Privacy-Policy'}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Ecosystem documentation exported successfully!", { id: toastId });
    } catch (error) {
      console.error("PDF Export Logic Error:", error);
      toast.error("Critical Export Error: Documentation synthesis failed.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredPrivacy = PRIVACY_SECTIONS.filter(sec => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.subtitle.toLowerCase().includes(q) ||
      sec.excerpt.toLowerCase().includes(q) ||
      sec.tags.some(tag => tag.includes(q)) ||
      sec.bullets.some(b => b.header.toLowerCase().includes(q) || b.desc.toLowerCase().includes(q))
    );
  });

  return (
    <div ref={guideRef} className="w-full max-w-7xl mx-auto px-6 py-12 pb-32 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-background/50 animate-duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-primary/10 pb-12">
        <div className="text-center md:text-left space-y-4 max-w-3xl">
          <Badge variant="outline" className="px-4 py-1 text-xs uppercase tracking-widest font-black text-primary border-primary/20 bg-primary/5">
            Platform Hub
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Unleashing <span className="text-primary italic">Creative Studio</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed italic serif">
            {activeTab === 'features' 
              ? "A comprehensive overview of our AI-native marketing operating system, designed to accelerate every stage of the lifecycle."
              : "Enterprise-grade trust, user data exception rules, and transparent security standards."}
          </p>
        </div>
        <Button 
          id="export-button"
          onClick={exportToPDF} 
          disabled={isExporting}
          className="rounded-full px-8 h-14 font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl group shrink-0 bg-primary text-primary-foreground"
        >
          {isExporting ? (
            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <FileDown className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-1" />
          )}
          {isExporting ? "Synthesizing..." : "Export to PDF"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/20 p-1 rounded-2xl max-w-md" id="capabilities-tabs">
        <button
          onClick={() => { setActiveTab('features'); setSearchQuery(''); }}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === 'features' 
              ? 'bg-primary text-primary-foreground shadow-lg' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/45'
          }`}
        >
          Ecosystem Map
        </button>
        <button
          onClick={() => { setActiveTab('privacy'); setSearchQuery(''); }}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === 'privacy' 
              ? 'bg-primary text-primary-foreground shadow-lg' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/45'
          }`}
        >
          Privacy & Security Policy
        </button>
      </div>

      {activeTab === 'features' ? (
        <div className="grid grid-cols-1 gap-12">
          {CAPABILITIES.map((category, idx) => (
            <div 
              key={idx}
              className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center gap-6 pb-4 border-b border-muted">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  {category.icon ? <category.icon className="w-8 h-8 text-primary" /> : <Zap className="w-8 h-8 text-primary" />}
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight">{category.title}</h2>
                  <p className="text-muted-foreground font-medium">{category.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.features.map((feature, fIdx) => (
                  <Card key={fIdx} className="premium-card flex flex-col border border-border/40 shadow-sm bg-card/30 hover:bg-card/60 transition-all hover:shadow-xl hover:border-primary/20">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-lg font-bold tracking-tight text-foreground/90">{feature.name}</CardTitle>
                        {(feature.name.includes("One-Click") || feature.name.includes("Slide Generation")) && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">High Efficiency</Badge>}
                      </div>
                      <CardDescription className="text-muted-foreground leading-relaxed text-xs">
                        {feature.detail}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 group-hover:bg-primary/10 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Value Proposition</span>
                        </div>
                        <p className="text-xs font-bold leading-relaxed italic text-foreground/80 leading-relaxed">
                          "{feature.value}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sidebar controls */}
          <div className="lg:col-span-4 space-y-6" id="privacy-picker">
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Search and Explore</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter clauses (e.g. metadata, gdpr)..."
                  className="w-full bg-secondary/30 text-xs text-foreground placeholder:text-muted-foreground/50 border border-border/40 rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Document Outline</h3>
                <Badge variant="outline" className="text-[9px] border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-bold">Enterprise Trust</Badge>
              </div>
              <div className="space-y-1.5">
                {PRIVACY_SECTIONS.map((sec) => {
                  const isSelected = activeSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSectionId(sec.id);
                        const element = document.getElementById(`privacy-sec-${sec.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className={`w-full text-left px-4 py-3.5 rounded-xl transition-all border flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-primary/10 border-primary/20 text-primary font-bold shadow-sm' 
                          : 'border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                      }`}
                    >
                      <sec.icon className="w-4 h-4 shrink-0 transition-transform" />
                      <span className="text-xs truncate font-medium">{sec.title.split('. ')[1] || sec.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border/40 bg-secondary/10 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Compliance Seal</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Our policy outline is optimized to respect corporate data security principles, global regulatory protocols, and transparent client operations.
              </p>
              <div className="text-[10px] text-muted-foreground/60 font-mono">
                Platform Agreement: v2.4-Enterprise
              </div>
            </div>
          </div>

          {/* Privacy clauses */}
          <div className="lg:col-span-8 space-y-8">
            {filteredPrivacy.map((sec) => (
              <Card 
                id={`privacy-sec-${sec.id}`}
                key={sec.id}
                className={`premium-card border transition-all duration-300 ${
                  activeSectionId === sec.id 
                    ? 'border-primary/40 bg-card shadow-lg ring-1 ring-primary/10' 
                    : 'border-border/40 bg-card/10 hover:border-border/80'
                }`}
                onClick={() => setActiveSectionId(sec.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                      <sec.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold tracking-tight text-foreground">{sec.title}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">{sec.subtitle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-[11px] text-muted-foreground/80 italic leading-relaxed border-l-2 border-primary/20 pl-4 py-1">
                    {sec.excerpt}
                  </p>
                  
                  <div className="space-y-5 pt-2">
                    {sec.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="space-y-1.5 group/bullet">
                        <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 group-hover/bullet:scale-125 transition-transform" />
                          {bullet.header}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                          {bullet.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPrivacy.length === 0 && (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 text-muted-foreground italic text-xs space-y-2">
                <ShieldAlert className="w-8 h-8 mx-auto text-muted-foreground/45 mb-2" />
                <p>No policy sections found matching "{searchQuery}".</p>
                <p className="text-[10px] text-muted-foreground/50">Try searching for keywords like "training", "GDPR", or "security".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer support card */}
      <div className="mt-24 p-12 rounded-[3rem] bg-foreground text-background relative overflow-hidden group shadow-2xl border-4 border-primary/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
          <Sparkles className="w-64 h-64" />
        </div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary rounded-full blur-[120px] opacity-20"></div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <Badge variant="outline" className="border-background/20 text-background/60 px-4 py-1">Support & Growth</Badge>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Ready to transform your marketing workflow?</h2>
          <p className="text-lg text-background/60 leading-relaxed serif italic">
            Creative Studio isn't just a set of tools; it's a multiplier for your expertise, 
            allowing you to focus on high-level strategy while our AI handles the heavy lifting 
            of execution, analysis, and localization.
          </p>
          <div className="flex items-center gap-4 pt-4">
             <Button variant="outline" className="rounded-full border-primary/40 text-primary hover:bg-primary hover:text-white font-bold h-12 px-8">
               Visit Help Centre
             </Button>
             <Button variant="ghost" className="rounded-full opacity-60 hover:opacity-100 font-bold h-12 gap-2">
               <MessageSquare className="w-5 h-5" />
               Share Feedback
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

