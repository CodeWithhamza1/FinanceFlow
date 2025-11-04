import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Check if Google AI API key is configured
const googleAIKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: googleAIKey,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
  enableTracing: false,
});
