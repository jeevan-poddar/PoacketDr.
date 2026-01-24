"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

export interface Alert {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: "high" | "medium" | "low";
  radius?: number; // in km
}

export async function getAlerts() {
  try {
    const { data: alerts, error } = await supabase
      .from("alerts")
      .select("id, title, description, latitude, longitude, severity, status, radius")
      .eq("status", "verified"); // Only show verified alerts to public

    if (error) {
      console.error("Supabase error fetching alerts:", error);
      throw error;
    }

    if (!alerts || alerts.length === 0) {
      return [];
    }
    
    return alerts.map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description || "No description provided.",
      severity: a.severity,
      latitude: a.latitude,
      longitude: a.longitude,
      radius: a.radius || 500 // Default to 500 meters if null
    }));

  } catch (error: any) {
    console.error("Values DB fetch failed:", error);
    return [];
  }
}

export async function reportAlert(data: {
  title: string;
  severity: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  description?: string;
}) {
  try {
    const { error } = await (supabase
      .from("alerts") as any)
      .insert({
        title: data.title,
        severity: data.severity,
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city || "",
        state: data.state || "",
        description: data.description || "",
        status: "pending" // Default to pending for user reports
      });

    if (error) throw error;

    revalidatePath("/dashboard"); 
    revalidatePath("/admin"); // Add admin revalidation
    return { success: true };
  } catch (error: any) {
    console.error("Report failed:", error);
    throw new Error("Failed to report alert. Please try again.");
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

export async function submitOutbreak(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);

    if (!title || !description || isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Missing required fields");
    }

    const { error } = await (supabase
      .from("alerts") as any)
      .insert({
        title,
        description,
        city,
        state,
        latitude,
        longitude,
        severity: "medium", // Default severity
        status: "pending"
      });

    if (error) throw error;

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Submit Outbreak Error:", error);
    return { success: false, error: error.message };
  }
}