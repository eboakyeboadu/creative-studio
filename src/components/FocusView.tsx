import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Timer, Clock, BarChart3, Maximize2, Play, Pause, RotateCcw, Sparkles, 
  Hourglass, Lightbulb, Volume2, Flame, Trophy, Target, Activity, 
  Calendar, ArrowUpRight, Brain, Moon, Leaf, Coffee, Music, CheckCircle2, 
  Zap, TrendingUp, History
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

export const FOCUS_MUSIC_TRACKS = [
  { id: 'lofi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', label: 'Chill Lo-fi', desc: 'Relaxed beats for steady focus', icon: Brain, thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'zen', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', label: 'Zen Garden', desc: 'Slow, meditative sounds', icon: Moon, thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'focus', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', label: 'Deep Focus', desc: 'Minimalist electronic pulses', icon: Zap, thumbnail: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'nature', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', label: 'Nordic Woods', desc: 'Cool, crisp nature soundscapes', icon: Leaf, thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'cafe', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', label: 'Jazz Cafe', desc: 'Sophisticated, steady rhythm', icon: Coffee, thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: 'track', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', label: 'Track', desc: 'Ambient atmosphere', icon: Music, thumbnail: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=200&h=200&auto=format&fit=crop' },
];

export interface FocusViewProps {
  viewStates: Record<string, any>;
  updateViewState: (view: string, updates: any) => void;
  resolvedTheme: 'light' | 'dark';
  t: any;
  showFocusWidget: boolean;
  setShowFocusWidget: (show: boolean) => void;
  isFocusActive: boolean;
  setIsFocusActive: (active: boolean) => void;
  focusTimeRemaining: number;
  setFocusTimeRemaining: (time: number) => void;
  focusDuration: number;
  setFocusDuration: (duration: number) => void;
  focusHistory: { id: string; task: string; duration: number; completedAt: number }[];
  setFocusHistory: (history: { id: string; task: string; duration: number; completedAt: number }[]) => void;
  focusTask: string;
  setFocusTask: (task: string) => void;
  focusVolume: number;
  setFocusVolume: (volume: number) => void;
  focusMusicId: string | null;
  setFocusMusicId: (id: string | null) => void;
  addFocusTime: (minutes: number) => void;
}

export function FocusView({
  viewStates,
  updateViewState,
  resolvedTheme,
  t,
  showFocusWidget,
  setShowFocusWidget,
  isFocusActive,
  setIsFocusActive,
  focusTimeRemaining,
  setFocusTimeRemaining,
  focusDuration,
  setFocusDuration,
  focusHistory,
  setFocusHistory,
  focusTask,
  setFocusTask,
  focusVolume,
  setFocusVolume,
  focusMusicId,
  setFocusMusicId,
  addFocusTime
}: FocusViewProps) {
  const focusTab = viewStates.focus.activeTab || 'timer';
  const focusScope = viewStates.focus.focusScope || 'week';
  const setFocusTab = (tab: string) => updateViewState('focus', { activeTab: tab });
  const setFocusScope = (scope: 'today' | 'week' | 'month') => updateViewState('focus', { focusScope: scope });

  const getStatsData = () => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (focusScope === 'today') {
      // Hourly view for today
      const hours = Array.from({ length: 25 }, (_, i) => ({
        name: i === 24 ? "23:59" : `${i.toString().padStart(2, '0')}:00`,
        sessions: 0,
        minutes: 0,
        hour: i
      }));
      
      focusHistory.forEach(s => {
        const date = new Date(s.completedAt);
        if (date.toDateString() === now.toDateString()) {
          const hour = date.getHours();
          hours[hour].sessions += 1;
          hours[hour].minutes += s.duration;
        }
      });
      return hours;
    } else if (focusScope === 'month') {
      // Daily view for the last 30 days
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i));
        return {
          name: `${d.getDate()}/${d.getMonth() + 1}`,
          date: d.toDateString(),
          sessions: 0,
          minutes: 0
        };
      });
      
      focusHistory.forEach(s => {
        const sDate = new Date(s.completedAt).toDateString();
        const day = last30Days.find(d => d.date === sDate);
        if (day) {
          day.sessions += 1;
          day.minutes += s.duration;
        }
      });
      return last30Days;
    } else {
      // Weekly view (Mon-Sun)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData = days.map(day => ({
        name: day,
        sessions: 0,
        minutes: 0
      }));

      const last7Days = new Date(now.getTime() - 7 * oneDay);
      focusHistory.forEach(s => {
        const date = new Date(s.completedAt);
        if (date > last7Days) {
          const dayName = days[date.getDay()];
          const dayObj = weeklyData.find(d => d.name === dayName);
          if (dayObj) {
            dayObj.sessions += 1;
            dayObj.minutes += s.duration;
          }
        }
      });
      
      const todayIdx = now.getDay();
      const reordered = [...weeklyData.slice(todayIdx + 1), ...weeklyData.slice(0, todayIdx + 1)];
      return reordered;
    }
  };

  const statsData = getStatsData();
  const chartTickColor = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const chartGridColor = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  const totalSeconds = focusHistory.reduce((acc, s) => acc + (s.duration * 60), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const sessionsToday = focusHistory.filter(s => new Date(s.completedAt).toDateString() === new Date().toDateString()).length;
  
  const scopeTotalMinutes = statsData.reduce((acc, d) => acc + d.minutes, 0);
  const scopeTotalHours = (scopeTotalMinutes / 60).toFixed(1);

  const avgSessionTime = focusHistory.length > 0 ? (totalSeconds / (focusHistory.length * 60)).toFixed(0) : 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-white/40 dark:bg-card/50 backdrop-blur-xl z-10 relative">
      <header className="pl-16 pr-4 lg:px-12 py-8 border-b bg-card/40 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-xl transition-transform hover:rotate-12">
                  <Timer className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-primary">{t.focusMode}</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{t.focus}</h2>
            </div>
            
            <div className="flex items-center gap-2 p-1.5 bg-secondary/20 rounded-2xl w-fit border border-white/5">
              <Button
                variant={focusTab === 'timer' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFocusTab('timer')}
                className={`rounded-xl px-6 font-bold uppercase tracking-widest text-[10px] h-9 transition-all ${focusTab === 'timer' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-primary/10 text-primary'}`}
              >
                <Clock className="w-3.5 h-3.5 mr-2" />
                {t.timer}
              </Button>
              <Button
                variant={focusTab === 'stats' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFocusTab('stats')}
                className={`rounded-xl px-6 font-bold uppercase tracking-widest text-[10px] h-9 transition-all ${focusTab === 'stats' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-primary/10 text-primary'}`}
              >
                <BarChart3 className="w-3.5 h-3.5 mr-2" />
                {t.stats}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2 border-primary/20 hover:bg-primary/10 rounded-2xl h-12 px-6"
              onClick={() => setShowFocusWidget(!showFocusWidget)}
            >
              <Maximize2 className="w-4 h-4" />
              {showFocusWidget ? "Hide Floating Widget" : "Show Floating Widget"}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full pb-8">
        {focusTab === 'timer' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <Card className="premium-card p-6 flex flex-col items-center justify-center space-y-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-secondary/10"
                    />
                    <motion.circle
                      cx="128"
                      cy="128"
                      r="120"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 120}
                      initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                      animate={{ strokeDashoffset: (2 * Math.PI * 120) * (1 - focusTimeRemaining / (focusDuration * 60)) }}
                      transition={{ type: "spring", bounce: 0, duration: 1 }}
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="flex items-baseline justify-center gap-1 group/timer">
                      {!isFocusActive ? (
                        <div className="flex items-baseline gap-0.5">
                          <Input 
                            type="number" 
                            value={Math.floor(focusTimeRemaining / 60)} 
                            onChange={(e) => {
                              const m = parseInt(e.target.value) || 0;
                              const s = focusTimeRemaining % 60;
                              const newVal = Math.max(0, m * 60 + s);
                              setFocusTimeRemaining(newVal);
                              setFocusDuration(Math.max(1, m));
                            }}
                            className="w-24 h-16 text-6xl font-black text-center bg-transparent border-none p-0 focus-visible:ring-0 tabular-nums"
                          />
                          <span className="text-2xl font-black opacity-30">:</span>
                          <Input 
                            type="number" 
                            max="59"
                            value={focusTimeRemaining % 60} 
                            onChange={(e) => {
                              const s = parseInt(e.target.value) || 0;
                              const m = Math.floor(focusTimeRemaining / 60);
                              setFocusTimeRemaining(Math.max(0, m * 60 + Math.min(s, 59)));
                            }}
                            className="w-16 h-10 text-4xl font-black text-center bg-transparent border-none p-0 focus-visible:ring-0 tabular-nums opacity-60"
                          />
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-0.5 animate-in fade-in duration-500">
                          <span className="text-7xl font-black tracking-tighter tabular-nums text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                            {Math.floor(focusTimeRemaining / 60)}
                          </span>
                          <span className="text-2xl font-black opacity-30 mx-1">:</span>
                          <span className="text-5xl font-black tracking-tighter tabular-nums opacity-60">
                            {(focusTimeRemaining % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 max-w-[160px] flex flex-col items-center gap-0.5">
                      <Input 
                        value={focusTask}
                        onChange={(e) => setFocusTask(e.target.value)}
                        className="h-6 text-[10px] bg-transparent border-none text-center font-black uppercase tracking-[0.15em] focus-visible:ring-0 placeholder:opacity-30"
                        placeholder="Goal..."
                      />
                      <div className="h-0.5 w-8 bg-primary/20 mx-auto rounded-full mt-0.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  {[1, 5, 10].map(mins => (
                    <Button
                      key={mins}
                      variant="secondary"
                      size="sm"
                      className="h-8 px-3 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/5 transition-all font-black text-[9px] tracking-widest text-primary"
                      onClick={() => addFocusTime(mins)}
                    >
                      +{mins}m
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-3 relative z-10 w-full px-4">
                  <Button 
                    size="lg" 
                    className={`h-12 px-6 rounded-xl shadow-xl transition-all duration-300 hover:scale-105 font-black uppercase tracking-[0.15em] text-[10px] gap-2 flex-1 min-w-0 ${isFocusActive ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                    onClick={() => setIsFocusActive(!isFocusActive)}
                  >
                    {isFocusActive ? (
                      <>
                        <Pause className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{t.pauseFocus}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 ml-0.5 flex-shrink-0" />
                        <span className="truncate">{t.startFocus}</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-12 w-12 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all flex flex-col items-center justify-center gap-0.5 flex-shrink-0"
                    onClick={() => {
                      setIsFocusActive(false);
                      setFocusTimeRemaining(focusDuration * 60);
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-[6px] font-black uppercase tracking-widest opacity-40">{t.resetFocus}</span>
                  </Button>
                </div>
              </Card>

              <Card className="premium-card p-5 bg-card/40 border-l-4 border-l-primary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <Brain className="w-12 h-12 rotate-12" />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <h3 className="text-[9px] font-black uppercase tracking-[0.1em] text-primary">{t.pomodoroTechnique}</h3>
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground italic serif mb-2">
                    "{t.pomodoroDescription}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">25m {t.focusPhase}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">5m {t.restPhase}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="premium-card p-4 bg-white/5 border-white/5 shadow-2xl">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/80 mb-3 flex items-center justify-between">
                  {t.presets}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: t.workTime, duration: 25, icon: Timer, color: 'bg-white shadow-sm' },
                    { label: t.breakTime, duration: 5, icon: Hourglass, color: 'bg-white shadow-sm' },
                    { label: t.longBreak, duration: 15, icon: Hourglass, color: 'bg-white shadow-sm' },
                    { label: 'Deep Work', duration: 50, icon: Lightbulb, color: 'bg-white shadow-sm' }
                  ].map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      className={`h-14 flex flex-row items-center justify-start gap-2.5 px-3 transition-all duration-300 rounded-xl ${
                        focusDuration === preset.duration 
                        ? 'bg-red-50 shadow-lg ring-1 ring-red-200 scale-[1.02]' 
                        : 'bg-white/40 hover:bg-white hover:shadow-md'
                      }`}
                      onClick={() => {
                        setFocusDuration(preset.duration);
                        setFocusTimeRemaining(preset.duration * 60);
                        setIsFocusActive(false);
                      }}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        focusDuration === preset.duration ? 'bg-red-500' : preset.color
                      }`}>
                        <preset.icon className={`w-4 h-4 ${focusDuration === preset.duration ? 'text-white' : 'text-slate-800'}`} />
                      </div>
                      <div className="text-left min-w-0">
                        <div className={`text-[10px] font-black uppercase tracking-tight leading-none truncate ${
                          focusDuration === preset.duration ? 'text-red-700' : 'text-slate-800'
                        }`}>{preset.label}</div>
                        <div className={`text-[11px] font-bold mt-0.5 ${
                          focusDuration === preset.duration ? 'text-red-500/70' : 'text-slate-500'
                        }`}>{preset.duration}m</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="premium-card p-4 bg-white/5 border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/80">
                    Focus Music
                  </h3>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors ${
                    focusMusicId ? 'bg-red-500' : 'bg-white'
                  }`}>
                    {isFocusActive && focusMusicId ? (
                      <div className="flex gap-0.5 items-end h-2">
                        {[1, 2, 3].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [2, 6, 4, 6, 2] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                            className="w-0.5 bg-white rounded-full"
                          />
                        ))}
                      </div>
                    ) : (
                      <Play className={`w-2.5 h-2.5 ml-0.5 ${focusMusicId ? 'text-white' : 'text-slate-800'}`} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_MUSIC_TRACKS.map(track => {
                    const TrackIcon = track.icon;
                    return (
                      <button
                        key={track.id}
                        className={`group flex items-center gap-2 p-1.5 rounded-xl transition-all duration-300 text-left ${
                          focusMusicId === track.id
                            ? 'bg-red-50 shadow-lg ring-1 ring-red-200'
                            : 'hover:bg-white/40'
                        }`}
                        onClick={() => setFocusMusicId(focusMusicId === track.id ? null : track.id)}
                      >
                        <div className={`w-9 h-9 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-all shrink-0 ${
                          focusMusicId === track.id ? 'ring-2 ring-red-500 ring-offset-1' : ''
                        }`}>
                          <img 
                            src={track.thumbnail} 
                            alt={track.label} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-[10px] font-black truncate transition-colors ${
                            focusMusicId === track.id ? 'text-red-700' : 'text-slate-600'
                          }`}>
                            {track.label}
                          </div>
                          {focusMusicId === track.id && (
                            <div className="text-[7px] font-bold text-red-500 animate-pulse uppercase tracking-widest mt-0.5">
                              Active
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  <button
                    className={`group flex items-center gap-2 p-1.5 rounded-xl transition-all duration-300 text-left ${
                      !focusMusicId
                        ? 'bg-red-50 shadow-lg ring-1 ring-red-200'
                        : 'hover:bg-white/40'
                    }`}
                    onClick={() => setFocusMusicId(null)}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border border-dashed shrink-0 transition-colors ${
                      !focusMusicId ? 'bg-red-100 border-red-300' : 'bg-slate-100 border-slate-300'
                    }`}>
                      <Music className={`w-4 h-4 transition-colors ${!focusMusicId ? 'text-red-500' : 'text-slate-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[10px] font-black truncate transition-colors ${
                        !focusMusicId ? 'text-red-700' : 'text-slate-600'
                      }`}>
                        No Music
                      </div>
                    </div>
                  </button>
                </div>
                
                {focusMusicId && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-slate-500" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={focusVolume}
                        onChange={(e) => setFocusVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="relative overflow-hidden p-8 !bg-primary border-none !text-white flex flex-col justify-between h-52 shadow-xl shadow-primary/20 transition-transform hover:scale-[1.02] duration-300 rounded-[2rem]">
                <div className="flex items-center justify-between relative z-10">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="outline" className="bg-white/10 border-white/20 text-white uppercase text-[8px] tracking-widest font-bold">Total</Badge>
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">{t.totalFocusTime}</div>
                  <div className="text-4xl font-extrabold font-mono tracking-tighter text-white">{totalHours}<span className="text-lg ml-1 opacity-60 font-light">h</span></div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden p-8 !bg-emerald-600 border-none !text-white flex flex-col justify-between h-52 shadow-xl shadow-emerald-600/20 transition-transform hover:scale-[1.02] duration-300 rounded-[2rem]">
                <div className="flex items-center justify-between relative z-10">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="outline" className="bg-white/10 border-white/20 text-white uppercase text-[8px] tracking-widest font-bold">Done</Badge>
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">{t.sessionsCompleted}</div>
                  <div className="text-4xl font-black font-mono tracking-tighter text-white">{focusHistory.length}</div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden p-8 !bg-amber-600 border-none !text-white flex flex-col justify-between h-52 shadow-xl shadow-amber-600/20 transition-transform hover:scale-[1.02] duration-300 rounded-[2rem]">
                <div className="flex items-center justify-between relative z-10">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="outline" className="bg-white/10 border-white/20 text-white uppercase text-[8px] tracking-widest font-bold">Average</Badge>
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Avg. Session</div>
                  <div className="text-4xl font-black font-mono tracking-tighter text-white">{avgSessionTime}<span className="text-lg ml-1 opacity-60">m</span></div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden p-8 !bg-indigo-600 border-none !text-white flex flex-col justify-between h-52 shadow-xl shadow-indigo-600/20 transition-transform hover:scale-[1.02] duration-300 rounded-[2rem]">
                <div className="flex items-center justify-between relative z-10">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= sessionsToday ? 'bg-white' : 'bg-white/20'}`} />
                    ))}
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Sessions Today</div>
                  <div className="text-4xl font-black font-mono tracking-tighter text-white">{sessionsToday}</div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="premium-card p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      {t.activity}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black">{scopeTotalHours}</span>
                      <span className="text-xs font-bold opacity-40 uppercase tracking-widest">{t.hours}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 p-1 bg-secondary/20 rounded-xl border border-white/5 self-start">
                    {[
                      { id: 'today', label: t.today },
                      { id: 'week', label: t.week },
                      { id: 'month', label: t.month }
                    ].map((scope) => (
                      <Button
                        key={scope.id}
                        variant={focusScope === scope.id ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFocusScope(scope.id as 'today' | 'week' | 'month')}
                        className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${focusScope === scope.id ? 'bg-background shadow-md text-primary' : 'hover:bg-background/30'}`}
                      >
                        {scope.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-72 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData}>
                      <defs>
                        <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis 
                        dataKey="name" 
                        stroke={chartTickColor} 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fontStyle: 'italic', fontWeight: 800, fill: chartTickColor }}
                        interval={focusScope === 'month' ? 4 : focusScope === 'today' ? 3 : 0}
                        height={40}
                        dy={10}
                      />
                      <YAxis hide domain={[0, 'dataMax + 5']} />
                      <RechartsTooltip 
                        cursor={{ fill: chartGridColor, radius: 8 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="glass-card p-3 shadow-2xl animate-in fade-in zoom-in duration-200">
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                  {payload[0].payload.date || payload[0].payload.name}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold opacity-60">Focus:</span>
                                    <span className="text-xs font-black text-primary">{payload[0].value} {t.minutes}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold opacity-60">Sessions:</span>
                                    <span className="text-xs font-black">{payload[0].payload.sessions}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="minutes" 
                        fill="url(#focusGradient)" 
                        radius={[6, 6, 2, 2]} 
                        barSize={focusScope === 'month' ? 8 : 24}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="premium-card overflow-hidden flex flex-col">
                <div className="p-8 border-b bg-muted/30 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    {t.focusSessionHistory}
                  </h3>
                  <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest hover:text-destructive" onClick={() => {
                    localStorage.removeItem('focusHistory');
                    setFocusHistory([]);
                  }}>
                    Clear
                  </Button>
                </div>
                <ScrollArea className="flex-1 h-[330px]">
                  <div className="p-0">
                    <table className="w-full">
                      <tbody className="divide-y divide-white/5">
                        {focusHistory.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-8 py-20 text-center text-muted-foreground text-sm font-medium italic opacity-40">
                              {t.noSessionsYet}
                            </td>
                          </tr>
                        ) : (
                          focusHistory.map((session) => (
                            <tr key={session.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-8 py-4">
                                <div className="font-bold text-sm mb-0.5">{session.task}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">{new Date(session.completedAt).toLocaleTimeString()}</div>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs font-black tabular-nums">{session.duration}m</span>
                                  <div className="text-[9px] font-black uppercase tracking-tighter opacity-30">{new Date(session.completedAt).toLocaleDateString()}</div>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

