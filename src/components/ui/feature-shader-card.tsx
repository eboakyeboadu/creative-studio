"use client"

import React, { useState, useEffect } from "react"

import { ArrowRight } from "lucide-react"
import { Warp } from "@paper-design/shaders-react"

interface FeatureShaderCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick?: () => void
  colorIndex?: number
}

const getShaderConfig = (index: number) => {
  const configs = [
    {
      proportion: 0.3,
      softness: 0.8,
      distortion: 0.15,
      swirl: 0.6,
      swirlIterations: 8,
      shape: "checks" as const,
      shapeScale: 0.08,
      colors: ["hsl(0, 100%, 90%)", "hsl(0, 100%, 98%)", "hsl(0, 90%, 95%)", "hsl(0, 100%, 99%)"],
      darkColors: ["hsl(0, 100%, 20%)", "hsl(0, 100%, 10%)", "hsl(0, 90%, 15%)", "hsl(0, 100%, 5%)"],
    },
    {
      proportion: 0.4,
      softness: 1.2,
      distortion: 0.2,
      swirl: 0.9,
      swirlIterations: 12,
      shape: "stripes" as const,
      shapeScale: 0.12,
      colors: ["hsl(30, 100%, 90%)", "hsl(30, 100%, 98%)", "hsl(30, 90%, 95%)", "hsl(30, 100%, 99%)"],
      darkColors: ["hsl(30, 100%, 20%)", "hsl(30, 100%, 10%)", "hsl(30, 90%, 15%)", "hsl(30, 100%, 5%)"],
    },
    {
      proportion: 0.35,
      softness: 0.9,
      distortion: 0.18,
      swirl: 0.7,
      swirlIterations: 10,
      shape: "checks" as const,
      shapeScale: 0.1,
      colors: ["hsl(120, 100%, 90%)", "hsl(120, 100%, 98%)", "hsl(120, 90%, 95%)", "hsl(120, 100%, 99%)"],
      darkColors: ["hsl(120, 100%, 20%)", "hsl(120, 100%, 10%)", "hsl(120, 90%, 15%)", "hsl(120, 100%, 5%)"],
    },
    {
      proportion: 0.45,
      softness: 1.1,
      distortion: 0.22,
      swirl: 0.8,
      swirlIterations: 15,
      shape: "stripes" as const,
      shapeScale: 0.09,
      colors: ["hsl(200, 100%, 90%)", "hsl(200, 100%, 98%)", "hsl(200, 90%, 95%)", "hsl(200, 100%, 99%)"],
      darkColors: ["hsl(200, 100%, 20%)", "hsl(200, 100%, 10%)", "hsl(200, 90%, 15%)", "hsl(200, 100%, 5%)"],
    },
    {
      proportion: 0.38,
      softness: 0.95,
      distortion: 0.16,
      swirl: 0.85,
      swirlIterations: 11,
      shape: "checks" as const,
      shapeScale: 0.11,
      colors: ["hsl(270, 100%, 90%)", "hsl(270, 100%, 98%)", "hsl(270, 90%, 95%)", "hsl(270, 100%, 99%)"],
      darkColors: ["hsl(270, 100%, 20%)", "hsl(270, 100%, 10%)", "hsl(270, 90%, 15%)", "hsl(270, 100%, 5%)"],
    },
    {
      proportion: 0.42,
      softness: 1.0,
      distortion: 0.19,
      swirl: 0.75,
      swirlIterations: 9,
      shape: "stripes" as const,
      shapeScale: 0.13,
      colors: ["hsl(330, 100%, 90%)", "hsl(330, 100%, 98%)", "hsl(330, 90%, 95%)", "hsl(330, 100%, 99%)"],
      darkColors: ["hsl(330, 100%, 20%)", "hsl(330, 100%, 10%)", "hsl(330, 90%, 15%)", "hsl(330, 100%, 5%)"],
    },
  ]
  return configs[index % configs.length]
}

export function FeatureShaderCard({ title, description, icon, onClick, colorIndex = 0 }: FeatureShaderCardProps) {
  const shaderConfig = getShaderConfig(colorIndex)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'))
    checkDark()
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDark()
        }
      })
    })
    
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  return (
    <div 
      className="relative h-44 group cursor-pointer border border-border shadow-md rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="absolute inset-0 z-0">
        <Warp
          style={{ height: "100%", width: "100%" }}
          proportion={shaderConfig.proportion}
          softness={shaderConfig.softness}
          distortion={shaderConfig.distortion}
          swirl={shaderConfig.swirl}
          swirlIterations={shaderConfig.swirlIterations}
          shape={shaderConfig.shape}
          shapeScale={shaderConfig.shapeScale}
          scale={1}
          rotation={0}
          speed={0.8}
          colors={isDark ? shaderConfig.darkColors : shaderConfig.colors}
        />
      </div>

      <div className="relative z-10 p-4 rounded-3xl h-full flex flex-col justify-between bg-white/40 dark:bg-black/40 border border-white/20 dark:border-white/10 backdrop-blur-[2px]">
        <div>
          <div className="mb-2 inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-background/50 dark:bg-background/50 shadow-sm backdrop-blur-md text-foreground group-hover:scale-110 transition-transform duration-300">
            {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: "w-5 h-5" })}
          </div>

          <h3 className="text-base font-bold mb-1 text-foreground tracking-tight line-clamp-1">{title}</h3>

          <p className="leading-relaxed text-xs text-foreground/80 font-medium line-clamp-2">{description}</p>
        </div>

        <div className="mt-2 flex items-center text-[10px] font-bold text-foreground/70 uppercase tracking-widest group-hover:text-primary transition-colors">
          <span className="mr-1">Open</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  )
}

