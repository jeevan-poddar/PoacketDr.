"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabaseClient";

const API_KEY = process.env.GEMINI_API_KEY;

interface UserProfile {
  name?: string | null;
  age?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  gender?: string | null;
  blood_type?: string | null;
  allergies?: string | null;
  medical_conditions?: string | null;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

function buildSystemPrompt(profile?: UserProfile | null): string {
  let prompt = `You are Dr. Pocket, a highly intelligent medical assistant. 
Your answers must be precise, medically grounded, and concise for a demo environment.
Always advise consulting a doctor for serious symptoms or emergencies.`;

  if (profile) {
    prompt += `\n\nYou are speaking with a patient. Here is their profile:`;
    if (profile.name) prompt += `\n- Name: ${profile.name}`;
    if (profile.age) prompt += `\n- Age: ${profile.age}`;
    if (profile.gender) prompt += `\n- Gender: ${profile.gender}`;
    if (profile.allergies) prompt += `\n- Allergies: ${profile.allergies}`;
    if (profile.medical_conditions) prompt += `\n- Conditions: ${profile.medical_conditions}`;
    prompt += `\n\nPersonalize your response.`;
  }
  return prompt;
}

export async function sendMessage(userMessage: string, profile?: UserProfile | null): Promise<ChatResponse> {
  if (!API_KEY) {
    console.error("Server Action: API Key is missing.");
    return { success: false, error: "API Key is missing on Server." };
  }

  console.log("Server Action: Starting with API Key length:", API_KEY.length);

  try {
    // Check for authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    const isGuest = !user;
    
    console.log("Server Action: User status:", isGuest ? "Guest" : "Logged In");

    const genAI = new GoogleGenerativeAI(API_KEY);
    // Using the experimental 2.0 flash model for best hackathon performance
    const modelName = "gemini-2.0-flash-exp"; 
    
    console.log("Server Action: Initializing Gemini model:", modelName);
    const model = genAI.getGenerativeModel({ model: modelName });

    let systemPrompt = buildSystemPrompt(profile);
    
    if (isGuest) {
        systemPrompt += "\n\nThe user is a Guest. Answer their medical questions but politely remind them that their chat history is not being saved.";
    }

    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Understood. I am Dr. Pocket, ready to assist with high precision." }] }
        ]
    });

    console.log("Server Action: Sending message to Gemini...");
    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();
    console.log("Server Action: Received response from Gemini");

    // Only store in Supabase if user is logged in
    if (!isGuest) {
      const { error: dbError } = await (supabase
        .from('messages') as any)
        .insert([
          { role: 'user' as const, content: userMessage, created_at: new Date().toISOString() },
          { role: 'assistant' as const, content: responseText, created_at: new Date().toISOString() }
        ]);

      if (dbError) {
          console.error("Supabase storage error:", dbError);
      }
    }

    return { success: true, message: responseText };

  } catch (error: any) {
    console.error("FULL GEMINI ERROR:", error);
    return { success: false, error: error.message || "Unknown Gemini Error" };
  }
}
