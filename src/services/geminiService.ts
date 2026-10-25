import { Type, ThinkingLevel } from "@google/genai";
import { getGeminiAI, withRetry, sleep } from "../lib/gemini";

export type SlideLayout = 'title' | 'contents' | 'content' | 'split' | 'grid' | 'quote' | 'image' | 'steps' | 'timeline' | 'chart' | 'map' | 'feature';

export interface Slide {
  title: string;
  content: string[];
  layout: SlideLayout;
  icon?: string;
  imagePrompt?: string;
  imageUrl?: string;
  accentColor?: string;
  subtitle?: string;
  data?: { label: string, value: number }[]; // For chart layout
  speakerNotes?: string;
}

export interface PresentationData {
  title: string;
  theme: 'modern' | 'minimal' | 'bold' | 'corporate' | 'studio-premium';
  slides: Slide[];
  styleName?: string;
}

const PRESET_STYLES = [
  {
    name: "Light",
    description: "High-impact consulting aesthetic. Minimalist but powerful. Uses heavy structural vertical sidebars for contents, bento-grid layouts for features, and sophisticated data visualization. Emphasizes key takeaways and executive summaries. Tone: Authoritative, decisive, premium."
  },
  {
    name: "Dark",
    description: "A bold, dark-mode presentation aesthetic focused on creative impact. Uses deep backgrounds, high-contrast text, and striking visuals. Tone: Innovative, dynamic, bold."
  },
  {
    name: "Gem",
    description: "Ultra-premium, high-level presentation aesthetic. Rejects generic corporate templates, colored rectangle accents, icon-bullet pairings, and cluttered layouts. Draws inspiration from high-fashion print lookbooks, premium tech keynotes, and modern editorial platforms. THE ASYMMETRY & SPACE LAW: Prioritize whitespace. At least 40-50% of every slide must remain completely empty. Avoid perfectly centered layouts, use asymmetrical distributions. DRAMATIC TYPOGRAPHIC HIERARCHY: Text is primary. Headlines massive, body copy crisp, Max 2-3 lines of body text. INTENT-AWARE STRUCTURAL CONTAINERS: No bullet points. Minimal timelines. Clean columns with massive numerical headers (01, 02). For data, number is the hero (60% space). RESTORATIVE & LOW-CONTRAST PALETTES: Warm sand/wax paper neutrals, deep charcoal, muted olive. One striking highlight color used incredibly sparingly. INTELLECTUAL CURATION OVER DECORATION: No decorative shapes or generic icons. Subtle ultra-thin borders if necessary."
  }
];

export interface BrandIdentity {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  toneOfVoice: string;
  guidelines: string;
  userContext?: string;
}

export async function generatePresentationPlan(
  prompt: string, 
  fileContent?: string, 
  numSlides?: number, 
  brandIdentity?: BrandIdentity,
  stylePreset?: string
): Promise<string> {
  return withRetry(async () => {
    const ai = getGeminiAI();
    const model = "gemini-3.8-flash";

    const selectedPreset = stylePreset 
      ? PRESET_STYLES.find(s => s.name === stylePreset) 
      : PRESET_STYLES[Math.floor(Math.random() * PRESET_STYLES.length)];

    const systemInstruction = `
      You are an elite presentation structural architect (McKensey/Bain caliber).
      Your job is to outline a highly compelling, logical, and persuasive slide-by-slide plan for a C-level presentation.
      
      ARCHITECTURAL STYLE: ${selectedPreset?.name || 'Executive Strategy'}
      DESIGN GUIDELINES: ${selectedPreset?.description || ''}
      
      BRAND CONTEXT:
      - Tone of Voice: ${brandIdentity?.toneOfVoice || "Executive, Data-Driven, Authoritative, & Visionary"}
      ${brandIdentity?.guidelines ? `- Brand Guidelines: ${brandIdentity.guidelines}` : ""}
      
      PERSONAL AI CONTEXT:
      ${brandIdentity?.userContext ? `- User Profile/Preferences: ${brandIdentity.userContext}` : ""}

      NARRATIVE EXPECTATIONS:
      - Discard poor, unorganized input structures. Reorganize the facts into a powerful, proven executive framework (e.g. Situation -> Complication -> Resolution -> Roadmap).
      - Every slide must have a distinct purpose and drive the narrative forward.

      For each slide, specify:
      - The Slide Number
      - The internal title or topic (make it an actionable headline, not a generic label)
      - The key message or takeaway (the "So What?")
      - A brief description of what visuals or data layout should be used (e.g., 'Split layout with a key chart on the right')
      
      Keep the output in clear, readable Markdown format. Do not output anything other than the plan.
      ${numSlides ? `Generate a plan for EXACTLY ${numSlides} slides.` : "Generate a plan for a complete storyline (usually 10-15 slides)."}
    `;

    const fullPrompt = fileContent
      ? `Based on the following document content, create a presentation plan about: ${prompt}\n\nDocument Content:\n${fileContent}`
      : `Create a presentation plan about: ${prompt}`;

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: {
        systemInstruction,
        maxOutputTokens: 8192,
      }
    });

    if (!response.text) throw new Error("Failed to generate presentation plan.");
    return response.text;
  });
}

export async function editPresentationPlan(currentPlan: string, feedback: string, brandIdentity?: BrandIdentity): Promise<string> {
  return withRetry(async () => {
    const ai = getGeminiAI();
    const model = "gemini-3.8-flash";

    const systemInstruction = `
      You are an expert presentation structural architect.
      The user is providing feedback or a new draft to modify the existing presentation plan.

      BRAND CONTEXT:
      - Tone of Voice: ${brandIdentity?.toneOfVoice || "Professional & Analytical"}
      ${brandIdentity?.guidelines ? `- Brand Guidelines: ${brandIdentity.guidelines}` : ""}
      
      PERSONAL AI CONTEXT:
      ${brandIdentity?.userContext ? `- User Profile/Preferences: ${brandIdentity.userContext}` : ""}

      If the user provides a line of instruction or feedback, apply those changes to the current plan.
      If the user provides a completely rewritten draft or plan, use their provided draft as the new plan, formatting it properly.
      Output ONLY the updated, complete Markdown plan. Do not include introductory text.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: `CURRENT PLAN:\n${currentPlan}\n\nUSER FEEDBACK:\n${feedback}`,
      config: {
        systemInstruction,
        maxOutputTokens: 8192,
      }
    });

    if (!response.text) throw new Error("Failed to update presentation plan.");
    return response.text;
  });
}

export async function generateGambit(presentationText: string, type: 'opening' | 'closing', brandIdentity?: BrandIdentity): Promise<string> {
  return withRetry(async () => {
    const ai = getGeminiAI();
    const model = "gemini-3.8-flash";

    const systemInstruction = `
      You are an expert public speaker and speechwriter.
      The user will provide the text of a presentation (or document).
      
      BRAND CONTEXT:
      - Tone of Voice: ${brandIdentity?.toneOfVoice || "Professional & Analytical"}
      ${brandIdentity?.guidelines ? `- Brand Guidelines: ${brandIdentity.guidelines}` : ""}
      
      PERSONAL AI CONTEXT:
      ${brandIdentity?.userContext ? `- User Profile/Preferences: ${brandIdentity.userContext}` : ""}

      Your job is to generate a powerful ${type} gambit for the presenter to say out loud.
      This can be an anecdote, question, quote, factoid, analogy, aphorism, retrospective/prospective statement, or elevator pitch.
      It must be highly engaging, strictly relevant to the content, and take UNDER 30 SECONDS to say out loud (around 60-70 words max).
      Output ONLY the exact words the speaker should say.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: `PRESENTATION CONTENT:\n${presentationText}\n\nGenerate the ${type} gambit.`,
      config: {
        systemInstruction,
      }
    });

    if (!response.text) throw new Error(`Failed to generate ${type} gambit.`);
    return response.text;
  });
}

export async function generatePresentation(
  prompt: string, 
  fileContent?: string, 
  numSlides?: number, 
  styleReferenceContent?: string,
  brandIdentity?: BrandIdentity,
  strictPlanMode?: boolean,
  stylePreset?: string
): Promise<PresentationData> {
  return withRetry(async () => {
    const ai = getGeminiAI();
    const model = "gemini-3.8-flash"; 
    
    let selectedPreset = null;
    if (stylePreset) {
      selectedPreset = PRESET_STYLES.find(s => s.name === stylePreset) || null;
    }
    
    if (!selectedPreset) {
      selectedPreset = styleReferenceContent ? null : PRESET_STYLES[Math.floor(Math.random() * PRESET_STYLES.length)];
    }
    
    const systemInstruction = `
      You are an elite, state-of-the-art presentation designer and strategic storyteller (operating at the level of top-tier consulting firms). 
      Your task is to generate a highly organized, insightful, and visually stunning presentation. If the source material lacks structure, you MUST re-organize it into a powerful, logical narrative arc suitable for a C-level audience.
      
      BRAND IDENTITY (MANDATORY BRANDING):
      - Primary Color: ${brandIdentity?.primaryColor || "Studio Red (#FF2B2B)"}.
      - Secondary Color: Black (#000000).
      - Accent Color: ${brandIdentity?.accentColor || "#FF2B2B"}.
      - Tone of Voice: ${brandIdentity?.toneOfVoice || "Executive, Data-Driven, Authoritative, & Visionary"}.
      ${brandIdentity?.guidelines ? `- Brand Guidelines: ${brandIdentity.guidelines}` : ""}
      
      DESIGN & AESTHETIC DIRECTIVE:
      - BACKGROUNDS: MANDATORY LIGHT THEME. Use Pure White (#FFFFFF) or very light off-white (#FAFAFA). Never use dark backgrounds.
      - FONT COLORS: Use Black (#000000) for primary text and Studio Red (#FF2B2B) for emphasis.
      - VIBE: Premium, minimalist, high-impact, state-of-the-art.
      
      ${styleReferenceContent ? `
      STYLE REFERENCE PROVIDED:
      Apply structural and narrative cues from this reference while maintaining brand colors.
      Reference Content:
      ${styleReferenceContent}
      ` : `
      SELECTED DESIGN STYLE: ${selectedPreset?.name}
      OVERRIDE POOR STRUCTURES: If any selected style or input leads to a low-quality outline, discard it and use a state-of-the-art, proven executive storyline (e.g. Problem -> Insight -> Solution -> Impact -> Roadmap).
      `}
      
      AVAILABLE SLIDE LAYOUTS (CHOOSE THE BEST ONE FOR THE MESSAGE):
      - 'title': Impactful executive headline.
      - 'contents': Agenda or Table of Contents.
      - 'content': Executive summary style. A clear headline bullet followed by 3-4 succinct supporting sub-points. (Avoid walls of text).
      - 'split': 50/50 vertical division. Insight on one side, high-quality visual/key metric on the other.
      - 'grid': Bento-grid style (4-6 conceptual boxes). Perfect for "Key Pillars" or "Core Capabilities".
      - 'quote': Large, high-impact strategic quote or singular takeaway.
      - 'image': Full-width visual with glassmorphism text callouts.
      - 'steps': Roadmap or sequential process.
      - 'timeline': Evolution or schedule.
      - 'chart': Analytical insight (emphasize the "So What?").
      - 'feature': Central pillar with radiating supporting points.
   
      Guidelines for Excellence:
      1. NARRATIVE ARC: Ensure the presentation tells a story. Slides must connect logically. 
      2. CONCISENESS: Slides are visual aids, not teleprompters. Keep on-slide text punchy and impactful. Move lengthy explanations to 'speakerNotes'. Never generate endless, repeating lists of words for subtitles or content fields. Keep text strings under 20 words where possible.
      3. SLIDE COUNT: ${numSlides ? `Generate EXACTLY ${numSlides} slides.` : "Generate 10-15 highly polished slides for a complete storyline."}
      4. ICONS: Use Lucide icon names appropriately to enhance points (e.g., 'Target', 'TrendingUp', 'Zap').
      5. SPEAKER NOTES: Provide a detailed, charismatic script for the presenter.
    `;
  
    const fullPrompt = fileContent 
      ? `Based on the following document content, generate a presentation about: ${prompt}\n\nDocument Content:\n${fileContent}`
      : `Generate a presentation about: ${prompt}`;
  
    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            theme: { type: Type.STRING, enum: ['modern', 'minimal', 'bold', 'corporate', 'studio-premium'] },
            styleName: { type: Type.STRING, description: "The name of the design style used" },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  content: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array of short concise bullet points. Max 6 items. Keep strings short."
                  },
                  layout: { type: Type.STRING, enum: ['title', 'content', 'split', 'grid', 'quote', 'image', 'steps', 'timeline', 'chart', 'map', 'feature'] },
                  icon: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  accentColor: { type: Type.STRING, description: "A hex color code that fits the theme (prefer Studio Red #FF2B2B)" },
                  speakerNotes: { type: Type.STRING, description: "Detailed notes for the presenter" },
                  data: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        value: { type: Type.NUMBER }
                      }
                    }
                  }
                },
                required: ["title", "content", "layout"]
              }
            }
          },
          required: ["title", "slides", "theme"]
        }
      }
    });
  
    if (!response.text) {
      throw new Error("Failed to generate presentation content.");
    }
  
    try {
      // Find the first '{' and last '}' to handle potential preamble/postamble
      const text = response.text;
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("Invalid format: JSON not found");
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr) as PresentationData;
    } catch (parseError) {
      console.error("JSON Parse Error. Data:", response.text);
      throw new Error("Failed to parse presentation structure. The content may be too complex. Try reducing the slide count.");
    }
  });
}

export interface StoryboardScene {
  id: string;
  number: number;
  timecode: string;
  narrative: string;
  prompt: string;
  imageUrl?: string;
  isApproved: boolean;
  approvedContentHash?: string;
}

export interface StoryboardData {
  id?: string;
  title: string;
  scenes: StoryboardScene[];
  characterDescription?: string;
  characterImageUrl?: string;
  targetAudience?: string;
  aspectRatio: "16:9" | "1:1" | "9:16";
  timestamp?: Date;
}

export async function generateCharacterDescription(prompt: string): Promise<{ name: string, description: string }> {
  return withRetry(async () => {
    const ai = getGeminiAI();
    const model = "gemini-3.8-flash";

    const systemInstruction = `
      You are a character designer for high-end commercials.
      The user wants a consistent main character for their video storyboards.
      Create a detailed visual description of a character including age, gender, ethnicity, clothing, distinctive features, and personality.
      The description must be highly consistent and provide enough detail for an image generator.
      Return as a JSON object with 'name' and 'description'.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: `Create a character for: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "description"]
        }
      }
    });

    if (!response.text) throw new Error("Failed to generate character description.");
    return JSON.parse(response.text);
  });
}

export async function generateStoryboard(
  prompt: string, 
  charDesc?: string, 
  targetAudience?: string,
  aspectRatio: "16:9" | "1:1" | "9:16" = "16:9",
  brandIdentity?: BrandIdentity
): Promise<StoryboardData> {
  return withRetry(async () => {
    const ai = getGeminiAI();
    const model = "gemini-3.8-flash";

    const systemInstruction = `
      You are an expert storyboard artist and commercial video director.
      User request: ${prompt}
      ${charDesc ? `Main Character: ${charDesc}` : ""}
      ${targetAudience ? `Target Audience: ${targetAudience}` : ""}
      
      BRAND CONTEXT:
      - Tone of Voice: ${brandIdentity?.toneOfVoice || "Professional & Analytical"}
      - Colors: Primary ${brandIdentity?.primaryColor || "Red"}, Accent ${brandIdentity?.accentColor || "Red"}
      ${brandIdentity?.guidelines ? `- Brand Guidelines: ${brandIdentity.guidelines}` : ""}
      
      PERSONAL AI CONTEXT:
      ${brandIdentity?.userContext ? `- User Profile/Preferences: ${brandIdentity.userContext}` : ""}

      Generate a scene-by-scene commercial/video script.
      EVERY scene must be exactly 8 seconds long.
      
      For each scene, provide:
      - Scene # & Timecode (e.g., Scene 1: 00:00 - 00:08, Scene 2: 00:08 - 00:16)
      - Narrative Script: The actual dialogue or voiceover (VO) for that segment.
      - Veo 3.1 Technical Prompt: A highly detailed visual prompt following this formula:
        [Shot Composition] + [Subject Details/Action] + [Action] + [Setting/Environment] + [Aesthetics/Mood] + [Audio Cues]
      
      Cinematography & Prompt Engineering Rules for Veo 3.1:
      - MANDATORY VISUAL CONSTRAINT: Always append "NO LOGOS, NO TEXT, NO WATERMARKS ON SCREEN" to the visualization part of the prompt.
      - Component Integration for each Scene's Technical Prompt:
        1. Context: Incorporate the overall commercial theme: "${prompt}".
        2. Character: Use the full physical visualization: "${charDesc || "the main character"}".
        3. Narrative/VO: Include the narrative script clearly marked as VO.
        4. Audio: Add specific voice direction tailored for ${targetAudience || "the target audience"}.
      
      Technical Prompt Formula to follow: 
      "Visual: [Cinematic Action] featuring [Character Description]. Narrative Context: [Context]. VO: [Narrative Text]. Voice Direction: [Tone/Accent]. NO TEXT ON SCREEN."

      Return the data as a JSON object with a 'title' and an array of 'scenes'.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: `Create a storyboard for: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER },
                  timecode: { type: Type.STRING },
                  narrative: { type: Type.STRING },
                  prompt: { type: Type.STRING }
                },
                required: ["number", "timecode", "narrative", "prompt"]
              }
            }
          },
          required: ["title", "scenes"]
        }
      }
    });

    if (!response.text) throw new Error("Failed to generate storyboard content.");
    
    // We need to add IDs and initial approved status
    let data;
    try {
      let cleanText = response.text.trim();
      if (cleanText.startsWith('```')) {
        const lines = cleanText.split('\n');
        cleanText = lines.slice(1, -1).join('\n');
      }
      data = JSON.parse(cleanText);
    } catch (e) {
      console.error("JSON parse failed, falling back to substring extraction", e);
      const text = response.text;
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("Invalid format: JSON not found");
      const jsonStr = text.substring(start, end + 1);
      data = JSON.parse(jsonStr);
    }

    data.scenes = data.scenes.map((s: any) => ({
      ...s,
      id: Math.random().toString(36).substring(7),
      isApproved: false
    }));
    data.aspectRatio = aspectRatio;
    
    return data;
  });
}

export async function refineStoryboard(
  currentStoryboard: StoryboardData,
  userFeedback: string,
  targetAudience?: string,
  brandIdentity?: BrandIdentity
): Promise<StoryboardData> {
  return withRetry(async () => {
    const ai = getGeminiAI();
    const model = "gemini-3.8-flash";

    const systemInstruction = `
      You are an expert storyboard artist and commercial video director.
      User wants to refine their current storyboard based on specific feedback.
      
      CURRENT STORYBOARD:
      ${JSON.stringify(currentStoryboard, null, 2)}
      
      USER FEEDBACK:
      ${userFeedback}
      
      ${targetAudience ? `Target Audience: ${targetAudience}` : ""}
      
      BRAND CONTEXT:
      - Tone of Voice: ${brandIdentity?.toneOfVoice || "Professional & Analytical"}
      - Colors: Primary ${brandIdentity?.primaryColor || "Red"}, Accent ${brandIdentity?.accentColor || "Red"}
      ${brandIdentity?.guidelines ? `- Brand Guidelines: ${brandIdentity.guidelines}` : ""}
      
      PERSONAL AI CONTEXT:
      ${brandIdentity?.userContext ? `- User Profile/Preferences: ${brandIdentity.userContext}` : ""}

      Adjust, expand, or reduce the storyboard based strictly on the USER FEEDBACK.
      EVERY scene must still be exactly 8 seconds long.
      
      For each scene, provide:
      - Scene # & Timecode (e.g., Scene 1: 00:00 - 00:08, Scene 2: 00:08 - 00:16)
      - Narrative Script: The actual dialogue or voiceover (VO) for that segment.
      - Veo 3.1 Technical Prompt: A highly detailed visual prompt.
      
      Cinematography & Prompt Engineering Rules for Veo 3.1:
      - MANDATORY VISUAL CONSTRAINT: Always append "NO LOGOS, NO TEXT, NO WATERMARKS ON SCREEN" to the visualization part of the prompt.
      
      Technical Prompt Formula to follow: 
      "Visual: [Cinematic Action] featuring [Character Description]. Narrative Context: [Context]. VO: [Narrative Text]. Voice Direction: [Tone/Accent]. NO TEXT ON SCREEN."

      Return the data as a JSON object with a 'title' and an array of 'scenes'.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: "Refine the storyboard.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER },
                  timecode: { type: Type.STRING },
                  narrative: { type: Type.STRING },
                  prompt: { type: Type.STRING }
                },
                required: ["number", "timecode", "narrative", "prompt"]
              }
            }
          },
          required: ["title", "scenes"]
        }
      }
    });

    if (!response.text) throw new Error("Failed to refine storyboard content.");
    
    let data;
    try {
      let cleanText = response.text.trim();
      if (cleanText.startsWith('```')) {
        const lines = cleanText.split('\n');
        cleanText = lines.slice(1, -1).join('\n');
      }
      data = JSON.parse(cleanText);
    } catch (e) {
      console.error("JSON parse failed, falling back to substring extraction", e);
      const text = response.text;
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("Invalid format: JSON not found");
      const jsonStr = text.substring(start, end + 1);
      data = JSON.parse(jsonStr);
    }

    data.scenes = data.scenes.map((s: any) => ({
      ...s,
      id: Math.random().toString(36).substring(7),
      isApproved: false
    }));
    data.aspectRatio = currentStoryboard.aspectRatio || "16:9";
    
    return data;
  });
}


export async function generateSlideImage(prompt: string, aspectRatio: string = "1:1"): Promise<string> {
  return withRetry(async () => {
    const ai = getGeminiAI();
    const model = "gemini-3.1-flash-image";
    
    // Add specific focus to the prompt to prevent generic hallucinations
    const enhancedPrompt = `${prompt}. Professional studio photography, high resolution, highly detailed, realistic textures. IMPORTANT BRANDING GUIDELINES: The background and context MUST be relevant to the specific location if requested (e.g., if Peru, the background must look like Peru). The primary brand color is red, not yellow; prioritize red elements. If a logo is requested, ONLY use the brand logo set in Settings (or a plain-text brand name). Never use any other logos or names. If the user explicitly states NO LOGOS, do not include any text or logos at all. Make sure the context inherently matches the configured brand identity.`;
    
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
        config: {
          imageConfig: {
            aspectRatio: (aspectRatio === "9:16" ? "9:16" : aspectRatio === "16:9" ? "16:9" : "1:1")
          }
        } as any
      });
  
      if (result.candidates?.[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (error: any) {
      const isQuotaError = error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota") || error?.status === 429 || error?.message?.includes("429");
      const isCreditsDepleted = !isQuotaError && (error?.message?.includes('prepayment credits') || error?.message?.includes('insufficient_credits'));
      console.warn(isCreditsDepleted ? "AI Prepayment credits depleted. Falling back to placeholder." : (isQuotaError ? "AI Image Quota exceeded. Falling back to placeholder." : "Image generation failed. Falling back to placeholder."), error);
      
      if (isQuotaError || isCreditsDepleted) throw error; // Let withRetry handle it

      // Provide a beautiful placeholder for non-quota errors
      const seed = Math.random().toString(36).substring(7);
      return `https://picsum.photos/seed/${seed}/1280/720`;
    }
    
    throw new Error("No image generated");
  });
}

export async function detectLanguage(text: string): Promise<string> {
  return withRetry(async () => {
    const ai = getGeminiAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Identify the primary language of the following text. Respond ONLY with the human-readable name of the language (e.g., "English", "French", "Spanish", "Swahili", etc.). Do not return anything else, no markdown, no quotes.\n\nText:\n${text}`,
    });
    return (response.text || 'Unknown Language').trim();
  });
}

