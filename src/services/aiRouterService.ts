import { Type } from "@google/genai";
import { getGeminiAI, withRetry } from "../lib/gemini";

export interface CommandResponse {
  action: 'navigate' | 'schedule_event' | 'create_task' | 'start_timer' | 'setup_image_generation' | 'setup_storyboard' | 'setup_marketing_plan' | 'setup_marketing_campaign' | 'translate' | 'unknown';
  view?: string;
  payload?: any;
  message?: string;
}

export async function parseUserCommand(command: string, currentDate: string): Promise<CommandResponse> {
  return withRetry(async () => {
    const ai = getGeminiAI();
    const model = "gemini-3.8-flash";

    const systemInstruction = `
      You are an intelligent global routing assistant for a marketing management platform.
      The user will provide a command in natural language.
      Your job is to parse their intent into a structured action.
      
      The current local date/time is: ${currentDate}.
      
      Available Actions:
      1. 'navigate': Switch to a different view (views: 'home', 'plan', 'analyze', 'campaign', 'presentation', 'settings', 'analytics', 'tasks', 'calendar', 'transcribe', 'translation', 'tts', 'focus', 'ai-studio', 'visualize', 'storyboard', 'image-gen', 'world-clock'). Use this for "convert time", "check time zones", etc. by navigating to 'world-clock'.
      2. 'schedule_event': Add an event to the calendar. Payload needs 'title' (string), 'date' (YYYY-MM-DD), 'startTime' (HH:MM), 'endTime' (HH:MM), 'type' ('meeting' | 'campaign' | 'deadline').
      3. 'create_task': Add a task to the todo list. Payload needs 'title' (string), 'description' (string), 'priority' ('high' | 'medium' | 'low').
      4. 'start_timer': Start a focus timer. Payload needs 'duration' (minutes, number), 'task' (string). Ensure duration is a number.
      5. 'setup_image_generation': The user wants to generate an image. Payload needs 'prompt' (string) which is a refined version of what they asked for.
      6. 'setup_storyboard': The user wants to create a storyboard. Payload needs 'prompt' (string).
      7. 'setup_marketing_plan': The user wants to write or generate a marketing plan. Payload needs 'prompt' (string).
      8. 'setup_marketing_campaign': The user wants to write, generate, or set up a marketing campaign. Payload needs 'prompt' (string).
      9. 'translate': The user wants to translate text, a campaign, or any documents. Payload needs 'prompt' (string).
      
      If the command doesn't match perfectly or is ambiguous, use 'unknown' and provide a helpful message.
      Respond strictly in JSON format matching the schema.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: command,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { 
              type: Type.STRING, 
              enum: ['navigate', 'schedule_event', 'create_task', 'start_timer', 'setup_image_generation', 'setup_storyboard', 'setup_marketing_plan', 'setup_marketing_campaign', 'translate', 'unknown'] 
            },
            view: { type: Type.STRING, description: "Only used if action is navigate" },
            payload: { type: Type.OBJECT, description: "The specific details required for the action" },
            message: { type: Type.STRING, description: "A message explaining what was done or if clarification is needed" }
          },
          required: ["action"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Failed to parse command");
    }

    try {
      return JSON.parse(response.text) as CommandResponse;
    } catch (e) {
      console.error("Failed to parse JSON response:", response.text);
      throw new Error("Invalid response format");
    }
  });
}

