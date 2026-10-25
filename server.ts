import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { google } from "googleapis";
import session from "express-session";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the proxy to handle HTTPS and cookies correctly
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());
  
  // session setup for iframe context
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === 'production') {
    console.error("CRITICAL: SESSION_SECRET is not set in production!");
  }

  app.use(session({
    secret: sessionSecret || 'dev-secret-change-me',
    resave: true,
    saveUninitialized: true,
    name: 'studio.sid',
    cookie: {
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Helper to build the correct redirect URI dynamically
  const getRedirectUri = (req: express.Request) => {
    // We force 'https' because Google requires it for all .run.app domains
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `https://${host}/api/auth/google/callback`;
  };

  const getOAuth2Client = (redirectUri: string) => {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Server-side Gemini TTS generation route
  app.post("/api/tts/generate", async (req, res) => {
    try {
      const { text, voiceName } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Please enter text to generate speech." });
      }

      // Map requested voice names to supported Gemini prebuilt voices:
      // Supported: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede', 'Ursa'
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

      const generateSpeechCall = async (voice: string) => {
        return await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: text.trim() }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });
      };

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

      let base64Audio: string | null = null;
      try {
        const response = await generateSpeechCall(mappedVoice);
        base64Audio = extractAudio(response);
      } catch (voiceErr: any) {
        const isRateLimit = voiceErr?.status === 429 || voiceErr?.message?.includes("429") || voiceErr?.message?.includes("RESOURCE_EXHAUSTED") || voiceErr?.message?.includes("quota");
        if (isRateLimit) {
          throw voiceErr; // rethrow to main catch handler
        }
        console.warn(`Primary voice ${mappedVoice} failed, falling back to Aoede...`, voiceErr);
        if (mappedVoice !== "Aoede") {
          const fallbackRes = await generateSpeechCall("Aoede");
          base64Audio = extractAudio(fallbackRes);
        }
      }

      if (!base64Audio && mappedVoice !== "Aoede") {
        try {
          const fallbackRes = await generateSpeechCall("Aoede");
          base64Audio = extractAudio(fallbackRes);
        } catch (fbErr: any) {
          console.warn("Fallback to Aoede also failed:", fbErr);
        }
      }

      if (!base64Audio) {
        return res.status(500).json({ error: "Unable to generate audio for the provided text. Please try again with slightly different text or voice." });
      }

      res.json({ audio: base64Audio });
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota");
      if (isRateLimit) {
        console.warn("Gemini Voice API quota/rate limit reached:", error?.message || error);
        return res.status(429).json({ error: "Gemini Voice API daily preview quota reached. Please switch to the built-in Web Speech engine or try again later." });
      }
      console.error("Error in /api/tts/generate:", error);
      const msg = error?.message || error?.toString() || "Failed to generate speech";
      res.status(500).json({ error: msg });
    }
  });

  // Server-side Audio Transcription route with automatic model fallback
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType, language, promptOverride } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim();
      const langName = language && language !== 'auto' ? language : 'its original spoken language (auto-detect)';
      
      const transcriptionPrompt = promptOverride || `Transcribe the following audio file accurately in ${langName}. Include speaker diarization using the speaker's actual name if detectable from the conversation (e.g. "Pamela [00:00]: text"). If the name is unknown, use "Speaker 1 [00:00]: text". Focus on clarity and correct terminology. IMPORTANT: Provide ONLY plain raw text. Do NOT use any Markdown formatting, asterisks, bold text, or lists.`;

      // Order of models to try: specialized transcription first, then flash models
      const modelsToTry = [
        "gemini-3.5-transcribe",
        "gemini-3.8-flash",
        "gemini-2.5-flash"
      ];

      let lastError: any = null;
      let transcribedText = "";

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      data: audioBase64,
                      mimeType: cleanMimeType
                    }
                  },
                  { text: transcriptionPrompt }
                ]
              }
            ]
          });

          if (response && response.text) {
            transcribedText = response.text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Transcription attempt with model ${modelName} failed:`, err?.message || err);
        }
      }

      if (!transcribedText) {
        throw lastError || new Error("Failed to transcribe audio file.");
      }

      res.json({ text: transcribedText });
    } catch (error: any) {
      console.error("Error in /api/transcribe:", error);
      const isQuota = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota");
      if (isQuota) {
        return res.status(429).json({ error: "Gemini API rate limit reached. Please wait a moment and try again." });
      }
      res.status(500).json({ error: error?.message || "Failed to transcribe audio file." });
    }
  });

  // Server-side Structured Summary Extraction route
  app.post("/api/transcribe/structure", async (req, res) => {
    try {
      const { text, language } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Transcript text is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const langName = language && language !== 'auto' ? language : 'the original language';
      
      const structurePrompt = `Analyze the following transcript and provide a structured summary. 
IMPORTANT: Your entire response (summary, key points, takeaways, and insights) MUST be written in ${langName}.
Transcript: ${text}

Provide the output in JSON format with the following structure:
{
  "summary": "A concise summary of the transcript",
  "keyPoints": ["Point 1", "Point 2"],
  "takeaways": ["Takeaway 1", "Takeaway 2"],
  "insights": ["Insight 1", "Insight 2"]
}`;

      const modelsToTry = ["gemini-3.8-flash", "gemini-2.5-flash"];
      let structuredData: any = null;
      let lastError: any = null;

      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: structurePrompt,
            config: {
              responseMimeType: "application/json",
            }
          });

          let raw = response.text || "{}";
          if (raw.includes("```json")) {
            raw = raw.replace(/```json\n?/, '').replace(/\n?```/, '');
          } else if (raw.includes("```")) {
            raw = raw.replace(/```\n?/, '').replace(/\n?```/, '');
          }
          structuredData = JSON.parse(raw);
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Structure extraction attempt with model ${model} failed:`, err?.message || err);
        }
      }

      if (!structuredData) {
        throw lastError || new Error("Failed to generate structured insights.");
      }

      res.json({ structured: structuredData });
    } catch (error: any) {
      console.error("Error in /api/transcribe/structure:", error);
      res.status(500).json({ error: error?.message || "Failed to process structure." });
    }
  });

  // Google OAuth URL
  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = getRedirectUri(req);
    const oauth2Client = getOAuth2Client(redirectUri);
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ url });
  });

  // Google OAuth Callback
  app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
      const redirectUri = getRedirectUri(req);
      const oauth2Client = getOAuth2Client(redirectUri);
      
      const { tokens } = await oauth2Client.getToken(code as string);
      (req.session as any).tokens = tokens;

      // Explicitly save session before responding (still keep it as fallback)
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }

        res.send(`
          <html>
            <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white;">
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">✅</div>
                <h1 style="color: #8b5cf6; margin-bottom: 10px;">Connection Success!</h1>
                <p style="margin-bottom: 20px;">Your Google Calendar is now linked to Creative Studio.</p>
                <p style="font-size: 0.8rem; opacity: 0.6;">You can close this window now.</p>
                <button onclick="window.close()" style="background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">Close Window</button>
                <script>
                  const tokens = ${JSON.stringify(tokens)};
                  // Send signal and tokens back to the main app
                  if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', tokens: tokens }, window.location.origin);
                    setTimeout(() => window.close(), 1500);
                  } else {
                    setTimeout(() => window.close(), 2000);
                  }
                </script>
              </div>
            </body>
          </html>
        `);
      });
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Check Auth Status
  app.post("/api/auth/google/status", (req, res) => {
    const bodyTokens = req.body.tokens;
    res.json({ connected: !!(bodyTokens || (req.session as any).tokens) });
  });

  // Sync to Google Calendar
  app.post("/api/calendar/sync", async (req, res) => {
    // Priority 1: Tokens in body (stateless fix for iframes)
    // Priority 2: Tokens in session (legacy/backup)
    const tokens = req.body.googleTokens || (req.session as any).tokens;
    
    if (!tokens) {
      console.warn("Sync attempted without tokens. Session ID:", req.sessionID);
      return res.status(401).json({ error: "Not authenticated - please reconnect your Google account" });
    }

    if (!tokens.refresh_token) {
      console.warn("Token does not have a refresh_token.");
    }

    const { events, tasks } = req.body;
    
    try {
      const oauth2Client = getOAuth2Client(getRedirectUri(req));
      oauth2Client.setCredentials(tokens);
      
      let refreshedTokens: any = null;
      // Listen for token refreshes
      oauth2Client.on('tokens', (newTokens) => {
        console.log("Tokens refreshed.");
        refreshedTokens = { ...tokens, ...newTokens };
      });
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Get primary calendar ID
      const calendarId = 'primary';

      const parseDate = (d: any) => {
        const date = new Date(d);
        return isNaN(date.getTime()) ? null : date.toISOString();
      };

      // Combine events and tasks for syncing
      const itemsToSync = [
        ...(events || []).map((e: any) => {
          const start = parseDate(e.start);
          const end = parseDate(e.end || e.start);
          if (!start || !end) return null;
          
          return {
            summary: `[Studio] ${e.title}`,
            description: e.description || '',
            start: { dateTime: start },
            end: { dateTime: end },
          };
        }),
        ...(tasks || []).filter((t: any) => t.dueDate).map((t: any) => {
          const start = parseDate(t.dueDate);
          const end = parseDate(new Date(new Date(t.dueDate).getTime() + 30 * 60000));
          if (!start || !end) return null;

          return {
            summary: `[Studio Task] ${t.title}`,
            description: t.description || '',
            start: { dateTime: start },
            end: { dateTime: end },
          };
        })
      ].filter(Boolean);

      if (itemsToSync.length === 0) {
        return res.json({ success: true, count: 0, message: "No valid items to sync" });
      }

      console.log(`Syncing ${itemsToSync.length} items to Google Calendar for user.`);
      console.log("Items to sync:", JSON.stringify(itemsToSync, null, 2));

      let successCount = 0;
      const errors = [];

      for (const item of itemsToSync) {
        try {
          const response = await calendar.events.insert({
            calendarId,
            requestBody: item as any,
          });
          console.log(`Successfully inserted event: ${item?.summary}. Response status: ${response.status}`);
          successCount++;
        } catch (err: any) {
          const errMsg = err.response?.data?.error?.message || err.message || "Unknown error";
          console.error(`Failed to insert event "${item?.summary}":`, errMsg);
          errors.push(`${item?.summary}: ${errMsg}`);
        }
      }

      if (successCount === 0 && itemsToSync.length > 0) {
        throw new Error(`Failed to sync any items. Last error: ${errors[errors.length - 1]}`);
      }

      res.json({ 
        success: true, 
        count: successCount, 
        total: itemsToSync.length,
        errors: errors.length > 0 ? errors : undefined,
        newTokens: refreshedTokens
      });
    } catch (error: any) {
      console.error("Error syncing with Google Calendar:", error);
      const message = error.response?.data?.error?.message || error.message || "Unknown error";
      res.status(500).json({ 
        error: "Sync failed", 
        details: message,
        connected: false // Hint to client to re-connect if it's an auth error
      });
    }
  });

  // ElevenLabs Proxy to bypass CORS or adblockers
  app.post("/api/elevenlabs/models", async (req, res) => {
    try {
      const { apiKey } = req.body;
      const response = await fetch('https://api.elevenlabs.io/v1/models', {
        headers: apiKey ? { 'xi-api-key': apiKey } : {}
      });
      if (response.ok) {
        res.json(await response.json());
      } else {
        res.status(response.status).send(await response.text());
      }
    } catch (e: any) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/elevenlabs/voices", async (req, res) => {
    try {
      const { apiKey } = req.body;
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: apiKey ? { 'xi-api-key': apiKey } : {}
      });
      if (response.ok) {
        res.json(await response.json());
      } else {
        res.status(response.status).send(await response.text());
      }
    } catch (e: any) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/elevenlabs/user", async (req, res) => {
    try {
      const { apiKey } = req.body;
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': apiKey }
      });
      if (response.ok) {
        res.json({ success: true });
      } else {
        res.status(response.status).send(await response.text());
      }
    } catch (e: any) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/elevenlabs/synthesize", async (req, res) => {
    try {
      const { apiKey, voiceId, text, model_id, voice_settings } = req.body;
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id,
          voice_settings
        })
      });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(buffer);
      } else {
        res.status(response.status).send(await response.text());
      }
    } catch (e: any) {
      res.status(500).json({ error: String(e) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

