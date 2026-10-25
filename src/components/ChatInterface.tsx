import React from 'react';
import { 
  PanelLeftClose, PanelLeftOpen, Check, X, Edit2, Trash2, Download, 
  ArrowRight, FileText, AlertTriangle, Copy, Loader2, Paperclip, XCircle, Square, Send 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { PromptEnhancer } from './PromptEnhancer';
import { ConversationSidebar } from './ConversationSidebar';

export interface ChatInterfaceProps {
  title: string;
  description: string;
  placeholder: string;
  emptyStateIcon: React.ReactNode;
  emptyStateSuggestions: {title: string, desc: string, prompt: string, icon?: any, color?: string}[];
  currentView: string;
  currentViewState: any;
  viewStates: Record<string, any>;
  initialViewState: any;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  t: any;
  createNewConversation: (view: string) => void;
  updateViewState: (view: string, updates: any) => void;
  deleteConversation: (view: string, id: string) => void;
  editingChatTitleId: string | null;
  setEditingChatTitleId: (id: string | null) => void;
  editedChatTitle: string;
  setEditedChatTitle: (title: string) => void;
  handleSaveChatTitle: (id: string, newTitle: string) => void;
  handleClearChat: () => void;
  handleExport: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  editingMessageContent: string;
  setEditingMessageContent: (content: string) => void;
  handleEditMessageSubmit: (messageId: string, conversationId: string, newContent: string) => void;
  userProfile: any;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleSend: (content: string) => void;
  handleStopGeneration: () => void;
  setViewStates: React.Dispatch<React.SetStateAction<any>>;
  saveConversation: (view: string, parsedConv: any) => void;
  addToast: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

const stripMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '') 
    .replace(/(\*\*|__)(.*?)\1/g, '$2') 
    .replace(/([*_])(.*?)\1/g, '$2') 
    .replace(/~~(.*?)~~/g, '$1') 
    .replace(/`([^`]+)`/g, '$1') 
    .replace(/```[\s\S]*?```/g, function(match) { return match.replace(/```[a-z]*\n?/g, '').replace(/```/g, ''); }) 
    .replace(/^\s*>\s+/gm, '') 
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
};

export function ChatInterface({
  title, description, placeholder, emptyStateIcon, emptyStateSuggestions,
  currentView, currentViewState, viewStates, initialViewState,
  isHistoryOpen, setIsHistoryOpen, t, createNewConversation, updateViewState,
  deleteConversation, editingChatTitleId, setEditingChatTitleId, editedChatTitle, setEditedChatTitle,
  handleSaveChatTitle, handleClearChat, handleExport, scrollRef, handleFileUpload,
  editingMessageId, setEditingMessageId, editingMessageContent, setEditingMessageContent,
  handleEditMessageSubmit, userProfile, fileInputRef, handleSend, handleStopGeneration,
  setViewStates, saveConversation, addToast
}: ChatInterfaceProps) {
  const { conversations, activeConversationId, isLoading, input } = currentViewState;
  const activeConv = conversations.find((c: any) => c.id === activeConversationId);
  const messages = activeConv?.messages || [];
  const uploadedFile = activeConv?.uploadedFile || currentViewState.uploadedFile;

  return (
    <div className="flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto border-x bg-white/40 dark:bg-black/20 backdrop-blur-xl z-10 relative shadow-2xl">
      {/* Conversation Sidebar */}
      <ConversationSidebar view={currentView as any}
        viewStates={viewStates}
        initialViewState={initialViewState}
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        t={t}
        createNewConversation={createNewConversation as any}
        updateViewState={updateViewState}
        deleteConversation={deleteConversation}
      />
      
      {/* Main Chat Area */}
      <section className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <header className="pl-16 pr-4 lg:px-8 py-4 border-b bg-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 gap-2">
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
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight truncate font-heading">{title}</h2>
                {editingChatTitleId === activeConversationId && activeConv ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editedChatTitle}
                      onChange={(e) => setEditedChatTitle(e.target.value)}
                      className="h-6 text-[10px] md:text-[11px] px-2 py-0 border-primary/40 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary w-[150px] rounded-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveChatTitle(activeConversationId!, editedChatTitle);
                        if (e.key === 'Escape') setEditingChatTitleId(null);
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleSaveChatTitle(activeConversationId!, editedChatTitle)}>
                      <Check className="w-3 h-3 text-green-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingChatTitleId(null)}>
                      <X className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="group text-[8px] md:text-[9px] h-4 md:h-4.5 px-1.5 md:px-2 font-black uppercase tracking-widest bg-background/50 text-primary border-primary/20 rounded-full shadow-sm truncate max-w-[100px] md:max-w-none cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      if (activeConversationId && activeConv) {
                        setEditingChatTitleId(activeConversationId);
                        setEditedChatTitle(activeConv.title || 'Untitled Session');
                      }
                    }}
                    title="Click to edit session name"
                  >
                    {activeConv?.title || 'Untitled Session'}
                    <Edit2 className="w-2 h-2 inline-block ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                )}
              </div>
              <p className="text-[10px] md:text-[11px] text-muted-foreground italic serif opacity-80 truncate">{description}</p>
            </div>
          </div>
          <div className="flex gap-1 md:gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="h-8 px-2 md:px-3 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-all" onClick={handleClearChat}>
              <Trash2 className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">{t.clear}</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-2 md:px-3 text-[10px] uppercase tracking-widest font-semibold rounded-xl glass-card hover:bg-background/80" onClick={() => handleExport()}>
              <Download className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">{t.export}</span>
            </Button>
          </div>
        </header>

        <ScrollArea 
          className="flex-1 h-full min-h-0" 
          ref={scrollRef}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0];
              const type = file.type;
              const name = file.name.toLowerCase();
              const validTypes = ['text/', 'application/json', 'application/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf'];
              const validExts = ['.txt', '.md', '.csv', '.json', '.docx', '.xlsx', '.xls', '.pptx', '.pdf'];
              if (validTypes.some(t => type.startsWith(t)) || validExts.some(ext => name.endsWith(ext))) {
                const mockEvent = {
                  target: {
                    files: [file]
                  }
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileUpload(mockEvent);
              }
            }
          }}
        >
          <div className="px-6 py-4">
            {messages.length === 0 ? (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="w-16 h-16 bg-background/40 rounded-2xl flex items-center justify-center mb-1 shadow-inner border border-white/5 group hover:scale-110 transition-transform duration-500">
        {emptyStateIcon}
      </div>
              <div className="space-y-1">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading">{t.howCanIHelp}</h3>
        <p className="text-muted-foreground max-w-md mx-auto text-sm font-medium">
          {t.uploadDocsDesc}
        </p>
      </div>
      <div className="flex overflow-x-auto md:grid md:grid-cols-2 gap-2 mt-2 w-full max-w-xl pb-4 snap-x hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {emptyStateSuggestions.map((suggestion, idx) => (
                      <Card 
                        key={idx} 
                        className="min-w-[85vw] sm:min-w-[240px] md:min-w-0 flex-shrink-0 snap-center glass-card hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer group text-left"
                        onClick={() => updateViewState(currentView, { input: suggestion.prompt })}
                      >
                        <CardHeader className="p-3.5">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {suggestion.icon && (
                                <div className={`vibrant-icon-container w-8 h-8 ${suggestion.color || 'vibrant-icon-red'}`}>
                                  <suggestion.icon className="w-4 h-4" />
                                </div>
                              )}
                              <CardTitle className="text-[13px] font-bold group-hover:text-foreground transition-colors">{suggestion.title}</CardTitle>
                            </div>
                            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-foreground" />
                          </div>
                          <CardDescription className="text-[11px] italic serif leading-tight opacity-70 line-clamp-1 group-hover:line-clamp-none capitalize">{suggestion.desc}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                  
                </div>
              ) : (
                <div className="space-y-10 pb-32 w-full">
                  {messages.map((message: any, idx: number) => (
                    <div key={message.id || idx} className={`flex gap-5 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      {message.role === 'model' && (
                        <Avatar className="w-10 h-10 border-2 border-primary/20 bg-background/50 shadow-sm mt-1">
                          <AvatarFallback className="bg-primary text-primary-foreground text-[12px] font-black italic">M</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[85%] ${message.role === 'user' ? '' : 'w-full'} space-y-2`}>
                        {message.role === 'user' ? (
                          <div className="relative group flex items-start gap-2 justify-end w-full">
                            {!isLoading && editingMessageId !== message.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/50 hover:bg-background shadow-sm shrink-0"
                                onClick={() => {
                                  setEditingMessageId(message.id);
                                  let content = message.content;
                                  const filePrefixStr = `I have uploaded a file named "`;
                                  if (content.startsWith(filePrefixStr)) {
                                    const parts = content.split(`\n\nMy question/task is: `);
                                    if (parts.length > 1) content = parts[1];
                                  } else if (content.startsWith('Continuing discussion about "')) {
                                    const parts = content.split(`":\n\n`);
                                    if (parts.length > 1) content = parts[1];
                                  }
                                  setEditingMessageContent(content);
                                }}
                                title="Edit Message"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            )}
                            
                            {editingMessageId === message.id ? (
                              <div className="bg-card border shadow-lg rounded-2xl p-4 w-full max-w-[500px]">
                                <Textarea 
                                  value={editingMessageContent}
                                  onChange={(e) => setEditingMessageContent(e.target.value)}
                                  className="min-h-[100px] w-full text-sm resize-none mb-3 bg-background border-none focus-visible:ring-0 shadow-inner"
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                                  <Button size="sm" className="bg-primary text-white rounded-xl shadow-md shadow-primary/20" onClick={() => handleEditMessageSubmit(message.id, activeConversationId || '', editingMessageContent)}>Save & Submit</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-6 py-4 shadow-xl shadow-primary/10 inline-block border border-white/10 max-w-full">
                                {(message.content.startsWith('I have uploaded a file named "') || message.content.startsWith('Continuing discussion about "')) && (
                                  <div className="flex items-center gap-1.5 mb-2 opacity-80 bg-black/10 px-2 py-1 rounded-md text-[10px] w-fit font-bold uppercase tracking-wider">
                                    <FileText className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">
                                      {message.content.split('"')[1]}
                                    </span>
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">
                                  {message.content.startsWith('I have uploaded a file named "') 
                                    ? (message.content.split('\n\nMy question/task is: ')[1] || message.content)
                                    : message.content.startsWith('Continuing discussion about "')
                                    ? (message.content.split('":\n\n')[1] || message.content)
                                    : message.content}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative group">
                            {message.isError ? (
                              <div className="w-full flex items-center px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm font-medium shadow-sm">
                                <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
                                <span>{message.content}</span>
                              </div>
                            ) : (
                              <div className="prose prose-sm max-w-none dark:prose-invert
                                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                                prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                                prose-p:text-foreground/90 prose-p:leading-relaxed
                                prose-li:text-foreground/90
                                prose-strong:font-bold prose-strong:text-foreground
                                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                glass-card rounded-2xl rounded-tl-none p-6 sm:p-8 shadow-xl">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {message.content}
                                </ReactMarkdown>
                                <div className="flex justify-end mt-4 md:mt-6 pt-4 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-8 text-[10px] uppercase tracking-widest font-black rounded-lg"
                                    onClick={() => {
                                      navigator.clipboard.writeText(stripMarkdown(message.content));
                                      addToast(t.copiedToClipboard, 'success');
                                    }}
                                  >
                                    <Copy className="w-3.5 h-3.5 mr-2" /> {t.copy}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className={`flex items-center gap-2 px-1 opacity-40 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[9px] uppercase tracking-widest font-black">
                            {message.role === 'user' ? t.you : t.studioAi}
                          </span>
                          <span className="text-[9px] font-mono">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {message.role === 'user' && (
          <Avatar className="w-10 h-10 border-2 border-border/50 bg-background/50 shadow-sm mt-1">
                          <AvatarImage src={userProfile?.photoURL || undefined} />
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-bold">
                            {userProfile?.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ME'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isLoading && (!messages.length || messages[messages.length - 1].role === 'user' || (messages[messages.length - 1].role === 'model' && !messages[messages.length - 1].content)) && (
                    <div className="flex gap-5 justify-start animate-pulse">
                      <Avatar className="w-10 h-10 border-2 border-primary/20 bg-background/50 shadow-sm">
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-black italic">Y</AvatarFallback>
                      </Avatar>
                      <div className="glass-card p-5 rounded-2xl rounded-tl-none flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                        <span className="text-xs font-bold italic serif animate-pulse">{t.thinking}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
        </ScrollArea>

        <div className="p-3 lg:p-4 bg-background/80 backdrop-blur-md border-t">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center w-full gap-2 px-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.md,.csv,.json,.docx,.xlsx,.xls,.pptx,.pdf"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              className="shrink-0 h-12 w-12 rounded-xl bg-card border-primary/10 hover:border-primary/30" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </Button>
            <div className="relative flex-1 bg-card rounded-xl border border-input focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 shadow-sm flex flex-col min-h-[48px]">
              {uploadedFile ? (
                <div className="flex items-center gap-2 px-3 pt-3 pb-1 shrink-0">
                  <Badge variant="secondary" className="px-2 py-1 flex items-center gap-2 bg-secondary/50 text-foreground border-none">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="max-w-[150px] sm:max-w-[200px] truncate">{uploadedFile.name}</span>
                    <button type="button" onClick={() => {
                      updateViewState(currentView, { uploadedFile: null });
                      if (activeConversationId) {
                        setViewStates(prev => {
                          const convs = prev[currentView].conversations.map((c: any) => c.id === activeConversationId ? { ...c, uploadedFile: null } : c);
                          const updatedConv = convs.find((c: any) => c.id === activeConversationId);
                          if (updatedConv) saveConversation(currentView, updatedConv);
                          return { ...prev, [currentView]: { ...prev[currentView], conversations: convs } };
                        });
                      }
                    }} className="hover:text-destructive">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </Badge>
                </div>
              ) : null}
              <Textarea
                value={input}
                onChange={(e) => updateViewState(currentView, { input: e.target.value })}
                placeholder={placeholder}
                className="pr-20 py-3 text-sm border-0 focus-visible:ring-0 shadow-none bg-transparent w-full min-h-[48px] max-h-[200px] resize-none"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1 bg-card rounded-lg">
                <PromptEnhancer 
                  value={input} 
                  onEnhance={(val) => updateViewState(currentView, { input: val })}
                  disabled={isLoading}
                  context={currentView === 'presentation' ? 'presentation' : 'general'}
                />
                {isLoading ? (
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleStopGeneration}
                    className="rounded-lg h-9 w-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim()}
                    className="rounded-lg h-9 w-9"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

