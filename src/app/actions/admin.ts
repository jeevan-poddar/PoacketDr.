"use server";

import { supabase } from "@/lib/supabaseClient";
import { DEMO_ALERTS } from "@/lib/demoAlerts";
import { revalidatePath } from "next/cache";

export interface AdminAlert {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  status: "pending" | "verified" | "rejected";
  created_at?: string;
}

export interface AdminData {
  pending: AdminAlert[];
  active: AdminAlert[];
}

export async function loginAdmin(user: string, pass: string) {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  
  // Simple check
  if (user === adminUser && pass === adminPass) {
    return { success: true };
  }
  return { success: false };
}

export async function getAdminData() {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const alerts = data.map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      severity: a.severity,
      latitude: a.lat,
      longitude: a.lng,
      city: a.city,
      state: a.state,
      status: a.status,
      created_at: a.created_at
    })) as AdminAlert[];

    if (alerts.length === 0) {
      const demo = DEMO_ALERTS.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        severity: a.severity,
        latitude: a.lat,
        longitude: a.lng,
        city: a.city || "",
        state: a.state || "",
        status: "verified" as const,
        created_at: new Date().toISOString(),
      })) as AdminAlert[];

      return {
        pending: [],
        active: demo,
      };
    }

    console.log("Admin Data Fetch:", { 
        total: alerts.length, 
        statuses: alerts.map(a => a.status),
        pendingCount: alerts.filter(a => a.status === 'pending').length
    });

    return {
      pending: alerts.filter(a => a.status === 'pending'),
      active: alerts.filter(a => a.status !== 'pending')
    };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return { pending: [], active: [] };
  }
}

export async function deleteAlert(id: string) {
  try {
    const { error } = await supabase
      .from("alerts")
      .delete()
      .eq("id", id);
      
    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/map");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting alert:", error);
    return { success: false, error: error.message };
  }
}

// Deprecated but kept for compatibility if needed, though replaced by getAdminData
export async function getPendingAlerts() {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      severity: a.severity,
      latitude: a.lat,
      longitude: a.lng,
      city: a.city,
      state: a.state,
      status: a.status,
      created_at: a.created_at
    })) as AdminAlert[];
  } catch (error) {
    console.error("Error fetching pending alerts:", error);
    return [];
  }
}

export async function verifyAlert(id: string, decision: "verified" | "rejected") {
  try {
    const { error } = await (supabase
      .from("alerts") as any)
      .update({ status: decision })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/map");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error verifying alert:", error);
    return { success: false, error: error.message };
  }
}

// Static Geocoding Dictionary (Duplicated for server action isolation)
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

export async function createOfficialAlert(data: {
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

    const { error } = await (supabase.from("alerts") as any)
      .insert({
        title: data.title,
        severity: data.severity,
        lat: finalLat,
        lng: finalLng,
        city: data.city || "",
        state: data.state || "",
        description: data.description || "",
        status: "verified" // Official alerts are auto-verified
      });

    if (error) throw error;

    revalidatePath("/map");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating official alert:", error);
    return { success: false, error: error.message };
  }
}
