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
    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base64Data, mimeType }),
      });

      if (!response.ok) {
        let errorMsg = `Server error ${response.status}`;
        try {
          const err = await response.json();
          errorMsg = err.error || errorMsg;
        } catch (_) {
          // Response is not JSON
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      return data.text || "Transcription failed.";
    } catch (error: any) {
      console.error("[aiService] transcribeAudio failed:", error);
      throw new Error(error.message || "Failed to transcribe audio.");
    }
  },

  async generateImagePrompts(text: string, totalSeconds: number = 90): Promise<ImagePrompt[]> {
    try {
      const response = await fetch("/api/generatePrompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, totalSeconds }),
      });

      if (!response.ok) {
        let errorMsg = `Server error ${response.status}`;
        try {
          const err = await response.json();
          errorMsg = err.error || errorMsg;
        } catch (_) {
          // Response is not JSON
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      return data.prompts || [];
    } catch (error: any) {
      console.error("[aiService] generateImagePrompts failed:", error);
      throw new Error(error.message || "Failed to generate image prompts.");
    }
  },

  async generateImage(prompt: string): Promise<string> {
    try {
      const response = await fetch("/api/generateImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        let errorMsg = `Server error ${response.status}`;
        try {
          const err = await response.json();
          errorMsg = err.error || errorMsg;
        } catch (_) {
          // Response is not JSON
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data.imageUrl) {
        throw new Error("No image URL returned from server.");
      }
      return data.imageUrl;
    } catch (error: any) {
      console.error("[aiService] generateImage failed:", error);
      throw new Error(error.message || "Failed to generate image.");
    }
  }
};
