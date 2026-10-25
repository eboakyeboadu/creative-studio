
import { getGeminiAI } from "../lib/gemini";

export type TTSEngine = 'studio' | 'webspeech' | 'elevenlabs';

export interface ElevenLabsSettings {
  apiKey: string;
  modelId: string;
}

export async function generateStudioSpeech(text: string, voiceName: string): Promise<string> {
  if (!text || !text.trim()) {
    throw new Error("Please enter text to generate speech.");
  }

  // Primary attempt: Call server-side endpoint
  try {
    const res = await fetch("/api/tts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), voiceName }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audio) return data.audio;
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        console.warn("Server TTS route error:", errData.error);
        throw new Error(errData.error);
      }
    }
  } catch (err: any) {
    console.warn("Server TTS route failed or unavailable, attempting client fallback...", err);
    if (err.message && !err.message.includes("fetch")) {
      throw err;
    }
  }

  // Client-side fallback using gemini-3.1-flash-tts-preview exclusively
  const ai = getGeminiAI();
  const validVoices: Record<string, string> = {
    'Kore': 'Kore',
    'Aoede': 'Aoede',
    'Zephyr': 'Zephyr',
    'Ursa': 'Ursa',
    'Callisto': 'Aoede',
    'Leda': 'Aoede',
    'Charon': 'Charon',
    'Fenrir': 'Fenrir',
    'Hyperion': 'Charon',
    'Atlas': 'Charon',
    'Orpheus': 'Fenrir',
    'Puck': 'Puck'
  };
  const mappedVoice = validVoices[voiceName] || 'Kore';

  const extractAudio = (res: any): string | null => {
    if (!res?.candidates) return null;
    for (const candidate of res.candidates) {
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part?.inlineData?.data) {
            return part.inlineData.data;
          }
        }
      }
    }
    return null;
  };

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text.trim() }] }],
      config: {
        responseModalities: ["AUDIO"] as any,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: mappedVoice },
          },
        },
      },
    });
  } catch (err: any) {
    console.warn(`Primary client voice ${mappedVoice} failed, trying Aoede fallback...`, err);
    response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text.trim() }] }],
      config: {
        responseModalities: ["AUDIO"] as any,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Aoede" },
          },
        },
      },
    });
  }

  const base64Audio = extractAudio(response);
  if (base64Audio) return base64Audio;

  throw new Error("Unable to generate audio. Please try again or select a different voice.");
}

export async function getElevenLabsVoices(apiKey: string): Promise<any[]> {
  try {
    const response = await fetch('/api/elevenlabs/voices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apiKey })
    });
    if (response.ok) {
      const data = await response.json();
      return data.voices || [];
    }
  } catch (error) {
    console.error("Error fetching voices with API key", error);
  }

  // Fallback to fetching public voices without API key
  try {
    const fallbackResponse = await fetch('/api/elevenlabs/voices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      return data.voices || [];
    } else {
      const errorText = await fallbackResponse.text();
      throw new Error(`Failed to fetch public voices: ${fallbackResponse.status} ${errorText}`);
    }
  } catch (error) {
    throw error;
  }
}

export async function getElevenLabsModels(apiKey: string): Promise<any[]> {
  try {
    const response = await fetch('/api/elevenlabs/models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apiKey })
    });
    if (response.ok) {
      const data = await response.json();
      return data || [];
    }
  } catch (error) {
    console.error("Error fetching models with API key", error);
  }

  // Fallback to commonly available models
  return [
    { model_id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2', can_do_text_to_speech: true },
    { model_id: 'eleven_turbo_v2_5', name: 'Eleven Turbo v2.5', can_do_text_to_speech: true },
    { model_id: 'eleven_turbo_v2', name: 'Eleven Turbo v2', can_do_text_to_speech: true },
    { model_id: 'eleven_monolingual_v1', name: 'Eleven English v1', can_do_text_to_speech: true },
  ];
}
export async function validateElevenLabsApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('/api/elevenlabs/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apiKey })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function generateElevenLabsSpeech(text: string, voiceId: string, settings: ElevenLabsSettings): Promise<ArrayBuffer> {
  const response = await fetch('/api/elevenlabs/synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: settings.apiKey,
      voiceId,
      text,
      model_id: settings.modelId || "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      }
    }),
  });

  if (!response.ok) {
    let errorMessage = "ElevenLabs synthesis failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail?.message || errorData.error || errorMessage;
    } catch (e) {
      errorMessage = await response.text() || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.arrayBuffer();
}

