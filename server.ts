import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limit to allow larger audio files (base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined on the server.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Helper to check if an error is transient (and thus should be retried)
function isTransientError(error: any): boolean {
  try {
    const message = error.message || "";
    const stack = error.stack || "";
    const status = error.status || error.statusCode || error.code || "";
    const nestedCode = error.error?.code || "";
    const nestedStatus = error.error?.status || "";
    
    const errString = `${message} ${stack} ${status} ${nestedCode} ${nestedStatus} ${JSON.stringify(error)}`.toUpperCase();

    // If it's a known non-transient auth/key error, do NOT retry
    if (
      errString.includes("API_KEY") || 
      errString.includes("API KEY") || 
      errString.includes("UNAUTHORIZED") || 
      errString.includes("FORBIDDEN") || 
      errString.includes("401") || 
      errString.includes("403")
    ) {
      return false;
    }

    // If it's a bad request or model not found, do NOT retry
    if (
      errString.includes("400") || 
      errString.includes("INVALID_ARGUMENT") || 
      errString.includes("INVALID ARGUMENT") || 
      errString.includes("PAYLOAD_TOO_LARGE") || 
      errString.includes("NOT_FOUND") || 
      errString.includes("404")
    ) {
      return false;
    }

    // For everything else (503, 504, 500, 429, UNAVAILABLE, overload, timeout, rate limits), it is transient and we should retry/fallback
    return true;
  } catch (e) {
    // In case stringifying fails, default to true (safe fallback)
    return true;
  }
}

// Robust fallback and retry helper for Gemini API content generation
async function generateContentWithFallback(client: GoogleGenAI, options: any): Promise<any> {
  const primaryModel = options.model || "gemini-3.5-flash";
  
  // Detect if the request contains multimodal input (inline audio/image data)
  let hasMultimodal = false;
  if (options.contents) {
    const contents = Array.isArray(options.contents) ? options.contents : [options.contents];
    for (const content of contents) {
      if (content.parts) {
        const parts = Array.isArray(content.parts) ? content.parts : [content.parts];
        for (const part of parts) {
          if (part.inlineData || part.fileData) {
            hasMultimodal = true;
            break;
          }
        }
      }
      if (hasMultimodal) break;
    }
  }

  // Determine fallback models in priority order
  const fallbackModels: string[] = [];
  if (hasMultimodal) {
    // Only flash-level models that support multimodal input (like audio/images)
    if (primaryModel === "gemini-3.5-flash") {
      fallbackModels.push("gemini-flash-latest");
    } else {
      fallbackModels.push("gemini-3.5-flash");
    }
  } else {
    // Text-only fallbacks
    if (primaryModel === "gemini-3.5-flash") {
      fallbackModels.push("gemini-flash-latest", "gemini-3.1-flash-lite");
    } else if (primaryModel === "gemini-flash-latest") {
      fallbackModels.push("gemini-3.5-flash", "gemini-3.1-flash-lite");
    } else {
      fallbackModels.push("gemini-3.5-flash", "gemini-flash-latest");
    }
  }

  const allModelsToTry = [primaryModel, ...fallbackModels];
  const maxRetriesPerModel = 2;

  async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  let lastError: any = null;

  for (const modelName of allModelsToTry) {
    let delayMs = 1000;
    console.log(`[Gemini Engine] Attempting model: ${modelName} (Multimodal: ${hasMultimodal})`);

    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`[Gemini Engine] [Model: ${modelName}] [Attempt ${attempt}/${maxRetriesPerModel}] Calling generateContent...`);
        const callOptions = { ...options, model: modelName };
        const result = await client.models.generateContent(callOptions);
        console.log(`[Gemini Engine] [Model: ${modelName}] Success!`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Gemini Engine] [Model: ${modelName}] [Attempt ${attempt}/${maxRetriesPerModel}] Failed.`, error);

        const transient = isTransientError(error);
        if (transient && attempt < maxRetriesPerModel) {
          console.log(`[Gemini Engine] Error is transient. Waiting ${delayMs}ms before retry...`);
          await sleep(delayMs);
          delayMs *= 2; // exponential backoff
          continue;
        }
        
        // If not transient, or we ran out of attempts for this model, move to next model
        break;
      }
    }
  }

  // If we exhausted all models and attempts, throw the last error
  console.error("[Gemini Engine] All models and attempts exhausted. Throwing final error.");
  throw lastError || new Error("All Gemini models failed to generate content.");
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasApiKey: !!process.env.GEMINI_API_KEY });
});

app.post("/api/transcribe", async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "Missing base64Data in request body." });
    }

    const client = getAIClient();
    const response = await generateContentWithFallback(client, {
      model: "gemini-3.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || "audio/mp3",
              },
            },
            {
              text: "Please transcribe this audio file accurately. If it is a biblical text or story, ensure the transcription reflects the solemn and narrative tone.",
            },
          ],
        },
      ],
    });

    const text = response.text || "Transcription failed.";
    res.json({ text });
  } catch (error: any) {
    console.error("Error transcribing audio on server:", error);
    res.status(500).json({ error: error.message || "Failed to transcribe audio." });
  }
});

app.post("/api/generatePrompts", async (req, res) => {
  try {
    const { text, totalSeconds } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text in request body." });
    }

    const duration = totalSeconds || 90;
    const client = getAIClient();
    const response = await generateContentWithFallback(client, {
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Based on the following text, segment the narrative chronologically and generate a MAXIMUM of 11 detailed, highly descriptive, artistic image prompts for an AI image generator (like Midjourney or DALL-E) with logical start and end timestamps in seconds.
          
          The narrative audio is approximately ${duration} seconds long. You must distribute up to 11 scene prompts sequentially from 0 seconds to approximately ${duration} seconds.
          - The first prompt must start at 0 seconds.
          - Each prompt must have non-overlapping, continuous, chronological start and end times in seconds (e.g., Prompt 1: 0 to 8s, Prompt 2: 8 to 15s).
          - Be extremely careful to match the timestamps to the actual content described. For example, if at second 26 the text talks about a specific subject, the prompt corresponding to that timestamp must capture that exact subject.
          - Keep the style descriptions cinematic, high-fidelity, or artistic (e.g., 'photorealistic cinematic lighting, 8k, highly detailed, dramatic atmosphere').

          Text: "${text}"

          Return the result as a JSON array where each object has:
          - "id": string
          - "prompt": the actual prompt for the AI image generator
          - "description": a short explanation of the visual concept
          - "startTime": integer (start second of the matching audio portion)
          - "endTime": integer (end second of the matching audio portion)
          - "transcriptionSegment": the exact spoken phrases/words from the original text corresponding precisely to this timestamp interval`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              prompt: { type: "STRING" },
              description: { type: "STRING" },
              startTime: { type: "INTEGER" },
              endTime: { type: "INTEGER" },
              transcriptionSegment: { type: "STRING" },
            },
            required: ["id", "prompt", "description", "startTime", "endTime", "transcriptionSegment"],
          },
        },
      },
    });

    try {
      const parsed = JSON.parse(response.text || "[]");
      res.json({ prompts: parsed });
    } catch (e) {
      console.error("Failed to parse image prompts response:", response.text);
      res.status(500).json({ error: "Failed to parse image prompts from Gemini response." });
    }
  } catch (error: any) {
    console.error("Error generating image prompts on server:", error);
    res.status(500).json({ error: error.message || "Failed to generate image prompts." });
  }
});

app.post("/api/generateImage", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt in request body." });
    }

    const client = getAIClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          text: `Create a highly artistic, cinematic visualization representing the following description: ${prompt}`,
        },
      ],
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          base64Image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("No image data returned from Gemini model.");
    }

    res.json({ imageUrl: base64Image });
  } catch (error: any) {
    console.error("Error generating image on server:", error);
    res.status(500).json({ error: error.message || "Failed to generate image." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

