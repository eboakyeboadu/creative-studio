import React from 'react';
import { History, PanelLeftClose, Plus, MonitorPlay, Bot, X } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { ViewType } from '../types';

export interface ConversationSidebarProps {
  view: ViewType;
  viewStates: Record<string, any>;
  initialViewState: any;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  t: any;
  createNewConversation: (view: ViewType) => void;
  updateViewState: (view: ViewType, updates: any) => void;
  deleteConversation: (view: ViewType, id: string) => void;
}

export function ConversationSidebar({
  view,
  viewStates,
  initialViewState,
  isHistoryOpen,
  setIsHistoryOpen,
  t,
  createNewConversation,
  updateViewState,
  deleteConversation
}: ConversationSidebarProps) {
  const viewState = viewStates[view] || initialViewState;
  const { conversations, activeConversationId } = viewState;
  const visibleConversations = conversations.filter((conv: any) => conv.messages.length > 0 || (view === 'presentation' && conv.presentation));
  
  return (
    <aside className={`w-64 border-r bg-card/40 backdrop-blur-xl flex flex-col shrink-0 transition-all duration-300 ${!isHistoryOpen ? '-ml-64 opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="p-4 border-b space-y-4 pt-16 lg:pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <History className="w-3.5 h-3.5" />
            {t.history}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={() => setIsHistoryOpen(false)}>
            <PanelLeftClose className="w-5 h-5" />
          </Button>
        </div>
        <Button className="w-full justify-start gap-2 h-10 rounded-xl border-dashed border-foreground/30 hover:border-foreground/60 hover:bg-secondary/50 shadow-sm" variant="outline" onClick={() => createNewConversation(view)}>
          <Plus className="w-5 h-5" /> {view === 'presentation' ? <span>{t.newPresentation}</span> : <span>{t.newChat}</span>}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {visibleConversations.map((conv: any) => (
            <div key={conv.id} className="group relative">
              <Button
                variant={activeConversationId === conv.id ? "secondary" : "ghost"}
                className={`w-full justify-start text-left px-3 py-3 h-auto block overflow-hidden rounded-xl transition-all ${activeConversationId === conv.id ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' : 'hover:bg-background/50'}`}
                onClick={() => updateViewState(view, { activeConversationId: conv.id })}
              >
                <div className="text-xs font-bold truncate pr-6 mb-1">{conv.title || (view === 'presentation' ? 'Untitled Presentation' : 'Untitled Chat')}</div>
                <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 opacity-60">
                  {view === 'presentation' ? <MonitorPlay className="w-2.5 h-2.5" /> : <Bot className="w-2.5 h-2.5" />}
                  {new Date(conv.timestamp).toLocaleDateString()}
                </div>
              </Button>
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(view, conv.id);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {visibleConversations.length === 0 && (
            <div className="p-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-40 italic">
              {t.noHistory}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

