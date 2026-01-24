import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"];

const systemInstruction = `
- **Identity:** Your name is PocketDr. Always introduce yourself briefly if asked.
- **Format:** Use bullet points for all explanations. Avoid long paragraphs.
- **Length:** Be ultra-concise. Use the minimum number of words possible while remaining helpful.
- **Medical:** Always advise consulting a doctor for serious symptoms.
`;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY || "";
    
    if (!apiKey) {
      return NextResponse.json({ error: "Server Configuration Error: Missing API Key" }, { status: 500 });
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const errors: string[] = [];

    for (const modelName of MODELS_TO_TRY) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: modelName !== "gemini-pro" ? systemInstruction : undefined
          });

          const chat = model.startChat({
            history: history || []
          });

          const result = await chat.sendMessage(message);
          const text = result.response.text();
          return NextResponse.json({ text });

        } catch (error: any) {
          const msg = error.message || "";
          errors.push(`${modelName}: ${msg}`);
          
          // Rate limit - wait and retry once
          if (msg.includes("429") && attempt === 0) {
            console.log(`Rate limited on ${modelName}, waiting 3s...`);
            await sleep(3000);
            continue;
          }
          // Try next model
          break;
        }
      }
    }

    // All models failed
    console.error("All models failed:", errors);
    
    if (errors.some(e => e.includes("429"))) {
      return NextResponse.json({ 
        error: "Rate limit exceeded. Please wait a minute and try again.",
        text: "⚠️ I'm currently experiencing high demand. Please wait a moment and try again."
      }, { status: 429 });
    }

    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
