"use server";

import { supabase } from "@/lib/supabaseClient";

interface DashboardStats {
  vaccineCount: number;
  outbreakCount: number;
  nextDue: string | null;
  healthScore: number;
}

interface Vaccination {
  id: string;
  user_id: string;
  name: string;
  status: string;
  due_date: string;
  administered_date?: string;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const stats: DashboardStats = {
    vaccineCount: 0,
    outbreakCount: 0,
    nextDue: null,
    healthScore: 92 // Static health score as per design
  };

  try {
    // 1. Get Vaccine Count & Next Due
    const { data, error: vaccineError } = await supabase
      .from("vaccinations")
      .select("*")
      .eq("user_id", userId)
      .order('due_date', { ascending: true });
    
    // Explicit cast since we don't have full db types generated
    const vaccines = (data as Vaccination[]) || [];

    if (!vaccineError && vaccines) {
       // Filter out vaccines that are already taken
       const pending = vaccines.filter(v => v.status !== 'completed'); 
       stats.vaccineCount = pending.length;
       
       // Find earliest future date
       const now = new Date();
       const upcoming = vaccines.find(v => new Date(v.due_date) > now && v.status !== 'completed');
       
       if (upcoming) {
           stats.nextDue = new Date(upcoming.due_date).toLocaleDateString('en-GB', {
               day: 'numeric', month: 'short', year: 'numeric'
           });
       } else if (vaccines.length > 0 && pending.length === 0) {
            stats.nextDue = "All caught up!";
       } else if (vaccines.length === 0) {
            stats.nextDue = "No vaccines tracked";
       }
    }

    // 2. Get Active Outbreak Count
    const { count: alertsCount, error: alertError } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "verified"); // Only verified alerts

    if (!alertError && alertsCount !== null) {
      stats.outbreakCount = alertsCount;
    }

  } catch (e) {
    console.error("Dashboard stats error:", e);
  }
  
  return stats;
}
