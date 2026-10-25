import React, { useState } from 'react';
import { useAuth } from '../contexts/FirebaseContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  Plus, Search, Filter, Tag, Folder, Clock, 
  AlertTriangle, MoreVertical, ChevronDown, CheckCircle2, 
  Circle, Calendar as CalendarIcon, List, Trash2, Edit2,
  AlertCircle, Check, X, ChevronRight, LayoutGrid, ListTodo, History,
  ExternalLink, Sparkles, Settings2, BellRing
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from './ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { PromptEnhancer } from './PromptEnhancer';
import { 
  Popover, PopoverContent, PopoverTrigger 
} from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, setHours, setMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

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
  notified2h?: boolean;
  notified24h?: boolean;
}

const STAGES = (t: any) => [
  { id: 'todo', label: t.todo || 'To Do', color: 'bg-blue-500/10 text-blue-500' },
  { id: 'completed', label: t.done || 'Done', color: 'bg-emerald-500/10 text-emerald-500' },
] as const;

export default function TasksView({ t, tasks, setTasks, initialTaskId, pendingTaskData }: { 
  t: any, 
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  initialTaskId?: string,
  pendingTaskData?: any
}) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [showCompletedInList, setShowCompletedInList] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTime, setTaskTime] = useState('09:00');
  const [isSuggestingDeadline, setIsSuggestingDeadline] = useState(false);
  
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    link: '',
    priority: 'medium',
    status: 'todo',
    cardStyle: 'accent',
    tags: [],
    category: 'General',
    folder: 'General'
  });

  const [availableCategories, setAvailableCategories] = useState<string[]>(['General', 'Marketing', 'Development', 'Operations']);
  const [availableFolders, setAvailableFolders] = useState<string[]>(['General', 'Campaigns', 'Personal']);

  const folders = Array.from(new Set([...availableFolders, ...tasks.map(t => t.folder).filter(Boolean)])) as string[];
  const categories = Array.from(new Set([...availableCategories, ...tasks.map(t => t.category).filter(Boolean)])) as string[];
  
  React.useEffect(() => {
    if (initialTaskId) {
      const task = tasks.find(t => t.id === initialTaskId);
      if (task) openEditDialog(task);
    }
  }, [initialTaskId, tasks]);

  React.useEffect(() => {
    if (pendingTaskData) {
      setNewTask({
        title: pendingTaskData.title || '',
        description: pendingTaskData.description || '',
        priority: pendingTaskData.priority || 'medium',
        status: 'todo',
        cardStyle: 'accent',
        tags: [],
        category: 'General',
        folder: 'General'
      });
      setIsCreateDialogOpen(true);
    }
  }, [pendingTaskData]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !activeFolder || task.folder === activeFolder;
    return matchesSearch && matchesFolder;
  });

  const stages = STAGES(t);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !user) return;
    
    let dueDate = newTask.dueDate;
    if (dueDate) {
      const [hours, minutes] = taskTime.split(':').map(Number);
      dueDate = setHours(setMinutes(dueDate, minutes), hours);
    }

    // Close immediately for responsiveness
    setIsCreateDialogOpen(false);
    
    // Defer state clearing slightly to let the animation start
    setTimeout(() => {
      setEditingTask(null);
      setNewTask({ title: '', description: '', link: '', priority: 'medium', status: 'todo', cardStyle: 'accent', tags: [], category: 'General', folder: 'General' });
      setTaskTime('09:00');
    }, 50);

    const taskToSave = { ...newTask };
    const editingId = editingTask?.id;

    try {
      if (editingId) {
        const taskRef = doc(db, 'users', user.uid, 'tasks', editingId);
        await updateDoc(taskRef, {
          ...taskToSave,
          dueDate: dueDate || null
        });
      } else {
        const tasksCollection = collection(db, 'users', user.uid, 'tasks');
        await addDoc(tasksCollection, {
          title: taskToSave.title,
          description: taskToSave.description || '',
          link: taskToSave.link || '',
          status: taskToSave.status || 'todo',
          priority: taskToSave.priority || 'medium',
          cardStyle: taskToSave.cardStyle || 'accent',
          tags: taskToSave.tags || [],
          category: taskToSave.category || 'General',
          folder: taskToSave.folder || 'General',
          dueDate: dueDate || null,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setNewTask({ ...task });
    if (task.dueDate) {
      setTaskTime(format(task.dueDate, 'HH:mm'));
    }
    setIsCreateDialogOpen(true);
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    if (!user) return;
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', id);
      await updateDoc(taskRef, { status });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const toggleTaskStatus = async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    try {
      const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
      const taskRef = doc(db, 'users', user.uid, 'tasks', id);
      await updateDoc(taskRef, { status: nextStatus });
    } catch (error) {
      console.error("Error toggling task status:", error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', id);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getPriorityAccent = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-b from-red-600 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
      case 'medium': return 'bg-gradient-to-b from-yellow-500 to-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.3)]';
      case 'low': return 'bg-gradient-to-b from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
      default: return 'bg-muted-foreground/30';
    }
  };

  const getSolidBackground = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-br from-red-600/95 to-red-800 shadow-xl border-red-500/40 text-white';
      case 'medium': return 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-xl border-yellow-400/30 text-slate-900';
      case 'low': return 'bg-gradient-to-br from-emerald-500/95 to-emerald-800 shadow-xl border-emerald-400/30 text-white';
      default: return 'bg-secondary/40 border-white/5';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 backdrop-blur-sm">
      <header className="px-4 py-3 border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight flex items-center gap-2 font-heading">
              <ListTodo className="w-6 h-6 text-primary" />
              Tasks & To-Dos
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              Task management for data-driven teams.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-secondary/20 p-0.5 rounded-lg mr-1">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon-xs" 
                className="rounded-md h-7 w-7"
                onClick={() => setViewMode('list')}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant={viewMode === 'board' ? 'secondary' : 'ghost'} 
                size="icon-xs" 
                className="rounded-md h-7 w-7"
                onClick={() => setViewMode('board')}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="relative group flex-1 md:w-32 lg:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-9 h-8 bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger render={
                <Button variant="outline" className="rounded-lg h-8 w-8 p-0 border-none hover:bg-secondary/30">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              } />
              <DialogContent className="sm:max-w-md rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-extrabold tracking-tight">Task Configuration</DialogTitle>
                  <DialogDescription>Manage your task categories and organizational folders.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Custom Categories</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableCategories.map(cat => (
                        <Badge key={cat} className="rounded-full px-3 py-1 font-bold bg-primary/5 text-primary border-primary/10">
                          {cat}
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" className="h-6 rounded-full border border-dashed border-muted-foreground/30 text-[10px] gap-1">
                        <Plus className="w-3 h-3" /> Add
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Folder Structure</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableFolders.map(folder => (
                        <div key={folder} className="flex items-center justify-between p-2 rounded-xl bg-secondary/20 text-xs font-bold">
                          <span className="flex items-center gap-2"><Folder className="w-3 h-3" /> {folder}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) {
                setEditingTask(null);
                setNewTask({ 
                  title: '', 
                  description: '', 
                  link: '', 
                  priority: 'medium', 
                  status: 'todo', 
                  tags: [], 
                  category: 'General', 
                  folder: 'General' 
                });
                setTaskTime('09:00');
              }
            }}>
              <DialogTrigger render={
                <Button 
                  className="rounded-lg h-8 shadow-md shadow-primary/20 gap-1.5 text-xs px-3"
                  onClick={() => {
                    setEditingTask(null);
                    setNewTask({ 
                      title: '', 
                      description: '', 
                      link: '', 
                      priority: 'medium', 
                      status: 'todo', 
                      tags: [], 
                      category: 'General', 
                      folder: 'General' 
                    });
                    setTaskTime('09:00');
                  }}
                >
                  <Plus className="w-4 h-4" /> New Task
                </Button>
              } />
              <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border-primary/10 shadow-2xl p-0">
                <DialogHeader className="px-6 pt-8 pb-4 shrink-0">
                  <DialogTitle className="text-2xl font-extrabold tracking-tight font-heading">
                    {editingTask ? 'Edit Task' : 'Create Task'}
                  </DialogTitle>
                  <DialogDescription className="italic serif">Add details, tags, and categories to stay organized.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-1">
                  <div className="grid gap-6 px-5 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Task Title</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="title" 
                        placeholder="What needs to be done?" 
                        className="rounded-xl flex-1 h-12"
                        value={newTask.title || ''}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      />
                      <Button 
                        variant="ghost" 
                        className="h-12 w-12 p-0 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20"
                        title="AI Suggest Deadline"
                        onClick={async () => {
                          if (!newTask.title) {
                            return;
                          }
                          const title = newTask.title.toLowerCase();
                          let suggestedDate = new Date();
                          if (title.includes('tomorrow')) {
                            suggestedDate.setDate(suggestedDate.getDate() + 1);
                          } else if (title.includes('next week')) {
                            suggestedDate.setDate(suggestedDate.getDate() + 7);
                          } else if (title.includes('monday')) {
                            const date = new Date();
                            date.setDate(date.getDate() + (1 + 7 - date.getDay()) % 7 || 7);
                            suggestedDate = date;
                          }
                          setNewTask(prev => ({ ...prev, dueDate: suggestedDate }));
                        }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Description</Label>
                      <PromptEnhancer 
                        value={newTask.description || ''} 
                        onEnhance={(val) => setNewTask({ ...newTask, description: val })}
                      />
                    </div>
                    <div className="relative">
                      <Textarea 
                        id="description" 
                        placeholder="Add more context..." 
                        className="rounded-xl min-h-[100px] pr-12"
                        value={newTask.description || ''}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="link" className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Link (Zoom, Docs, etc.)</Label>
                    <Input 
                      id="link" 
                      placeholder="https://..." 
                      className="rounded-xl"
                      value={newTask.link || ''}
                      onChange={(e) => setNewTask({ ...newTask, link: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Priority</Label>
                      <Select value={newTask.priority || 'medium'} onValueChange={(v) => setNewTask({ ...newTask, priority: v as any })}>
                        <SelectTrigger className="rounded-xl h-10 px-4">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Card Visual Style</Label>
                      <Select value={newTask.cardStyle || 'accent'} onValueChange={(v) => setNewTask({ ...newTask, cardStyle: v as any })}>
                        <SelectTrigger className="rounded-xl h-10 px-4">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="accent">Subtle Accent (White/Glass)</SelectItem>
                          <SelectItem value="solid">Vibrant Solid (Graded)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Initial Status</Label>
                      <Select value={newTask.status || 'todo'} onValueChange={(v) => setNewTask({ ...newTask, status: v as any })}>
                        <SelectTrigger className="rounded-xl h-10 px-4">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {stages.map(stage => (
                            <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Category</Label>
                      <Input 
                        placeholder="e.g. Marketing" 
                        className="rounded-xl"
                        value={newTask.category || ''}
                        onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Folder</Label>
                    <Input 
                      placeholder="e.g. Q4 Planning" 
                      className="rounded-xl"
                      value={newTask.folder || ''}
                      onChange={(e) => setNewTask({ ...newTask, folder: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Tags (comma separated)</Label>
                    <Input 
                      placeholder="e.g. strategy, urgent" 
                      className="rounded-xl"
                      value={newTask.tags?.join(', ') || ''}
                      onChange={(e) => setNewTask({ ...newTask, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Due Date</Label>
                      <Popover>
                        <PopoverTrigger render={
                          <Button
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal rounded-xl ${!newTask.dueDate && "text-muted-foreground"}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newTask.dueDate ? format(newTask.dueDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        } />
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newTask.dueDate}
                            onSelect={(date) => setNewTask({ ...newTask, dueDate: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Time</Label>
                      <Input 
                        type="time"
                        value={taskTime || ''}
                        onChange={(e) => setTaskTime(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 pt-5 pb-8 border-t bg-muted/30 shrink-0 rounded-b-3xl">
                  <DialogClose render={
                    <Button variant="outline" className="rounded-xl h-10 px-6">Cancel</Button>
                  } />
                  <Button onClick={handleCreateTask} className="rounded-xl h-10 px-8">
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-48 lg:w-56 border-r bg-secondary/10 p-4 hidden lg:flex flex-col gap-6">
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-primary opacity-60 font-heading">Success Pulse</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-muted-foreground">Completion</span>
                  <span className="text-lg font-extrabold tracking-tighter font-heading">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold opacity-60">
                  <span>{tasks.filter(t => t.status === 'completed').length} Done</span>
                  <span>{tasks.length} Total</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[9px] lg:text-[10px] font-semibold uppercase tracking-widest opacity-40">Folders</h3>
            <div className="space-y-0.5">
              <Button 
                variant={activeFolder === null ? "secondary" : "ghost"} 
                className="w-full h-8 justify-start gap-2 rounded-lg text-[11px] font-bold px-2.5"
                onClick={() => setActiveFolder(null)}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> All Tasks
              </Button>
              {folders.map(folder => (
                <Button 
                  key={folder}
                  variant={activeFolder === folder ? "secondary" : "ghost"} 
                  className="w-full h-8 justify-start gap-2 rounded-lg text-[11px] font-bold px-2.5"
                  onClick={() => setActiveFolder(folder)}
                >
                  <Folder className="w-3.5 h-3.5" /> {folder}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest opacity-40">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Badge key={cat} variant="outline" className="bg-background/50 border-primary/10 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {viewMode === 'list' ? (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest opacity-40">Active Tasks</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[9px] font-bold gap-1.5 px-2"
                  onClick={() => setShowCompletedInList(!showCompletedInList)}
                >
                  {showCompletedInList ? 'Hide Done' : 'Show History'}
                  <History className="w-3 h-3" />
                </Button>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.filter(t => showCompletedInList || t.status !== 'completed').map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      toggleStatus={toggleTaskStatus} 
                      deleteTask={deleteTask} 
                      getPriorityColor={getPriorityColor}
                      onEdit={() => openEditDialog(task)}
                    />
                  ))}
                </AnimatePresence>

                {filteredTasks.filter(t => showCompletedInList || t.status !== 'completed').length === 0 && (
                  <EmptyState />
                )}
              </div>

              {showCompletedInList && filteredTasks.some(t => t.status === 'completed') && (
                <div className="pt-8 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest opacity-40 font-heading">Done History</h3>
                  <div className="space-y-4 opacity-70">
                    {filteredTasks.filter(t => t.status === 'completed').map((task) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        toggleStatus={toggleTaskStatus} 
                        deleteTask={deleteTask} 
                        getPriorityColor={getPriorityColor}
                        onEdit={() => openEditDialog(task)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex gap-6 overflow-x-auto pb-4">
              {stages.map(stage => (
                <div 
                  key={stage.id} 
                  className="flex-1 min-w-[300px] flex flex-col gap-4"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className={`p-3 rounded-xl ${stage.color} flex items-center justify-between`}>
                    <span className="text-xs font-semibold uppercase tracking-widest">{stage.label}</span>
                    <Badge variant="secondary" className="rounded-full px-2 py-0 h-5 text-[10px]">
                      {filteredTasks.filter(t => t.status === stage.id).length}
                    </Badge>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      <AnimatePresence mode="popLayout">
                        {filteredTasks.filter(t => t.status === stage.id).map(task => (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                          >
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              className="cursor-grab active:cursor-grabbing"
                            >
                              <Card 
                                className={`group relative overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-2xl cursor-pointer ${
                                  task.cardStyle === 'solid' ? getSolidBackground(task.priority) : 'bg-card/30 backdrop-blur-xl border border-white/5 hover:bg-card/50'
                                } ${task.status === 'completed' ? 'opacity-50' : ''}`}
                                onClick={() => openEditDialog(task)}
                              >
                                {/* Priority Accent Bar - Only show if not solid */}
                                {task.cardStyle !== 'solid' && (
                                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 z-10 ${getPriorityAccent(task.priority)}`} />
                                )}
                                
                                <CardContent className="p-3 space-y-2.5 relative z-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={`font-bold text-[13px] leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-2 ${
                                      task.cardStyle === 'solid' 
                                        ? (task.priority === 'medium' ? 'text-slate-900' : 'text-white') 
                                        : 'text-foreground/90'
                                    }`}>
                                      {task.title}
                                    </h4>
                                  </div>
                                  
                                  {task.description && (
                                    <p className={`text-[11px] italic font-medium serif line-clamp-2 leading-relaxed ${
                                      task.cardStyle === 'solid' 
                                        ? (task.priority === 'medium' ? 'text-slate-900/70' : 'text-white/70') 
                                        : 'text-muted-foreground/70'
                                    }`}>
                                      {task.description}
                                    </p>
                                  )}
                                  
                                  {task.link && (
                                    <div 
                                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-primary/80 hover:text-primary cursor-pointer transition-colors" 
                                      onClick={(e) => { e.stopPropagation(); window.open(task.link || '', '_blank'); }}
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      Resource
                                    </div>
                                  )}
  
                                  <div className={`flex items-center justify-between pt-2 border-t ${
                                    task.cardStyle === 'solid' ? 'border-white/10' : 'border-white/5'
                                  }`}>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0 rounded-md border-none ${
                                        task.cardStyle === 'solid' ? 'bg-white/20 text-white' : getPriorityColor(task.priority)
                                      }`}>
                                        {task.priority}
                                      </Badge>
                                      {task.dueDate && (
                                        <div className={`flex items-center gap-1.5 text-[9px] font-bold ${
                                          task.cardStyle === 'solid' ? 'text-white/60' : 'text-muted-foreground/60'
                                        }`}>
                                          <Clock className={`w-2.5 h-2.5 ${task.cardStyle === 'solid' ? 'text-white/40' : 'text-primary/60'}`} />
                                          {format(task.dueDate, 'MMM d')}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={`h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive ${
                                          task.cardStyle === 'solid' ? 'text-white/40 hover:bg-white/10 hover:text-white' : 'text-muted-foreground/40'
                                        }`}
                                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function TaskCard({ task, toggleStatus, deleteTask, getPriorityColor, onEdit }: { 
  task: Task, 
  toggleStatus: (id: string) => void, 
  deleteTask: (id: string) => void,
  getPriorityColor: (p: string) => string,
  onEdit: () => void
}) {
  const getPriorityAccent = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-b from-red-600 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
      case 'medium': return 'bg-gradient-to-b from-orange-500 to-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.3)]';
      case 'low': return 'bg-gradient-to-b from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
      default: return 'bg-muted-foreground/30';
    }
  };

  const getSolidBackground = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-br from-red-600/95 to-red-800 shadow-xl border-red-500/40 text-white';
      case 'medium': return 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-xl border-yellow-400/30 text-slate-900';
      case 'low': return 'bg-gradient-to-br from-emerald-500/95 to-emerald-800 shadow-xl border-emerald-400/30 text-white';
      default: return 'bg-secondary/40 border-white/5';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group"
      onClick={onEdit}
    >
      <Card className={`relative overflow-hidden transition-all hover:shadow-2xl cursor-pointer ${
        task.cardStyle === 'solid' ? getSolidBackground(task.priority) : 'bg-card/30 backdrop-blur-xl border border-white/5 hover:bg-card/50'
      } ${task.status === 'completed' ? 'opacity-50' : ''}`}>
        {/* Priority Accent Bar - Only if not solid */}
        {task.cardStyle !== 'solid' && (
          <div className={`absolute left-0 top-0 bottom-0 w-1 z-10 ${getPriorityAccent(task.priority)}`} />
        )}

        <CardContent className="p-3 flex items-start gap-3 relative z-0">
            <Checkbox 
            checked={task.status === 'completed'} 
            onCheckedChange={() => toggleStatus(task.id)}
            className={`mt-1 rounded-full w-4 h-4 border-2 transition-colors data-[state=checked]:bg-primary data-[state=checked]:border-primary ${
              task.cardStyle === 'solid' 
                ? (task.priority === 'medium' 
                  ? 'border-slate-900/30 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 data-[state=checked]:text-white' 
                  : 'border-white/30 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-primary')
                : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5 gap-4">
              <h4 className={`font-bold text-[15px] tracking-tight truncate transition-all ${
                task.status === 'completed' 
                  ? 'line-through text-muted-foreground/50' 
                  : (task.cardStyle === 'solid' 
                    ? (task.priority === 'medium' ? 'text-slate-900' : 'text-white') 
                    : 'text-foreground/90 group-hover:text-primary')
              }`}>
                {task.title}
              </h4>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0 rounded-md border-none ${
                  task.cardStyle === 'solid' 
                    ? (task.priority === 'medium' ? 'bg-slate-950/20 text-slate-900' : 'bg-white/20 text-white') 
                    : getPriorityColor(task.priority)
                }`}>
                  {task.priority}
                </Badge>
                  <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive ${
                    task.cardStyle === 'solid' 
                      ? (task.priority === 'medium' ? 'text-slate-900/40 hover:bg-slate-900/10 hover:text-slate-900' : 'text-white/40 hover:bg-white/10 hover:text-white') 
                      : 'text-muted-foreground/40'
                  }`}
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            {task.description && (
              <p className={`text-[12px] italic font-medium serif mb-2.5 line-clamp-1 leading-relaxed ${
                task.cardStyle === 'solid' 
                  ? (task.priority === 'medium' ? 'text-slate-900/70' : 'text-white/70') 
                  : 'text-muted-foreground/60'
              }`}>
                {task.description}
              </p>
            )}
            {task.link && (
              <div 
                className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-wider cursor-pointer mb-2.5 transition-colors underline underline-offset-4 ${
                  task.cardStyle === 'solid' 
                    ? (task.priority === 'medium' ? 'text-slate-950/80 hover:text-slate-950 decoration-slate-950/20' : 'text-white/80 hover:text-white decoration-white/20') 
                    : 'text-primary/70 hover:text-primary decoration-primary/10'
                }`}
                onClick={(e) => { e.stopPropagation(); window.open(task.link || '', '_blank'); }}
              >
                <ExternalLink className="w-3 h-3" />
                Resource
              </div>
            )}
            <div className={`flex flex-wrap items-center gap-3 border-t pt-2.5 ${
              task.cardStyle === 'solid' 
                ? (task.priority === 'medium' ? 'border-slate-950/10' : 'border-white/10') 
                : 'border-white/5'
            }`}>
              {task.dueDate && (
                <div className={`flex items-center gap-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                  task.cardStyle === 'solid' 
                    ? (task.priority === 'medium' ? 'bg-slate-950/10 text-slate-800' : 'bg-white/10 text-white/70') 
                    : 'bg-secondary/10 text-muted-foreground/50'
                }`}>
                  <Clock className={`w-2.5 h-2.5 ${
                    task.cardStyle === 'solid' 
                      ? (task.priority === 'medium' ? 'text-slate-900/40' : 'text-white/40') 
                      : 'text-primary/60'
                  }`} />
                  {format(task.dueDate, 'MMM d, HH:mm')}
                </div>
              )}
              {task.folder && (
                <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest border px-1.5 py-0.5 rounded-md ${
                  task.cardStyle === 'solid' 
                    ? (task.priority === 'medium' ? 'border-slate-950/10 text-slate-800' : 'border-white/10 text-white/60') 
                    : 'border-white/5 text-muted-foreground/50'
                }`}>
                  <Folder className="w-2.5 h-2.5" />
                  {task.folder}
                </div>
              )}
              <div className="flex gap-1.5">
                {task.tags && task.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className={`text-[8px] font-bold px-1.5 py-0 h-4 rounded-md border ${
                    task.cardStyle === 'solid' 
                      ? (task.priority === 'medium' ? 'bg-slate-950/5 text-slate-800/60 border-slate-950/5' : 'bg-white/5 text-white/50 border-white/5') 
                      : 'bg-primary/5 text-primary/60 border-primary/5'
                  }`}>
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10 lg:py-16 animate-in fade-in duration-500">
      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
        <ListTodo className="w-6 h-6 lg:w-8 lg:h-8 text-muted-foreground opacity-20" />
      </div>
      <h3 className="text-base lg:text-lg font-bold text-muted-foreground opacity-40">No tasks found</h3>
      <p className="text-[10px] lg:text-xs text-muted-foreground italic serif opacity-40">Try adjusting your search or filters.</p>
    </div>
  );
}

