import toast from 'react-hot-toast';

const GEMINI_API_KEY = 'AIzaSyBY4UcAlU8TQ5pjlBPRXzQrW5h1MI9fo0c';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface GeminiResponse {
  text: string;
  error?: string;
}

export const generateContent = async (prompt: string): Promise<GeminiResponse> => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.candidates[0].content.parts[0].text
    };
  } catch (error) {
    console.error('Error generating content:', error);
    toast.error('Failed to generate content');
    return {
      text: '',
      error: 'Failed to generate content'
    };
  }
};