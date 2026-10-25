import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Slide } from '../services/geminiService';
import { STUDIO_LOGO_RED } from '../constants';

interface SlidePreviewProps {
  slide: Slide;
  presentationTitle: string;
  index: number;
  total: number;
  previewRef?: React.RefObject<HTMLDivElement>;
  t: any;
  styleName?: string;
}

export const SlidePreview = ({ slide, presentationTitle, index, total, previewRef, t, styleName }: SlidePreviewProps) => {
  const IconComponent = (slide.icon && (LucideIcons as any)[slide.icon]) || LucideIcons.MonitorPlay;
  
  const isStrategic = styleName === "Strategic Elite";
  const isLight = styleName === "Light" || styleName === "Executive Strategy";
  const isDark = styleName === "Dark" || styleName === "Creative Impact";
  const isModern = styleName === "Modern Dynamic";
  const isGem = styleName === "Gem" || styleName === "Analytical Data";
  const isCreative = false; // deprecated
  const isExecutive = isLight || isDark;
  
  const titleFont = "font-impact uppercase";
  const bodyFont = isGem ? "font-serif" : "font-sans";
  const brandColor = "#FF2B2B";

  const getStyle = (x: number, y: number, w: number, h: number) => ({
    position: 'absolute' as const,
    left: `${(x / 10) * 100}%`,
    top: `${(y / 5.625) * 100}%`,
    width: `${(w / 10) * 100}%`,
    height: `${(h / 5.625) * 100}%`,
  });

  const getFontSize = (pt: number) => `${pt * 1.3}px`;

      const renderGemLayout = () => {
    switch (slide.layout) {
      case 'title':
        return (
          <div className="absolute inset-0 bg-[#f4f1eb] overflow-hidden flex flex-col p-24">
            <div className="flex-1 max-w-[70%] mt-32">
              <h1 className={`text-[#2d302c] leading-[1.0] text-[80px]  ${titleFont}  tracking-tight`}>{slide.title}</h1>
              {slide.subtitle && (
                <p className="text-[#2d302c]/70 mt-12 text-[24px] font-sans font-light max-w-xl leading-relaxed">{slide.subtitle}</p>
              )}
            </div>
          </div>
        );
      case 'contents':
        return (
          <div className="absolute inset-0 bg-[#f4f1eb] overflow-hidden flex p-24">
            <div className="w-1/3">
              <h2 className={`text-[#2d302c] text-[48px]  ${titleFont}  tracking-tight leading-tight`}>{t.contents || 'Contents'}</h2>
            </div>
            <div className="w-2/3 flex flex-col gap-12 mt-8 pl-24">
              {slide.content.slice(0, 8).map((item, i) => (
                <div key={i} className="flex gap-8 group items-center">
                  <div className="w-2 h-2 rounded-full hidden" />
                  <span className="text-[#FF2B2B] font-sans font-bold text-xl tracking-tighter opacity-80">{(i + 1).toString().padStart(2, '0')}</span>
                  <div className="flex-1 border-b border-[#2d302c]/5 pb-4">
                    <span className="text-[#2d302c]/90 text-2xl font-serif">{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'split':
        return (
          <div className="absolute inset-0 bg-[#f4f1eb] overflow-hidden flex">
            <div className="w-[55%] h-full flex flex-col p-24 justify-center">
              <h2 className={`text-[#2d302c] text-[48px]  ${titleFont}  tracking-tight leading-[1.1] mb-12`}>{slide.title}</h2>
              <div className="flex flex-col gap-8">
                {slide.content.slice(0, 5).map((point, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#FF2B2B] mt-2 shrink-0 opacity-80" />
                    <p className="text-[#2d302c]/80 text-[22px] font-sans font-light leading-[1.5]">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-[45%] h-full relative p-12">
              {slide.imageUrl ? (
                <img src={slide.imageUrl} className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-[2s] rounded-xl" alt={slide.title} referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-[#ebe7df] flex items-center justify-center rounded-xl">
                  <IconComponent className="w-24 h-24 text-[#2d302c]/10" strokeWidth={1} />
                </div>
              )}
            </div>
          </div>
        );
      case 'grid': {
        const gridItems = slide.content.slice(0, 6);
        return (
          <div className="absolute inset-0 bg-[#f4f1eb] overflow-hidden flex flex-col p-24">
            <h2 className={`text-[#2d302c] text-[48px]  ${titleFont}  tracking-tight w-2/3 mb-16`}>{slide.title}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-12">
              {gridItems.map((item, i) => (
                <div key={i} className="flex-1 min-w-[250px] border-l-[3px] border-[#FF2B2B]/40 pl-6 flex flex-col gap-4">
                  <span className="text-[#FF2B2B] font-sans text-sm font-bold opacity-60">STRATEGY {String(i + 1).padStart(2, '0')}</span>
                  <p className="text-[#2d302c]/90 text-[20px] font-serif leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'feature':
        return (
          <div className="absolute inset-0 bg-[#f4f1eb] overflow-hidden flex flex-col items-center justify-center p-32 text-center">
            <div className="w-16 h-1 bg-[#FF2B2B] mb-12 opacity-80" />
            <h2 className={`text-[#2d302c] text-[56px]  ${titleFont}  tracking-tight leading-[1.1] max-w-[85%] mb-16`}>{slide.title}</h2>
            <div className="flex justify-center gap-12 max-w-[95%]">
              {slide.content.slice(0, 4).map((item, i) => (
                <div key={i} className="flex flex-col text-left bg-white/40 p-8 rounded-2xl shadow-sm border border-[#2d302c]/5">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-6 h-6 rounded-full bg-[#FF2B2B]/10 flex items-center justify-center">
                        <span className="text-[#FF2B2B] font-bold text-xs">{i+1}</span>
                     </div>
                   </div>
                  <p className="text-[#2d302c] text-[18px] font-sans font-light leading-[1.5]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'timeline':
      case 'steps':
        return (
          <div className="absolute inset-0 bg-[#f4f1eb] overflow-hidden flex col p-24">
             <div className="w-1/3">
                <h2 className={`text-[#2d302c] text-[48px]  ${titleFont}  tracking-tight`}>{slide.title}</h2>
             </div>
            <div className="w-2/3 flex flex-col gap-12 mt-4 pl-12 border-l-[0.5px] border-[#2d302c]/20 relative">
              {slide.content.slice(0, 5).map((item, i) => (
                <div key={i} className="flex gap-8 relative items-start block">
                  <div className="absolute -left-[54.5px] top-2 w-4 h-4 bg-[#FF2B2B] rounded-full ring-4 ring-[#f4f1eb]" />
                  <div className="flex-1 flex flex-col">
                    <span className="text-[#FF2B2B] font-sans font-bold text-sm tracking-widest uppercase mb-2">Phase 0{i+1}</span>
                    <p className="text-[#2d302c] text-[22px] font-serif leading-[1.4]">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'chart': {
        const chartData = slide.data || [
          { label: 'Q1', value: 340 },
          { label: 'Q2', value: 410 },
          { label: 'Q3', value: 580 },
          { label: 'Q4', value: 720 },
        ];
        return (
          <div className="absolute inset-0 bg-[#f4f1eb] overflow-hidden flex p-24">
            <div className="w-[45%] flex flex-col justify-center pr-16">
              <h2 className={`text-[#2d302c] text-[52px]  ${titleFont}  tracking-tight leading-[1.1] mb-12`}>{slide.title}</h2>
              <p className="text-[#2d302c]/70 text-[22px] font-sans font-light leading-[1.6]">
                {slide.content[0] || "Metrics analysis and overview."}
              </p>
              <div className="mt-12 flex flex-col gap-4">
                {slide.content.slice(1,4).map((note, idx) => (
                   <div key={idx} className="flex items-center gap-3">
                     <span className="text-[#FF2B2B]">•</span>
                     <span className="text-[#2d302c]/80 text-lg font-sans font-light">{note}</span>
                   </div>
                ))}
              </div>
            </div>
            <div className="w-[55%] flex items-end justify-center gap-12 h-[80%] my-auto ml-16 bg-white/40 p-12 rounded-[32px] shadow-sm border border-[#2d302c]/5 relative">
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 p-12">
                   {[0,1,2,3].map(i => <div key={i} className="border-t border-dashed border-[#2d302c] w-full" />)}
               </div>
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center z-10 h-full justify-end group">
                  <span className="text-[#FF2B2B] font-sans font-black text-[32px] leading-none mb-4 group-hover:-translate-y-2 transition-transform">{d.value}</span>
                  <div className="w-16 bg-[#2d302c]/80 group-hover:bg-[#2d302c] transition-colors rounded-t-xl" style={{height: (d.value / Math.max(...chartData.map(v => v.value))) * 100 + '%'}} />
                  <span className="text-[#2d302c]/60 text-[12px] uppercase tracking-widest font-sans mt-4 font-bold">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'quote':
        return (
          <div className="absolute inset-0 bg-[#2d302c] overflow-hidden flex flex-col p-32 justify-center items-center text-center">
            <div className="text-[#FF2B2B] font-serif text-[120px] leading-none mb-8 opacity-80">&ldquo;</div>
            <h2 className={`text-[#f4f1eb] text-[48px] font-serif font-light leading-[1.3] max-w-[85%]`}>{slide.content[0]}</h2>
            <div className="mt-16 flex flex-col items-center">
              <div className="w-12 h-[2px] bg-[#FF2B2B] mb-6 opacity-60" />
              <p className="text-[#f4f1eb]/60 text-[16px] uppercase tracking-[0.3em] font-sans font-bold">{slide.title}</p>
            </div>
          </div>
        );
      case 'image':
        return (
          <div className="absolute inset-0 bg-[#f4f1eb] overflow-hidden flex">
            <div className="w-[45%] h-full p-24 flex flex-col z-10 justify-center">
              <h2 className={`text-[#2d302c] text-[48px]  ${titleFont}  tracking-tight mb-16`}>{slide.title}</h2>
              <div className="flex flex-col gap-8">
                {slide.content.slice(0, 4).map((point, i) => (
                   <div key={i} className="flex items-start gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-white border border-[#2d302c]/10 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF2B2B] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[#2d302c]/90 text-[20px] font-sans font-light leading-[1.5]">{point}</p>
                   </div>
                ))}
              </div>
            </div>
            <div className="w-[55%] h-full">
              {slide.imageUrl ? (
                <img src={slide.imageUrl} className="w-full h-full object-cover filter grayscale opacity-90 mix-blend-multiply" alt={slide.title} referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-[#ebe7df] flex items-center justify-center border-l-[0.5px] border-[#2d302c]/10">
                  <IconComponent className="w-24 h-24 text-[#2d302c]/10" strokeWidth={1} />
                </div>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="absolute inset-0 bg-[#f4f1eb] overflow-hidden flex flex-col p-24">
            <div className="w-2/3">
              <h2 className={`text-[#2d302c] text-[48px]  ${titleFont}  tracking-tight mb-16 leading-tight`}>{slide.title}</h2>
            </div>
            <div className="flex flex-row flex-wrap gap-x-12 gap-y-16">
              {slide.content.slice(0, 6).map((point, i) => (
                <div key={i} className="flex gap-4 w-[calc(50%-24px)] items-start">
                  <div className="w-2 h-2 rounded-full bg-[#FF2B2B] mt-[10px] shrink-0 opacity-80" />
                  <p className="text-[#2d302c]/90 text-[22px] font-serif leading-snug">{point}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

const renderLayout = () => {
    if (isGem) return renderGemLayout();
    switch (slide.layout) {
      case 'title':
        return (
          <div className="absolute inset-0 bg-white overflow-hidden">
            {/* Background geometric accents specific to styles */}
            {isModern && (
              <div 
                className="absolute top-0 right-0 w-[40%] h-full bg-[#FF2B2B]/5"
                style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
              />
            )}
            {isExecutive && (
              <div className="absolute top-0 right-0 w-[40%] h-full z-0">
                 <div 
                  className="absolute inset-0 bg-[#000000]"
                  style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                />
                <div 
                  className="absolute inset-0 bg-[#FF2B2B]/10 ml-8"
                  style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                />
              </div>
            )}
            {isStrategic && (
              <div className="absolute inset-0 border-[32px] border-[#F5F5F5]" />
            )}
            {isGem && (
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            )}

            <div style={{...getStyle(0.8, 1.2, 5.0, 3.2), display: 'flex', flexDirection: 'column', alignItems: (isStrategic && !isExecutive) ? 'center' : 'flex-start', justifyContent: 'center', textAlign: (isStrategic && !isExecutive) ? 'center' : 'left', zIndex: 10}}>
              <div className="mb-8 w-24 h-1.5 bg-[#FF2B2B]" />
              <h1 className={`text-black font-black leading-[1.1] ${titleFont}`} style={{ fontSize: getFontSize(72) }}>{slide.title}</h1>
              {slide.subtitle && (
                <p className={`text-black/60 mt-8 ${bodyFont} leading-relaxed`} style={{ fontSize: getFontSize(28) }}>{slide.subtitle}</p>
              )}
            </div>
            
            <div style={{...getStyle(0.8, 4.8, 2, 0.5), display: 'flex', alignItems: 'center', zIndex: 10}}>
              {/* Logo removed */}
            </div>
          </div>
        );
      case 'contents':
        if (isExecutive) {
          return (
            <div className="absolute inset-0 bg-white overflow-hidden flex">
              <div className="w-[30%] h-full bg-[#000000] p-16 flex flex-col justify-end relative overflow-hidden">
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                <div className="h-1 w-12 bg-[#FF2B2B] mb-8" />
                <h2 className={`font-black text-white ${titleFont} uppercase tracking-tighter leading-none relative z-10`} style={{ fontSize: getFontSize(80) }}>{t.contents || 'Contents'}</h2>
              </div>
              <div className="w-[70%] h-full p-20 flex flex-col justify-center bg-[#FAFAFA]">
                <div className="grid grid-cols-1 gap-12">
                  {slide.content.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-start gap-8 group">
                      <div className="w-12 h-12 rounded-xl bg-white border border-black/5 shadow-sm flex items-center justify-center shrink-0 group-hover:bg-[#FF2B2B] group-hover:text-white group-hover:border-transparent transition-all">
                        <span className="font-black text-xl">{(i + 1).toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex flex-col gap-2 pt-1 border-b border-black/5 pb-6 w-full">
                        <span className={`font-black text-black group-hover:text-[#FF2B2B] transition-colors`} style={{ fontSize: getFontSize(28) }}>{item}</span>
                        <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                          <LucideIcons.ArrowRight className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">Section Insight</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="absolute inset-0 bg-white overflow-hidden flex flex-col p-16">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-8 mb-12">
              <h2 className={`font-black text-black ${titleFont} uppercase tracking-widest`} style={{ fontSize: getFontSize(40) }}>{t.contents || 'AGENDA'}</h2>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#FF2B2B]" />
                 <span className="text-black/40 font-black text-sm uppercase tracking-widest">Overview</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-24 gap-y-12 flex-1 items-start content-start">
              {slide.content.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <span className="text-[#FF2B2B] font-black text-3xl opacity-30 group-hover:opacity-100 transition-opacity">{(i + 1).toString().padStart(2, '0')}</span>
                  <div className="flex flex-col gap-2">
                    <span className={`font-bold text-black border-b border-transparent group-hover:border-[#FF2B2B] transition-colors pb-1 line-clamp-2`} style={{ fontSize: getFontSize(24) }}>{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'split':
        return (
          <div className="absolute inset-0 bg-white overflow-hidden flex">
             <div className="w-[50%] h-full p-20 flex flex-col justify-center bg-[#FAFAFA]">
              <div className="w-12 h-1.5 bg-[#FF2B2B] mb-10" />
              <h2 className={`font-black text-black ${titleFont} mb-12 leading-tight`} style={{ fontSize: getFontSize(40) }}>{slide.title}</h2>
              <div className="space-y-8 max-h-[500px] overflow-hidden">
                {slide.content.slice(0, 4).map((point, i) => (
                  <div key={i} className="flex items-start gap-6 group">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF2B2B]/20 mt-2.5 shrink-0 group-hover:bg-[#FF2B2B] transition-colors" />
                    <span className={`text-black/70 ${bodyFont} leading-relaxed line-clamp-4`} style={{ fontSize: getFontSize(20) }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-[50%] h-full relative overflow-hidden">
              <div className="absolute inset-0 w-8 bg-gradient-to-r from-[#FAFAFA] to-transparent z-10" />
              {slide.imageUrl ? (
                <img src={slide.imageUrl} className="w-full h-full object-cover shadow-[-40px_0_80px_rgba(0,0,0,0.1)] hover:scale-105 transition-transform duration-[10s]" alt={slide.title} referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center">
                  <IconComponent className="w-32 h-32 text-black/5" />
                </div>
              )}
            </div>
          </div>
        );
      case 'grid': {
        const gridItems = slide.content.slice(0, 6);
        const colCount = gridItems.length === 4 || gridItems.length === 2 ? 2 : gridItems.length === 1 ? 1 : 3;
        
        if (isExecutive) {
          return (
            <div className="absolute inset-0 bg-white overflow-hidden">
              <div style={{...getStyle(0.8, 0.5, 8.4, 0.8), display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EEE'}}>
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-10 bg-[#FF2B2B]" />
                  <h2 className={`font-black text-black ${titleFont} uppercase tracking-tight`} style={{ fontSize: getFontSize(36) }}>{slide.title}</h2>
                </div>
                <div className="flex gap-2">
                  <div className="w-12 h-1.5 bg-black/5 rounded-full" />
                  <div className="w-24 h-1.5 bg-[#FF2B2B] rounded-full" />
                </div>
              </div>
              <div style={{...getStyle(0.8, 1.6, 8.4, 3.8), display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: '24px', alignContent: 'start'}}>
                {gridItems.map((item, i) => (
                  <div key={i} className={`group p-8 bg-[#F8F9FA] rounded-[32px] border border-black/5 hover:border-[#FF2B2B]/30 hover:bg-white hover:shadow-2xl transition-all relative overflow-hidden flex flex-col justify-center ${colCount === 2 ? 'min-h-[220px]' : 'min-h-[200px]'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-bl-[100px] -mr-16 -mt-16 group-hover:bg-[#FF2B2B]/5 transition-colors" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-6 h-6 text-[#FF2B2B]" />
                      </div>
                      <h3 className={`font-black text-black mb-3 font-sans`} style={{ fontSize: getFontSize(22) }}>Strategic Pillar {i+1}</h3>
                      <p className={`text-black/60 ${bodyFont} leading-relaxed line-clamp-3`} style={{ fontSize: getFontSize(16) }}>{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="absolute inset-0 overflow-hidden flex flex-col pt-16 px-20 pb-16">
            {isModern && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF2B2B]/5 rounded-bl-[100px]" />
            )}
            {isCreative && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#FF2B2B]/10 rounded-full" />
            )}
            <h2 className={`font-black ${isGem ? 'text-black/80' : 'text-black'} ${titleFont} uppercase mb-16 relative z-10`} style={{ fontSize: getFontSize(40) }}>{slide.title}</h2>
            <div className={`flex-1 grid grid-cols-${colCount} gap-12 auto-rows-fr relative z-10`} style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
              {gridItems.map((item, i) => (
                <div key={i} className={`p-8 border ${isGem ? 'border-2 border-black/10 bg-[#FAFAFA]' : isModern ? 'border-0 bg-white shadow-xl rotate-1' : isCreative ? 'border-0 bg-[#FFF5F5] rounded-[40px]' : 'border-black/5 shadow-sm bg-white'} hover:shadow-xl transition-all flex flex-col rounded-3xl h-full`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-10 h-10 flex items-center justify-center ${isModern ? 'bg-[#FF2B2B] text-white rounded-lg shadow-lg' : isGem ? 'bg-black text-white font-mono rounded-sm' : 'rounded-full bg-[#FF2B2B]/10 text-[#FF2B2B]'}`}>
                      <span className="font-black text-lg">{(i + 1).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                  <span className={`font-bold text-black/80 ${bodyFont} leading-relaxed line-clamp-4`} style={{ fontSize: getFontSize(18) }}>{item}</span>
                  {isStrategic && <div className="mt-8 w-12 h-1 bg-[#FF2B2B]" />}
                  {isCreative && <div className="mt-auto pt-6"><div className="w-2 h-2 rounded-full bg-[#FF2B2B]" /></div>}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'feature': {
        const featureItems = slide.content.slice(0, 4);
        const fColCount = featureItems.length === 3 ? 3 : featureItems.length === 1 ? 1 : 2;
        return (
          <div className="absolute inset-0 bg-[#FAFAFA] overflow-hidden flex flex-col p-16">
            <div className="flex flex-col items-center justify-center text-center z-10 relative mb-16">
              <h2 className={`font-black text-black ${titleFont}`} style={{ fontSize: getFontSize(40), maxWidth: '80%' }}>{slide.title}</h2>
              {isExecutive && <div className="mt-6 w-16 h-1 bg-[#FF2B2B] rounded-full" />}
            </div>

            <div className={`flex-1 grid gap-x-16 gap-y-12 items-center`} style={{ gridTemplateColumns: `repeat(${fColCount}, minmax(0, 1fr))` }}>
                {featureItems.map((item, i) => (
                  <div 
                    key={i} 
                    className={`bg-white border ${isExecutive ? 'border-black/5' : 'border-transparent'} p-8 rounded-[24px] shadow-lg flex flex-col justify-center h-[180px] z-10 transition-transform hover:-translate-y-1`}
                  >
                    <div className="mb-4 w-12 h-1.5 bg-[#FF2B2B]/20 rounded-full" />
                    <span className={`font-bold text-black/90 ${bodyFont} leading-relaxed line-clamp-3`} style={{ fontSize: getFontSize(22) }}>{item}</span>
                  </div>
                ))}
            </div>
          </div>
        );
      }
      case 'timeline':
        return (
          <div className="absolute inset-0 bg-white overflow-hidden">
            <div style={{...getStyle(0.8, 0.6, 8.4, 0.8), display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <h2 className={`font-black text-black ${titleFont}`} style={{ fontSize: getFontSize(40) }}>{slide.title}</h2>
              {isExecutive && <div className="h-[2px] w-32 bg-[#FF2B2B]" />}
            </div>
            {isExecutive ? (
               <div style={{...getStyle(0.8, 2.0, 8.4, 3.0), display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0 40px'}}>
                  {slide.content.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-8 w-1/4 relative group">
                      {i < 3 && <div className="absolute top-6 left-[60%] w-full h-0.5 bg-black/5 z-0" />}
                      <div className="w-12 h-12 rounded-full border-4 border-white bg-[#000000] text-white flex items-center justify-center font-black shadow-xl z-10 group-hover:bg-[#FF2B2B] transition-colors">
                        {i + 1}
                      </div>
                      <div className="text-center flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#FF2B2B]">Phase 0{i+1}</span>
                        <span className={`font-bold text-black ${bodyFont} leading-tight`} style={{ fontSize: getFontSize(18) }}>{item}</span>
                      </div>
                    </div>
                  ))}
               </div>
            ) : (
              <div className="absolute inset-0 px-20">
                <div className="absolute top-[55%] left-20 right-20 h-1 bg-black/5" />
                <div className="h-full flex items-center justify-between pt-24">
                  {slide.content.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-6 w-1/5 text-center px-4 relative z-10 group mt-10">
                      <div className="w-20 h-20 bg-white border-4 border-black/5 rounded-full flex items-center justify-center shadow-lg group-hover:border-[#FF2B2B] group-hover:scale-110 transition-all">
                        <span className="font-black text-black/40 text-xl group-hover:text-[#FF2B2B]">{(i + 1).toString().padStart(2, '0')}</span>
                      </div>
                      <div className="w-1 h-8 bg-black/5 group-hover:bg-[#FF2B2B]/50 transition-colors" />
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-black/5">
                        <span className={`font-bold text-black/80 ${bodyFont} leading-snug line-clamp-3`} style={{ fontSize: getFontSize(16) }}>{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'chart': {
        const chartData = slide.data || [
          { label: 'Q1', value: 340 },
          { label: 'Q2', value: 410 },
          { label: 'Q3', value: 580 },
          { label: 'Q4', value: 720 },
        ];
        const maxVal = Math.max(...chartData.map(v => v.value));
        return (
          <div className="absolute inset-0 bg-white overflow-hidden">
            <div style={{...getStyle(0.8, 0.6, 8.4, 0.8), display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <h2 className={`font-black text-black ${titleFont}`} style={{ fontSize: getFontSize(40) }}>{slide.title}</h2>
              <div className="text-[10px] font-black border border-[#FF2B2B] text-[#FF2B2B] px-6 py-2 rounded-full uppercase tracking-[0.2em]">{isExecutive ? 'Strategic Growth Analysis' : 'REAL-TIME DATA'}</div>
            </div>
            
            <div className="flex h-full pt-32 px-16 pb-32 gap-16">
               <div className="flex-1 flex items-end justify-around pb-12 border-b-2 border-[#F0F0F0] relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    {[0,1,2,3].map(i => <div key={i} className="border-t border-dashed border-black w-full" />)}
                  </div>
                  
                  {chartData.map((d, i) => {
                    const heightPercent = (d.value / maxVal) * 100;
                    return (
                      <div key={i} className="flex flex-col items-center gap-6 flex-1 h-full justify-end group z-10">
                        <span className="font-black text-[#FF2B2B] group-hover:scale-125 transition-transform" style={{ fontSize: getFontSize(24) }}>{d.value}</span>
                        <div 
                          className={`w-20 rounded-t-xl transition-all duration-1000 origin-bottom ${isExecutive ? 'bg-[#000000]' : 'bg-gradient-to-t from-[#FF2B2B] to-[#FF5C5C]'}`} 
                          style={{ height: `${heightPercent}%` }} 
                        />
                        <span className={`font-black text-black/40 uppercase tracking-[0.3em]`} style={{ fontSize: getFontSize(12) }}>{d.label}</span>
                      </div>
                    );
                  })}
               </div>
               
               <div className="w-[320px] flex flex-col gap-6">
                  <div className="bg-[#FF2B2B] text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden shrink-0">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full -mr-8 -mt-8" />
                      <div className="flex items-center gap-2 mb-6">
                        <LucideIcons.Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Strategic Insight</span>
                      </div>
                      <p className="font-black leading-tight italic line-clamp-4" style={{ fontSize: getFontSize(20) }}>"{slide.content[0] || "Growth is trending significantly above expectations."}"</p>
                  </div>
                  <div className="bg-[#F8F9FA] p-8 rounded-[32px] border border-black/5 flex-1 overflow-hidden flex flex-col">
                      <h4 className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-6">Supporting Evidence</h4>
                      <div className="space-y-6 overflow-hidden">
                        {slide.content.slice(1, 4).map((note, i) => (
                           <div key={i} className="flex items-start gap-4">
                              <div className="w-2 h-2 rounded-full bg-[#FF2B2B] mt-1.5 shrink-0" />
                              <span className="text-xs font-bold text-black/70 leading-relaxed line-clamp-3">{note}</span>
                           </div>
                        ))}
                      </div>
                  </div>
               </div>
            </div>
          </div>
        );
      }
      case 'quote':
        return (
          <div className="absolute inset-0 bg-white overflow-hidden flex flex-col items-center justify-center p-32 text-center">
            <div className="absolute top-16 left-16 text-[#FF2B2B] opacity-10 font-serif leading-none" style={{ fontSize: getFontSize(400) }}>“</div>
            <h2 className={`italic text-black ${titleFont} font-light leading-snug relative z-10`} style={{ fontSize: getFontSize(56) }}>{slide.content[0]}</h2>
            <div className="mt-16 w-24 h-2 bg-[#FF2B2B] rounded-full" />
            <p className="mt-8 font-black text-black tracking-[0.4em] uppercase" style={{ fontSize: getFontSize(18) }}>{slide.title}</p>
          </div>
        );
      case 'steps':
        if (isExecutive) {
          return (
            <div className="absolute inset-0 bg-white overflow-hidden">
              <div style={{...getStyle(0.8, 0.6, 8.4, 0.8), display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <h2 className={`font-black text-black ${titleFont}`} style={{ fontSize: getFontSize(40) }}>{slide.title}</h2>
                <div className="flex items-center gap-2">
                  <LucideIcons.ShieldCheck className="w-5 h-5 text-[#FF2B2B]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Verified Roadmap</span>
                </div>
              </div>
              <div style={{...getStyle(0.8, 1.8, 8.4, 3.2), display: 'flex', alignItems: 'center', justifyContent: 'space-around'}}>
                {slide.content.slice(0, 3).map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center w-1/3 relative group">
                    {idx < 2 && (
                      <div className="absolute top-[80px] left-[70%] w-full flex items-center justify-center">
                        <div className="w-[120px] h-px bg-black/10 border-t border-dashed border-black/30" />
                        <LucideIcons.ChevronRight className="w-4 h-4 text-[#FF2B2B]" />
                      </div>
                    )}
                    <div className="w-40 h-40 bg-white hover:bg-[#F8F9FA] border border-black/5 rounded-[40px] flex items-center justify-center relative shadow-xl mb-10 transition-all group-hover:-translate-y-2 group-hover:shadow-2xl">
                      <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#000000] text-white flex items-center justify-center font-black text-xl rounded-2xl shadow-lg ring-4 ring-white">
                        {idx + 1}
                      </div>
                      <IconComponent className="w-12 h-12 text-[#FF2B2B]" />
                    </div>
                    <p className={`font-black text-black ${bodyFont} leading-tight max-w-[200px]`} style={{ fontSize: getFontSize(22) }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="absolute inset-0 bg-[#FAFAFA] overflow-hidden flex flex-col pt-16 px-20 pb-16">
            <h2 className={`font-black text-black ${titleFont} text-center mb-24`} style={{ fontSize: getFontSize(40) }}>{slide.title}</h2>
            <div className="flex-1 grid grid-cols-3 gap-16 relative">
              {/* Connecting Background Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-black/5 -translate-y-1/2 rounded-full" />
              
              {slide.content.slice(0, 3).map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center relative z-10 group">
                  <div className="w-40 h-40 bg-white border-4 border-black/5 rounded-3xl flex items-center justify-center relative shadow-xl mb-12 group-hover:-translate-y-4 group-hover:border-[#FF2B2B] group-hover:shadow-2xl transition-all">
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#000000] text-white flex items-center justify-center font-black text-2xl rounded-2xl group-hover:bg-[#FF2B2B] transition-colors">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <IconComponent className="w-16 h-16 text-black/20 group-hover:text-[#FF2B2B] transition-colors" />
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                    <p className={`font-bold text-black/80 ${bodyFont} leading-snug line-clamp-4`} style={{ fontSize: getFontSize(18) }}>{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'image':
        return (
          <div className="absolute inset-0 bg-white overflow-hidden flex">
           <div className="w-1/2 h-full bg-slate-100 flex flex-col items-center justify-center border-r border-slate-200">
              {slide.imageUrl ? (
                <img src={slide.imageUrl} className="w-full h-full object-cover" alt={slide.title} referrerPolicy="no-referrer" />
              ) : (
                <div className="flex flex-col items-center opacity-50 space-y-4">
                  <div className="w-24 h-24 border-4 border-dashed border-slate-400 rounded-3xl flex items-center justify-center">
                    <IconComponent className="w-10 h-10 text-slate-500" />
                  </div>
                  <span className="font-semibold text-slate-500 uppercase tracking-widest text-sm">Image Placeholder</span>
                </div>
              )}
            </div>
            <div className="w-1/2 h-full p-20 flex flex-col justify-center bg-[#FAFAFA]">
              <h2 className={`font-black text-black ${titleFont} mb-12`} style={{ fontSize: getFontSize(52) }}>{slide.title}</h2>
              <div className="space-y-8">
                {slide.content.slice(0, 4).map((point, i) => (
                  <div key={i} className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="w-3 h-3 rounded-full bg-[#FF2B2B]" />
                    <span className={`text-black font-bold ${bodyFont}`} style={{ fontSize: getFontSize(20) }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default: {
        const defaultItems = slide.content;
        const defaultCols = defaultItems.length === 1 ? 1 : 2;
        return (
          <div className="absolute inset-0 bg-[#FAFAFA] overflow-hidden flex flex-col pt-16 px-20">
            <div className="flex items-center gap-6 mb-16 border-b border-black/10 pb-8">
              <div className="w-4 h-12 bg-[#FF2B2B] rounded-full" />
              <h2 className={`font-black text-black ${titleFont}`} style={{ fontSize: getFontSize(48) }}>{slide.title}</h2>
            </div>
            <div className={`flex-1 grid gap-x-16 gap-y-8 items-start content-start`} style={{ gridTemplateColumns: `repeat(${defaultCols}, 1fr)` }}>
              {defaultItems.map((point, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="w-12 h-12 rounded-xl bg-white border border-black/10 shadow-sm flex items-center justify-center shrink-0 group-hover:bg-[#FF2B2B] group-hover:text-white group-hover:border-[#FF2B2B] transition-colors">
                    <span className="font-black text-xl">{(i + 1).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm group-hover:shadow-md transition-shadow w-full">
                    <span className={`text-black/80 font-bold ${bodyFont} leading-relaxed line-clamp-4`} style={{ fontSize: getFontSize(22) }}>{point}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div 
      ref={previewRef}
      className={`w-[1280px] h-[720px] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.4)] rounded-none p-0 flex flex-col relative overflow-hidden group/slide origin-top ${isDark ? 'dark-slide bg-black' : isGem ? 'gem-slide bg-[#f4f1eb]' : 'bg-white'}`}
    >
      {/* Slide Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {renderLayout()}
      </div>

      {/* Global Footer (except for title slides) */}
      {false && slide.layout !== 'title' && (
        <div className="absolute bottom-12 left-12 right-12 flex items-end justify-between pointer-events-none z-20">
          <div className="flex items-center gap-8">
            {/* Logo removed */}
            <div className="w-px h-10 bg-black/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-black/30 mb-1">PROPRIETARY & CONFIDENTIAL</span>
              <span className="text-xs font-black text-black/60 uppercase">
                {presentationTitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-sm font-black text-black/20 tracking-widest">
              PAGE {index + 1}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

