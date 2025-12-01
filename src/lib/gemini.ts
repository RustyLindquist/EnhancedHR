import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn("Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export async function getGeminiResponse(prompt: string, history: { role: "user" | "model", parts: string }[] = []) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.parts }]
      })),
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}
