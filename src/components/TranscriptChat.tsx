import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  MessageSquare, Send, User, Bot, Copy, Check, 
  Trash2, Maximize2, Minimize2, Sparkles, 
  HelpCircle, ListChecks, Users, Lightbulb, Quote,
  Loader2, ArrowDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { TranscriptionResult, ChatMessage } from '@/types';

interface TranscriptChatProps {
  result: TranscriptionResult;
  onSendMessage: (resultId: string, message: string) => Promise<void>;
  onClearChat: (resultId: string) => void;
}

const SUGGESTED_QUESTIONS = [
  { label: 'Summarize Key Points', icon: Sparkles, prompt: 'Provide a structured summary of the key discussion points and conclusions from this transcript.' },
  { label: 'Action Items & Next Steps', icon: ListChecks, prompt: 'Extract all action items, decisions made, and designated next steps from this audio transcript.' },
  { label: 'Speaker Breakdown', icon: Users, prompt: 'Break down who spoke in this transcript and summarize what each person contributed.' },
  { label: 'Key Quotes & Citations', icon: Quote, prompt: 'List the most notable quotes from the transcript with the speaker and context.' },
  { label: 'Questions Raised', icon: HelpCircle, prompt: 'What questions or concerns were raised during this conversation, and were they resolved?' },
];

export const TranscriptChat: React.FC<TranscriptChatProps> = ({
  result,
  onSendMessage,
  onClearChat,
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatHistory = result.chatHistory || [];
  const isChatting = result.isChatting || false;

  // Auto scroll to bottom when messages update or streaming
  useEffect(() => {
    if (chatHistory.length > 0 || isChatting) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatting]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isChatting) return;

    setInput('');
    await onSendMessage(result.id, textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatMessageTime = (timestamp?: string | Date) => {
    if (!timestamp) return '';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-secondary/15 border-t border-border/70 flex flex-col">
      {/* Header bar */}
      <div className="px-6 py-3.5 flex items-center justify-between border-b border-border/40 bg-card/40 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold tracking-tight text-foreground">
                Transcript AI Chat
              </h4>
              {chatHistory.length > 0 && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-mono">
                  {chatHistory.length} {chatHistory.length === 1 ? 'message' : 'messages'}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Ask questions, analyze quotes, or extract insights from this transcript
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {chatHistory.length > 0 && (
            <>
              {showClearConfirm ? (
                <div className="flex items-center gap-1 bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-0.5 animate-in fade-in">
                  <span className="text-[10px] font-medium text-destructive">Clear all?</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/20 font-bold"
                    onClick={() => {
                      onClearChat(result.id);
                      setShowClearConfirm(false);
                    }}
                  >
                    Yes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] text-muted-foreground hover:bg-secondary"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowClearConfirm(true)}
                  title="Clear chat history"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
            onClick={() => setIsExpanded(prev => !prev)}
            title={isExpanded ? 'Collapse height' : 'Expand chat height'}
            aria-label={isExpanded ? 'Collapse height' : 'Expand chat height'}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Suggested prompts row (always visible as quick actions) */}
      <div className="px-6 py-2 border-b border-border/30 bg-muted/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground shrink-0 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-primary" /> Suggestions:
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {SUGGESTED_QUESTIONS.map((sq, i) => {
            const Icon = sq.icon;
            return (
              <button
                key={i}
                type="button"
                disabled={isChatting}
                onClick={() => handleSend(sq.prompt)}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-background/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-border/60 transition-all text-foreground/80 shrink-0 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon className="w-3 h-3 text-primary/70 shrink-0" />
                <span>{sq.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <ScrollArea className={`${isExpanded ? 'h-[500px]' : chatHistory.length > 0 ? 'h-[320px]' : 'h-[160px]'} transition-all duration-300`}>
        <div className="p-6 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 opacity-75">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-sm">
                <p className="text-xs font-semibold text-foreground">Start a structured conversation</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ask anything about the audio transcript. Get structured answers with bullet points, speaker quotes, and actionable takeaways.
                </p>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={i} 
                  className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                    isUser 
                      ? 'bg-primary text-primary-foreground font-semibold text-xs' 
                      : 'bg-primary/10 border border-primary/20 text-primary'
                  }`}>
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%] sm:max-w-[82%]`}>
                    {/* Role Header */}
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-muted-foreground">
                      <span className="font-semibold">
                        {isUser ? 'You' : 'Transcript Analyst'}
                      </span>
                      {msg.timestamp && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{formatMessageTime(msg.timestamp)}</span>
                        </>
                      )}
                    </div>

                    {/* Content Box */}
                    {isUser ? (
                      <div className="px-4 py-2.5 rounded-2xl rounded-tr-none bg-primary text-primary-foreground text-xs leading-relaxed font-medium shadow-sm whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="w-full bg-card/90 border border-border/80 rounded-2xl rounded-tl-none p-4 shadow-sm space-y-3">
                        {/* Rich Markdown Rendering */}
                        <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none 
                          prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-headings:mt-3.5 prose-headings:mb-1.5
                          prose-h1:text-sm prose-h2:text-xs prose-h3:text-xs prose-h3:uppercase prose-h3:tracking-wider prose-h3:text-primary
                          prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-1.5
                          prose-ul:my-2 prose-ul:pl-4 prose-li:my-1 prose-li:text-foreground/90
                          prose-ol:my-2 prose-ol:pl-4 prose-ol:list-decimal
                          prose-strong:font-bold prose-strong:text-foreground
                          prose-blockquote:border-l-2 prose-blockquote:border-primary/60 prose-blockquote:bg-muted/40 prose-blockquote:py-1.5 prose-blockquote:px-3 prose-blockquote:rounded-r-md prose-blockquote:italic prose-blockquote:my-2.5 prose-blockquote:text-muted-foreground
                          prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:bg-muted prose-code:font-mono prose-code:text-[11px]
                          prose-table:w-full prose-table:my-2 prose-table:border-collapse
                          prose-th:border prose-th:border-border prose-th:p-1.5 prose-th:bg-muted/50 prose-th:text-xs prose-th:font-semibold
                          prose-td:border prose-td:border-border prose-td:p-1.5 prose-td:text-xs">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {/* Assistant Footer Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                          <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-primary/70" />
                            Grounded in audio transcript
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] rounded-md gap-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                            onClick={() => handleCopy(msg.content, i)}
                          >
                            {copiedIndex === i ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Thinking / Streaming Indicator */}
          {isChatting && (
            <div className="flex gap-3 items-start animate-in fade-in duration-200">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-card/90 border border-border/80 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-medium">
                  Analyzing transcript & structuring answer...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input bar */}
      <div className="p-4 border-t border-border/40 bg-card/30 backdrop-blur-sm">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask a question about this transcript (e.g., 'What were the main decisions?')..."
              className="w-full bg-background border border-border rounded-xl pl-4 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-xs"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isChatting}
            />
          </div>

          <Button
            type="submit"
            size="default"
            className="rounded-xl px-4 py-2.5 h-auto text-xs font-semibold shrink-0 gap-1.5 shadow-sm"
            disabled={isChatting || !input.trim()}
          >
            {isChatting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Thinking...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

