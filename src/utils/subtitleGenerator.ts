import { ImagePrompt } from "../services/aiService";

// Helper to convert seconds to SRT format: HH:MM:SS,mmm
function formatSrtTime(sec: number): string {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

// Helper to convert seconds to LRC format: [mm:ss.xx]
function formatLrcTime(sec: number): string {
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  const hundredths = Math.floor((sec % 1) * 100);
  return `[${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${hundredths.toString().padStart(2, "0")}]`;
}

// Helper to convert seconds to ASS format: H:MM:SS.CC
function formatAssTime(sec: number): string {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = Math.floor(sec % 60);
  const centiseconds = Math.floor((sec % 1) * 100);
  return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

export type SubtitleSource = "transcription" | "prompt" | "description";

export const subtitleGenerator = {
  // Generate SubRip (.srt) subtitles
  generateSRT(prompts: ImagePrompt[], source: SubtitleSource): string {
    let srtText = "";
    prompts.forEach((p, index) => {
      const start = formatSrtTime(p.startTime);
      const end = formatSrtTime(p.endTime);
      
      let text = "";
      if (source === "transcription") {
        text = p.transcriptionSegment || "";
      } else if (source === "prompt") {
        text = p.prompt;
      } else {
        text = p.description;
      }
      
      // Clean text by removing raw newlines
      const cleanText = text.replace(/\r?\n/g, " ").trim();

      srtText += `${index + 1}\n`;
      srtText += `${start} --> ${end}\n`;
      srtText += `${cleanText}\n\n`;
    });
    return srtText;
  },

  // Generate Lyrics (.lrc) subtitles
  generateLRC(prompts: ImagePrompt[], source: SubtitleSource): string {
    let lrcText = "[ti:Sacred Vision Narrative Subtitles]\n";
    lrcText += "[by:Sacred Script AI Systems]\n";
    lrcText += "[re:CapCut LRC Compliant Converter]\n\n";

    prompts.forEach((p) => {
      const start = formatLrcTime(p.startTime);
      const end = formatLrcTime(p.endTime);
      
      let text = "";
      if (source === "transcription") {
        text = p.transcriptionSegment || "";
      } else if (source === "prompt") {
        text = p.prompt;
      } else {
        text = p.description;
      }
      const cleanText = text.replace(/\r?\n/g, " ").trim();

      lrcText += `${start}${cleanText}\n`;
      // Insert a blank line at the end of the segment to make LRC lyrics disappear cleanly
      lrcText += `${end}\n`;
    });
    return lrcText;
  },

  // Generate Advanced SubStation Alpha (.ass) subtitles (CapCut loved!)
  generateASS(prompts: ImagePrompt[], source: SubtitleSource): string {
    let assText = `[Script Info]
Title: Sacred Vision Captions
ScriptType: v4.00+
Collisions: Normal
PlayResX: 1920
PlayResY: 1080
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,55,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,y0,1,3,0,2,20,20,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    prompts.forEach((p) => {
      const start = formatAssTime(p.startTime);
      const end = formatAssTime(p.endTime);
      
      let text = "";
      if (source === "transcription") {
        text = p.transcriptionSegment || "";
      } else if (source === "prompt") {
        text = p.prompt;
      } else {
        text = p.description;
      }
      const cleanText = text.replace(/\r?\n/g, " ").trim();

      assText += `Dialogue: 0,${start},${end},Default,,0,0,0,,${cleanText}\n`;
    });

    return assText;
  },

  // File Downloader utility
  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
