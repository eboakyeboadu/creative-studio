import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Search, ArrowRight, X, Plus, Trash2, 
  ChevronDown, MapPin, RefreshCw, Layers, Clock
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './ui/popover';
import { cn } from '../lib/utils';
import { format, setHours, setMinutes, parse } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import ct from 'countries-and-timezones';

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '🌍';
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
};

// List of major world cities and their timezones
const MAJOR_CITIES = [
  { city: 'London', country: 'UK', timezone: 'Europe/London', flag: '🇬🇧', label: 'British Summer Time / GMT' },
  { city: 'Paris', country: 'France', timezone: 'Europe/Paris', flag: '🇫🇷', label: 'Central European Time' },
  { city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai', flag: '🇦🇪', label: 'Gulf Standard Time' },
  { city: 'New York', country: 'USA', timezone: 'America/New_York', flag: '🇺🇸', label: 'Eastern Standard Time' },
  { city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', flag: '🇯🇵', label: 'Japan Standard Time' },
  { city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', flag: '🇸🇬', label: 'Singapore Standard Time' },
  { city: 'Hong Kong', country: 'China', timezone: 'Asia/Hong_Kong', flag: '🇭🇰', label: 'Hong Kong Time' },
  { city: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin', flag: '🇩🇪', label: 'Central European Time' },
  { city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', flag: '🇦🇺', label: 'Australian Eastern Time' },
  { city: 'San Francisco', country: 'USA', timezone: 'America/Los_Angeles', flag: '🇺🇸', label: 'Pacific Standard Time' },
  { city: 'Toronto', country: 'Canada', timezone: 'America/Toronto', flag: '🇨🇦', label: 'Eastern Standard Time' },
  { city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', flag: '🇮🇳', label: 'India Standard Time' },
  { city: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul', flag: '🇰🇷', label: 'Korean Standard Time' },
  { city: 'Sao Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo', flag: '🇧🇷', label: 'Brasilia Time' },
  { city: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City', flag: '🇲🇽', label: 'Central Standard Time' },
  { city: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo', flag: '🇪🇬', label: 'Eastern European Time' },
  { city: 'Johannesburg', country: 'South Africa', timezone: 'Africa/Johannesburg', flag: '🇿🇦', label: 'South Africa Standard Time' },
  { city: 'Moscow', country: 'Russia', timezone: 'Europe/Moscow', flag: '🇷🇺', label: 'Moscow Standard Time' },
  { city: 'Beijing', country: 'China', timezone: 'Asia/Shanghai', flag: '🇨🇳', label: 'China Standard Time' },
  { city: 'Boston', country: 'USA', timezone: 'America/New_York', flag: '🇺🇸', label: 'Eastern Standard Time' },
  { city: 'Chicago', country: 'USA', timezone: 'America/Chicago', flag: '🇺🇸', label: 'Central Standard Time' },
  { city: 'Los Angeles', country: 'USA', timezone: 'America/Los_Angeles', flag: '🇺🇸', label: 'Pacific Standard Time' },
  { city: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid', flag: '🇪🇸', label: 'Central European Time' },
  { city: 'Rome', country: 'Italy', timezone: 'Europe/Rome', flag: '🇮🇹', label: 'Central European Time' },
  { city: 'Delhi', country: 'India', timezone: 'Asia/Kolkata', flag: '🇮🇳', label: 'India Standard Time' },
  { city: 'Istanbul', country: 'Turkey', timezone: 'Europe/Istanbul', flag: '🇹🇷', label: 'Turkey Time' },
  { city: 'Buenos Aires', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷', label: 'Argentina Time' },
  { city: 'Lagos', country: 'Nigeria', timezone: 'Africa/Lagos', flag: '🇳🇬', label: 'West Africa Time' },
  { city: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta', flag: '🇮🇩', label: 'Western Indonesia Time' },
  { city: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok', flag: '🇹🇭', label: 'Indochina Time' },
];

const generateAllCities = () => {
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const timezones = Intl.supportedValuesOf('timeZone');
    const additional = timezones.map(tz => {
      const tzData = ct.getTimezone(tz);
      const countryCode = tzData?.countries?.[0] || '';
      const countryData = countryCode ? ct.getCountry(countryCode) : null;
      
      const parts = tz.split('/');
      const cityRaw = parts[parts.length - 1] || tz;
      const city = cityRaw.replace(/_/g, ' ');
      
      // Use Intl.DisplayNames for better country name resolution
      let country = '';
      if (countryCode) {
        try {
          country = regionNames.of(countryCode) || '';
        } catch (e) {
          country = countryData?.name || '';
        }
      }

      // Final fallback and cleanup
      const continents = ['Africa', 'Europe', 'Asia', 'America', 'Australia', 'Antarctica', 'Atlantic', 'Indian', 'Pacific'];
      if (!country || continents.includes(country)) {
        const potential = parts[0];
        if (potential && potential !== cityRaw && !continents.includes(potential)) {
          country = potential.replace(/_/g, ' ');
        } else {
          country = countryCode || 'International';
        }
      }
      
      const flag = countryCode ? getFlagEmoji(countryCode) : '🌍';
      
      return { 
        city, 
        country, 
        timezone: tz, 
        flag, 
        label: `${city}, ${country}` 
      };
    }).filter(c => !MAJOR_CITIES.find(mc => mc.timezone === c.timezone));
    return [...MAJOR_CITIES, ...additional];
  } catch (e) {
    return MAJOR_CITIES;
  }
};

const WORLD_CITIES = generateAllCities();

import { ChevronsUpDown, ArrowLeftRight } from 'lucide-react';

function EmptyCitySelector({ selectedCity, onSelect, placeholder, label }: any) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = WORLD_CITIES.filter(c => 
    c.city.toLowerCase().includes(search.toLowerCase()) || 
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex flex-col cursor-pointer group w-full text-left outline-none bg-transparent border-none p-0 focus:ring-0">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-0.5">{label}</span>
        <span className="flex items-center justify-between border-b border-border/20 pb-1 group-hover:border-primary/40 transition-colors w-full">
          {selectedCity ? (
            <span className="text-sm font-black text-foreground tracking-tight truncate mr-2">
              <span className="mr-1.5">{selectedCity.flag}</span>
              {selectedCity.city}, {selectedCity.country}
            </span>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground/30">{placeholder}</span>
          )}
          <ChevronsUpDown className="w-2.5 h-2.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] p-0 bg-popover border-border shadow-xl">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input 
              autoFocus
              placeholder="Search city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="p-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No cities found.</div>
            ) : (
              filtered.map((city) => (
                <button
                  key={`${city.timezone}-${city.city}`}
                  onClick={() => { onSelect(city); setOpen(false); setSearch(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors focus:bg-muted focus:outline-none"
                >
                  <span className="text-xl">{city.flag}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">{city.city}</span>
                    <span className="text-xs text-muted-foreground truncate">{city.country}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function WorldClockView() {
  const [currentRealTime, setCurrentRealTime] = useState(new Date());
  
  const [isLive, setIsLive] = useState(true);
  const [baseDate, setBaseDate] = useState(new Date());

  const getLocalCity = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return WORLD_CITIES.find(c => c.timezone === tz) || WORLD_CITIES[3];
    } catch {
      return WORLD_CITIES[3];
    }
  };

  const [sourceCity, setSourceCity] = useState<typeof WORLD_CITIES[0] | null>(null);
  const [targetCity, setTargetCity] = useState<typeof WORLD_CITIES[0] | null>(null);
  
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editValue, setEditValue] = useState('');

  const [savedConversions, setSavedConversions] = useState<any[]>([
    { source: WORLD_CITIES[3], target: WORLD_CITIES[3], id: 1 }, 
    { source: WORLD_CITIES[3], target: WORLD_CITIES[4], id: 2 }, 
    { source: WORLD_CITIES[3], target: WORLD_CITIES[2], id: 3 }, 
    { source: WORLD_CITIES[3], target: WORLD_CITIES[8], id: 4 }, 
    { source: WORLD_CITIES[3], target: WORLD_CITIES[7], id: 5 }, 
  ]);

  // Handle actual ticking
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentRealTime(now);
      if (isLive) {
        setBaseDate(now);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  const saveConversion = () => {
    if (!sourceCity || !targetCity) return;
    if (savedConversions.find(c => c.source.city === sourceCity.city && c.target.city === targetCity.city)) return;
    setSavedConversions([{ source: sourceCity, target: targetCity, id: Date.now() }, ...savedConversions]);
  };

  const removeConversion = (id: number) => {
    setSavedConversions(savedConversions.filter(c => c.id !== id));
  };

  const handleTimeEditClick = () => {
    if (!sourceCity) return;
    setIsEditingTime(true);
    const info = getTimeInfo(sourceCity, baseDate);
    setEditValue(`${info.hours}:${info.minutes}`);
  };

  const handleTimeEditCommit = () => {
    setIsEditingTime(false);
    if (!sourceCity || !editValue.includes(':')) {
      if (!editValue) setIsLive(true);
      return;
    }
    const [h, m] = editValue.split(':');
    if (!h || !m || isNaN(Number(h)) || isNaN(Number(m))) {
      setIsLive(true);
      return;
    }
    setIsLive(false);
    try {
      const todayStr = formatInTimeZone(currentRealTime, sourceCity.timezone, 'yyyy-MM-dd');
      const localTimeString = `${todayStr} ${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
      setBaseDate(toDate(localTimeString, { timeZone: sourceCity.timezone }));
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to get time info for a given city and point in time
  const getTimeInfo = (city: typeof WORLD_CITIES[0], time: Date) => {
    const hours = formatInTimeZone(time, city.timezone, 'HH');
    const minutes = formatInTimeZone(time, city.timezone, 'mm');
    const seconds = formatInTimeZone(time, city.timezone, 'ss');
    const dateStr = formatInTimeZone(time, city.timezone, 'EEEE, MMMM d');
    const ampm = formatInTimeZone(time, city.timezone, 'a');
    return { hours, minutes, seconds, dateStr, ampm };
  };

  const sourceInfo = sourceCity ? getTimeInfo(sourceCity, baseDate) : null;
  const targetInfo = targetCity ? getTimeInfo(targetCity, baseDate) : null;

  // Time difference string
  const diffString = (() => {
    if (!sourceCity || !targetCity) return '';
    try {
      const sourceOffsetStr = formatInTimeZone(baseDate, sourceCity.timezone, 'XX');
      const targetOffsetStr = formatInTimeZone(baseDate, targetCity.timezone, 'XX');
      
      const parseOffset = (str: string) => {
        if (str === 'Z') return 0;
        const sign = str[0] === '+' ? 1 : -1;
        const h = parseInt(str.slice(1, 3));
        const m = parseInt(str.slice(3, 5) || "00");
        return sign * (h * 60 + m);
      };

      const sOffset = parseOffset(sourceOffsetStr);
      const tOffset = parseOffset(targetOffsetStr);
      const diffMins = tOffset - sOffset;
      
      if (diffMins === 0) return 'SAME TIME';
      const hours = Math.abs(diffMins / 60);
      return `${hours} HOUR${hours !== 1 ? 'S' : ''} ${diffMins > 0 ? 'AHEAD' : 'BEHIND'}`;
    } catch (e) {
      return '';
    }
  })();

  const localTimeInfo = {
    city: 'Your Local Time',
    time: format(currentRealTime, 'hh:mm'),
    ampm: format(currentRealTime, 'a'),
    date: format(currentRealTime, 'EEEE, MMMM d'),
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto border-x bg-white/40 dark:bg-card/50 backdrop-blur-xl relative shadow-2xl">
      <section className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <header className="px-4 lg:px-8 py-4 border-b bg-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-5 h-5 md:w-6 md:h-6 text-foreground shrink-0" />
                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight truncate font-heading text-foreground">
                  World Clock
                </h2>
              </div>
              <p className="text-[10px] md:text-[11px] text-muted-foreground italic serif opacity-80 truncate">
                 Global Collaboration Ready. Seamlessly bridge the gap between time zones.
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-background/50 backdrop-blur-sm p-4 lg:p-6 font-sans text-foreground scroll-smooth pb-20">
          <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Local Time Widget */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Local Time</div>
          <h2 className="text-base font-bold text-foreground mb-0.5">{localTimeInfo.city}</h2>
          <div className="flex items-baseline gap-1 text-primary">
            <span className="text-4xl font-black tabular-nums tracking-tighter">{localTimeInfo.time}</span>
            <span className="text-lg font-bold">{localTimeInfo.ampm}</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-semibold text-muted-foreground mt-0.5">
            <Clock className="w-2.5 h-2.5" />
            {localTimeInfo.date}
          </div>
          {!isLive && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 border-primary/20 text-primary hover:bg-primary/5 rounded-full text-[9px] h-6 px-3"
              onClick={() => setIsLive(true)}
            >
              <RefreshCw className="w-2.5 h-2.5 mr-1.5" />
              Reset to Live Time
            </Button>
          )}
        </div>

        {/* Main Conversion Card */}
        <div className="bg-card/40 backdrop-blur-md rounded-[16px] border border-white/10 dark:border-white/5 p-5 md:p-6 shadow-2xl relative">
          
          {/* Top Selectors strictly matching the user's layout */}
          <div className="flex flex-col md:flex-row items-end justify-between gap-3 md:gap-6 w-full max-w-xl mx-auto mb-6">
            <div className="flex-1 w-full">
              <EmptyCitySelector label="Your City" placeholder="Select Source City" selectedCity={sourceCity} onSelect={(c: any) => { setSourceCity(c); setIsLive(false); }} />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-primary/5 hover:bg-primary/10 shrink-0 w-8 h-8 mb-1 md:mb-1 transition-all hover:scale-110 active:scale-95"
              onClick={() => {
                const temp = sourceCity;
                setSourceCity(targetCity);
                setTargetCity(temp);
              }}
            >
              <ArrowLeftRight className="w-3 h-3 text-primary/70" />
            </Button>
            
            <div className="flex-1 w-full">
              <EmptyCitySelector label="Target City" placeholder="Add Target City" selectedCity={targetCity} onSelect={setTargetCity} />
            </div>
          </div>

          {/* CLOCKS SECTION */}
          {(sourceCity || targetCity) && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center min-h-[140px]">
              
              {/* SOURCE CLOCK */}
              <div className="flex flex-col items-center text-center">
                {sourceCity && sourceInfo ? (
                  <>
                    <h3 className="text-xl font-bold tracking-tight mb-0.5 flex items-center gap-1.5">
                      <span>{sourceCity.flag}</span>
                      {sourceCity.city}
                    </h3>
                    <span className="text-[10px] font-medium text-muted-foreground mb-4">{sourceCity.country}</span>
                    
                    <div className="relative group mb-3 flex justify-center w-full">
                      {/* Visual clock */}
                      {isEditingTime ? (
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          className="bg-transparent border-b-2 border-primary outline-none text-[42px] leading-none font-black text-foreground tabular-nums tracking-tighter w-32 text-center"
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={handleTimeEditCommit}
                          onKeyDown={e => e.key === 'Enter' && handleTimeEditCommit()}
                        />
                      ) : (
                        <div 
                          className="flex items-baseline gap-1 cursor-pointer transition-transform hover:scale-105"
                          onClick={handleTimeEditClick}
                        >
                          <span className="text-[48px] leading-none font-black text-foreground tabular-nums tracking-tighter transition-colors">
                            {sourceInfo.hours}:{sourceInfo.minutes}
                          </span>
                          <span className="text-lg font-bold text-muted-foreground/60">
                            {isLive ? sourceInfo.seconds : '00'}
                          </span>
                        </div>
                      )}
                      
                      {/* EDIT helper text appearing on hover */}
                      {!isEditingTime && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Click to Edit
                        </div>
                      )}
                    </div>
                    
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                      {sourceInfo.dateStr.toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground/20 font-medium text-xs italic">Select a source city</div>
                )}
              </div>

              {/* ARROW INDICATOR */}
              <div className="flex justify-center -my-1 md:my-0 relative z-10">
                {sourceCity && targetCity && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <ArrowRight className="w-3 h-3 text-primary" />
                  </div>
                )}
              </div>

              {/* TARGET CLOCK */}
              <div className="flex flex-col items-center text-center relative">
                {targetCity && targetInfo ? (
                  <>
                    <h3 className="text-xl font-bold tracking-tight mb-0.5 flex items-center gap-1.5">
                      <span>{targetCity.flag}</span>
                      {targetCity.city}
                    </h3>
                    <span className="text-[10px] font-medium text-muted-foreground mb-4">{targetCity.country}</span>
                    
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-[48px] leading-none font-black text-primary tabular-nums tracking-tighter">
                        {targetInfo.hours}:{targetInfo.minutes}
                      </span>
                      <span className="text-lg font-bold text-primary opacity-50">
                        {isLive ? targetInfo.seconds : '00'}
                      </span>
                    </div>
                    
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
                      {targetInfo.dateStr.toUpperCase()}
                    </div>
                    
                    <div className="bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                        {diffString}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground/20 font-medium text-xs italic">Select a target city</div>
                )}
              </div>
            </div>
          )}

          {/* SAVE BUTTON */}
          {sourceCity && targetCity && (
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={saveConversion}
                className="rounded-full px-6 h-8 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Save to World Clock
              </Button>
            </div>
          )}
        </div>

        {/* Saved Conversions */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Saved Clocks</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {savedConversions.map((conv) => {
                const isTarget = conv.source?.city === conv.target?.city; 
                const displayCity = isTarget ? conv.source : conv.target; 
                
                if (!displayCity) return null;

                const cardTimeInfo = getTimeInfo(displayCity, currentRealTime);
                const localDiff = (() => {
                  try {
                    const localOffset = new Date().getTimezoneOffset() * -1; // in minutes
                    const parseOffset = (str: string) => {
                      if (str === 'Z') return 0;
                      const sign = str[0] === '+' ? 1 : -1;
                      const h = parseInt(str.slice(1, 3));
                      const m = parseInt(str.slice(3, 5) || "00");
                      return sign * (h * 60 + m);
                    };
                    const targetOffsetStr = formatInTimeZone(currentRealTime, displayCity.timezone, 'XX');
                    const targetOffset = parseOffset(targetOffsetStr);
                    const diff = targetOffset - localOffset;
                    if (diff === 0) return 'SAME TIME AS LOCAL';
                    const diffHours = Math.abs(diff / 60);
                    return `${diffHours}H ${diff > 0 ? 'AHEAD' : 'BEHIND'}`;
                  } catch (e) { return ''; }
                })();

                return (
                  <motion.div
                    key={conv.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group bg-card/40 backdrop-blur-md border border-white/5 rounded-xl p-4 hover:border-primary/30 transition-all font-sans shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{displayCity.flag}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold truncate leading-tight">{displayCity.city}</span>
                          <span className="text-[8px] text-muted-foreground font-black uppercase tracking-tighter opacity-60 truncate">{displayCity.country}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeConversion(conv.id)} className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black tabular-nums tracking-tighter">
                        {cardTimeInfo.hours}:{cardTimeInfo.minutes}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground/60 uppercase">
                        {cardTimeInfo.ampm}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{cardTimeInfo.dateStr}</span>
                      <Badge variant="outline" className="text-[8px] h-4 font-black bg-primary/5 text-primary border-primary/20 tracking-tighter px-1">
                        {localDiff}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}

