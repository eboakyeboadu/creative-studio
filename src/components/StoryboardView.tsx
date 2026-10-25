import React, { useState, useRef } from 'react';
import { 
  PlayCircle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  Image as ImageIcon, 
  RefreshCw, 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clapperboard,
  Clock,
  Video,
  User,
  Paperclip,
  XCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  generateStoryboard, 
  generateSlideImage, 
  generateCharacterDescription,
  refineStoryboard,
  StoryboardData, 
  StoryboardScene 
} from '@/services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/FirebaseContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { parseFileToString } from '@/lib/fileParser';

interface StoryboardViewProps {
  t: any;
  brandIdentity: any;
  addActivity: (type: any, title: string, details: string, view?: any, itemId?: string) => void;
}

export function StoryboardView({ t, brandIdentity, addActivity }: StoryboardViewProps) {
  const [prompt, setPrompt] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1" | "9:16">("16:9");
  
  const [charName, setCharName] = useState('');
  const [charDesc, setCharDesc] = useState('');
  const [isRefiningCharDesc, setIsRefiningCharDesc] = useState(false);
  
  const [setupStep, setSetupStep] = useState<'character' | 'storyboard'>('character');
  const [isLoading, setIsLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<StoryboardData | null>(null);
  const [history, setHistory] = useState<StoryboardData[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{name: string, content: string}|null>(null);
  const [refineFeedback, setRefineFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isEditingForm, setIsEditingForm] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  const handleRefineDescription = async () => {
    if (!charName.trim()) return;
    setIsRefiningCharDesc(true);
    try {
      const data = await generateCharacterDescription(`A professional cinematic character prompt for ${charName}. Initial description: ${charDesc}. Focus on specific physical traits, clothing, and textures for consistent video generation.`);
      setCharDesc(data.description);
      toast.success(t.charPromptRefined || "Character prompt refined!");
    } catch (error) {
      console.error("Refining failed:", error);
      toast.error(t.refiningFailed || "Failed to refine character prompt.");
    } finally {
      setIsRefiningCharDesc(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await parseFileToString(file);
      setUploadedFile({ name: file.name, content });
      toast.success(`Document "${file.name}" uploaded successfully!`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to parse file: ${err.message || 'Unknown error'}`);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedFile) return;
    
    let finalPrompt = prompt.trim();
    if (uploadedFile) {
      finalPrompt = `Context from uploaded document "${uploadedFile.name}":\n\n${uploadedFile.content}\n\nAdditional user instructions:\n${finalPrompt}`;
    }

    setIsLoading(true);
    try {
      const data = await generateStoryboard(finalPrompt, charDesc, targetAudience, aspectRatio, brandIdentity);
      const newStoryboard = {
        ...data,
        id: Date.now().toString(),
        characterDescription: charDesc,
        targetAudience,
        aspectRatio,
        timestamp: new Date()
      };
      
      setStoryboard(newStoryboard);
      setHistory(prev => [newStoryboard, ...prev]);
      
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'storyboards', newStoryboard.id), {
          ...newStoryboard,
          timestamp: serverTimestamp()
        }).catch(dbError => {
          console.error("Failed to save storyboard to history:", dbError);
        });
      }

      if (data.scenes.length > 0) {
        setSelectedSceneId(data.scenes[0].id);
      }
      setIsEditingForm(false);
      addActivity('storyboard', t.storyboardGeneratedToast || 'Storyboard Generated', `Generated ${data.scenes.length} scenes for "${prompt.substring(0, 30)}..."`, 'storyboard', newStoryboard.id);
    } catch (error) {
      console.error("Storyboard generation failed:", error);
      toast.error(t.generationFailed || "Generation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineStoryboard = async () => {
    if (!storyboard || !refineFeedback.trim()) return;

    setIsRefining(true);
    try {
      const refinedData = await refineStoryboard(storyboard, refineFeedback, targetAudience, brandIdentity);
      
      const newStoryboard = {
        ...storyboard,
        ...refinedData,
        id: Date.now().toString(),
        timestamp: new Date()
      };
      
      setStoryboard(newStoryboard);
      setHistory(prev => [newStoryboard, ...prev]);
      setRefineFeedback('');
      
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'storyboards', newStoryboard.id), {
          ...newStoryboard,
          timestamp: serverTimestamp()
        }).catch(err => console.error("Failed to save refined storyboard:", err));
      }

      if (refinedData.scenes.length > 0) {
        setSelectedSceneId(refinedData.scenes[0].id);
      }
      
      addActivity('storyboard', t.storyboardRefinedToast || 'Storyboard Refined', `Refined storyboard based on feedback`, 'storyboard', newStoryboard.id);
      toast.success(t.storyboardRefinedSuccess || "Storyboard refined successfully!");
    } catch (error) {
      console.error("Storyboard refinement failed:", error);
      toast.error(t.refinementFailed || "Refinement failed. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleUpdateScene = (id: string, updates: Partial<StoryboardScene>) => {
    if (!storyboard) return;
    setStoryboard({
      ...storyboard,
      scenes: storyboard.scenes.map(s => {
        if (s.id === id) {
          let updated = { ...s, ...updates };
          
          // If narrative changed, update the technical prompt to reflect it
          if (updates.narrative !== undefined && !updates.prompt) {
            const voPrefix = 'VO: "';
            const voIndex = updated.prompt.indexOf(voPrefix);
            if (voIndex !== -1) {
              const startPart = updated.prompt.substring(0, voIndex + voPrefix.length);
              const remainingPart = updated.prompt.substring(voIndex + voPrefix.length);
              const endQuoteIndex = remainingPart.indexOf('"');
              if (endQuoteIndex !== -1) {
                const afterPart = remainingPart.substring(endQuoteIndex);
                updated.prompt = startPart + updates.narrative + afterPart;
              }
            } else if (!updated.prompt.includes('VO:')) {
               // Append if missing
               updated.prompt = updated.prompt.replace('. NO TEXT', `. VO: "${updates.narrative}". NO TEXT`);
            }
          }

          // Detect if text content changed to reset approval
          if (updates.narrative !== undefined || updates.prompt !== undefined || updates.timecode !== undefined) {
            updated.isApproved = false;
          }
          return updated;
        }
        return s;
      })
    });
  };

  const handleApproveScene = (id: string) => {
    handleUpdateScene(id, { isApproved: true });
    const scene = storyboard?.scenes.find(s => s.id === id);
    addActivity('storyboard', t.sceneApprovedToast || 'Scene Approved', `Approved Scene ${scene?.number} of "${storyboard?.title}"`);
    toast.success(t.sceneApprovedToast || "Scene approved!");
  };

  const getWordCountWarning = (text: string) => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (words > 22) return "Script might exceed 8s (approx. 22 words max).";
    return null;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
    toast.success(t.promptCopied || "Prompt copied to clipboard!");
  };

  const openGoogleFlow = () => {
    window.open('https://labs.google/fx/tools/flow', '_blank');
  };

  const resetProject = () => {
    setStoryboard(null);
    setSetupStep('character');
    setCharDesc('');
    setCharName('');
    setPrompt('');
    setTargetAudience('');
    setIsEditingForm(true);
  };

  const selectedScene = storyboard?.scenes.find(s => s.id === selectedSceneId);

  return (
    <div className="flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto border-x bg-white/40 dark:bg-card/50 backdrop-blur-xl relative shadow-2xl">
      <section className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <header className="px-4 lg:px-8 py-4 border-b bg-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Clapperboard className="w-5 h-5 md:w-6 md:h-6 text-foreground shrink-0" />
                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight truncate font-heading text-foreground">
                  {t.storyboardTitle || "Video Storyboard Studio"}
                </h2>
              </div>
              <p className="text-[10px] md:text-[11px] text-muted-foreground italic serif opacity-80 truncate">
                 {t.storyboardSubtitle || "Create cinematic, scene-by-scene video scripts for Veo 3.1"}
              </p>
            </div>
          </div>
          <div className="flex gap-1 md:gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={openGoogleFlow} className="h-8 px-2 md:px-3 text-[10px] uppercase tracking-widest font-semibold rounded-xl glass-card hover:bg-background/80 gap-1 md:gap-2">
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Google Flow</span>
            </Button>
            {!isEditingForm && storyboard && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingForm(true)} className="h-8 px-2 md:px-3 text-[10px] uppercase tracking-widest font-semibold rounded-xl gap-1 md:gap-2">
                <Edit3 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">{t.editDetails || "Edit Details"}</span>
              </Button>
            )}
            <Button size="sm" onClick={resetProject} className="h-8 px-2 md:px-3 text-[10px] uppercase tracking-widest font-semibold rounded-xl shadow-lg shadow-foreground/10 gap-1 md:gap-2">
               <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">{t.newProject || "New Project"}</span>
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col p-6 max-w-7xl mx-auto w-full space-y-6">

      {isEditingForm ? (
        <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
          <Card className="max-w-3xl w-full border-0 shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col max-h-full">
            <div className="h-2 bg-gradient-to-r from-primary via-primary/50 to-primary shrink-0"></div>
            <ScrollArea className="flex-1">
            <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">
                    {setupStep === 'character' ? (t.step1of2 || 'Step 1 of 2') : (t.step2of2 || 'Step 2 of 2')}
                  </Badge>
                  <div className="flex gap-2">
                    <div className={`w-2 h-2 rounded-full ${setupStep === 'character' ? 'bg-primary' : 'bg-muted'}`} />
                    <div className={`w-2 h-2 rounded-full ${setupStep === 'storyboard' ? 'bg-primary' : 'bg-muted'}`} />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  {setupStep === 'character' ? (
                    <><User className="w-6 h-6 text-primary" /> {t.visualIdentityDesign || "Visual Identity Design"}</>
                  ) : (
                    <><Sparkles className="w-6 h-6 text-primary" /> {t.initializeScript || "Initialize Script"}</>
                  )}
                </CardTitle>
                <CardDescription>
                  {setupStep === 'character' 
                    ? (t.visualIdentityDesc || "Establish the main character's physical identity. This prompt will be used to ensure absolute consistency across every video scene.") 
                    : (t.initializeScriptDesc || "Describe your concept, audience, and preferred style. We'll build the 8s scene sequences.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {setupStep === 'character' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">{t.protagonistName || "Protagonist Name"}</label>
                        <Input 
                          placeholder={t.protagonistNamePlaceholder || "e.g. Ama"} 
                          value={charName}
                          onChange={(e) => setCharName(e.target.value)}
                          className="bg-background/50 h-12"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={handleRefineDescription} 
                          disabled={isRefiningCharDesc || !charName.trim() || !charDesc.trim()}
                          variant="secondary"
                          className="w-full gap-2 text-foreground font-bold h-12 bg-secondary/80 border-secondary/20"
                        >
                          {isRefiningCharDesc ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {t.refinePrompt || "Refine Prompt"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">{t.mainCharacterPrompt || "Main Character Prompt (Visualization)"}</label>
                      <Textarea 
                        placeholder={t.mainCharacterPlaceholder || "Describe exact physical traits: age, skin tone, hair style, specific facial features, and attire..."}
                        value={charDesc}
                        onChange={(e) => setCharDesc(e.target.value)}
                        className="min-h-[160px] bg-background/50 resize-none font-medium leading-relaxed"
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                      <p className="text-xs font-bold flex items-center gap-2 text-primary">
                        <ImageIcon className="w-3 h-3" /> {t.technicalGuidance || "Technical Guidance"}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t.technicalGuidanceDesc || "This character prompt is the source of truth. It will be injected into every generated scene. Use the Global Image Generator in the sidebar to test your character's look before finalizing this prompt."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">{t.targetAudienceStr || "Target Audience"}</label>
                        <Input 
                          placeholder={t.targetAudiencePlaceholder || "e.g. Young professionals in Accra"} 
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          className="bg-background/50 h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">{t.aspectRatioStr || "Aspect Ratio"}</label>
                        <Tabs value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)} className="w-full">
                          <TabsList className="grid grid-cols-3 w-full bg-background/50 h-12 p-1 rounded-xl">
                            <TabsTrigger value="16:9" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-red-600/30 font-bold transition-all h-full">16:9</TabsTrigger>
                            <TabsTrigger value="1:1" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-red-600/30 font-bold transition-all h-full">1:1</TabsTrigger>
                            <TabsTrigger value="9:16" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-red-600/30 font-bold transition-all h-full">9:16</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase text-muted-foreground">{t.commercialConcept || "Commercial Concept"}</label>
                        {uploadedFile && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1 bg-primary/10 text-primary border-none text-[10px]">
                              <FileText className="w-3 h-3" />
                              <span className="max-w-[120px] truncate">{uploadedFile.name}</span>
                              <button onClick={() => setUploadedFile(null)} className="ml-1 hover:text-destructive"><XCircle className="w-3 h-3" /></button>
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".txt,.md,.csv,.json,.docx,.xlsx,.xls,.pptx,.pdf"
                        />
                        <Textarea 
                          placeholder={t.commercialConceptPlaceholder || "A cinematic 30-second commercial for a new product launch"}
                          className="min-h-[150px] resize-none text-lg leading-relaxed bg-background/50 border-primary/20 focus:border-primary pb-14"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                        />
                        <div className="absolute bottom-3 left-3">
                          <Button size="sm" variant="outline" className="h-8 gap-2 bg-background/80 backdrop-blur-sm" onClick={() => fileInputRef.current?.click()}>
                             <Paperclip className="w-4 h-4" /> Upload Document
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </ScrollArea>
            <CardFooter className="flex gap-3 bg-muted/5 py-4 shrink-0">
              {storyboard && (
                <Button variant="ghost" disabled={isLoading} onClick={() => setIsEditingForm(false)} className="h-14 px-4 md:px-6 text-muted-foreground hover:bg-muted/50">
                  {t.cancelEdit || "Cancel"}
                </Button>
              )}
              {setupStep === 'storyboard' && (
                <Button variant="outline" disabled={isLoading} onClick={() => setSetupStep('character')} className="h-14 px-8">
                  {t.backButton || "Back"}
                </Button>
              )}
              <Button 
                onClick={setupStep === 'character' ? () => setSetupStep('storyboard') : handleGenerate} 
                className="flex-1 h-14 text-lg font-bold gap-2 animate-in fade-in slide-in-from-bottom-2"
                disabled={
                  isLoading || 
                  (setupStep === 'character' && !charDesc.trim()) ||
                  (setupStep === 'storyboard' && !prompt.trim())
                }
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{t.generatingPleaseWait || "Generating... (This may take up to 30s)"}</span>
                  </>
                ) : (
                  <>
                    {setupStep === 'character' ? <ArrowRight className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                    <span>{setupStep === 'character' ? (t.nextConfigureScript || "Next: Configure Script") : (t.generateStoryboardBtn || "Generate Storyboard")}</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
          {/* Side: Scene List */}
          <div className="lg:col-span-4 flex flex-col space-y-4 min-h-0">
            <div className="px-2 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.scenesChronology || "Scenes Chronology"}</h3>
              <Badge variant="secondary" className="font-mono">{storyboard.aspectRatio}</Badge>
            </div>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3 pb-6">
                {storyboard.scenes.map((scene) => (
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedSceneId(scene.id)}
                    className={`
                      p-4 rounded-xl border-2 transition-all cursor-pointer relative group
                      ${selectedSceneId === scene.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={scene.isApproved ? "default" : "outline"} className="text-[10px] font-bold uppercase">
                        {t.sceneStr || "Scene"} {scene.number}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground bg-background/50 px-2 rounded-full py-0.5">
                        {scene.timecode}
                      </span>
                    </div>
                    <p className="text-sm font-medium line-clamp-2 text-foreground/80 leading-relaxed">
                      {scene.narrative}
                    </p>
                    {scene.isApproved && (
                      <CheckCircle2 className="w-4 h-4 text-primary absolute -top-1 -right-1 bg-background rounded-full shadow-sm" />
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="pt-2">
              <div className="relative">
                <Textarea 
                  placeholder={t.refineStoryboardPlaceholder || "E.g. Reduce to 4 scenes, or make the ending more dramatic..."}
                  value={refineFeedback}
                  onChange={(e) => setRefineFeedback(e.target.value)}
                  className="min-h-[80px] pr-12 resize-none bg-background/50 text-sm focus-visible:ring-primary/20"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <Button 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50"
                    disabled={isRefining || !refineFeedback.trim()}
                    onClick={handleRefineStoryboard}
                  >
                    {isRefining ? <RefreshCw className="h-4 w-4 animate-spin text-primary-foreground" /> : <Sparkles className="h-4 w-4 text-primary-foreground" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main: Scene Editor */}
          <div className="lg:col-span-8 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-20">
              <AnimatePresence mode="wait">
                {selectedScene && (
                  <motion.div
                    key={selectedScene.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-6 pt-4"
                  >
                    {/* Content Editor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-0 bg-muted/30 relative">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Video className="w-4 h-4 text-primary" /> {t.narrativeScript || "Narrative Script"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Textarea 
                            value={selectedScene.narrative}
                            onChange={(e) => handleUpdateScene(selectedScene.id, { narrative: e.target.value })}
                            className="bg-transparent border-none focus-visible:ring-0 resize-none min-h-[120px] p-0 text-foreground/80 italic font-medium leading-relaxed"
                          />
                          {getWordCountWarning(selectedScene.narrative) && (
                            <div className="mt-2 text-[10px] text-destructive font-bold bg-destructive/10 px-2 py-1.5 rounded border border-destructive/20 animate-pulse flex items-center gap-1.5">
                              <Clapperboard className="w-3 h-3 flex-shrink-0" />
                              <span>{t.scriptMightExceed || "Script might exceed 8s (approx. 22 words max)."}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-0 bg-muted/30">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" /> {t.timecodeStr || "Timecode"}
                          </CardTitle>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{t.fixed8sInterval || "Fixed 8s Interval"}</span>
                        </CardHeader>
                        <CardContent>
                          <Input 
                            value={selectedScene.timecode}
                            onChange={(e) => handleUpdateScene(selectedScene.id, { timecode: e.target.value })}
                            className="bg-transparent border-none focus-visible:ring-0 font-mono text-xl text-primary p-0"
                          />
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-0 bg-primary/5 relative group">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" /> {t.technicalPrompt || "Veo 3.1 Technical Prompt"}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-primary/20"
                            onClick={() => copyToClipboard(selectedScene.prompt, selectedScene.id)}
                          >
                            {copiedPromptId === selectedScene.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea 
                          value={selectedScene.prompt}
                          onChange={(e) => handleUpdateScene(selectedScene.id, { prompt: e.target.value })}
                          className="bg-transparent border-none focus-visible:ring-0 resize-none min-h-[140px] p-0 text-sm font-medium text-foreground/70 leading-relaxed font-mono"
                        />
                      </CardContent>
                    </Card>

                    <div className="flex items-center justify-between pt-4 gap-4">
                      <Button 
                        variant="secondary" 
                        size="lg" 
                        className="px-8 h-14"
                        onClick={() => {
                          const idx = storyboard.scenes.findIndex(s => s.id === selectedScene.id);
                          if (idx > 0) setSelectedSceneId(storyboard.scenes[idx - 1].id);
                        }}
                        disabled={storyboard.scenes.findIndex(s => s.id === selectedScene.id) === 0}
                      >
                        {t.previousScene || "Previous Scene"}
                      </Button>
                      
                      <div className="flex items-center gap-3">
                        {!selectedScene.isApproved && (
                          <Button 
                            className="h-14 px-8 text-lg font-bold gap-2 shadow-lg shadow-primary/20 animate-in zoom-in-95" 
                            onClick={() => handleApproveScene(selectedScene.id)}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            {t.approveScene || "Approve Scene"}
                          </Button>
                        )}
                        
                        <Button 
                          variant={selectedScene.isApproved ? "outline" : "secondary"}
                          size="lg" 
                          className="px-8 h-14"
                          onClick={() => {
                            const idx = storyboard.scenes.findIndex(s => s.id === selectedScene.id);
                            if (idx < storyboard.scenes.length - 1) setSelectedSceneId(storyboard.scenes[idx + 1].id);
                          }}
                          disabled={storyboard.scenes.findIndex(s => s.id === selectedScene.id) === storyboard.scenes.length - 1}
                        >
                          {t.nextScene || "Next Scene"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar when storyboard exists */}
      {!isEditingForm && storyboard && (
        <motion.div 
          initial={{ y: 100 }} 
          animate={{ y: 0 }} 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur-md border border-primary/20 p-2 rounded-2xl shadow-2xl flex items-center gap-2 max-w-lg w-full"
        >
          <div className="flex-1 px-4">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{t.overallProgress || "Overall Progress"}</p>
              <p className="text-[10px] font-bold text-primary">{storyboard.scenes.filter(s => s.isApproved).length} / {storyboard.scenes.length}</p>
            </div>
            <div className="flex gap-1">
              {storyboard.scenes.map(s => (
                <div 
                  key={s.id} 
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${s.isApproved ? 'bg-primary' : 'bg-muted'}`} 
                />
              ))}
            </div>
          </div>
          <Button onClick={openGoogleFlow} size="lg" className="rounded-xl gap-2 font-bold whitespace-nowrap shadow-lg shadow-primary/20">
            {t.generateInGoogleFlow || "Generate in Google Flow"}
            <ExternalLink className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
        </div>
      </section>
    </div>
  );
}

