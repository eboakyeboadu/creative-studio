import { GoogleGenAI, ThinkingLevel, Chat } from "@google/genai";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { toast } from "sonner";

let ai: GoogleGenAI | null = null;

export const NO_KEY_MESSAGE = "AI features are turned off in this demo because no Gemini API key is configured.";
let lastNoKeyToast = 0;

// Stand-in client used when no API key is configured. The app loads normally and
// each AI call fails with a clear message instead of crashing the whole page.
function createUnavailableClient(): GoogleGenAI {
  const fail = async (): Promise<never> => {
    const now = Date.now();
    if (now - lastNoKeyToast > 4000) {
      lastNoKeyToast = now;
      toast.info(NO_KEY_MESSAGE, { description: 'Set GEMINI_API_KEY to enable them.' });
    }
    throw new Error(NO_KEY_MESSAGE);
  };
  const unavailable = () => new Proxy({}, { get: () => fail });
  return {
    models: unavailable(),
    live: unavailable(),
    files: unavailable(),
    chats: {
      create: () => ({ sendMessage: fail, sendMessageStream: fail, getHistory: () => [] }),
    },
  } as unknown as GoogleGenAI;
}

export function getGeminiAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY || (window as any).GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set: AI calls are disabled.");
      return createUnavailableClient();
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const ENHANCEMENT_SYSTEM_INSTRUCTION = `
You are an expert Prompt Engineer. Your goal is to rewrite user inputs into high-quality, professional AI prompts for marketing managers.

CONTEXT:
This tool is used by marketing managers and analysts. DAC stands for Driver Acquisition Cost (the cost to acquire a new partner driver). 

C.L.E.A.R. Framework Guidelines:
1. Concise: Use clear, simple language. Prioritize important info. Remove irrelevant words. Skip politeness (no "please", "thank you").
2. Logical: Coherent and follows a logical order.
3. Explicit: Provide specific instructions about output format, content, and scope.
4. Adaptive: Tailored specifically to the context provided in the input.
5. Reflective: Accuracy and depth check. No duplicate information. Aim for a 10/10 quality rating.

Best Practices to include:
- Add a Persona: Assign a relevant expert role (e.g., "You are a Senior Marketing Strategist").
- Add Context: Explain why the task is being done and who the audience is.
- Define Output Format: Specify if it should be an email, code, table, report, etc.
- Include Task-Specific References: If the input mentions documents or specific metrics, ensure the prompt instructs the AI on how to handle them.

DIFFERENTIATION RULE:
If the user's input looks like it is intended primarily for TRANSLATING verbatim (like a simple static sentence or a translation request with no instructions), do NOT rewrite it into a complex prompt. Instead, simply clean it up and ensure it is grammatically correct.
However, if it contains instructions, goals, or tasks (most cases in this app), apply the full C.L.E.A.R. framework.

Output:
Provide ONLY the enhanced prompt. Do not include your reasoning or any meta-comments.
`;

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 1000,
  factor = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = String(error?.message || error).toLowerCase();
    
    // Check for Location format error
    if (errorStr.includes('user location is not supported') || (error?.status === 400 && errorStr.includes('location'))) {
      toast("AI Region Lock", {
        description: "AI generation is currently unavailable in your region. Please continue using other parts of the platform or consider connecting to a VPN.",
        icon: "🌍",
        duration: 8000,
        className: "bg-background/90 backdrop-blur-xl border border-red-500/30 shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)] !rounded-2xl p-4 gap-3",
      });
      throw new Error("AI generation is currently unavailable in your region.");
    }
    
    const isRateLimit = (
      error?.status === 429 || 
      error?.status === 503 ||
      errorStr.includes('resource_exhausted') || 
      errorStr.includes('429') ||
      errorStr.includes('quota') ||
      errorStr.includes('rate limit') ||
      errorStr.includes('rate-limit') ||
      errorStr.includes('high demand') ||
      errorStr.includes('503') ||
      errorStr.includes('service unavailable') ||
      errorStr.includes('deadline exceeded')
    );
    
    const isCreditsDepleted = !isRateLimit && (
      errorStr.includes('prepayment credits') || 
      errorStr.includes('insufficient_credits') ||
      errorStr.includes('credit balance')
    );
    
    if (retries > 0 && isRateLimit) {
      const waitTime = delay;
      console.warn(`Model busy or rate limit hit. Retrying in ${waitTime}ms... (${retries} retries left)`);
      if (error?.message?.includes('high demand') || error?.status === 503) {
        toast.info("AI is currently under high demand. Automatically retrying...", { duration: 3000, id: 'high-demand-retry' });
      }
      await sleep(delay);
      return withRetry(fn, retries - 1, delay * factor);
    }
    throw error;
  }
}

export async function generateContentWithRetry(
  prompt: string, 
  systemInstruction?: string, 
  model: string = "gemini-3.8-flash",
  temperature: number = 0.7
) {
  return withRetry(async () => {
    const ai = getGeminiAI();
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      });
      return response;
    } catch (err: any) {
      // Fallback if model is unavailable
      if (model !== "gemini-3.8-flash" && model !== "gemini-2.5-flash") {
        console.warn(`Model ${model} failed, falling back to gemini-3.8-flash:`, err?.message || err);
        return await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction,
            temperature,
          },
        });
      }
      throw err;
    }
  });
}

/**
 * Generates content using streaming for better perceived performance.
 */
export async function streamContentWithRetry(
  prompt: string,
  onChunk: (text: string) => void,
  systemInstruction?: string,
  model: string = "gemini-3.8-flash",
  temperature: number = 0.7
) {
  return withRetry(async () => {
    const ai = getGeminiAI();
    let stream;
    try {
      stream = await ai.models.generateContentStream({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      });
    } catch (err: any) {
      if (model !== "gemini-3.8-flash" && model !== "gemini-2.5-flash") {
        console.warn(`Streaming with model ${model} failed, falling back to gemini-3.8-flash:`, err?.message || err);
        stream = await ai.models.generateContentStream({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction,
            temperature,
          },
        });
      } else {
        throw err;
      }
    }

    let fullText = "";
    for await (const chunk of stream) {
      const chunkText = chunk.text;
      fullText += chunkText;
      onChunk(fullText);
    }
    return fullText;
  });
}

export async function enhanceDictation(input: string) {
  if (!input || input.trim().length < 2) return input;

  try {
    const result = await withRetry(async () => {
      const ai = getGeminiAI();
      console.log(`Enhancing dictation...`);
      
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: input,
        config: {
          systemInstruction: "You are an intelligent transcription assistant and editor. The user provides a raw and potentially messy voice transcription. Your job is to clean it up, fixing all grammatical errors, logical gaps, and awkward phrasing caused by spoken language. Restructure it so it makes perfect sense while retaining the exact original meaning and intent. Output ONLY the corrected text, with no introductory or conversational text.",
          temperature: 0.2,
        }
      });

      return response.text;
    });

    return result || input;
  } catch (error) {
    console.error("Error enhancing dictation:", error);
    return input; // fallback to original input
  }
}

export async function enhancePrompt(input: string, context?: string) {
  if (!input || input.trim().length < 3) return input;

  try {
    const result = await withRetry(async () => {
      const ai = getGeminiAI();
      console.log(`Enhancing prompt (${context || 'general'})...`);
      
      let contextInstruction = "";
      if (context === "image_generation") {
        contextInstruction = "This prompt is specifically for generating a visual image. Focus on adding descriptive visual details like lighting, composition, style (e.g., photorealistic, 3D, vector), color palette, and mood.";
      } else if (context === "presentation") {
        contextInstruction = "This prompt is for generating a presentation. Focus on structure, key themes, target audience, and the professional or persuasive tone required for a slide deck.";
      } else if (context === "data_analysis") {
          contextInstruction = "This prompt is for data analysis. Focus on specifying the analytical methods, the expected output format (e.g., tables, charts, summaries), and the key metrics or hypotheses to explore.";
      }

      const finalSystemInstruction = `${ENHANCEMENT_SYSTEM_INSTRUCTION}
      
      ${contextInstruction ? `ADDITIONAL CONTEXT REQUIREMENT:\n${contextInstruction}` : ""}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        config: {
          systemInstruction: finalSystemInstruction,
          temperature: 0.7,
        },
        contents: input,
      });

      if (!response || !response.candidates || response.candidates.length === 0) {
        throw new Error("No enhancement results returned.");
      }

      return response.text || input;
    });
    
    return (result || input).trim();
  } catch (error) {
    console.error("Failed to enhance prompt after all retries:", error);
    throw error;
  }
}

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim();
  
  // Try server endpoint first if available
  try {
    const res = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64, mimeType: cleanMimeType }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text) return data.text;
    }
  } catch (serverErr) {
    console.warn("Server-side transcription route unavailable, using direct client call:", serverErr);
  }

  return withRetry(async () => {
    const ai = getGeminiAI();
    const modelsToTry = ["gemini-3.5-transcribe", "gemini-3.8-flash", "gemini-2.5-flash"];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    data: audioBase64,
                    mimeType: cleanMimeType
                  }
                },
                {
                  text: "Please transcribe the provided audio accurately. Clean up any stutters, filler words (like 'um', 'uh', 'like'), and grammatical hiccups so it reads beautifully and professionally while retaining the original message and intent. Output ONLY the polished transcription text. Do not add any conversational filler or introductions. If there is no voice, no speech, or only background noise/silence in the audio, you MUST reply with exactly: 'NO_SPEECH_DETECTED'."
                }
              ]
            }
          ]
        });
        if (response?.text) return response.text;
      } catch (err: any) {
        lastError = err;
        console.warn(`Client transcription with ${model} failed, trying next:`, err?.message || err);
      }
    }
    throw lastError || new Error("Failed to transcribe audio.");
  });
}

export function createChatSession(systemInstruction: string = SYSTEM_PROMPT, brandIdentityPrompt?: string, history: any[] = []): Chat {
  const ai = getGeminiAI();
  const finalPrompt = brandIdentityPrompt 
    ? `${systemInstruction}\n\nCRITICAL BRAND IDENTITY MANDATE:\nYou MUST strictly adopt the following brand style and identity for ALL responses. This overrides any default personality traits:\n${brandIdentityPrompt}`
    : systemInstruction;
    
  return ai.chats.create({
    model: "gemini-3.8-flash",
    config: {
      systemInstruction: finalPrompt,
      temperature: 0.2,
    },
    history: history,
  });
}

