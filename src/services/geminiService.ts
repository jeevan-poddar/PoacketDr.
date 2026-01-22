import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Models to try
const MODELS_TO_TRY = [
  "gemini-2.0-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
];

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

function buildSystemPrompt(profile?: UserProfile | null): string {
  let prompt = `You are PocketDr, a friendly and professional AI health assistant. 
Keep answers concise (under 100 words) and helpful.
Always advise consulting a doctor for serious symptoms or emergencies.
Be empathetic and supportive.`;

  if (profile) {
    prompt += `\n\nYou are speaking with a patient. Here is their profile:`;
    
    if (profile.name) {
      prompt += `\n- Name: ${profile.name} (Address them by name to be friendly)`;
    }
    if (profile.age) {
      prompt += `\n- Age: ${profile.age} years old`;
    }
    if (profile.gender) {
      prompt += `\n- Gender: ${profile.gender}`;
    }
    if (profile.height_cm) {
      prompt += `\n- Height: ${profile.height_cm} cm`;
    }
    if (profile.weight_kg) {
      prompt += `\n- Weight: ${profile.weight_kg} kg`;
    }
    if (profile.blood_type) {
      prompt += `\n- Blood Type: ${profile.blood_type}`;
    }
    if (profile.allergies) {
      prompt += `\n- Known Allergies: ${profile.allergies} (IMPORTANT: Never recommend medications they are allergic to)`;
    }
    if (profile.medical_conditions) {
      prompt += `\n- Medical Conditions: ${profile.medical_conditions} (Consider these when giving advice)`;
    }
    
    prompt += `\n\nUse this information to personalize your responses. For example, greet them by name and consider their medical history.`;
  }

  return prompt;
}

export const getMedicalAdvice = async (userMessage: string, userProfile?: UserProfile | null) => {
  if (!API_KEY) {
    console.error("Missing API Key. Check .env.local");
    return "Error: API Key is missing. Please restart the server.";
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const errors: any[] = [];
  const systemPrompt = buildSystemPrompt(userProfile);

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`Attempting to use model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model",
            parts: [{ text: `Understood! I'm PocketDr, ready to help${userProfile?.name ? ` ${userProfile.name}` : ''}. I'll keep their health profile in mind.` }],
          },
        ],
      });

      const result = await chat.sendMessage(userMessage);
      const responseText = result.response.text();
      console.log(`Success with model: ${modelName}`);
      return responseText;

    } catch (error: any) {
      const errorMsg = error.message || error.toString();
      console.warn(`Model ${modelName} failed:`, errorMsg);
      errors.push({ model: modelName, error: errorMsg });
    }
  }

  // All models failed
  console.error("All Gemini models failed. Errors:", errors);
  
  if (errors.some(e => e.error.includes("429"))) {
     return "⚠️ Rate Limit Exceeded: You've made too many requests. Please wait 1-2 minutes and try again.";
  }

  if (errors.some(e => e.error.includes("404"))) {
      return "Error: Could not connect to any Gemini models. Please check your API key.";
  }

  return "I'm having trouble connecting to the medical service. Please try again in a moment.";
};