import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY! });

/**
 * A simple validator to check if the returned text is in a plausible LRC format.
 * It checks if at least half the lines start with a timestamp.
 * @param text The text to validate.
 * @returns boolean
 */
const isLrcFormat = (text: string): boolean => {
    if (!text) return false;
    const lines = text.trim().split('\n');
    // Regex to match [mm:ss.xx] or [mm:ss:xxx] timestamps
    const lrcLineRegex = /^\[\d{2}:\d{2}[.:]\d{2,3}\]/;
    const lrcLinesCount = lines.filter(line => lrcLineRegex.test(line.trim())).length;
    
    // Consider it valid if there's at least one line and more than 50% of lines are timestamped
    return lines.length > 0 && (lrcLinesCount / lines.length) > 0.5;
};


export const findLyrics = async (title: string, artist: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured. Please set the environment variable.");
  }
  
  const primaryModel = 'gemini-2.5-flash';
  const fallbackModel = 'gemini-2.5-pro'; // A more powerful model for the retry

  const detailedPrompt = `You are an expert music lyric transcriber. Your task is to provide highly accurate, synchronized lyrics for a song. The user has **verified** that the song is "${title}" by "${artist}". Use this information as the absolute source of truth.

The output format must be strictly LRC (Ly-Ri-Cs). Each line must start with a timestamp in the format [mm:ss.xx].

CRITICAL INSTRUCTIONS:
1.  **Accuracy is paramount.** Based on the user-confirmed title and artist, find the correct lyrics from reliable sources.
2.  **Precise Synchronization:** The timestamps must align perfectly with a standard studio recording of the song.
3.  **Timestamp Precision:** Timestamps must mark the exact moment the *first syllable* of the corresponding line is sung. Do not place timestamps early or late. This is crucial for user experience.
4.  **Clean Output:** The final output must ONLY contain the raw LRC text. Do not include any headers, song titles, artist names, explanations, or markdown formatting like \`\`\`lrc.
5.  **Instrumentals:** For purely instrumental sections longer than 5 seconds, you must add a descriptive line, e.g., \`[01:23.45] (Guitar Solo)\`.
6.  **Completeness:** You must transcribe the entire song from the very beginning to the absolute end. Do not omit verses, choruses, bridges, or the outro.

Example of correct format:
[00:15.32] Here comes the sun, doo-doo-doo-doo
[00:17.81] Here comes the sun`;

  try {
    // First attempt with the faster model
    console.log(`Attempting to find lyrics for "${title}" with primary model: ${primaryModel}`);
    const initialResponse = await ai.models.generateContent({
      model: primaryModel,
      contents: detailedPrompt,
    });
    
    const initialText = initialResponse.text;
    
    if (isLrcFormat(initialText)) {
        console.log("Successfully fetched lyrics in LRC format with primary model.");
        return initialText;
    }

    // If the format is incorrect, trigger the fallback to the more powerful model
    console.warn(`Primary model did not return valid LRC format for "${title}". Trying fallback model: ${fallbackModel}`);
    
    const fallbackResponse = await ai.models.generateContent({
        model: fallbackModel,
        contents: detailedPrompt, // Use the same high-quality prompt
    });

    const fallbackText = fallbackResponse.text;

    if (isLrcFormat(fallbackText)) {
        console.log("Successfully fetched lyrics in LRC format with fallback model.");
        return fallbackText;
    } else {
        console.error("Fallback model also failed to return valid LRC format.");
        throw new Error("AI failed to retrieve synchronized lyrics in the correct format, even after a retry. Please double-check the song title/artist or enter the lyrics manually.");
    }
  } catch (error) {
    console.error("Error finding lyrics from Gemini API:", error);
    throw new Error("Failed to find lyrics. The model may be unavailable or the song not found. Please try again or enter them manually.");
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
    if (!API_KEY) {
      throw new Error("API_KEY is not configured. Please set the environment variable.");
    }
    try {
        const fullPrompt = `A vibrant, high-quality background image for a karaoke screen. The theme is: ${prompt}. Cinematic, atmospheric, digital art, 8k, highly detailed.`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated by the model.");
        }

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate background image. Please try a different prompt.");
    }
};