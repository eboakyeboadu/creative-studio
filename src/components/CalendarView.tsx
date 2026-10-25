import React, { useState } from 'react';
import { useAuth } from '../contexts/FirebaseContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Plus, Filter, Search, MoreVertical,
  ChevronDown, Target, Zap, Globe, FileText,
  LayoutGrid, List as ListIcon, Sparkles,
  AlertCircle, CheckCircle2, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from './ui/select';
import { 
  Popover, PopoverContent, PopoverTrigger 
} from './ui/popover';
import { Calendar } from './ui/calendar';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
  eachDayOfInterval, isToday, setHours, setMinutes
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  link?: string;
  start: Date;
  end: Date;
  type: 'task' | 'meeting' | 'campaign' | 'other';
  status?: 'todo' | 'completed' | 'active';
  color?: string;
  relatedId?: string;
  cardStyle?: 'accent' | 'solid';
}

interface Task {
  id: string;
  title: string;
  description?: string;
  link?: string;
  status: 'todo' | 'completed';
  priority: 'low' | 'medium' | 'high';
  cardStyle?: 'accent' | 'solid';
  tags: string[];
  category?: string;
  folder?: string;
  dueDate?: Date;
  createdAt: Date;
}

export default function CalendarView({ 
  tasks, setTasks, events, setEvents, initialEventId, 
  isGoogleConnected, onGoogleConnect, onGoogleSync, pendingEventData
}: { 
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  events: CalendarEvent[],
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>,
  initialEventId?: string,
  isGoogleConnected?: boolean,
  onGoogleConnect?: () => void,
  onGoogleSync?: () => void,
  pendingEventData?: any
}) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'schedule'>('month');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [entryType, setEntryType] = useState<'event' | 'task'>('event');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    link: '',
    type: 'meeting',
    start: new Date(),
    cardStyle: 'accent'
  });

  const [eventTime, setEventTime] = useState('10:00');

  const [newQuickTask, setNewQuickTask] = useState({
    title: '',
    description: '',
    link: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    cardStyle: 'accent' as 'accent' | 'solid',
    time: '09:00'
  });

  React.useEffect(() => {
    if (initialEventId) {
      const event = events.find(e => e.id === initialEventId);
      if (event) openEditEvent(event);
    }
  }, [initialEventId, events]);

  React.useEffect(() => {
    if (pendingEventData) {
      setEntryType('event');
      
      const newD = pendingEventData.date ? new Date(pendingEventData.date) : new Date();
      if (pendingEventData.startTime) {
        setEventTime(pendingEventData.startTime);
      }
      setSelectedDate(newD);
      setCurrentDate(newD);

      setNewEvent({
        title: pendingEventData.title || '',
        description: pendingEventData.description || '',
        type: pendingEventData.type || 'meeting',
        start: newD,
        cardStyle: 'accent'
      });
      setIsAddEventOpen(true);
    }
  }, [pendingEventData]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDay = (day: Date) => {
    const calendarEvents = events.filter(event => isSameDay(event.start, day)).map(e => ({ ...e, status: 'active' as const }));
    const taskEvents = tasks
      .filter(task => task.dueDate && isSameDay(task.dueDate, day))
      .map(task => {
        const start = task.dueDate!;
        const end = new Date(start.getTime() + 30 * 60000); // Default 30 min duration for tasks
        return {
          id: task.id,
          title: task.title,
          start,
          end,
          type: 'task' as const,
          status: task.status,
          description: task.description,
          link: task.link,
          color: task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-emerald-500',
          relatedId: task.id,
          cardStyle: task.cardStyle
        };
      });
    
    return [...calendarEvents, ...taskEvents];
  };

  const getSolidBackground = (event: any) => {
    if (event.type === 'task') {
      const task = tasks.find(t => t.id === event.relatedId);
      const priority = task?.priority || 'medium';
      switch (priority) {
        case 'high': return 'bg-gradient-to-br from-red-600/95 to-red-800 shadow-xl border-red-500/40 text-white';
        case 'medium': return 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-xl border-yellow-400/30 text-slate-900';
        case 'low': return 'bg-gradient-to-br from-emerald-500/95 to-emerald-800 shadow-xl border-emerald-400/30 text-white';
        default: return 'bg-secondary/40 border-white/5';
      }
    }
    
    switch (event.type) {
      case 'meeting': return 'bg-gradient-to-br from-blue-600/95 to-blue-800 shadow-xl border-blue-500/40 text-white';
      case 'campaign': return 'bg-gradient-to-br from-emerald-600/95 to-emerald-800 shadow-xl border-emerald-400/30 text-white';
      default: return 'bg-gradient-to-br from-amber-500/95 to-amber-800 shadow-xl border-amber-400/40 text-white';
    }
  };

  const handleAddEvent = async () => {
    if (!user || !newEvent.title) return;
    
    let startDate = newEvent.start || selectedDate;
    const [hours, minutes] = eventTime.split(':').map(Number);
    startDate = setHours(setMinutes(startDate, minutes), hours);

    // Close immediately
    setIsAddEventOpen(false);
    const eventToSave = { ...newEvent };
    const editingId = editingEvent?.id;
    
    // Clear state
    setEditingEvent(null);
    setNewEvent({ title: '', description: '', link: '', type: 'meeting', start: new Date() });

    try {
      if (editingId) {
        const eventRef = doc(db, 'users', user.uid, 'calendarEvents', editingId);
        await updateDoc(eventRef, {
          ...eventToSave,
          start: startDate,
          end: startDate,
          cardStyle: eventToSave.cardStyle || 'accent'
        });
      } else {
        const eventsCollection = collection(db, 'users', user.uid, 'calendarEvents');
        await addDoc(eventsCollection, {
          title: eventToSave.title,
          description: eventToSave.description || '',
          link: eventToSave.link || '',
          start: startDate,
          end: startDate,
          type: eventToSave.type || 'meeting',
          cardStyle: eventToSave.cardStyle || 'accent',
          color: eventToSave.type === 'meeting' ? 'bg-blue-500' : eventToSave.type === 'campaign' ? 'bg-emerald-500' : 'bg-amber-500'
        });
      }
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleQuickTask = async () => {
    if (!newQuickTask.title || !user) return;
    
    let dueDate = selectedDate;
    const [hours, minutes] = newQuickTask.time.split(':').map(Number);
    dueDate = setHours(setMinutes(dueDate, minutes), hours);

    // Close immediately
    setIsAddEventOpen(false);
    const taskToSave = { ...newQuickTask };
    const editingId = editingTask?.id;
    
    // Clear state
    setEditingTask(null);
    setNewQuickTask({ title: '', description: '', link: '', priority: 'medium', cardStyle: 'accent', time: '09:00' });

    try {
      if (editingId) {
        const taskRef = doc(db, 'users', user.uid, 'tasks', editingId);
        await updateDoc(taskRef, {
          ...taskToSave,
          dueDate,
          cardStyle: taskToSave.cardStyle || 'accent'
        });
      } else {
        const tasksCollection = collection(db, 'users', user.uid, 'tasks');
        await addDoc(tasksCollection, {
          title: taskToSave.title,
          description: taskToSave.description || '',
          link: taskToSave.link || '',
          status: 'todo',
          priority: taskToSave.priority || 'medium',
          cardStyle: taskToSave.cardStyle || 'accent',
          tags: [],
          createdAt: serverTimestamp(),
          dueDate: dueDate
        });
      }
    } catch (error) {
      console.error("Error saving task from calendar:", error);
    }
  };

  const openEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEvent({ ...event });
    setEventTime(format(event.start, 'HH:mm'));
    setEntryType('event');
    setIsAddEventOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setNewQuickTask({
      title: task.title,
      description: task.description || '',
      link: task.link || '',
      priority: task.priority,
      cardStyle: task.cardStyle || 'accent',
      time: task.dueDate ? format(task.dueDate, 'HH:mm') : '09:00'
    });
    setEntryType('task');
    setIsAddEventOpen(true);
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 backdrop-blur-sm overflow-hidden">
      <header className="px-4 py-3 border-b bg-card/50 backdrop-blur-md sticky top-0 z-10 transition-all">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl lg:text-2xl font-extrabold tracking-tighter flex items-center gap-2 font-heading">
              <CalendarIcon className="w-6 h-6 text-primary" />
              Marketing Calendar
            </h2>
            <p className="text-muted-foreground text-[10px] lg:text-xs italic serif opacity-80">
              Visualize deadlines, campaigns, and strategic milestones.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isGoogleConnected ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-lg h-8 px-3 text-[9px] font-semibold uppercase tracking-widest gap-1.5 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                onClick={onGoogleConnect}
              >
                <Globe className="w-3.5 h-3.5 text-red-600" />
                Connect Google
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-lg h-8 px-3 text-[9px] font-semibold uppercase tracking-widest gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm group"
                onClick={onGoogleSync}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-12 transition-transform" />
                Sync Calendar
              </Button>
            )}
            <div className="flex items-center bg-secondary/30 rounded-lg p-0.5">
              <Button 
                variant={viewMode === 'day' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="text-[9px] font-black uppercase tracking-widest px-2.5 h-7 rounded-md"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
              <Button 
                variant={viewMode === 'week' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="text-[9px] font-black uppercase tracking-widest px-2.5 h-7 rounded-md"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button 
                variant={viewMode === 'month' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="text-[9px] font-black uppercase tracking-widest px-2.5 h-7 rounded-md"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button 
                variant={viewMode === 'schedule' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="text-[9px] font-black uppercase tracking-widest px-2.5 h-7 rounded-md"
                onClick={() => setViewMode('schedule')}
              >
                Schedule
              </Button>
            </div>
            <div className="flex items-center bg-secondary/30 rounded-lg p-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-2 text-[10px] font-black uppercase tracking-widest min-w-[110px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger render={
                <Button className="rounded-lg h-8 shadow-md shadow-primary/20 gap-1.5 text-xs px-3">
                  <Plus className="w-4 h-4" /> Add Item
                </Button>
              } />
              <DialogContent className="sm:max-w-[500px] rounded-3xl">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Button 
                      variant={entryType === 'event' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="rounded-full h-7 px-4 text-[10px] font-black uppercase tracking-widest"
                      onClick={() => setEntryType('event')}
                    >
                      Event
                    </Button>
                    <Button 
                      variant={entryType === 'task' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="rounded-full h-7 px-4 text-[10px] font-black uppercase tracking-widest"
                      onClick={() => setEntryType('task')}
                    >
                      Task
                    </Button>
                  </div>
                  <DialogTitle className="text-2xl font-black tracking-tight">
                    {entryType === 'event' 
                      ? (editingEvent ? 'Update Calendar Event' : 'Add Calendar Event')
                      : (editingTask ? 'Update Task' : 'Quick Task')
                    }
                  </DialogTitle>
                  <DialogDescription className="italic serif">
                    {entryType === 'event' 
                      ? 'Schedule a new meeting or campaign milestone.'
                      : `Add a task for ${format(selectedDate, 'MMM do')}.`
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {entryType === 'event' ? (
                    <>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Event Title</Label>
                        <div className="flex gap-1">
                          <Input 
                            placeholder="Meeting name..." 
                            value={newEvent.title || ''}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="rounded-xl flex-1"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Description</Label>
                        <div className="relative">
                          <Textarea 
                            placeholder="Add details..." 
                            value={newEvent.description || ''}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            className="rounded-xl min-h-[80px] pr-12"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Link (Zoom, Docs, etc.)</Label>
                        <Input 
                          placeholder="https://..." 
                          value={newEvent.link || ''}
                          onChange={(e) => setNewEvent({ ...newEvent, link: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Type</Label>
                          <Select value={newEvent.type || 'meeting'} onValueChange={(v) => setNewEvent({ ...newEvent, type: v as any })}>
                            <SelectTrigger className="rounded-xl h-10 px-4">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="campaign">Campaign</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Card Style</Label>
                          <Select value={newEvent.cardStyle || 'accent'} onValueChange={(v) => setNewEvent({ ...newEvent, cardStyle: v as any })}>
                            <SelectTrigger className="rounded-xl h-10 px-4">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="accent">Subtle Accent</SelectItem>
                              <SelectItem value="solid">Vibrant Solid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Time</Label>
                          <Input 
                            type="time"
                            value={eventTime || ''}
                            onChange={(e) => setEventTime(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Date</Label>
                          <Popover>
                            <PopoverTrigger render={
                              <Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newEvent.start ? format(newEvent.start, "PPP") : format(selectedDate, "PPP")}
                              </Button>
                            } />
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={newEvent.start || selectedDate}
                                onSelect={(date) => setNewEvent({ ...newEvent, start: date })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Task Title</Label>
                        <div className="flex gap-1">
                          <Input 
                            placeholder="What needs to be done?" 
                            value={newQuickTask.title || ''}
                            onChange={(e) => setNewQuickTask({ ...newQuickTask, title: e.target.value })}
                            className="rounded-xl flex-1"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Description</Label>
                        <div className="relative">
                          <Textarea 
                            placeholder="Add context..." 
                            value={newQuickTask.description || ''}
                            onChange={(e) => setNewQuickTask({ ...newQuickTask, description: e.target.value })}
                            className="rounded-xl min-h-[80px] pr-12"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Link</Label>
                        <Input 
                          placeholder="https://..." 
                          value={newQuickTask.link || ''}
                          onChange={(e) => setNewQuickTask({ ...newQuickTask, link: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Priority</Label>
                          <Select value={newQuickTask.priority || 'medium'} onValueChange={(v) => setNewQuickTask({ ...newQuickTask, priority: v as any })}>
                            <SelectTrigger className="rounded-xl h-10 px-4">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Card Style</Label>
                          <Select value={newQuickTask.cardStyle || 'accent'} onValueChange={(v) => setNewQuickTask({ ...newQuickTask, cardStyle: v as any })}>
                            <SelectTrigger className="rounded-xl h-10 px-4">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="accent">Subtle Accent</SelectItem>
                              <SelectItem value="solid">Vibrant Solid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Time</Label>
                          <Input 
                            type="time"
                            value={newQuickTask.time || ''}
                            onChange={(e) => setNewQuickTask({ ...newQuickTask, time: e.target.value })}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddEventOpen(false)} className="rounded-xl">Cancel</Button>
                  {entryType === 'event' ? (
                    <Button onClick={handleAddEvent} className="rounded-xl">
                      {editingEvent ? 'Update Event' : 'Create Event'}
                    </Button>
                  ) : (
                    <Button onClick={handleQuickTask} className="rounded-xl">
                      {editingTask ? 'Update Task' : 'Add Task'}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Calendar Grid */}
        <main className="flex-1 overflow-y-auto p-6">
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-px bg-border border rounded-2xl overflow-hidden shadow-xl">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-secondary/50 p-2 lg:p-3 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{day}</span>
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDay = isToday(day);

                return (
                  <div 
                    key={idx}
                    className={`min-h-[85px] lg:min-h-[105px] p-1.5 transition-all cursor-pointer relative group ${
                      isCurrentMonth ? 'bg-card/40' : 'bg-secondary/5 opacity-40'
                    } ${isSelected ? 'ring-2 ring-primary ring-inset z-10' : 'hover:bg-secondary/20'}`}
                    onClick={() => {
                      setSelectedDate(day);
                      setEventTime('09:00');
                      setNewQuickTask(prev => ({ ...prev, time: '09:00' }));
                      setIsAddEventOpen(true);
                      setEditingEvent(null);
                      setEditingTask(null);
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ${
                        isTodayDay ? 'bg-primary text-white' : 'text-foreground/60'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="text-[7px] font-black h-3.5 px-1 rounded-sm bg-primary/10 text-primary">
                          {dayEvents.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(event => (
                        <div 
                          key={event.id}
                          className={`text-[8px] font-bold px-1 py-0.5 rounded-sm truncate border-l ${event.color} bg-opacity-10 text-foreground/80 border-opacity-50`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[7px] font-black text-muted-foreground pl-1">
                          + {dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'week' && (
            <div className="bg-card/40 border rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[800px]">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b bg-secondary/10">
                <div className="p-4 border-r" />
                {eachDayOfInterval({
                  start: startOfWeek(selectedDate),
                  end: endOfWeek(selectedDate)
                }).map((day, idx) => (
                  <div key={idx} className={`p-4 text-center border-r last:border-r-0 ${isToday(day) ? 'bg-primary/10' : ''}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{format(day, 'EEE')}</p>
                    <p className={`text-sm font-black ${isToday(day) ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
                  </div>
                ))}
              </div>
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-[80px_repeat(7,1fr)] relative">
                  {/* Time Labels */}
                  <div className="border-r bg-secondary/5">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div key={hour} className="h-20 border-b p-2 text-right">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-30">
                          {format(setHours(new Date(), hour), 'HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Day Columns */}
                  {eachDayOfInterval({
                    start: startOfWeek(selectedDate),
                    end: endOfWeek(selectedDate)
                  }).map((day, dayIdx) => (
                    <div 
                      key={dayIdx} 
                      className="relative border-r last:border-r-0 min-h-[1920px] hover:bg-secondary/5 transition-colors cursor-crosshair"
                    >
                      {Array.from({ length: 24 }).map((_, hour) => (
                        <div 
                          key={hour} 
                          className="h-20 border-b border-dashed border-muted-foreground/10 hover:bg-primary/5 transition-colors" 
                          onClick={() => {
                            setSelectedDate(day);
                            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                            setEventTime(timeStr);
                            setNewQuickTask(prev => ({ ...prev, time: timeStr }));
                            setIsAddEventOpen(true);
                            setEditingEvent(null);
                            setEditingTask(null);
                          }}
                        />
                      ))}
                      {getEventsForDay(day).map(event => {
                        const startHour = event.start.getHours();
                        const startMinutes = event.start.getMinutes();
                        const durationMs = event.end.getTime() - event.start.getTime();
                        const durationMins = Math.max(30, durationMs / 60000);
                        const top = (startHour * 80) + (startMinutes / 60 * 80);
                        const height = (durationMins / 60 * 80);

                        const getAccent = () => {
                          if (event.type === 'task') {
                            const task = tasks.find(t => t.id === event.relatedId);
                            const p = task?.priority || 'medium';
                            switch (p) {
                              case 'high': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
                              case 'medium': return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]';
                              case 'low': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
                              default: return 'bg-primary/50';
                            }
                          }
                          switch (event.type) {
                            case 'meeting': return 'bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]';
                            case 'campaign': return 'bg-emerald-500 shadow-[0_0_8px_rgba(5,150,105,0.4)]';
                            default: return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
                          }
                        };
                        
                          return (
                            <div 
                              key={event.id}
                              className={`absolute left-1 right-1 p-2 rounded-xl border transition-all z-10 overflow-hidden group shadow-lg cursor-pointer hover:scale-[1.02] hover:z-20 ${
                                event.cardStyle === 'solid' 
                                  ? getSolidBackground(event) 
                                  : 'bg-card/40 backdrop-blur-md border-white/5 hover:bg-card/60'
                              } ${event.status === 'completed' ? 'opacity-40' : ''}`}
                              style={{ top: `${top}px`, height: `${height}px`, minHeight: '30px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (event.type === 'task' && event.relatedId) {
                                  const task = tasks.find(t => t.id === event.relatedId);
                                  if (task) openEditTask(task);
                                } else {
                                  openEditEvent(event);
                                }
                              }}
                            >
                              {event.cardStyle !== 'solid' && (
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getAccent()}`} />
                              )}
                              <p className={`text-[8px] font-black uppercase tracking-widest opacity-40 mb-1 group-hover:opacity-100 transition-opacity ${
                                event.cardStyle === 'solid' ? 'text-white' : ''
                              }`}>{format(event.start, 'HH:mm')}</p>
                              <p className={`text-[10px] font-bold leading-tight truncate group-hover:text-primary transition-colors ${
                                event.cardStyle === 'solid' 
                                  ? (event.type === 'task' && tasks.find(t => t.id === event.relatedId)?.priority === 'medium' ? 'text-slate-900 group-hover:text-slate-900' : 'text-white group-hover:text-white') 
                                  : ''
                              }`}>{event.title}</p>
                            </div>
                          );
                      })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {viewMode === 'day' && (
            <div className="bg-card/40 border rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[800px]">
              <div className="p-6 border-b bg-secondary/10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter">{format(selectedDate, 'EEEE, MMMM do')}</h3>
                  <p className="text-xs text-muted-foreground font-medium italic serif">Daily schedule and milestones</p>
                </div>
                <Badge className="bg-primary text-white font-black uppercase tracking-widest px-3 py-1">
                  {getEventsForDay(selectedDate).length} Items
                </Badge>
              </div>
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-[80px_1fr] relative">
                  {/* Time Labels */}
                  <div className="border-r bg-secondary/5">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div key={hour} className="h-20 border-b p-2 text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">
                          {format(setHours(new Date(), hour), 'HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Day Column */}
                  <div 
                    className="relative min-h-[1920px] hover:bg-secondary/5 transition-colors cursor-crosshair"
                  >
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div 
                        key={hour} 
                        className="h-20 border-b border-dashed border-muted-foreground/10 hover:bg-primary/5 transition-colors" 
                        onClick={() => {
                          const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                          setEventTime(timeStr);
                          setNewQuickTask(prev => ({ ...prev, time: timeStr }));
                          setIsAddEventOpen(true);
                          setEditingEvent(null);
                          setEditingTask(null);
                        }}
                      />
                    ))}
                    {getEventsForDay(selectedDate).map(event => {
                      const startHour = event.start.getHours();
                      const startMinutes = event.start.getMinutes();
                      const durationMs = event.end.getTime() - event.start.getTime();
                      const durationMins = Math.max(30, durationMs / 60000);
                      const top = (startHour * 80) + (startMinutes / 60 * 80);
                      const height = (durationMins / 60 * 80);
                      
                      const getAccent = () => {
                        if (event.type === 'task') {
                          const task = tasks.find(t => t.id === event.relatedId);
                          const p = task?.priority || 'medium';
                          switch (p) {
                            case 'high': return 'bg-gradient-to-b from-red-600 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]';
                            case 'medium': return 'bg-gradient-to-b from-orange-500 to-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.4)]';
                            case 'low': return 'bg-gradient-to-b from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
                            default: return 'bg-primary/50';
                          }
                        }
                        switch (event.type) {
                          case 'meeting': return 'bg-gradient-to-b from-blue-600 to-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.4)]';
                          case 'campaign': return 'bg-gradient-to-b from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(5,150,105,0.4)]';
                          default: return 'bg-gradient-to-b from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]';
                        }
                      };

                      return (
                        <div 
                          key={event.id}
                          className={`absolute left-4 right-4 p-4 rounded-2xl border transition-all z-10 overflow-hidden group shadow-2xl cursor-pointer hover:scale-[1.01] ${
                            event.cardStyle === 'solid' 
                              ? getSolidBackground(event) 
                              : 'bg-card/30 backdrop-blur-xl border-white/5 hover:bg-card/50'
                          } ${event.status === 'completed' ? 'opacity-40' : ''}`}
                          style={{ top: `${top}px`, height: `${height}px`, minHeight: '40px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (event.type === 'task' && event.relatedId) {
                              const task = tasks.find(t => t.id === event.relatedId);
                              if (task) openEditTask(task);
                            } else {
                              openEditEvent(event);
                            }
                          }}
                        >
                          {event.cardStyle !== 'solid' && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getAccent()}`} />
                          )}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-1.5 h-4 rounded-md border-none ${
                                event.cardStyle === 'solid' 
                                  ? 'bg-white/20 text-white' 
                                  : (event.type === 'task' ? 'bg-primary/10 text-primary' : 'bg-secondary/20 text-muted-foreground')
                              }`}>
                                {event.type}
                              </Badge>
                              <span className={`text-[9px] font-mono font-bold opacity-30 group-hover:opacity-80 transition-opacity ${
                                event.cardStyle === 'solid' 
                                  ? (event.type === 'task' && tasks.find(t => t.id === event.relatedId)?.priority === 'medium' ? 'text-slate-900' : 'text-white') 
                                  : ''
                              }`}>{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</span>
                            </div>
                            {event.status === 'completed' && <CheckCircle2 className={`w-3.5 h-3.5 ${event.cardStyle === 'solid' ? 'text-white' : 'text-emerald-500'}`} />}
                          </div>
                          <h4 className={`text-sm font-black leading-tight mb-1.5 transition-colors tracking-tight truncate ${
                            event.cardStyle === 'solid' 
                              ? (event.type === 'task' && tasks.find(t => t.id === event.relatedId)?.priority === 'medium' ? 'text-slate-900' : 'text-white') 
                              : 'group-hover:text-primary'
                          }`}>{event.title}</h4>
                          {height > 80 && event.description && (
                            <p className={`text-[11px] line-clamp-2 italic font-medium serif leading-relaxed ${
                              event.cardStyle === 'solid' ? 'text-white/70' : 'text-muted-foreground/70'
                            }`}>{event.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}

          {viewMode === 'schedule' && (
            <div className="space-y-8">
              {Array.from({ length: 7 }).map((_, i) => {
                const day = addDays(new Date(), i);
                const dayEvents = getEventsForDay(day);
                if (dayEvents.length === 0) return null;

                return (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary leading-none mb-1">{format(day, 'EEE')}</span>
                        <span className="text-lg font-black leading-none">{format(day, 'd')}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black tracking-tight">{isToday(day) ? 'Today' : format(day, 'MMMM do')}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{dayEvents.length} Scheduled Items</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime()).map(event => {
                        const getAccent = () => {
                          if (event.type === 'task') {
                            const task = tasks.find(t => t.id === event.relatedId);
                            const p = task?.priority || 'medium';
                            switch (p) {
                              case 'high': return 'bg-gradient-to-b from-red-600 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
                              case 'medium': return 'bg-gradient-to-b from-orange-500 to-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.3)]';
                              case 'low': return 'bg-gradient-to-b from-emerald-500 to-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
                              default: return 'bg-primary/40';
                            }
                          }
                          switch (event.type) {
                            case 'meeting': return 'bg-gradient-to-b from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.3)]';
                            case 'campaign': return 'bg-gradient-to-b from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(5,150,105,0.3)]';
                            default: return 'bg-gradient-to-b from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
                          }
                        };

                        return (
                          <Card 
                            key={event.id} 
                            className={`group relative bg-card/30 backdrop-blur-xl border border-white/5 overflow-hidden hover:bg-card/50 hover:shadow-2xl hover:translate-y-[-2px] cursor-pointer transition-all ${
                              event.status === 'completed' ? 'opacity-50' : ''
                            }`}
                            onClick={() => {
                              if (event.type === 'task' && event.relatedId) {
                                const task = tasks.find(t => t.id === event.relatedId);
                                if (task) openEditTask(task);
                              } else {
                                openEditEvent(event);
                              }
                            }}
                          >
                            {/* Accent Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 z-10 ${getAccent()}`} />

                            <CardContent className="p-3 relative z-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <Badge variant="outline" className={`text-[7px] font-black uppercase tracking-widest px-1.5 h-3.5 rounded-md border-none ${
                                  event.type === 'task' ? 'bg-primary/10 text-primary' : 'bg-secondary/20 text-muted-foreground'
                                }`}>
                                  {event.type}
                                </Badge>
                                <div className="flex items-center gap-1.5 text-[9px] font-mono opacity-50 font-bold group-hover:text-primary transition-colors">
                                  <Clock className="w-2.5 h-2.5" />
                                  {format(event.start, 'HH:mm')}
                                </div>
                              </div>
                              <h4 className="font-bold text-[13px] mb-0.5 group-hover:translate-x-0.5 transition-transform truncate">{event.title}</h4>
                              {event.description && <p className="text-[10px] text-muted-foreground/60 italic serif line-clamp-1 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{event.description}</p>}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {Array.from({ length: 7 }).every((_, i) => getEventsForDay(addDays(new Date(), i)).length === 0) && (
                <div className="text-center py-20 opacity-30">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-black uppercase tracking-widest">Nothing scheduled</h3>
                  <p className="text-sm italic serif">Your upcoming week looks clear!</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Side Panel */}
        <aside className="w-80 border-l bg-secondary/10 p-6 hidden xl:flex flex-col gap-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tighter">{format(selectedDate, 'EEEE')}</h3>
              <p className="text-sm text-muted-foreground font-medium">{format(selectedDate, 'MMMM do, yyyy')}</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Events & Deadlines</h4>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  <AnimatePresence mode="popLayout">
                    {selectedDayEvents.map(event => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => {
                          if (event.type === 'task' && event.relatedId) {
                            const task = tasks.find(t => t.id === event.relatedId);
                            if (task) openEditTask(task);
                          } else {
                            openEditEvent(event);
                          }
                        }}
                      >
                        <Card className="premium-card border-l-4 border-l-primary hover:bg-card/60 cursor-pointer">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-primary">{event.type}</span>
                              <span className="text-[9px] font-mono opacity-40">{format(event.start, 'HH:mm')}</span>
                            </div>
                            <h5 className="text-xs font-bold leading-tight mb-1">{event.title}</h5>
                            {event.description && (
                              <p className="text-[10px] text-muted-foreground italic serif mb-2 line-clamp-2">{event.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${event.color}`} />
                                <span className={`text-[10px] font-medium italic serif ${
                                  event.status === 'completed' ? 'text-emerald-500' : 'text-muted-foreground'
                                }`}>
                                  {event.status === 'completed' ? 'Completed' : 'Active'}
                                </span>
                              </div>
                              {event.link && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-md"
                                  onClick={() => window.open(event.link, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 text-primary" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {selectedDayEvents.length === 0 && (
                    <div className="text-center py-12 opacity-30">
                      <Sparkles className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No events scheduled</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <Button 
              variant="outline" 
              className="w-full rounded-xl border-dashed border-primary/20 text-xs font-black uppercase tracking-widest h-12"
              onClick={() => {
                setEntryType('task');
                setEditingTask(null);
              setNewQuickTask({ title: '', description: '', link: '', priority: 'medium', cardStyle: 'accent', time: '09:00' });
                setIsAddEventOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Quick Add Task
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

