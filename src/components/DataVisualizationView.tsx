import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toBlob } from 'html-to-image';
import { 
  BarChart2, PieChart, LineChart, Target, Zap, Download, 
  Upload, Paperclip, X, History, AreaChart as AreaChartIcon,
  ChevronsUpDown, LayoutDashboard
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, 
  Pie, Cell, AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';
import { getGeminiAI } from '@/lib/gemini';
import { useAuth } from '@/contexts/FirebaseContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { InteractiveDashboardView } from './InteractiveDashboardView';

const COLORS = ['#e11d48', '#3b82f6', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899', '#64748b'];

interface ChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  xAxisKey?: string;
  yAxisKey?: string;
  series: { key: string; name: string; color?: string }[];
  description?: string;
  timestamp: Date;
}

interface DataVisualizationViewProps {
  t: any;
  brandIdentity: any;
  addActivity: (type: any, title: string, details: string, view?: any, itemId?: string) => void;
}

const PALETTES = {
  default: ['#e11d48', '#3b82f6', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899', '#64748b'],
  ocean: ['#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e', '#22d3ee', '#06b6d4'],
  sunset: ['#f43f5e', '#fb7185', '#fda4af', '#f59e0b', '#fbbf24', '#fcd34d', '#ea580c'],
  emerald: ['#10b981', '#059669', '#34d399', '#059669', '#047857', '#065f46', '#064e3b'],
  monochrome: ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#94a3b8', '#cbd5e1']
};

export function DataVisualizationView({ t, brandIdentity, addActivity }: DataVisualizationViewProps) {
  const [dataInput, setDataInput] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [preferredType, setPreferredType] = useState<'auto' | 'bar' | 'line' | 'pie' | 'area'>('auto');
  
  const brandPalette = [
    brandIdentity.primaryColor,
    brandIdentity.secondaryColor,
    brandIdentity.accentColor,
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#64748b'
  ].filter((v, i, a) => a.indexOf(v) === i);

  const [currentPalette, setCurrentPalette] = useState<string>('brand');

  const ALL_PALETTES = {
    brand: brandPalette,
    ...PALETTES
  };
  const [isLoading, setIsLoading] = useState(false);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [history, setHistory] = useState<ChartConfig[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const { user } = useAuth();
  
  const chartRef = useRef<HTMLDivElement>(null);

  const handleApplyPalette = (paletteName: string) => {
    setCurrentPalette(paletteName);
    if (chartConfig) {
      const colors = (ALL_PALETTES as any)[paletteName];
      const updatedSeries = chartConfig.series.map((s, i) => ({
        ...s,
        color: colors[i % colors.length]
      }));
      setChartConfig({ ...chartConfig, series: updatedSeries });
    }
  };

  const handleExport = async () => {
    if (!chartRef.current) return;
    try {
      const blob = await toBlob(chartRef.current, { backgroundColor: 'white' });
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `chart-${new Date().getTime()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      addActivity('visualize', t.chartExported || 'Chart Exported', `${t.chartExported || 'Exported'} "${chartConfig?.title}"`);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFileName(file.name);
    
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      let csv = XLSX.utils.sheet_to_csv(worksheet);
      
      if (csv.length > 30000) {
          csv = csv.substring(0, 30000) + '\n...[TRUNCATED]';
      }
      
      setDataInput(prev => prev ? prev + '\n\nFile Data:\n' + csv : csv);
      addActivity('visualize', t.dataUploaded || 'Data Uploaded', `${t.dataUploaded || 'Uploaded'} ${file.name}`);
    } catch (err) {
      console.error("Error reading file:", err);
      alert(t.failedToParseFile || "Failed to parse file. Make sure it's a valid CSV or Excel file.");
      setUploadedFileName(null);
    }
  };

  const handleGenerate = async () => {
    if (!promptInput && !dataInput) return;
    setIsLoading(true);
    
    try {
      const ai = getGeminiAI();
      const systemInstruction = `
        You are an expert data visualization designer for marketing data.
        Generate a JSON configuration for a chart.
        Output ONLY valid JSON without markdown formatting.
      `;
      
      const fullPrompt = `
        The user wants to generate a chart.
        ${preferredType !== 'auto' ? `The user prefers a "${preferredType}" chart.` : ''}
        Data or Context: ${dataInput || 'Not provided. Generate dummy marketing data if needed.'}
        User Request: ${promptInput || 'Visualize the data provided.'}
        
        The JSON must follow this exact structure:
        {
          "title": "Chart Title",
          "description": "A short summary of what this chart shows",
          "type": "${preferredType !== 'auto' ? preferredType : 'bar, line, pie, or area'}",
          "data": [ { "x": "Label", "value1": 100, ... } ],
          "xAxisKey": "name of the key in data objects used for X axis (e.g. 'x')",
          "series": [ { "key": "value1", "name": "Metric Name" } ]
        }
      `;
      
      const result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        config: {
          systemInstruction,
          temperature: 0.2,
        },
        contents: fullPrompt,
      });
      
      const text = result.text || '';
      
      let jsonPart = text;
      // Extract JSON if AI wrapped it in markdown or included conversational text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonPart = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonPart);
      if (parsed.series) {
        const palette = (ALL_PALETTES as any)[currentPalette];
        parsed.series = parsed.series.map((s: any, i: number) => ({
          ...s,
          color: s.color || palette[i % palette.length]
        }));
      }
      
      const newChart: ChartConfig = {
        ...parsed,
        id: Date.now().toString(),
        timestamp: new Date()
      };
      
      setChartConfig(newChart);
      setHistory(prev => [newChart, ...prev]);
      
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'visualizations', newChart.id), {
          ...newChart,
          timestamp: serverTimestamp()
        }).catch(e => console.error("Error saving visualization", e));
      }

      addActivity('visualize', t.visualizationGenerated || 'Visualization Generated', `Created "${newChart.title}" chart`, 'visualize', newChart.id);
    } catch (e: any) {
      console.error("Visualization error:", e);
      alert(`${t.failedToGenerateVisualization || 'Failed to generate visualization'}: ${e.message || "Unknown error"}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    if (!chartConfig) return null;
    
    const { type, data, xAxisKey, series } = chartConfig;

    const tooltipFormatter = (value: any, name: any, props: any) => {
      if (typeof value !== 'number') return value;
      let total = 0;
      if (type === 'pie') {
        const pieDataKey = series[0]?.key || 'value';
        total = data.reduce((acc: number, item: any) => acc + Number(item[pieDataKey] || 0), 0);
      } else if (props && props.dataKey) {
        total = data.reduce((acc: number, item: any) => acc + Number(item[props.dataKey] || 0), 0);
      }
      const pct = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
      return [value + " (" + pct + ")", name];
    };
    
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey={xAxisKey || 'name'} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={tooltipFormatter} />
              <Legend verticalAlign="top" height={36}/>
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey={xAxisKey || 'name'} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={tooltipFormatter} />
              <Legend verticalAlign="top" height={36}/>
              {series.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey={xAxisKey || 'name'} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={tooltipFormatter} />
              <Legend verticalAlign="top" height={36}/>
              {series.map((s) => (
                <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} fill={s.color} fillOpacity={0.3} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieDataKey = series[0]?.key || 'value';
        const pieNameKey = xAxisKey || 'name';
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#dc2626"
                dataKey={pieDataKey}
                nameKey={pieNameKey}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || (ALL_PALETTES as any)[currentPalette][index % (ALL_PALETTES as any)[currentPalette].length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={tooltipFormatter} />
              <Legend verticalAlign="top" height={36}/>
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      default:
        return <div>Unsupported chart type.</div>;
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto border-x bg-white/40 dark:bg-card/50 backdrop-blur-xl relative shadow-2xl">
      <section className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <header className="px-4 lg:px-8 py-4 border-b bg-card/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <BarChart2 className="w-5 h-5 md:w-6 md:h-6 text-foreground shrink-0" />
                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight truncate font-heading text-foreground">
                  {t.dataVisualizationTitle || "Data Visualization"}
                </h2>
              </div>
              <p className="text-[10px] md:text-[11px] text-muted-foreground italic serif opacity-80 truncate">
                 {t.dataVisualizationDesc || "Transform marketing data and metrics into professional, modern charts for your presentations."}
              </p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="single" className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex justify-center px-4 lg:px-8 py-6 border-b bg-card/40 backdrop-blur-md relative z-10">
            <TabsList className="bg-transparent border-0 shadow-none gap-4 lg:gap-8 flex-wrap justify-center h-auto">
              <TabsTrigger 
                value="single" 
                className="gap-3 text-sm lg:text-base font-bold px-6 py-3 lg:px-8 lg:py-4 rounded-2xl border border-transparent data-active:border-red-500/30 data-active:!bg-red-600 data-active:!text-white shadow-sm hover:bg-muted transition-all duration-300 data-active:shadow-[0_8px_30px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 data-active:scale-105 bg-background dark:bg-muted/50 dark:hover:bg-muted/80 text-foreground/60 opacity-70 data-active:!opacity-100"
              >
                <BarChart2 className="w-5 h-5 lg:w-6 lg:h-6" /> Single Chart Generation
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="gap-3 text-sm lg:text-base font-bold px-6 py-3 lg:px-8 lg:py-4 rounded-2xl border border-transparent data-active:border-red-500/30 data-active:!bg-red-600 data-active:!text-white shadow-sm hover:bg-muted transition-all duration-300 data-active:shadow-[0_8px_30px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 data-active:scale-105 bg-background dark:bg-muted/50 dark:hover:bg-muted/80 text-foreground/60 opacity-70 data-active:!opacity-100"
              >
                 <LayoutDashboard className="w-5 h-5 lg:w-6 lg:h-6" /> Interactive Dashboard
               </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="single" className="flex-1 overflow-y-auto p-4 md:p-8 m-0 border-0 h-full">
            <div className="max-w-6xl mx-auto space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card className="glass-card shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  {t.dataset || "Dataset"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.rawData || "Raw Data"}</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".csv, .xlsx, .xls"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        title={t.uploadCsvOrExcel || "Upload CSV or Excel"}
                      />
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 shadow-sm rounded-md border-primary/20 hover:bg-primary/5">
                        <Upload className="w-3 h-3 mr-1" />
                        {t.uploadCsvOrExcel || "CSV/Excel"}
                      </Button>
                    </div>
                  </div>
                  {uploadedFileName && (
                    <div className="flex items-center justify-between text-xs bg-primary/5 p-2 rounded border border-primary/10">
                      <span className="flex items-center text-primary font-medium truncate max-w-[200px]">
                        <Paperclip className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate">{uploadedFileName}</span>
                      </span>
                      <button className="text-muted-foreground hover:text-foreground p-1 shrink-0" onClick={() => { setUploadedFileName(null); setDataInput(''); }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <Textarea 
                    placeholder="Paste CSV, JSON, or any unstructured data here..." 
                    className="min-h-[150px] resize-none text-sm bg-background/50"
                    value={dataInput}
                    onChange={(e) => setDataInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.chartTypePreference || "Chart Type Preference"}</label>
                  <Select value={preferredType} onValueChange={(val: any) => setPreferredType(val)}>
                    <SelectTrigger className="w-full bg-background/50 rounded-xl border-primary/10">
                      <SelectValue placeholder={t.selectChartType || "Select Chart Type"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t.autoAiDecide || "Auto (Let AI Decide)"}</SelectItem>
                      <SelectItem value="bar">{t.barChart || "Bar Chart"}</SelectItem>
                      <SelectItem value="line">{t.lineGraph || "Line Graph"}</SelectItem>
                      <SelectItem value="area">{t.areaChart || "Area Chart"}</SelectItem>
                      <SelectItem value="pie">{t.pieChart || "Pie Chart"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.visualizationRequest || "Visualization Request"}</label>
                  <Textarea 
                    placeholder={t.visualizationPlaceholder || "e.g. Create a bar chart showing churn rate over the last 6 months"} 
                    className="min-h-[100px] resize-none text-sm bg-background/50"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full font-bold shadow-lg shadow-primary/20" 
                  onClick={handleGenerate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Zap className="w-4 h-4 mr-2 animate-pulse" /> {t.generating || "Generating..."}</>
                  ) : (
                    <><BarChart2 className="w-4 h-4 mr-2" /> {t.generateChart || "Generate Chart"}</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm border-0 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  {t.ideas || "Ideas"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="cursor-pointer hover:text-primary transition-colors" onClick={() => setPromptInput(t.ideasItem1Prompt || "Show Q3 revenue vs targets across regions as a bar chart")}>• {t.ideasItem1 || "Q3 Revenue vs Targets"}</li>
                  <li className="cursor-pointer hover:text-primary transition-colors" onClick={() => setPromptInput(t.ideasItem2Prompt || "Create a pie chart for market share breakdown")}>• {t.ideasItem2 || "Market Share Breakdown"}</li>
                  <li className="cursor-pointer hover:text-primary transition-colors" onClick={() => setPromptInput(t.ideasItem3Prompt || "Visualize website traffic trends over the last year as an area chart")}>• {t.ideasItem3 || "Website Traffic Trends"}</li>
                </ul>
              </CardContent>
            </Card>

            {history.length > 0 && (
              <Card className="glass-card shadow-sm border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    {t.history || "History"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {history.map((chart) => (
                        <div 
                          key={chart.id} 
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${chartConfig?.id === chart.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-secondary/50 border-transparent'}`}
                          onClick={() => setChartConfig(chart)}
                        >
                          <div className="font-bold truncate">{chart.title}</div>
                          <div className="text-[10px] text-muted-foreground">{chart.timestamp.toLocaleTimeString()}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card className="glass-card shadow-lg border-0 h-full min-h-[500px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/60"></div>
              {chartConfig ? (
                <>
                  <CardHeader className="pb-0">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-black tracking-tight">{chartConfig.title}</CardTitle>
                        {chartConfig.description && (
                          <CardDescription className="mt-1 text-sm leading-tight">{chartConfig.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                           <Tabs 
                            value={chartConfig.type} 
                            onValueChange={(val: any) => setChartConfig({ ...chartConfig, type: val })}
                            className="hidden sm:block"
                          >
                            <TabsList className="h-8 p-1 bg-secondary/50">
                              <TabsTrigger value="bar" className="h-6 px-2"><BarChart2 className="w-3.5 h-3.5" /></TabsTrigger>
                              <TabsTrigger value="line" className="h-6 px-2"><LineChart className="w-3.5 h-3.5" /></TabsTrigger>
                              <TabsTrigger value="area" className="h-6 px-2"><AreaChartIcon className="w-3.5 h-3.5" /></TabsTrigger>
                              <TabsTrigger value="pie" className="h-6 px-2"><PieChart className="w-3.5 h-3.5" /></TabsTrigger>
                            </TabsList>
                          </Tabs>
                          <Button variant="outline" size="sm" className="h-8 font-semibold rounded-lg shadow-sm" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" /> {t.export || "Export"}
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {Object.keys(ALL_PALETTES).map((name) => (
                            <button
                              key={name}
                              onClick={() => handleApplyPalette(name)}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all p-0.5",
                                currentPalette === name ? "border-primary scale-110 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                              )}
                              title={`${name.charAt(0).toUpperCase() + name.slice(1)} Palette`}
                            >
                              <div className="w-full h-full rounded-full flex overflow-hidden rotate-45">
                                <div className="w-1/2 h-full" style={{ backgroundColor: (ALL_PALETTES as any)[name][0] }} />
                                <div className="w-1/2 h-full" style={{ backgroundColor: (ALL_PALETTES as any)[name][1] }} />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-center items-center pb-4 pt-2">
                    <div className="w-full px-2" ref={chartRef}>
                      {renderChart()}
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 absolute inset-0">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <PieChart className="w-10 h-10 text-primary/50" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{t.noVisualizationGenerated || "No Visualization Generated"}</h3>
                  <p className="text-muted-foreground max-w-sm mb-8">
                    {t.noVisualizationDesc || "Provide data or describe what you want to visualize, and AI will create a modern, presentation-ready chart for you."}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
          </div>
          </TabsContent>
          
          <TabsContent value="dashboard" className="flex-1 overflow-y-auto p-0 m-0 border-0 h-full bg-muted/5">
            <InteractiveDashboardView brandIdentity={brandIdentity} t={t} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

