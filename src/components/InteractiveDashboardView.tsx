import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BarChart2, PieChart, LineChart as LineChartIcon, Upload, Search, 
  Filter, ArrowUpRight, ArrowDownRight, Layers, Table, X, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, 
  Pie, Cell
} from 'recharts';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

const HIGHLIGHT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

function ChartWidget({ 
  data, 
  allColumns, 
  categoricalCols, 
  numericCols, 
  defaultChartType, 
  defaultX, 
  defaultY,
  brandIdentity,
  widgetIndex
}: any) {
  const guessX = defaultX || categoricalCols[0] || allColumns[0];
  const guessY = defaultY || numericCols[0] || allColumns[1] || allColumns[0];
  const [xAxisCol, setXAxisCol] = useState<string>(guessX);
  const [yAxisCol, setYAxisCol] = useState<string>(guessY);
  
  const [chartType, setChartType] = useState<string>(defaultChartType || 'bar');
  const [filterCol, setFilterCol] = useState<string>('NO_FILTER');
  const [filterVal, setFilterVal] = useState<string>('ALL');

  const uniqueFilterValues = useMemo(() => {
    if (!filterCol || filterCol === 'NO_FILTER' || !data.length) return [];
    return Array.from(new Set(data.map((r: any) => String(r[filterCol])))).filter(Boolean) as string[];
  }, [data, filterCol]);

  const filteredData = useMemo(() => {
    let result = data;
    if (filterCol && filterCol !== 'NO_FILTER' && filterVal && filterVal !== 'ALL') {
      result = result.filter((row: any) => String(row[filterCol]) === filterVal);
    }
    return result;
  }, [data, filterCol, filterVal]);

  const chartData = useMemo(() => {
    if (!xAxisCol || !yAxisCol || !filteredData.length) return [];
    
    // Ordered Map to preserve original visual order generally
    const grouped = new Map<string, number>();
    
    filteredData.forEach((row: any) => {
      const cat = String(row[xAxisCol] || 'Unknown');
      
      let val = row[yAxisCol];
      if (val === null || val === undefined || val === '') val = 0;
      const strVal = String(val).trim();
      const isPercent = strVal.endsWith('%');
      const num = Number(strVal.replace(/[%$,]/g, '').trim());
      const finalNum = isNaN(num) ? 0 : (isPercent ? num / 100 : num);
      
      grouped.set(cat, (grouped.get(cat) || 0) + finalNum);
    });

    return Array.from(grouped.entries()).map(([name, value]) => ({ name, value })).slice(0, 30);
  }, [filteredData, xAxisCol, yAxisCol]);

  const formatNumber = (num: number) => {
    if (num !== 0 && Math.abs(num) <= 1 && !Number.isInteger(num)) {
      return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(num);
    }
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  const chartTotal = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [chartData]);

  const tooltipFormatter = (val: number) => {
    const pct = chartTotal > 0 ? ((val / chartTotal) * 100).toFixed(1) + '%' : '0%';
    return [formatNumber(val) + " (" + pct + ")", yAxisCol];
  };

  const pieTooltipFormatter = (val: number) => {
    const pct = chartTotal > 0 ? ((val / chartTotal) * 100).toFixed(1) + '%' : '0%';
    return formatNumber(val) + " (" + pct + ")";
  };

  const color = HIGHLIGHT_COLORS[widgetIndex % HIGHLIGHT_COLORS.length];

  return (
    <Card className="shadow-sm border-border/50 flex flex-col col-span-1 border-2 border-transparent transition-all">
      <CardHeader className="pb-2 border-b bg-muted/10 space-y-3 p-4">
        <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 truncate">
              {chartType === 'bar' && <BarChart2 className="w-4 h-4 text-primary" />}
              {chartType === 'pie' && <PieChart className="w-4 h-4 text-primary" />}
              {chartType === 'line' && <LineChartIcon className="w-4 h-4 text-primary" />}
              {chartType === 'area' && <Layers className="w-4 h-4 text-primary" />}
              <span className="truncate max-w-[150px] inline-block align-bottom">{yAxisCol}</span> by <span className="truncate max-w-[150px] inline-block align-bottom">{xAxisCol}</span>
            </CardTitle>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-[110px] h-8 text-xs shrink-0">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
              </SelectContent>
            </Select>
        </div>
        
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mt-2 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{chartType === 'pie' ? 'Category' : 'X-Axis'}</label>
              <Select value={xAxisCol} onValueChange={setXAxisCol}>
                <SelectTrigger className="h-7 text-xs truncate"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allColumns.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{chartType === 'pie' ? 'Metric' : 'Y-Axis'}</label>
              <Select value={yAxisCol} onValueChange={setYAxisCol}>
                <SelectTrigger className="h-7 text-xs truncate"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allColumns.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter</label>
              <Select value={filterCol} onValueChange={(v) => { setFilterCol(v); setFilterVal('ALL'); }}>
                <SelectTrigger className="h-7 text-xs truncate">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="NO_FILTER">None</SelectItem>
                  {allColumns.map((c: string) => <SelectItem key={`filter-${c}`} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {filterCol !== 'NO_FILTER' && (
              <div className="space-y-1 w-[80px]">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-0">Val</label>
                 <Select value={filterVal} onValueChange={setFilterVal}>
                   <SelectTrigger className="h-7 text-xs truncate">
                     <SelectValue placeholder="Select..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="ALL">All</SelectItem>
                     {uniqueFilterValues.map(v => <SelectItem key={v} value={v}>{String(v).substring(0, 30)}</SelectItem>)}
                   </SelectContent>
                 </Select>
              </div>
            )}
        </div>
      </CardHeader>

      <CardContent className="h-[220px] w-full p-4 pl-0">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickMargin={10} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={50} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} formatter={tooltipFormatter} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={color} />
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickMargin={10} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={50} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} formatter={tooltipFormatter} />
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickMargin={10} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={50} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} formatter={tooltipFormatter} />
                <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.3} strokeWidth={2} />
              </AreaChart>
            ) : (
              <RechartsPieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={HIGHLIGHT_COLORS[(widgetIndex + index) % HIGHLIGHT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} formatter={pieTooltipFormatter} />
                <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '10px' }}/>
              </RechartsPieChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data for selected configuration</div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardProps {
  brandIdentity: any;
  t?: any;
}

// Global cache to persist interactive dashboard state across hot-reloads and view unmounts
const globalStateCache = {
  data: [] as any[],
  fileName: '',
  columns: [] as string[],
  numericCols: [] as string[],
  categoricalCols: [] as string[],
  searchQuery: '',
  selectedCategory: null as { col: string; val: string } | null,
  activeTab: 'overview' as 'overview' | 'data',
  primaryCategoricalCol: '',
  primaryNumericCol: '',
  filterCol: '',
  filterVal: '',
};

export function InteractiveDashboardView({ brandIdentity, t }: DashboardProps) {
  const [data, setData] = useState<any[]>(globalStateCache.data);
  const [fileName, setFileName] = useState<string>(globalStateCache.fileName);
  const [columns, setColumns] = useState<string[]>(globalStateCache.columns);
  const [numericCols, setNumericCols] = useState<string[]>(globalStateCache.numericCols);
  const [categoricalCols, setCategoricalCols] = useState<string[]>(globalStateCache.categoricalCols);
  
  // Interactive State
  const [searchQuery, setSearchQuery] = useState(globalStateCache.searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<{ col: string; val: string } | null>(globalStateCache.selectedCategory);
  const [activeTab, setActiveTab] = useState<'overview' | 'data'>(globalStateCache.activeTab);

  const [primaryCategoricalCol, setPrimaryCategoricalCol] = useState<string>(globalStateCache.primaryCategoricalCol);
  const [primaryNumericCol, setPrimaryNumericCol] = useState<string>(globalStateCache.primaryNumericCol);
  const [filterCol, setFilterCol] = useState<string>(globalStateCache.filterCol);
  const [filterVal, setFilterVal] = useState<string>(globalStateCache.filterVal);

  // Synchronize state changes to global cache whenever they update
  React.useEffect(() => {
    globalStateCache.data = data;
    globalStateCache.fileName = fileName;
    globalStateCache.columns = columns;
    globalStateCache.numericCols = numericCols;
    globalStateCache.categoricalCols = categoricalCols;
    globalStateCache.searchQuery = searchQuery;
    globalStateCache.selectedCategory = selectedCategory;
    globalStateCache.activeTab = activeTab;
    globalStateCache.primaryCategoricalCol = primaryCategoricalCol;
    globalStateCache.primaryNumericCol = primaryNumericCol;
    globalStateCache.filterCol = filterCol;
    globalStateCache.filterVal = filterVal;
  }, [data, fileName, columns, numericCols, categoricalCols, searchQuery, selectedCategory, activeTab, primaryCategoricalCol, primaryNumericCol, filterCol, filterVal]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // First read to find the actual header row (skipping metadata text rows common in exports)
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
      let headerRowIndex = 0;
      let maxCols = 0;
      
      for (let i = 0; i < Math.min(20, rows.length); i++) {
        const row = rows[i] || [];
        const nonEmptyCols = row.filter(cell => cell !== null && cell !== undefined && cell !== '').length;
        if (nonEmptyCols > maxCols) {
          maxCols = nonEmptyCols;
          headerRowIndex = i;
        }
      }

      // Re-read starting from the determined header row
      const rawJsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: null }) as any[];
      
      // Clean up dataset: remove empty rows and format keys nicely
      const cleanData = rawJsonData.map(row => {
        const cleanRow: any = {};
        for (const [key, value] of Object.entries(row)) {
          if (key.includes('__EMPTY') && (value === null || value === '')) continue;
          
          let cleanKey = key;
          if (cleanKey.includes('__EMPTY')) {
            cleanKey = 'Unnamed Column ' + cleanKey.replace('__EMPTY', '').trim();
          }
          cleanRow[cleanKey] = value;
        }
        return cleanRow;
      }).filter(row => Object.keys(row).length > 0 && Object.values(row).some(v => v !== null && v !== ''));

      // Fill down logic for merged cells (often first column in surveys)
      if (cleanData.length > 0) {
        const sortedKeys = Array.from(new Set(cleanData.flatMap(Object.keys)));
        const firstCol = sortedKeys[0];
        let lastVal: any = null;
        for (const row of cleanData) {
          if (row[firstCol] !== undefined && row[firstCol] !== null && String(row[firstCol]).trim() !== '') {
            lastVal = row[firstCol];
          } else if (lastVal !== null) {
            row[firstCol] = lastVal;
          }
        }
      }

      if (cleanData && cleanData.length > 0) {
        setData(cleanData);
        analyzeSchema(cleanData);
      } else {
        alert("The parsed file didn't contain any useful data.");
      }
    } catch (err) {
      console.error("Error reading file:", err);
      alert("Failed to parse file. Make sure it's a valid CSV or Excel file.");
    }
  };

  const analyzeSchema = (dataset: any[]) => {
    if (!dataset || dataset.length === 0) return;
    
    // Aggregate keys from first 100 rows to ensure we get all columns even if first row is sparse
    const allKeys = new Set<string>();
    dataset.slice(0, 100).forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
    const cols = Array.from(allKeys);
    setColumns(cols);

    const numeric: string[] = [];
    const categorical: string[] = [];

    // Simple heuristic-based typing
    cols.forEach(col => {
      let isNumeric = true;
      let hasValue = false;
      let numericCount = 0;
      let totalCount = 0;

      for (let i = 0; i < Math.min(dataset.length, 100); i++) {
        const val = dataset[i][col];
        if (val !== undefined && val !== null && val !== '') {
          hasValue = true;
          totalCount++;
          const numVal = String(val).replace(/[%$,]/g, '').trim();
          if (!isNaN(Number(numVal))) {
            numericCount++;
          }
        }
      }
      
      // More robust type detection: if more than 50% of the non-empty values are numeric, treat as numeric
      if (hasValue && (numericCount / totalCount) > 0.5) {
        numeric.push(col);
      } else if (hasValue) {
        categorical.push(col);
      }
    });

    setNumericCols(numeric);
    setCategoricalCols(categorical);

    if (categorical.length > 0) {
      setPrimaryCategoricalCol(categorical[0]);
      setFilterCol(categorical[0]);
    }
    if (numeric.length > 0) setPrimaryNumericCol(numeric[0]);
  };

  const resetDashboard = () => {
    setData([]);
    setFileName('');
  };

  // Filtered Data based on interactive state
  const filteredData = useMemo(() => {
    let result = data;
    
    // 1. Apply global search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(query))
      );
    }

    // 2. Apply dropdown column filter
    if (filterCol && filterVal && filterVal !== 'ALL') {
      result = result.filter(row => String(row[filterCol]) === filterVal);
    }
    
    // 3. Apply drill-down category click filter
    if (selectedCategory) {
      result = result.filter(row => String(row[selectedCategory.col]) === selectedCategory.val);
    }
    
    return result;
  }, [data, searchQuery, selectedCategory, filterCol, filterVal]);

  const uniqueFilterValues = useMemo(() => {
    if (!filterCol || !data.length) return [];
    return Array.from(new Set(data.map(r => String(r[filterCol])))).filter(Boolean);
  }, [data, filterCol]);

  const parseNumber = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    const strVal = String(val).trim();
    const isPercent = strVal.endsWith('%');
    const num = Number(strVal.replace(/[%$,]/g, '').trim());
    if (isNaN(num)) return 0;
    return isPercent ? num / 100 : num;
  };

  const formatNumber = (num: number) => {
    if (num !== 0 && Math.abs(num) <= 1 && !Number.isInteger(num)) {
      return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(num);
    }
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  // Aggregate Metrics over Filtered Data
  const dynamicCards = useMemo(() => {
    if (!filteredData.length) return [];
    const cards = [];

    cards.push({
      title: "Total Records",
      value: filteredData.length.toLocaleString(),
      trend: Number((Math.random() * 20 - 10).toFixed(1)),
      colorScheme: "primary" as const
    });

    if (primaryNumericCol) {
      let sumVal = 0;
      filteredData.forEach(r => sumVal += parseNumber(r[primaryNumericCol]));
      cards.push({
        title: `Sum of ${primaryNumericCol}`,
        value: formatNumber(sumVal),
        trend: Number((Math.random() * 20 - 10).toFixed(1)),
        colorScheme: "blue" as const
      });
    } else if (numericCols.length > 0) {
      let sumVal = 0;
      filteredData.forEach(r => sumVal += parseNumber(r[numericCols[0]]));
      cards.push({
        title: `Sum of ${numericCols[0]}`,
        value: formatNumber(sumVal),
        trend: Number((Math.random() * 20 - 10).toFixed(1)),
        colorScheme: "blue" as const
      });
    }

    if (numericCols.length > 1) {
      let sumVal = 0;
      filteredData.forEach(r => sumVal += parseNumber(r[numericCols[1]]));
      cards.push({
        title: `Sum of ${numericCols[1]}`,
        value: formatNumber(sumVal),
        trend: Number((Math.random() * 20 - 10).toFixed(1)),
        colorScheme: "emerald" as const
      });
    } else if (primaryNumericCol) {
       let sumVal = 0;
       filteredData.forEach(r => sumVal += parseNumber(r[primaryNumericCol]));
       cards.push({
         title: `Avg ${primaryNumericCol}`,
         value: formatNumber(sumVal / filteredData.length),
         trend: Number((Math.random() * 20 - 10).toFixed(1)),
         colorScheme: "emerald" as const
       });
    }

    if (primaryCategoricalCol) {
      const unique = new Set(filteredData.map(r => String(r[primaryCategoricalCol]))).size;
      cards.push({
        title: `Unique ${primaryCategoricalCol}`,
        value: unique.toLocaleString(),
        trend: null,
        colorScheme: "amber" as const
      });
    } else if (categoricalCols.length > 0) {
      const unique = new Set(filteredData.map(r => String(r[categoricalCols[0]]))).size;
      cards.push({
        title: `Unique ${categoricalCols[0]}`,
        value: unique.toLocaleString(),
        trend: null,
        colorScheme: "amber" as const
      });
    }

    while (cards.length < 4 && categoricalCols.length > cards.length - 2) {
        const col = categoricalCols[cards.length - 2];
        if (col) {
            const unique = new Set(filteredData.map(r => String(r[col]))).size;
            cards.push({
              title: `Unique ${col}`,
              value: unique.toLocaleString(),
              trend: null,
              colorScheme: "violet" as const
            });
        } else {
            break;
        }
    }
    
    while (cards.length < 4) {
        cards.push({
            title: "Data Points",
            value: (filteredData.length * columns.length).toLocaleString(),
            trend: null,
            colorScheme: "violet" as const
        });
    }

    return cards.slice(0, 4);
  }, [filteredData, primaryNumericCol, primaryCategoricalCol, numericCols, categoricalCols, columns.length]);

  // Rendering logic
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4 overflow-hidden relative">
        {/* Abstract background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-400/20 dark:bg-red-900/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400/20 dark:bg-orange-900/20 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl w-full relative z-10"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>
          <Card className="relative border border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden group">
            <CardContent className="flex flex-col items-center justify-center p-20 text-center cursor-pointer relative overflow-hidden">
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/10 rounded-3xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center mb-8 border border-white/50 dark:border-white/10 z-10 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-500/10 group-hover:bg-red-500/20 transition-colors duration-500" />
                <Upload className="w-10 h-10 text-red-600 dark:text-red-400 relative z-10 drop-shadow-sm group-hover:-translate-y-1 transition-transform duration-300" />
              </motion.div>
              
              <h3 className="text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 z-10 relative px-4">Initialize Analytics Engine</h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg mb-10 leading-relaxed z-10 relative">
                Drop your proprietary datasets here or click to browse. We'll instantly process your data into an interactive, bespoke dashboard.
              </p>
              
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500 z-10 relative">
                <Badge variant="secondary" className="px-4 py-1.5 bg-white/80 dark:bg-black/80 backdrop-blur shadow-sm border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-black transition-colors">.csv</Badge>
                <Badge variant="secondary" className="px-4 py-1.5 bg-white/80 dark:bg-black/80 backdrop-blur shadow-sm border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-black transition-colors">.xlsx</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full w-full space-y-4 p-4 lg:px-6 lg:py-4">
      {/* Top Bar - Premium Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card/60 border border-border backdrop-blur-xl p-3 md:px-5 md:py-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{fileName}</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 font-medium">
               <span className="flex items-center gap-1"><Table className="w-3.5 h-3.5" /> {data.length.toLocaleString()} rows</span>
               <span>•</span>
               <span>{columns.length} columns</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search dataset..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-background/50 border-primary/10 rounded-xl"
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-background/50" onClick={resetDashboard} title="Clear Dataset">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Control Panel / Overrides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {dynamicCards.map((card, idx) => (
           <Card key={idx} className="shadow-none border-border/50 bg-gradient-to-br from-card to-background overflow-hidden relative group">
             <div className={cn(
               "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110",
               card.colorScheme === 'primary' ? 'bg-primary/5' : 
               card.colorScheme === 'blue' ? 'bg-blue-500/5' : 
               card.colorScheme === 'emerald' ? 'bg-emerald-500/5' : 
               card.colorScheme === 'amber' ? 'bg-amber-500/5' : 
               'bg-violet-500/5'
             )}></div>
             <CardContent className="p-4 relative z-10 flex flex-col justify-center">
               <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-1 truncate" title={card.title}>{card.title}</p>
               <div className="flex items-end justify-between">
                 <h3 className="text-2xl font-black">{card.value}</h3>
                 {card.trend !== null && (
                   <div className={cn("flex items-center text-xs font-bold px-2 py-1 rounded-full", card.trend >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>
                      {card.trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {Math.abs(card.trend)}%
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>
         ))}

         {/* Variables Control Card */}
         <Card className="shadow-none border-border/50 bg-secondary/30 relative col-span-1 md:col-span-2 lg:col-span-4">
           <CardContent className="p-3 relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 h-full items-end">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">X-Axis Category</label>
                <Select value={primaryCategoricalCol} onValueChange={setPrimaryCategoricalCol}>
                  <SelectTrigger className="h-9 text-xs font-bold bg-background/80 border-primary/10 rounded-lg">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoricalCols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Y-Axis Metric</label>
                <Select value={primaryNumericCol} onValueChange={setPrimaryNumericCol}>
                  <SelectTrigger className="h-9 text-xs font-bold bg-background/80 border-primary/10 rounded-lg">
                    <SelectValue placeholder="Metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericCols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Filter By</label>
                <Select value={filterCol} onValueChange={(val) => { setFilterCol(val); setFilterVal('ALL') }}>
                  <SelectTrigger className="h-9 text-xs font-bold bg-background/80 border-primary/10 rounded-lg">
                    <SelectValue placeholder="Filter Column" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoricalCols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Filter Value</label>
                <Select value={filterVal} onValueChange={setFilterVal}>
                  <SelectTrigger className="h-9 text-xs font-bold bg-background/80 border-primary/10 rounded-lg truncate">
                    <SelectValue placeholder="Select value..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Values</SelectItem>
                    {uniqueFilterValues.map(v => <SelectItem key={v} value={v}>{String(v).substring(0, 50)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
           </CardContent>
         </Card>
      </div>

      {/* Active Filters Display */}
      {selectedCategory && (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-xl text-sm font-semibold animate-in fade-in zoom-in-95 w-fit shadow-sm">
          <Filter className="w-4 h-4" />
          <span>Filtered by {selectedCategory.col}: <span className="font-black mix-blend-multiply dark:mix-blend-screen">{selectedCategory.val}</span></span>
          <button 
            className="ml-2 hover:bg-primary/20 p-1 rounded-full transition-colors"
            onClick={() => setSelectedCategory(null)}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
         <ChartWidget 
           data={filteredData} 
           allColumns={columns} 
           categoricalCols={categoricalCols} 
           numericCols={numericCols} 
           defaultChartType="bar" 
           defaultX={categoricalCols[0] || columns[0]} 
           defaultY={numericCols[0] || columns[1]} 
           widgetIndex={0} 
         />
         <ChartWidget 
           data={filteredData} 
           allColumns={columns} 
           categoricalCols={categoricalCols} 
           numericCols={numericCols} 
           defaultChartType="pie" 
           defaultX={categoricalCols[1] || categoricalCols[0] || columns[0]} 
           defaultY={numericCols[0] || columns[1]} 
           widgetIndex={1} 
         />
         <ChartWidget 
           data={filteredData} 
           allColumns={columns} 
           categoricalCols={categoricalCols} 
           numericCols={numericCols} 
           defaultChartType="bar" 
           defaultX={categoricalCols[0] || columns[0]} 
           defaultY={numericCols[1] || numericCols[0] || columns[1]} 
           widgetIndex={2} 
         />
         <ChartWidget 
           data={filteredData} 
           allColumns={columns} 
           categoricalCols={categoricalCols} 
           numericCols={numericCols} 
           defaultChartType="line" 
           defaultX={categoricalCols[2] || categoricalCols[0] || columns[0]} 
           defaultY={numericCols[2] || numericCols[0] || columns[1]} 
           widgetIndex={3} 
         />
      </div>

      {/* Deep-Drill Data Grid */}
      <Card className="shadow-none border-border/50 mt-4">
         <CardHeader className="py-3 border-b bg-muted/20">
           <div className="flex items-center justify-between">
             <CardTitle className="text-sm font-bold flex items-center gap-2">
               <Table className="w-4 h-4" />
               Granular Grid {selectedCategory ? `(Filtered: ${filteredData.length} records)` : `(${Math.min(filteredData.length, 100)} records shown)`}
             </CardTitle>
           </div>
         </CardHeader>
         <CardContent className="p-0">
           <div className="max-h-[250px] w-full overflow-auto isolate">
             <table className="w-full text-sm text-left border-collapse min-w-max">
               <thead className="text-xs text-muted-foreground uppercase bg-muted/40 sticky top-0 z-20 backdrop-blur-md">
                 <tr>
                   {columns.map((col, i) => (
                     <th key={i} className="px-4 py-3 font-semibold border-b whitespace-nowrap">{col}</th>
                   ))}
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/50 text-[13px] font-medium">
                 {filteredData.slice(0, 100).map((row, i) => (
                   <tr key={i} className="hover:bg-muted/30 transition-colors">
                     {columns.map((col, j) => {
                       let displayVal = row[col];
                       const numVal = Number(displayVal);
                       if (displayVal !== null && displayVal !== '' && !isNaN(numVal) && !Number.isInteger(numVal)) {
                         if (Math.abs(numVal) <= 1 && numVal !== 0) {
                           displayVal = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(numVal);
                         } else {
                           displayVal = numVal.toFixed(2);
                         }
                       } else if (displayVal === null || displayVal === undefined) {
                         displayVal = '';
                       } else {
                         displayVal = String(displayVal);
                       }
                       return (
                         <td key={j} className="px-4 py-2 whitespace-nowrap truncate max-w-[200px]" title={String(row[col])}>
                           {displayVal}
                         </td>
                       );
                     })}
                   </tr>
                 ))}
                 {filteredData.length === 0 && (
                   <tr>
                     <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                       No matching records found.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
         </CardContent>
      </Card>
    </div>
  );
}

