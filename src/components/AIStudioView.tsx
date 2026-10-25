import React, { useState, useRef } from 'react';
import { 
  Sparkles, Image as ImageIcon, Languages, Download, 
  Copy, Check, Loader2, ArrowRight, Upload, X, FileText,
  Palette, Camera, Layout, FileType, Search, Wand2, RefreshCw, PenTool,
  AlertCircle, History, Maximize2, Share2, Printer, Globe, ExternalLink, ZoomIn, Volume2
} from 'lucide-react';
import TTSView from './TTSView';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { withRetry, getGeminiAI, streamContentWithRetry } from '../lib/gemini';
import { PromptEnhancer } from './PromptEnhancer';
import { toast } from 'sonner';

interface AIStudioViewProps {
  t: any;
  addActivity: (type: any, title: string, details: string, view?: any, itemId?: string) => void;
  viewState: any;
  updateViewState: (updates: any) => void;
}

export default function AIStudioView({ t, addActivity, viewState, updateViewState, mode = 'all' }: AIStudioViewProps & { mode?: 'image' | 'translation' | 'all' }) {
  const [activeTab, setActiveTab] = useState<'image' | 'translate' | 'history' | 'tts'>(
    mode === 'translation' ? 'translate' : 'image'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Image Generator State
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt: string; base64?: string }[]>(viewState.images || []);
  const [imageStyle, setImageStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; prompt: string } | null>(null);
  const [referenceImage, setReferenceImage] = useState<{ url: string; base64: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  
  // Translator State
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('fr');

  const saveToHistory = (title: string, userText: string, aiText: string) => {
    const id = Date.now().toString();
    const newConv = {
      id,
      title,
      messages: [
        { id: '1', role: 'user', content: userText },
        { id: '2', role: 'model', content: aiText }
      ],
      chatSession: null,
      uploadedFile: null,
      timestamp: new Date()
    };
    
    updateViewState({
      conversations: [newConv, ...(viewState.conversations || [])]
    });
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() && !referenceImage) return;
    setIsGenerating(true);
    try {
      await withRetry(async () => {
        const ai = getGeminiAI();
        const isEditing = editingImageIndex !== null;
        const baseImage = isEditing ? generatedImages[editingImageIndex] : null;

        const brandingRules = `IMPORTANT BRANDING GUIDELINES: The background and context MUST be relevant to the specific location if requested (e.g., if Peru, the background must look like Peru). The primary brand color is red, not yellow; prioritize red elements. If a logo is requested, ONLY use the brand logo set in Settings (or a plain-text brand name). Never use any other logos or names. If the user explicitly states NO LOGOS, do not include any text or logos at all. Make sure the context inherently matches the configured brand identity.`;

        const promptText = isEditing 
          ? `TASK: TRANSFORM IMAGE STYLE. 
             Current image content must be preserved but COMPREHENSIVELY RE-RENDERED in the following style: ${imageStyle}.
             Requested changes: ${imagePrompt || 'Apply style transformation'}.
             Technical Directive: If the original is photorealistic and target is 3D Render, recreate the subject as a high-fidelity 3D model. If target is 2D Flat, simplify vectors and colors.
             Style to strictly follow: ${imageStyle}.
             ${brandingRules}`
          : referenceImage 
            ? `TASK: GENERATE IMAGE FROM REFERENCE.
               Use the attached reference for composition, lighting, and subject layout.
               New Prompt: ${imagePrompt || 'highly detailed visual'}.
               Target Artistic Style: ${imageStyle}.
               Instruction: Re-render the scene strictly in ${imageStyle} while maintaining the visual weight of the reference.
               ${brandingRules}`
            : `Create a ${imageStyle} image of: ${imagePrompt}. Ensure the ${imageStyle} aesthetic is dominant.
               ${brandingRules}`;

        const contents: any[] = [{
          role: 'user',
          parts: [{ text: promptText }],
        }];

        // Add base image if editing
        if (isEditing && baseImage?.base64) {
          contents[0].parts.push({
            inlineData: {
              data: baseImage.base64,
              mimeType: 'image/png'
            }
          });
        } 
        // Add reference image if provided
        else if (referenceImage) {
          contents[0].parts.push({
            inlineData: {
              data: referenceImage.base64,
              mimeType: 'image/png'
            }
          });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents,
          config: {
            imageConfig: {
              aspectRatio: aspectRatio === '1:1' ? '1:1' : aspectRatio === '16:9' ? '16:9' : aspectRatio === '9:16' ? '9:16' : '4:3'
            }
          }
        });

        let foundImage = false;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
              const base64Bytes = part.inlineData.data;
              const imageUrl = `data:image/png;base64,${base64Bytes}`;
              const newImage = { 
                url: imageUrl, 
                prompt: isEditing ? `Edit of: ${baseImage?.prompt} -> ${imagePrompt}` : imagePrompt,
                base64: base64Bytes
              };
              const newImages = [newImage, ...generatedImages];
              setGeneratedImages(newImages);
              updateViewState({ images: newImages });
              
              addActivity('ai-studio', 'Image Generated', `New image created: ${imagePrompt.substring(0, 30)}...`, 'ai-studio');
              saveToHistory(`Image: ${imagePrompt.substring(0, 20)}...`, imagePrompt, `[Image Generated]`);

              foundImage = true;
              setEditingImageIndex(null); // Clear editing state after success
              setReferenceImage(null); // Clear reference image after success
              setImagePrompt('');
              break;
          }
        }
        
        if (!foundImage) throw new Error("No image data in response");
      });
      
      toast.success("Image generated successfully!");
    } catch (error: any) {
      console.error('Image generation error:', error);
      const errStr = String(error?.message || error).toLowerCase();
      if (errStr.includes('unavailable in your region')) return;
      const isQuotaError = error?.status === 429 || errStr.includes('429') || errStr.includes('quota') || errStr.includes('resource_exhausted');
      const isBusy = error?.status === 503 || errStr.includes('503') || errStr.includes('high demand') || errStr.includes('service unavailable');
      const isCreditsDepleted = !isQuotaError && !isBusy && (errStr.includes('prepayment credits') || errStr.includes('insufficient_credits'));

      if (isCreditsDepleted) {
          toast.error("Your AI Studio prepayment credits are depleted. Please check your billing.");
      } else if (isBusy) {
          toast.error("AI service is currently under very high demand and failed after several attempts. Please try again in 1-2 minutes.");
      } else if (isQuotaError) {
          toast.error("Image generation quota exceeded. Please try again later.");
      } else {
          toast.error("Failed to generate image. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large. Please select an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setReferenceImage({ url: reader.result as string, base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    setTranslatedText('');
    
    try {
      const prompt = `Original Text: ${sourceText}\n\nTask: Translate this text STRICTLY into ${targetLang}. Do NOT change the meaning or add any additional localization or comments. Just return the translation in ${targetLang}.`;
      const systemInstruction = `You are a professional expert marketing translator. 
            Your goal is to produce localized, high-impact, marketing-worthy content in the STRICT target language requested.
            
            Specific Target Language Requirements:
            - If Spanish is requested, use professional marketing Spanish (avoiding regional dialects of other languages).
            - If Urdu (Traditional) is requested, use the traditional Arabic-based script.
            - If Urdu (Roman) is requested, use the Romanized phonetic spelling of Urdu.
            - If Turkish is requested, use professional marketing Turkish.
            - Always use a tone that resonates with a professional and innovative brand.`;

      const resultText = await streamContentWithRetry(
        prompt,
        (chunkText) => {
          setTranslatedText(chunkText);
        },
        systemInstruction,
        "gemini-3.1-pro-preview"
      );

      setTranslatedText(resultText);
      addActivity('ai-studio', 'Content Translated', `Localized content into ${targetLang}`, 'ai-studio');
      saveToHistory(`Translation: ${sourceText.substring(0, 20)}...`, sourceText, resultText);
      toast.success("Translation complete!");
    } catch (error: any) {
      console.error('Translation error:', error);
      const errStr = String(error?.message || error).toLowerCase();
      if (errStr.includes('unavailable in your region')) return;
      const isBusy = error?.status === 503 || errStr.includes('503') || errStr.includes('high demand') || errStr.includes('service unavailable');
      const isQuota = error?.status === 429 || errStr.includes('429') || errStr.includes('quota');
      
      if (isBusy) {
        toast.error("AI service is busy. Please try again in a moment.");
      } else if (isQuota) {
        toast.error("Rate limit exceeded. Please wait a moment.");
      } else {
        toast.error("Failed to translate text.");
      }
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto border-x bg-white/40 dark:bg-card/50 backdrop-blur-xl relative shadow-2xl">
      <section className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <header className="px-4 lg:px-8 py-4 border-b bg-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {mode === 'translation' ? (
                  <Languages className="w-5 h-5 md:w-6 md:h-6 text-foreground shrink-0" />
                ) : mode === 'image' ? (
                  <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-foreground shrink-0" />
                ) : (
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-foreground shrink-0" />
                )}
                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight truncate font-heading text-foreground">
                  {mode === 'translation' ? 'Translation Engine' : mode === 'image' ? 'Image Generation' : 'AI Creative Studio'}
                </h2>
              </div>
              <p className="text-[10px] md:text-[11px] text-muted-foreground italic serif opacity-80 truncate">
                 {mode === 'translation' ? 'Translate your marketing materials instantly across 50+ languages.' : mode === 'image' ? 'Generate stunning brand-aligned visuals and art locally.' : 'Powering your marketing with cutting-edge AI. Generate visuals, translate campaigns, and scale your brand values globally.'}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-4 pb-20">
          <div className="max-w-6xl mx-auto w-full space-y-6">

          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
            <TabsList className={`grid w-full ${mode === 'all' ? 'grid-cols-4' : 'grid-cols-2'} h-11 lg:h-14 p-1 bg-secondary/50 backdrop-blur-md border border-primary/10 rounded-xl lg:rounded-2xl mb-6 shadow-inner`}>
              {(mode === 'all' || mode === 'image') && (
                <TabsTrigger 
                  value="image" 
                  className="rounded-lg lg:rounded-xl data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold uppercase tracking-widest text-[10px] lg:text-xs gap-2 transition-all duration-300"
                >
                  <ImageIcon className="w-3.5 h-3.5 lg:w-4 h-4 hidden sm:block" /> Image
                </TabsTrigger>
              )}
              {(mode === 'all' || mode === 'translation') && (
                <TabsTrigger 
                  value="translate" 
                  className="rounded-lg lg:rounded-xl data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold uppercase tracking-widest text-[10px] lg:text-xs gap-2 transition-all duration-300"
                >
                  <Languages className="w-3.5 h-3.5 lg:w-4 h-4 hidden sm:block" /> Translate
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="history" 
                className="rounded-lg lg:rounded-xl data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold uppercase tracking-widest text-[10px] lg:text-xs gap-2 transition-all duration-300"
              >
                <History className="w-3.5 h-3.5 lg:w-4 h-4 hidden sm:block" /> History
              </TabsTrigger>
              {mode === 'all' && (
                <TabsTrigger 
                  value="tts" 
                  className="rounded-lg lg:rounded-xl data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold uppercase tracking-widest text-[10px] lg:text-xs gap-2 transition-all duration-300"
                >
                  <Volume2 className="w-3.5 h-3.5 lg:w-4 h-4 hidden sm:block" /> Voiceover
                </TabsTrigger>
              )}
            </TabsList>

            <AnimatePresence mode="wait">
              {activeTab === 'image' && (
                <motion.div
                  key="image"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                >
                  <div className="lg:col-span-5 space-y-6">
                    <Card className="glass-card border-primary/10 shadow-xl overflow-hidden rounded-2xl">
                      <CardHeader className="bg-primary/5 border-b border-primary/10 p-4">
                        <CardTitle className="text-[11px] font-semibold uppercase tracking-widest flex items-center gap-2">
                          <Wand2 className="w-3.5 h-3.5 text-primary" /> Generator Config
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                        <div className="space-y-2 lg:space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {editingImageIndex !== null ? 'Modify Image Request' : 'Concept Prompt'}
                            </label>
                            <div className="flex items-center gap-1">
                              <PromptEnhancer 
                                value={imagePrompt} 
                                onEnhance={setImagePrompt}
                                context="image_generation"
                              />
                              {editingImageIndex !== null && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-[10px] text-destructive hover:text-destructive font-semibold"
                                  onClick={() => {
                                    setEditingImageIndex(null);
                                    setImagePrompt('');
                                  }}
                                >
                                  Cancel Edit
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {editingImageIndex !== null && (
                            <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-xl border border-primary/10 mb-2">
                              <img 
                                src={generatedImages[editingImageIndex].url} 
                                className="w-10 h-10 rounded-lg object-cover ring-2 ring-primary/20" 
                                alt="Editing base"
                              />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-[9px] font-semibold uppercase text-primary tracking-tighter">Editing Active</p>
                                <p className="text-[9px] text-muted-foreground truncate italic">
                                  {generatedImages[editingImageIndex].prompt}
                                </p>
                              </div>
                            </div>
                          )}

                          {referenceImage && (
                            <div className="flex items-center gap-3 p-2 bg-amber-500/5 rounded-xl border border-amber-500/10 mb-2 group relative">
                              <img 
                                src={referenceImage.url} 
                                className="w-10 h-10 rounded-lg object-cover ring-2 ring-amber-500/20" 
                                alt="Reference"
                              />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-[9px] font-semibold uppercase text-amber-600 tracking-tighter">Reference Image Loaded</p>
                                <p className="text-[9px] text-muted-foreground truncate italic">The AI will use this as a style/content guide.</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 absolute -top-2 -right-2 bg-background border shadow-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setReferenceImage(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}

                          <div className="relative group">
                            <Textarea 
                              placeholder={editingImageIndex !== null ? "Describe the changes (e.g., 'Change the hat to red', 'Make the car blue')..." : "Describe your vision (e.g., 'A professional delivery driver in a vibrant cityscape, cinematic lighting, 8k resolution')..."}
                              className="min-h-[100px] lg:min-h-[140px] resize-none rounded-xl border-primary/10 focus-visible:ring-primary/50 text-xs lg:text-sm p-3 lg:p-4 pr-12"
                              value={imagePrompt}
                              onChange={(e) => setImagePrompt(e.target.value)}
                            />
                            <div className="absolute bottom-2 right-2 flex flex-col gap-2">
                              <input 
                                type="file" 
                                ref={fileRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className={`h-8 w-8 rounded-lg ${referenceImage ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-background/50 hover:bg-primary/10 hover:text-primary border-primary/10'} transition-all`}
                                onClick={() => fileRef.current?.click()}
                                title="Upload Reference Image"
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:gap-4">
                          <div className="space-y-2 lg:space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Visual Style</label>
                            <Select value={imageStyle} onValueChange={setImageStyle}>
                              <SelectTrigger className="rounded-xl border-primary/10">
                                <SelectValue placeholder="Select Style" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="photorealistic">Photorealistic</SelectItem>
                                <SelectItem value="cinematic">Cinematic</SelectItem>
                                <SelectItem value="flat-design">Flat Illustration</SelectItem>
                                <SelectItem value="minimalist">Minimalist</SelectItem>
                                <SelectItem value="bold-marketing">Bold Marketing</SelectItem>
                                <SelectItem value="3d-render">3D Abstract</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Frame Ratio</label>
                            <Select value={aspectRatio} onValueChange={(val: any) => setAspectRatio(val)}>
                              <SelectTrigger className="rounded-xl border-primary/10">
                                <SelectValue placeholder="Select Ratio" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1:1">Square (1:1)</SelectItem>
                                <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                                <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                                <SelectItem value="4:3">Standard (4:3)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button 
                          className="w-full h-12 rounded-xl font-semibold uppercase tracking-widest text-xs gap-2 shadow-lg shadow-primary/20"
                          onClick={handleGenerateImage}
                          disabled={isGenerating || !imagePrompt.trim()}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              {editingImageIndex !== null ? 'Applying Changes...' : 'Crafting Visuals...'}
                            </>
                          ) : (
                            <>
                              {editingImageIndex !== null ? <PenTool className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                              {editingImageIndex !== null ? 'Apply Changes' : 'Generate Image'}
                            </>
                          )}
                        </Button>

                        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                          <AlertCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                            <b>Pro Tip:</b> Image generation is a high-resource task. If you hit quota limits, consider adding your own API key in <b>Settings</b> for higher priority and throughput.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card border-primary/10 rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold uppercase tracking-widest">Inspiration Keywords</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2 pt-0">
                        {['High resolution', 'Cinematic', 'Soft lighting', 'Bokeh', 'Hyper-realistic', 'Vibrant colors', 'Minimalist', 'Editorial photography'].map(tag => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1 px-3 rounded-lg" onClick={() => setImagePrompt(prev => prev + (prev ? ', ' : '') + tag)}>
                            {tag}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-7 space-y-6">
                    <Card className="glass-card border-primary/10 h-full min-h-[400px] lg:min-h-[600px] flex flex-col rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                        <CardTitle className="text-[11px] font-semibold uppercase tracking-widest flex items-center gap-2">
                          <History className="w-3.5 h-3.5 text-primary" /> Creative Output
                        </CardTitle>
                        {generatedImages.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => setGeneratedImages([])} className="h-6 text-[10px] font-bold text-muted-foreground hover:text-destructive px-2">Clear All</Button>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col p-4 lg:p-6 pt-0">
                        {generatedImages.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 lg:space-y-4 opacity-50">
                            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 lg:w-10 lg:h-10 text-primary/40" />
                            </div>
                            <div>
                              <p className="font-bold text-base lg:text-lg">No images generated yet</p>
                              <p className="text-[10px] lg:text-sm">Enter a prompt to see the magic happen.</p>
                            </div>
                          </div>
                        ) : (
                          <ScrollArea className="h-[400px] lg:h-[600px] pr-2 lg:pr-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                              {generatedImages.map((img, i) => (
                                <motion.div 
                                  key={i} 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="group relative rounded-xl overflow-hidden shadow-lg border border-primary/5"
                                >
                                  <img 
                                    src={img.url} 
                                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110" 
                                    alt="Generated AI"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <p className="text-white text-xs line-clamp-2 mb-3 font-medium opacity-80 italic">"{img.prompt}"</p>
                                    <div className="flex gap-2">
                                      <Button variant="secondary" size="sm" className="h-8 px-3 rounded-lg bg-primary text-white border-none text-[10px] font-bold uppercase tracking-wider" onClick={() => {
                                        setEditingImageIndex(i);
                                        setActiveTab('image'); // Make sure we are in image tab
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}>
                                        <PenTool className="w-3.5 h-3.5 mr-1" /> Edit
                                      </Button>
                                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-none" onClick={() => setSelectedImage({ url: img.url, prompt: img.prompt })}>
                                        <Maximize2 className="w-4 h-4" />
                                      </Button>
                                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-none" onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = img.url;
                                        link.download = `studio-ai-gen-${Date.now()}.png`;
                                        link.click();
                                      }}>
                                        <Download className="w-4 h-4" />
                                      </Button>
                                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-none" onClick={() => {
                                        navigator.clipboard.writeText(img.url);
                                        toast.success("Image copied to clipboard!");
                                      }}>
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}
              {activeTab === 'translate' && (
                <motion.div
                  key="translate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                >
                  <div className="lg:col-span-12">
                    <Card className="glass-card border-primary/10 rounded-2xl shadow-xl overflow-hidden">
                      <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold uppercase tracking-widest flex items-center gap-2">
                          <Languages className="w-4 h-4 text-primary" /> Multi-Language Bridge
                        </CardTitle>
                        <div className="flex items-center gap-4">
                          <Select value={sourceLang} onValueChange={setSourceLang}>
                            <SelectTrigger className="w-40 rounded-xl bg-background/50 border-primary/10">
                              <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Detect Language</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="pt">Portuguese</SelectItem>
                              <SelectItem value="ru">Russian</SelectItem>
                              <SelectItem value="am">Amharic</SelectItem>
                            </SelectContent>
                          </Select>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <Select value={targetLang} onValueChange={setTargetLang}>
                            <SelectTrigger className="w-40 rounded-xl bg-background/50 border-primary/10">
                              <SelectValue placeholder="Target" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="pt">Portuguese</SelectItem>
                              <SelectItem value="ar">Arabic</SelectItem>
                              <SelectItem value="ru">Russian</SelectItem>
                              <SelectItem value="am">Amharic</SelectItem>
                              <SelectItem value="tr">Turkish</SelectItem>
                              <SelectItem value="ur">Urdu (Traditional)</SelectItem>
                              <SelectItem value="ur-roman">Urdu (Roman)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 lg:p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[450px]">
                           {/* Source Pod */}
                           <div className="flex flex-col rounded-2xl border-2 border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden bg-card">
                             <div className="p-5 flex flex-col h-full space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                  <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground dark:text-gray-400">Source Marketing Text</label>
                                </div>
                                <div className="flex items-center gap-2">
                                  {sourceText && (
                                    <Button variant="ghost" size="sm" className="h-8 text-destructive px-2 rounded-lg hover:bg-destructive/10" onClick={() => setSourceText('')}><X className="w-4 h-4" /></Button>
                                  )}
                                </div>
                              </div>
                              
                               <div className="text-[10px] text-muted-foreground dark:text-gray-400 bg-red-500/5 dark:bg-white/[0.03] p-3 rounded-xl border border-red-500/10 dark:border-white/5 mb-2 italic leading-relaxed">
                                 <span className="font-semibold uppercase tracking-widest text-[9px] block mb-1 text-red-500 dark:text-red-400">Linguistic Notice:</span>
                                 To translate PDF, Word, or Excel documents, please use the <strong>Translate Large Documents</strong> button below.
                               </div>
                              
                              <div className="flex-1 relative">
                                <Textarea 
                                  placeholder="Type or paste your marketing copy here..."
                                  className="h-full w-full resize-none border-none focus-visible:ring-0 text-base leading-relaxed p-0 bg-transparent min-h-[250px] dark:placeholder:text-muted-foreground/30"
                                  value={sourceText}
                                  onChange={(e) => setSourceText(e.target.value)}
                                />
                              </div>
                             </div>
                             {/* Decorative accent */}
                             <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                          </div>

                          {/* Target Pod */}
                          <div className="flex flex-col rounded-2xl border-2 border-indigo-500/20 shadow-xl relative group overflow-hidden bg-indigo-50/50 dark:border-indigo-500/30">
                             <div className="p-5 flex flex-col h-full space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                  <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground dark:text-indigo-300">Translation Result</label>
                                </div>
                                {translatedText && (
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-background/50 dark:bg-background/80 border border-primary/10 dark:border-primary/30"
                                      onClick={() => {
                                        navigator.clipboard.writeText(translatedText);
                                        toast.success("Copied to clipboard!");
                                      }}
                                    >
                                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-base leading-relaxed p-1">
                                {isTranslating ? (
                                  <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                    <p className="text-sm font-semibold uppercase tracking-widest italic animate-pulse text-primary">Processing...</p>
                                  </div>
                                ) : translatedText ? (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full"
                                  >
                                    {translatedText}
                                  </motion.div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-40 py-12">
                                    <Globe className="w-10 h-10 text-primary/40" />
                                    <p className="text-xs text-center font-medium italic">Translation will appear here after clicking translate.</p>
                                  </div>
                                )}
                              </div>
                             </div>
                             {/* Decorative accent */}
                             <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
                          </div>
                        </div>

                        <div className="p-4 lg:p-6 pt-0 flex flex-wrap gap-4 mt-2">
                          <Button 
                            className="flex-1 md:flex-none min-w-[200px] h-12 rounded-xl font-semibold uppercase tracking-widest text-xs gap-2 shadow-lg"
                            disabled={isTranslating || !sourceText.trim()}
                            onClick={handleTranslate}
                          >
                            {isTranslating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Languages className="w-5 h-5" />}
                            Translate Content
                          </Button>
                          
                          <Button 
                            variant="outline"
                            className="flex-1 md:flex-none min-w-[220px] h-12 rounded-xl font-semibold uppercase tracking-widest text-xs gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300 group shadow-sm"
                            onClick={() => window.open('https://www.onlinedoctranslator.com/en/translationform', '_blank')}
                          >
                            <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Translate Large Documents
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                       <Card className="glass-card border-none bg-indigo-500/5 p-6 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                              <FileType className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h4 className="font-semibold text-xs uppercase tracking-widest">Global Support</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            Scale your brand globally with native localized content for Latin America, Africa, Russia, and Ethiopia.
                          </p>
                       </Card>
                       <Card className="glass-card border-none bg-emerald-500/5 p-6 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <Globe className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h4 className="font-semibold text-xs uppercase tracking-widest">Global Nuance</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            Our AI understands local slang and business etiquette, ensuring your campaigns sound native, not robotic.
                          </p>
                       </Card>
                       <Card className="glass-card border-none bg-amber-500/5 p-6 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                              <Palette className="w-5 h-5 text-amber-500" />
                            </div>
                            <h4 className="font-semibold text-xs uppercase tracking-widest">Brand Voice Preservation</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            The translator uses your defined "Tone of Voice" from settings to match your brand across all languages.
                          </p>
                       </Card>
                    </div>
                  </div>
                </motion.div>
              )}
  {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <Card className="glass-card border-primary/10 shadow-xl rounded-2xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10 p-4">
                      <CardTitle className="text-[11px] font-semibold uppercase tracking-widest flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-primary" /> AI Studio Activity History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-4">
                          {(viewState.conversations || []).length > 0 ? (
                            viewState.conversations.map((conv: any) => (
                              <Card key={conv.id} className="glass-card border-primary/5 hover:border-primary/20 transition-all p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      {conv.title.startsWith('Image') ? (
                                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                                      ) : (
                                        <Languages className="w-3.5 h-3.5 text-indigo-500" />
                                      )}
                                      <h3 className="font-bold text-sm tracking-tight">{conv.title}</h3>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-light tracking-widest">
                                      {new Date(conv.timestamp).toLocaleString()}
                                    </p>
                                    <div className="mt-3 bg-secondary/20 p-3 rounded-xl border border-primary/5">
                                      <p className="text-xs font-normal text-foreground line-clamp-3 leading-relaxed">
                                        {conv.messages[1]?.content || 'No content available'}
                                      </p>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-lg h-8 text-[10px] font-semibold uppercase tracking-widest"
                                    onClick={() => updateViewState({ activeConversationId: conv.id })}
                                  >
                                    Open
                                  </Button>
                                </div>
                              </Card>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                              <History className="w-12 h-12" />
                              <div>
                                <h3 className="text-sm font-bold">No History Yet</h3>
                                <p className="text-[10px] max-w-xs mx-auto italic">Start generating images or translating content to see your activity here.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              {activeTab === 'tts' && (
                <motion.div
                  key="tts"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <TTSView isEmbedded={true} />
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>

        </div>
      </div>
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-y-auto"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-5xl w-full flex flex-col items-center gap-6 my-auto"
              onClick={e => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="fixed top-6 right-6 text-white bg-white/10 hover:bg-white/20 rounded-full h-12 w-12 z-[110]"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-8 h-8" />
              </Button>
              
              <div className="w-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group bg-black/20">
                <img
                  src={selectedImage.url}
                  alt="Enlarged Visual"
                  className="w-full h-auto object-contain max-h-[70vh] mx-auto"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 px-4 rounded-xl bg-white/10 backdrop-blur-xl hover:bg-white/20 text-white border border-white/10 font-bold uppercase tracking-wider text-[10px]"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedImage.url;
                      link.download = `creative-studio-exp-${Date.now()}.png`;
                      link.click();
                    }}
                  >
                    <Download className="w-3.5 h-3.5 mr-2" /> Download
                  </Button>
                </div>
              </div>

              <div className="max-w-4xl w-full bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-semibold">Generation Prompt</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] text-white/60 hover:text-white uppercase font-bold"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedImage.prompt);
                      toast.success("Prompt copied!");
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1.5" /> Copy Prompt
                  </Button>
                </div>
                <ScrollArea className="max-h-[150px]">
                  <p className="text-white text-base md:text-lg font-medium leading-relaxed italic pr-4">
                    "{selectedImage.prompt}"
                  </p>
                </ScrollArea>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <p className="text-white/20 text-[9px] uppercase tracking-widest font-bold">Creative Studio Output</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </section>
    </div>
  );
}

