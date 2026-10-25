import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Volume2, Upload, Loader2, Trash2, 
  FileAudio, MessageSquare, Globe,
  AlertCircle, X, Sparkles,
  History, Copy, PanelRightClose, PanelRightOpen, 
  ListChecks, Lightbulb, Target, FileText,
  Send, User, Bot, Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { getGeminiAI, withRetry, streamContentWithRetry } from '../lib/gemini';
import { Type, ThinkingLevel } from '@google/genai';
import { useAuth } from '@/contexts/FirebaseContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { TranscriptChat } from './TranscriptChat';
import { toast } from 'sonner';

interface StructuredTranscript {
  summary: string;
  keyPoints: string[];
  takeaways: string[];
  insights: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string | Date;
  tempId?: string;
}

interface TranscriptionResult {
  id: string;
  text: string;
  timestamp: Date;
  language: string;
  fileName?: string;
  structured?: StructuredTranscript;
  isProcessing?: boolean;
  chatHistory?: ChatMessage[];
  isChatting?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Original Language', flag: '🌍' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' }
];

export default function TranscribeView({ results, setResults, addActivity }: { 
  results: TranscriptionResult[], 
  setResults: React.Dispatch<React.SetStateAction<TranscriptionResult[]>>,
  addActivity: (type: any, title: string, details: string, view?: any, itemId?: string) => void
}) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcribingPhase, setTranscribingPhase] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleChat = async (resultId: string, messageText: string) => {
    if (!messageText?.trim()) return;

    const result = results.find(r => r.id === resultId);
    if (!result) return;

    const userMessage: ChatMessage = { 
      role: 'user', 
      content: messageText.trim(),
      timestamp: new Date()
    };

    const existingHistory = result.chatHistory || [];
    const updatedWithUser = [...existingHistory, userMessage];

    setResults(prev => prev.map(r => r.id === resultId ? { 
      ...r, 
      chatHistory: updatedWithUser,
      isChatting: true 
    } : r));

    try {
      // Build clean chronological dialogue turns for past messages (omit temp streaming items)
      const formattedHistory = existingHistory
        .filter(m => !(m as any).tempId)
        .slice(-8)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const prompt = `Below is an audio transcription. Please answer the user's question clearly, thoroughly, and using clean, structured Markdown formatting.

--- AUDIO TRANSCRIPTION ---
${result.text}
--- END AUDIO TRANSCRIPTION ---

${formattedHistory ? `--- PREVIOUS CONVERSATION ---\n${formattedHistory}\n--- END PREVIOUS CONVERSATION ---\n\n` : ''}User Question: ${messageText}

Structure your response with clear Markdown headings, bullet points, and citations where appropriate according to your instructions.`;

      const systemInstruction = `You are an expert Audio Transcript Analyst and Executive Intelligence Assistant.
Your mission is to answer user inquiries about the provided audio transcript in a well-structured, highly legible, and insightful manner.

Strict Formatting & Response Guidelines:
1. **Clear Structure & Organization**:
   - Start with a direct 1-2 sentence executive answer or summary.
   - Use clear Markdown headings (e.g. ### Key Takeaways, ### Decisions & Next Steps, ### Speaker Perspectives) to group information logically.
   - Use bullet points (•) and numbered lists rather than dense blocks of running text.
   - Highlight key names, figures, decisions, and dates using **bold text** to make it easily scannable.
2. **Transcript Citations & Verbatim Quotes**:
   - When citing specific statements, quotes, or timestamps, format them as clean blockquotes:
     > "[Quote from audio]" — [Speaker / Timestamp if available]
3. **Speaker Breakdown**:
   - If multiple speakers or timestamps exist in the transcript, attribute points accurately to their respective speakers.
4. **Accuracy & Grounding**:
   - Ground all answers strictly in the audio transcript text. If something was not discussed or is ambiguous in the audio, state so clearly and concisely rather than guessing.
5. **Language Matching**:
   - Answer in the same language as the user's question or the language of the transcript.`;

      const assistantMessageId = 'assistant-' + Date.now();
      let streamText = '';

      const finalContent = await streamContentWithRetry(
        prompt,
        (chunkText) => {
          streamText = chunkText;
          setResults(prev => prev.map(r => r.id === resultId ? { 
            ...r, 
            chatHistory: [
              ...(r.chatHistory || []).filter(msg => (msg as any).tempId !== assistantMessageId),
              { role: 'assistant', content: chunkText, timestamp: new Date(), tempId: assistantMessageId } as any
            ]
          } : r));
        },
        systemInstruction,
        "gemini-3.8-flash"
      );

      const finalAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: finalContent,
        timestamp: new Date()
      };

      const finalHistory = [
        ...updatedWithUser,
        finalAssistantMessage
      ];

      setResults(prev => prev.map(r => r.id === resultId ? { 
        ...r, 
        chatHistory: finalHistory,
        isChatting: false 
      } : r));

      // Persist to Firestore if user logged in
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'transcriptions', resultId), {
          chatHistory: finalHistory.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : (m.timestamp || new Date().toISOString())
          }))
        }, { merge: true }).catch(err => {
          console.warn("Could not save chat history to Firestore:", err);
        });
      }
    } catch (error) {
      console.error("Error in transcript chat:", error);
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, isChatting: false } : r));
    }
  };

  const handleClearChat = async (resultId: string) => {
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, chatHistory: [], isChatting: false } : r));
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'transcriptions', resultId), {
          chatHistory: []
        }, { merge: true });
      } catch (err) {
        console.warn("Could not clear chat history in Firestore:", err);
      }
    }
  };

  const copyStructured = (structured: StructuredTranscript) => {
    const text = `
Summary: ${structured.summary}

Key Points:
${structured.keyPoints.map(p => `• ${p}`).join('\n')}

Takeaways:
${structured.takeaways.map(t => `• ${t}`).join('\n')}

Insights:
${structured.insights.map(i => `• ${i}`).join('\n')}
    `.trim();
    copyToClipboard(text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const processTranscript = async (resultId: string, text: string, languageCode?: string) => {
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, isProcessing: true } : r));
    
    try {
      const langObj = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
      const langName = langObj?.code === 'auto' ? 'the original audio language' : (langObj?.name || 'the original language');
      
      let structured: any = null;

      // 1. Try server structure endpoint
      try {
        const serverRes = await fetch("/api/transcribe/structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: langName })
        });
        if (serverRes.ok) {
          const data = await serverRes.json();
          if (data.structured) {
            structured = data.structured;
          }
        }
      } catch (srvErr) {
        console.warn("Server-side structure extraction failed, attempting client fallback:", srvErr);
      }

      // 2. Client fallback
      if (!structured) {
        const ai = getGeminiAI();
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `Analyze the following transcript and provide a structured summary. 
          IMPORTANT: Your entire response (summary, key points, takeaways, and insights) MUST be written in ${langName}.
          Transcript: ${text}
          
          Provide the output in JSON format with the following structure:
          {
            "summary": "A concise summary of the transcript",
            "keyPoints": ["Point 1", "Point 2", ...],
            "takeaways": ["Takeaway 1", "Takeaway 2", ...],
            "insights": ["Insight 1", "Insight 2", ...]
          }`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                insights: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["summary", "keyPoints", "takeaways", "insights"]
            }
          }
        });

        let textToParse = response.text || "{}";
        if (textToParse.includes("```json")) {
          textToParse = textToParse.replace(/```json\n?/, '').replace(/\n?```/, '');
        } else if (textToParse.includes("```")) {
          textToParse = textToParse.replace(/```\n?/, '').replace(/\n?```/, '');
        }
        structured = JSON.parse(textToParse);
      }
      
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, structured, isProcessing: false } : r));
      
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'transcriptions', resultId), {
          structured,
          timestamp: serverTimestamp()
        }, { merge: true });
      }
    } catch (error: any) {
      console.error("Error processing transcript:", String(error?.message || error));
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, isProcessing: false } : r));
    }
  };

  const transcribeUploadedFile = async () => {
    if (!uploadFile) return;
    
    setIsTranscribing(true);
    setUploadProgress(5);
    setTranscribingPhase('Reading file...');
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev < 35) return prev + Math.floor(Math.random() * 4) + 1;
        if (prev < 85) return prev + Math.floor(Math.random() * 2) + 1;
        return prev;
      });
    }, 800);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.includes(',') ? result.split(',')[1] : result);
        };
        reader.onerror = (e) => reject(e);
      });
      reader.readAsDataURL(uploadFile);
      const base64Data = await base64Promise;

      setTranscribingPhase('Analyzing audio with AI...');

      const langObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);
      const langName = langObj?.code === 'auto' ? 'its original language (auto-detect)' : langObj?.name;

      const prompt = `Transcribe the following audio file accurately in ${langName}. Include speaker diarization using the speaker's actual name if detectable from the conversation (e.g. "Pamela [00:00]: text"). If the name is unknown, use "Speaker 1 [00:00]: text". Focus on clarity and correct terminology related to ride-hailing and marketplace logistics if mentioned. IMPORTANT: Provide ONLY plain raw text. Do NOT use any Markdown formatting, asterisks, bold text, or lists.`;
      
      let transcribedText = '';
      const newId = Date.now().toString();
      
      // Temporary initial result for streaming / progressive update
      const initialResult: TranscriptionResult = {
        id: newId,
        text: '',
        timestamp: new Date(),
        language: selectedLanguage,
        fileName: uploadFile.name,
        isProcessing: false
      };
      setResults(prev => [initialResult, ...prev]);

      // 1. Try server-side route first
      let success = false;
      try {
        const srvRes = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: uploadFile.type,
            language: langName,
            promptOverride: prompt
          })
        });

        if (srvRes.ok) {
          const data = await srvRes.json();
          if (data.text) {
            transcribedText = data.text;
            clearInterval(progressInterval);
            setUploadProgress(100);
            setResults(prev => prev.map(r => r.id === newId ? { ...r, text: transcribedText } : r));
            success = true;
          }
        } else {
          const errData = await srvRes.json().catch(() => ({}));
          console.warn("Server transcribe returned non-200, attempting client fallback:", errData);
        }
      } catch (srvErr) {
        console.warn("Server transcribe failed, attempting client fallback:", srvErr);
      }

      // 2. Client fallback with valid free models
      if (!success) {
        const ai = getGeminiAI();
        const modelsToTry = ["gemini-3.5-transcribe", "gemini-3.8-flash", "gemini-2.5-flash"];
        let lastError: any = null;

        for (const modelName of modelsToTry) {
          try {
            const stream = await ai.models.generateContentStream({
              model: modelName,
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        data: base64Data,
                        mimeType: uploadFile.type
                      }
                    },
                    { text: prompt }
                  ]
                }
              ]
            });

            let firstChunk = true;
            for await (const chunk of stream) {
              if (firstChunk) {
                clearInterval(progressInterval);
                setUploadProgress(100);
                setTranscribingPhase('Streaming transcription...');
                firstChunk = false;
              }
              const text = chunk.text;
              if (text) {
                transcribedText += text;
                setResults(prev => prev.map(r => r.id === newId ? { ...r, text: transcribedText } : r));
              }
            }
            if (transcribedText) {
              success = true;
              break;
            }
          } catch (mErr: any) {
            lastError = mErr;
            console.warn(`Client transcription with ${modelName} failed:`, mErr?.message || mErr);
          }
        }

        if (!success && !transcribedText) {
          throw lastError || new Error("Failed to transcribe file with available models.");
        }
      }

      setUploadProgress(100);
      
      if (transcribedText) {
        if (user) {
          setDoc(doc(db, 'users', user.uid, 'transcriptions', newId), {
            id: newId,
            text: transcribedText,
            timestamp: serverTimestamp(),
            language: selectedLanguage,
            fileName: uploadFile.name
          }).catch(console.error);
        }

        setUploadFile(null);
        addActivity('transcribe', 'Audio Transcribed', `Transcribed ${uploadFile.name} (${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name})`, 'transcribe', newId);
        toast.success("Transcription complete!");
        
        // Automatically process the transcript for structure
        processTranscript(newId, transcribedText, selectedLanguage);
      }
    } catch (error: any) {
      console.error("Error transcribing file:", String(error?.message || error));
      const errStr = String(error?.message || error);
      if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
        toast.error("AI rate limit reached. Please wait a moment and try again.");
      } else {
        toast.error(`Transcription error: ${error?.message || "Failed to transcribe audio file"}`);
      }
    } finally {
      clearInterval(progressInterval);
      setIsTranscribing(false);
      setTranscribingPhase('');
      setUploadProgress(0);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const deleteResult = async (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'transcriptions', id));
      } catch (e) {
        console.error("Error deleting transcription:", e);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1600px] mx-auto border-x bg-background/50 backdrop-blur-sm">
      <header className="pl-16 pr-4 lg:px-8 py-6 border-b bg-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="vibrant-icon-container w-12 h-12 vibrant-icon-purple">
            <FileAudio className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight font-heading">Audio Transcription</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Transform any audio and video files into accurate transcriptions, structured summaries, and key actionable insights. Content is automatically transcribed and analyzed in your selected language.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-40 rounded-xl bg-secondary/50 border-primary/10 transition-all hover:bg-secondary/70">
                <Globe className="w-3.5 h-3.5 text-primary mr-1" />
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="mr-2">{lang.flag}</span> {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card 
              className="glass-card border-dashed border-2 hover:border-primary/40 transition-all duration-500 group"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
                    setUploadFile(file);
                  }
                }
              }}
            >
              <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                {!uploadFile ? (
                  <>
                    <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      <FileAudio className="w-10 h-10 text-primary opacity-60" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold tracking-tight">Upload Audio Recording</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto italic serif">
                        Support for MP3, WAV, AAC, and other common formats.
                      </p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="audio/*"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl px-8 h-12 shadow-lg shadow-primary/20"
                    >
                      Select Audio File
                    </Button>
                    <p className="text-[11px] text-muted-foreground/60 max-w-sm mx-auto">
                      Choose a different language to transcribe into directly on the top right corner.
                    </p>
                  </>
                ) : (
                  <div className="w-full max-w-md space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileAudio className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="text-sm font-bold truncate">{uploadFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setUploadFile(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {isTranscribing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-primary font-heading">
                          <span>{transcribingPhase || 'Transcribing...'}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-1.5" />
                      </div>
                    )}
                    
                    <Button 
                      onClick={transcribeUploadedFile} 
                      disabled={isTranscribing}
                      className="w-full rounded-xl h-12 shadow-lg shadow-primary/20"
                    >
                      {isTranscribing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" /> Start Transcription</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results History */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 font-heading">
                  <History className="w-5 h-5 text-primary" /> Transcription History
                </h3>
                <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
                  {results.length} Results
                </Badge>
              </div>

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {results.map((result) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="glass-card hover:border-primary/20 transition-all group overflow-hidden">
                        <CardHeader className="p-4 border-b bg-secondary/5 flex flex-row items-center justify-between space-y-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-500">
                              <FileAudio className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold truncate max-w-[150px]">
                                  {result.fileName}
                                </span>
                                <Badge variant="secondary" className="text-[8px] h-4 px-1 font-semibold uppercase tracking-tighter">
                                  {SUPPORTED_LANGUAGES.find(l => l.code === result.language)?.flag} {result.language}
                                </Badge>
                              </div>
                              <p className="text-[9px] text-muted-foreground font-mono">
                                {result.timestamp.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => deleteResult(result.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x border-b">
                            {/* Raw Transcript */}
                            <div className="p-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary">
                                  <FileText className="w-4 h-4" />
                                  <h4 className="text-[10px] font-semibold uppercase tracking-widest">Raw Transcript</h4>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 px-2 text-[9px] font-semibold uppercase tracking-widest"
                                  onClick={() => copyToClipboard(result.text)}
                                >
                                  <Copy className="w-3 h-3 mr-1.5" /> Copy Raw
                                </Button>
                              </div>
                              <ScrollArea className="h-60">
                                <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap pr-4 prose dark:prose-invert">
                                  <ReactMarkdown>{result.text}</ReactMarkdown>
                                </div>
                              </ScrollArea>
                            </div>

                            {/* Structured Analysis */}
                            <div className="p-6 space-y-6 bg-secondary/5">
                              {result.isProcessing ? (
                                <div className="h-60 flex flex-col items-center justify-center space-y-4 opacity-50">
                                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                  <p className="text-[10px] font-semibold uppercase tracking-widest">Structuring Transcript...</p>
                                </div>
                              ) : result.structured ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-primary">
                                      <Sparkles className="w-4 h-4" />
                                      <h4 className="text-[10px] font-semibold uppercase tracking-widest">AI Analysis</h4>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 px-2 text-[9px] font-semibold uppercase tracking-widest"
                                      onClick={() => copyStructured(result.structured!)}
                                    >
                                      <Copy className="w-3 h-3 mr-1.5" /> Copy Analysis
                                    </Button>
                                  </div>
                                  <ScrollArea className="h-60 pr-4">
                                    <div className="space-y-6">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary">
                                          <MessageSquare className="w-4 h-4" />
                                          <h4 className="text-[10px] font-semibold uppercase tracking-widest">Summary</h4>
                                        </div>
                                        <p className="text-xs leading-relaxed text-muted-foreground italic serif">
                                          {result.structured.summary}
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 text-amber-500">
                                            <ListChecks className="w-4 h-4" />
                                            <h4 className="text-[10px] font-semibold uppercase tracking-widest">Key Points</h4>
                                          </div>
                                          <ul className="space-y-1">
                                            {result.structured.keyPoints.map((point, i) => (
                                              <li key={i} className="text-[10px] flex gap-2">
                                                <span className="text-amber-500">•</span>
                                                <span>{point}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>

                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 text-emerald-500">
                                            <Target className="w-4 h-4" />
                                            <h4 className="text-[10px] font-semibold uppercase tracking-widest">Takeaways</h4>
                                          </div>
                                          <ul className="space-y-1">
                                            {result.structured.takeaways.map((item, i) => (
                                              <li key={i} className="text-[10px] flex gap-2">
                                                <span className="text-emerald-500">•</span>
                                                <span>{item}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>

                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 text-purple-500">
                                            <Lightbulb className="w-4 h-4" />
                                            <h4 className="text-[10px] font-semibold uppercase tracking-widest">Insights</h4>
                                          </div>
                                          <ul className="space-y-1">
                                            {result.structured.insights.map((insight, i) => (
                                              <li key={i} className="text-[10px] flex gap-2">
                                                <span className="text-purple-500">•</span>
                                                <span>{insight}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  </ScrollArea>
                                </div>
                              ) : (
                                <div className="h-60 flex flex-col items-center justify-center space-y-4 opacity-30">
                                  <Sparkles className="w-8 h-8" />
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => processTranscript(result.id, result.text, result.language)}
                                    className="text-[10px] font-semibold uppercase tracking-widest"
                                  >
                                    Generate Structure
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Structured Chat Interface */}
                          <TranscriptChat 
                            result={result}
                            onSendMessage={handleChat}
                            onClearChat={handleClearChat}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {results.length === 0 && (
                  <div className="py-20 text-center space-y-4 opacity-30">
                    <MessageSquare className="w-12 h-12 mx-auto" />
                    <p className="text-sm italic serif">No transcriptions yet. Start by uploading an audio file.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar Info */}
        <AnimatePresence>
          {isSidebarVisible && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="hidden xl:flex w-80 border-l bg-card/30 flex-col overflow-hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-6 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary font-heading">Transcription Tips</h4>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSidebarVisible(false)}>
                        <PanelRightClose className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary">01</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          For best results, ensure the audio quality is clear and background noise is minimized.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary">02</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Select the correct language before starting to improve terminology accuracy for specific markets.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary">03</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          After transcription, the AI will automatically structure the text into summaries and key insights.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary font-heading">Markets</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                        <div key={lang.code} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-primary/5">
                          <span className="text-sm">{lang.flag}</span>
                          <span className="text-[10px] font-bold truncate">{lang.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest">Privacy Note</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic serif">
                      All audio data is processed securely. Recordings are not used for public model training.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>

        {!isSidebarVisible && (
          <div className="hidden xl:flex border-l bg-card/30 flex-col p-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSidebarVisible(true)}>
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

