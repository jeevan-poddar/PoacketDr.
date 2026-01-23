import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    
    // Explicitly using the requested key and model alias
    const apiKey = process.env.GEMINI_API_KEY || "";
    
    if (!apiKey) {
      console.error("API Key is missing in route.ts");
      return NextResponse.json({ error: "Server Configuration Error: Missing API Key" }, { status: 500 });
    }
    
    console.log("Using API Key starting with:", apiKey.substring(0, 5));
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // DEBUG: List available models
    try {
      const models = await genAI.getGenerativeModel({ model: "gemini-pro" }).apiKey; // Hack to access manager if needed? No.
      // The SDK doesn't expose listModels on the instance easily in all versions?
      // Actually it's just a method on the class in some versions, or ignored.
      // Let's typically assumes standard usage. 
      // Correct way in v0.x:
      // const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 
      // There isn't a direct listModels on the client instance in some versions without importing GoogleGenerativeAI.
      // Wait, GoogleGenerativeAI is the class.
    } catch(e) {}
    
    // Let's try gemini-1.5-flash again but without system instruction first to match "stable" capability?
    // Or just use 'gemini-pro' WITHOUT systemInstruction.
    
    // System instruction for medical and linguistic behavior
    const systemInstruction = `
- **Identity:** Your name is AIVA. Always introduce yourself briefly as AIVA if asked.
- **Format:** Use bullet points for all explanations. Avoid long paragraphs.
- **Length:** Be ultra-concise. Use the minimum number of words possible while remaining helpful.
- **Greeting:** Keep greetings to one short sentence.
`;

    // Attempting to use a model that definitely exists.
    // If gemini-pro failed, let's try 'gemini-1.0-pro' or just 'gemini-pro' without system instruction.
    // Many 404s on models are due to System Instructions being passed to models that don't support them in that API version.
    
    // However, gemini-1.5-flash DOES support it.
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      // systemInstruction: systemInstruction 
      // Commenting out systemInstruction temporarily to isolate the issue
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
