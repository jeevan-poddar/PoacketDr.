import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    
    // Explicitly using the requested key and model alias
    const genAI = new GoogleGenerativeAI("AIzaSyBF7HPv0q9S2aDkvOq8x8rgsrS27rsQfiw");
    
    // System instruction for medical and linguistic behavior
    const systemInstruction = `
- **Identity:** Your name is AIVA. Always introduce yourself briefly as AIVA if asked.
- **Format:** Use bullet points for all explanations. Avoid long paragraphs.
- **Length:** Be ultra-concise. Use the minimum number of words possible while remaining helpful.
- **Language:** Support English, Hindi, and Hinglish based on user input.
- **Medical Protocol:**
  - For symptoms: Ask 2-3 brief follow-up bullet points.
  - For diseases: Use headers for Symptoms, Causes, Precautions, and Medicine.
  - Citations: Provide short links or names (WHO, CDC, Govt sites).
  - Breakdown terms: Explain scientific words in simple brackets.
- **Greeting:** Keep greetings to one short sentence (e.g., 'Hello, I am AIVA. How can I help?').
`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction: systemInstruction
    });

    const chat = model.startChat({
      history: history || []
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
