"use server";

import { supabase } from "@/lib/supabaseClient";
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
      latitude: a.latitude,
      longitude: a.longitude,
      city: a.city,
      state: a.state,
      status: a.status,
      created_at: a.created_at
    })) as AdminAlert[];

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

export async function createOfficialAlert(data: {
  title: string;
  severity: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  description?: string;
}) {
  try {
    const { error } = await (supabase.from("alerts") as any)
      .insert({
        title: data.title,
        severity: data.severity,
        latitude: data.latitude,
        longitude: data.longitude,
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
