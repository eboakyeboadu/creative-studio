import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { enhancePrompt } from '../lib/gemini';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface PromptEnhancerProps {
  value: string;
  onEnhance: (newValue: string) => void;
  className?: string;
  disabled?: boolean;
  context?: 'image_generation' | 'presentation' | 'data_analysis' | 'general';
}

export const PromptEnhancer: React.FC<PromptEnhancerProps> = ({ 
  value, 
  onEnhance, 
  className = "", 
  disabled = false,
  context = 'general'
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleEnhance = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!value || value.trim().length < 3) {
      toast.info("Please enter a longer prompt to enhance.");
      return;
    }

    if (isEnhancing) return;

    setIsEnhancing(true);
    
    // Add a safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted.current && isEnhancing) {
        setIsEnhancing(false);
        toast.error("Enhancement timed out. Please try again.");
      }
    }, 60000); // Increased to 60s to accommodate 5 retries with backoff

    try {
      const enhancedValue = await enhancePrompt(value, context);
      
      if (!isMounted.current) return;

      if (enhancedValue && enhancedValue !== value) {
        onEnhance(enhancedValue);
        toast.success("Prompt enhanced successfully!");
      } else {
        toast.info("No changes suggested for this prompt.");
      }
    } catch (error: any) {
      if (!isMounted.current) return;
      console.error("Enhancement failed:", error);
      const msg = error?.message || String(error);
      if (msg.toLowerCase().includes('unavailable in your region')) return;
      if (msg.includes("high demand") || msg.includes("503") || msg.includes("429")) {
        toast.error("AI service is too busy right now. Please try again in a few minutes.");
      } else {
        toast.error("Failed to enhance prompt. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setIsEnhancing(false);
        clearTimeout(timeoutId);
      }
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30 relative"
                onClick={handleEnhance}
                disabled={isEnhancing || disabled || !value.trim()}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isEnhancing ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="flex items-center justify-center pointer-events-none"
                    >
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center"
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            }
          />
          <TooltipContent side="top" className="text-[10px] uppercase tracking-widest font-bold px-2 py-1">
            Enhance Prompt
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

