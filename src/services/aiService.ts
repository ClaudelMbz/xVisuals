import { ai } from "../lib/gemini";

export interface ImagePrompt {
  id: string;
  prompt: string;
  description: string;
  startTime: number;
  endTime: number;
  transcriptionSegment: string;
}

export const aiService = {
  async transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: "Please transcribe this audio file accurately. If it is a biblical text or story, ensure the transcription reflects the solemn and narrative tone.",
            },
          ],
        },
      ],
    });

    return response.text || "Transcription failed.";
  },

  async generateImagePrompts(text: string): Promise<ImagePrompt[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Based on the following text, segment the narrative chronologically and generate 10-15 detailed, artistic image prompts for an AI image generator (like Midjourney or DALL-E) with logical start and end timestamps in seconds.
          
          The narrative audio is approximately 1 minute and 30 seconds (90 seconds) long. You must distribute the 10-15 scene prompts sequentially from 0 seconds to approximately 90 seconds.
          - The first prompt must start at 0 seconds.
          - Each prompt must have non-overlapping, continuous, chronological start and end times in seconds (e.g., Prompt 1: 0 to 8s, Prompt 2: 8 to 15s).
          - If the text is biblical, the prompts should reflect a classic, cinematic, or artistic style (e.g., 'oil painting', 'cinematic lighting', 'renaissance style').

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
      return parsed;
    } catch (e) {
      console.error("Failed to parse image prompts", e);
      return [];
    }
  },
};
