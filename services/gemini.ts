
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .slice(0, 80);
};

export const extractMCQsFromDocument = async (base64Data: string, mimeType: string): Promise<Question[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        {
          text: "Extract all Multiple Choice Questions (MCQs) from this document. Return them in a structured JSON array. Each question must include: 'question', 'options' (array of strings), 'correctAnswerIndex' (0-indexed), and a brief 'explanation'. \n\nIMPORTANT FORMATTING RULES:\n1. If a question involves matching lists (e.g., 'Match List-I with List-II'), use newlines to separate the items in the 'question' text so they appear as a vertical list rather than a single paragraph.\n2. Preserve the exact number of options found in the document (could be 4, 5, or more).\n3. Ensure the 'question' text is clean and well-structured using newlines where logical."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            correctAnswerIndex: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  try {
    const text = response.text;
    const questions = JSON.parse(text || "[]");
    return questions.map((q: any, idx: number) => ({
      ...q,
      id: `q-${Date.now()}-${idx}`,
      slug: generateSlug(q.question) + '-' + Math.random().toString(36).substr(2, 5)
    }));
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return [];
  }
};

export const getDeepExplanation = async (question: Question): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Provide a deep, logical breakdown of why the correct answer to this MCQ is correct and why the others are wrong. 
    Question: ${question.question}
    Options: ${question.options.join(", ")}
    Correct Index: ${question.correctAnswerIndex}`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  return response.text || "No explanation available.";
};

export const searchFactsForQuestion = async (question: Question): Promise<{ text: string, sources: { title: string, uri: string }[] }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Search for facts and verified information related to this question: "${question.question}". 
    The options provided are: ${question.options.join(", ")}. 
    Provide a concise educational summary of the topic and confirm the correct facts.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "No additional facts found.";
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any) => web && web.uri) || [];

  return { text, sources };
};

export const analyzeImageQuestion = async (base64Data: string): Promise<Question | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        },
        {
          text: "Analyze this image containing a question. Extract the question, options, identify the correct answer, and provide an explanation. Return in JSON format."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswerIndex: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctAnswerIndex", "explanation"]
      }
    }
  });

  try {
    const q = JSON.parse(response.text || "{}");
    return { 
      ...q, 
      id: `img-q-${Date.now()}`,
      slug: generateSlug(q.question) + '-' + Math.random().toString(36).substr(2, 5)
    };
  } catch {
    return null;
  }
};
