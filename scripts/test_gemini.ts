
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Error: NEXT_PUBLIC_GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  try {
    console.log("Fetching available models via REST API...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
        console.log("✅ Available Models:");
        data.models.forEach((m: any) => {
            console.log(` - ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
        });
    } else {
        console.log("❌ No models found or error:", JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error("Fatal error:", error);
  }
}

listModels();
