import { ai } from "../lib/gemini";

export interface ImagePrompt {
  id: string;
  prompt: string;
  description: string;
}

export const aiService = {
  async transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Based on the following text, generate 10-15 detailed, artistic image prompts for an AI image generator (like Midjourney or DALL-E). 
          The prompts should capture the mood, characters, and settings of the story. 
          If the text is biblical, the prompts should reflect a classic, cinematic, or artistic style (e.g., 'oil painting', 'cinematic lighting', 'renaissance style').

          Text: "${text}"

          Return the result as a JSON array of objects with "id", "prompt" (the actual prompt for the AI), and "description" (a short explanation of why this prompt was chosen).`,
        },
      ],
      config: {
        responseMimeType: "application/json",
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
