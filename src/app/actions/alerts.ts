"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

export interface Alert {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  severity: "high" | "medium" | "low";
  radius?: number; // in km
}

const DEMO_ALERTS: Alert[] = [
  {
    id: "demo-1",
    title: "Flu Outbreak",
    description: "High rate of viral influenza cases reported in New Delhi. Hospitals dealing with influx.",
    lat: 28.6139,
    lng: 77.2090, 
    severity: "high",
    radius: 15
  },
  {
    id: "demo-2", 
    title: "Dengue Alert",
    description: "Mosquito-borne viral disease cases rising in Mumbai due to recent rains.",
    lat: 19.0760,
    lng: 72.8777,
    severity: "medium",
    radius: 12
  },
  {
    id: "demo-3",
    title: "Malaria Warning",
    description: "Several cases of Malaria reported in Chennai suburbs.",
    lat: 13.0827,
    lng: 80.2707,
    severity: "high",
    radius: 10
  },
  {
    id: "demo-4",
    title: "Water Contamination",
    description: "Reports of contaminated water supply in parts of Kolkata.",
    lat: 22.5726,
    lng: 88.3639,
    severity: "low",
    radius: 8
  },
  {
    id: "demo-5",
    title: "Viral Fever",
    description: "Seasonal viral fever cases increasing in Bangalore office districts.",
    lat: 12.9716,
    lng: 77.5946,
    severity: "medium",
    radius: 7
  },
  {
    id: "demo-6",
    title: "Respiratory Issues",
    description: "Air quality related respiratory complaints in Hyderabad.",
    lat: 17.3850,
    lng: 78.4867,
    severity: "low",
    radius: 6
  },
  {
    id: "demo-7",
    title: "H1N1 Alert",
    description: "Isolated cases of H1N1 reported in Pune.",
    lat: 18.5204,
    lng: 73.8567,
    severity: "high",
    radius: 9
  },
  {
    id: "demo-8",
    title: "Heat Wave",
    description: "Extreme heat advisory in Ahmedabad. Stay hydrated.",
    lat: 23.0225,
    lng: 72.5714,
    severity: "medium",
    radius: 20
  },
  {
    id: "demo-9",
    title: "Food Poisoning",
    description: "Cluster of food poisoning cases in Jaipur tourist area.",
    lat: 26.9124,
    lng: 75.7873,
    severity: "low",
    radius: 4
  },
  {
    id: "demo-10",
    title: "Chikungunya",
    description: "Chikungunya cases identified in Lucknow.",
    lat: 26.8467,
    lng: 80.9462,
    severity: "high",
    radius: 11
  }
];

export async function getAlerts() {
  try {
    const { data: alerts, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("status", "verified"); // Only show verified alerts to public

    if (error) {
      console.error("Supabase error fetching alerts:", error);
      throw error;
    }

    if (!alerts || alerts.length === 0) {
      console.log("No verified alerts found, returning demo data.");
      return DEMO_ALERTS;
    }
    
    return alerts.map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description || "No description provided.",
      severity: a.severity,
      lat: a.lat,
      lng: a.lng,
      radius: a.radius || 10
    }));

  } catch (error: any) {
    if (error.message?.includes("fetch failed") || error.message?.includes("timeout") || error.status === 504) {
      console.warn("Network Timeout - Returning Demo Alerts");
      return DEMO_ALERTS;
    }
    console.warn("Values DB fetch failed, using demo data:", error);
    return DEMO_ALERTS;
  }
}

// Static Geocoding Dictionary
const CITY_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  "New Delhi": { lat: 28.6139, lng: 77.2090 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Bangalore": { lat: 12.9716, lng: 77.5946 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Hyderabad": { lat: 17.3850, lng: 78.4867 },
  "Jaipur": { lat: 26.9124, lng: 75.7873 },
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Lucknow": { lat: 26.8467, lng: 80.9462 }
};

export async function reportAlert(data: {
  title: string;
  severity: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  description?: string;
}) {
  try {
    // 1. Determine Coordinates (Prefer City Lookup > Provided Lat/Lng)
    let finalLat = data.lat;
    let finalLng = data.lng;

    if (data.city) {
        // Normalize input
        const cityKey = Object.keys(CITY_COORDINATES).find(
            key => key.toLowerCase() === data.city!.trim().toLowerCase()
        );

        if (cityKey) {
            const coords = CITY_COORDINATES[cityKey];
            const jitter = () => (Math.random() - 0.5) * 0.05; // ~5km jitter
            finalLat = coords.lat + jitter();
            finalLng = coords.lng + jitter();
        } else {
             // Fallback to New Delhi if city unknown but we need valid coords
             // Only if original lat/lng are 0 or invalid (optional check, but good for safety)
             if (!finalLat || !finalLng) {
                const fallback = CITY_COORDINATES["New Delhi"];
                 finalLat = fallback.lat + (Math.random() - 0.5) * 0.1;
                 finalLng = fallback.lng + (Math.random() - 0.5) * 0.1;
             }
        }
    }

    const { error } = await (supabase
      .from("alerts") as any)
      .insert({
        title: data.title,
        severity: data.severity,
        lat: finalLat,
        lng: finalLng,
        city: data.city || "",
        state: data.state || "",
        description: data.description || "",
        status: "pending" // Default to pending for user reports
      });

    if (error) throw error;

    revalidatePath("/dashboard"); 
    return { success: true };
  } catch (error: any) {
    console.error("Report failed:", error);
    throw new Error("Failed to report alert. Please try again.");
  }
}