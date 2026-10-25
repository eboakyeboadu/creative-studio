import React from 'react';
import { format } from 'date-fns';
import { Bell, BellRing, CalendarIcon, ListTodo, Activity, X } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { AnimatePresence, motion } from 'motion/react';
import type { Notification, ViewType } from '../types';

export function NotificationBell({ notifications, setNotifications, setCurrentView }: { 
  notifications: Notification[], 
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setCurrentView: (view: ViewType) => void
}) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.type === 'task') {
      setCurrentView('tasks');
    } else if (notification.type === 'event') {
      setCurrentView('calendar');
    }
  };

  return (
    <Popover>
      <PopoverTrigger nativeButton={true} render={(props) => (
        <Button {...props} variant="ghost" size="icon" className="relative h-12 w-12 rounded-xl hover:bg-white/10 transition-colors group">
          <Bell className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-white text-red-600 text-[10px] font-black flex items-center justify-center rounded-full border-2 border-red-600 animate-in zoom-in duration-300">
              {unreadCount}
            </span>
          )}
        </Button>
      )} />
      <PopoverContent 
        align="end" 
        className="w-80 sm:w-96 p-0 bg-card/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[1.5rem] overflow-hidden"
      >
        <div className="p-4 border-b bg-card/50 flex items-center justify-between">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <BellRing className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground">Notifications Hub</h3>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[9px] font-bold" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-2 space-y-1">
            <AnimatePresence mode="popLayout">
              {notifications.length > 0 ? (
                notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <div 
                      className={`relative flex gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden ${
                        !notification.read 
                          ? 'bg-white/10 border border-white/10 shadow-lg' 
                          : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Vibrant Vertical Indicator Bar - Premium Design */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 shadow-[0_0_10px_currentColor] ${
                        notification.priority === 'high' ? 'bg-red-500 text-red-500' :
                        notification.priority === 'medium' ? 'bg-orange-500 text-orange-500' :
                        'bg-emerald-500 text-emerald-500'
                      }`} />

                      <div className="flex-1 flex gap-4 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          notification.type === 'task' ? 'bg-blue-500/10 text-blue-500' : 
                          notification.type === 'event' ? 'bg-purple-500/10 text-purple-500' : 
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {notification.type === 'task' ? <ListTodo className="w-4 h-4" /> : 
                           notification.type === 'event' ? <CalendarIcon className="w-4 h-4" /> : 
                           <Activity className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className={`text-xs font-black uppercase tracking-wider truncate overflow-hidden ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </p>
                            <span className="text-[9px] font-mono text-muted-foreground/60 whitespace-nowrap ml-2 bg-secondary/30 px-1.5 py-0.5 rounded-md">
                              {format(notification.timestamp, 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                      >
                        <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto ring-4 ring-white/5">
                    <Bell className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Clean Inbox</p>
                    <p className="text-xs text-muted-foreground/30 italic">No new notifications</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
        <AnimatePresence>
          {notifications.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3 border-t border-white/5 bg-white/[0.02] mt-auto"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl border border-transparent hover:border-destructive/10 transition-all" 
                onClick={() => setNotifications([])}
              >
                Flush All Notifications
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}

