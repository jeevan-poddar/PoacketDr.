"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { DEMO_ALERTS } from "@/lib/demoAlerts";

export interface Alert {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  severity: "high" | "medium" | "low";
  radius?: number; // in km
}

const DEMO_ALERTS_TYPED: Alert[] = DEMO_ALERTS.map((alert) => ({
  id: alert.id,
  title: alert.title,
  description: alert.description,
  lat: alert.lat,
  lng: alert.lng,
  severity: alert.severity,
  radius: alert.radius,
}));

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
      return DEMO_ALERTS_TYPED;
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
      return DEMO_ALERTS_TYPED;
    }
    console.warn("Values DB fetch failed, using demo data:", error);
    return DEMO_ALERTS_TYPED;
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