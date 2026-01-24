"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import VaccinationList from "@/components/VaccinationList";
import { Shield } from "lucide-react";

interface Vaccination {
  id: string;
  name: string;
  date_administered: string | null;
  next_due_date: string | null;
  status: "completed" | "upcoming" | "overdue";
  notes: string | null;
}

export default function VaccinationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        const fetchData = async () => {
          try {
            const { data, error } = await supabase
              .from("vaccinations")
              .select("*")
              .eq("user_id", user.id)
              .order("next_due_date", { ascending: true, nullsFirst: true });

            if (error) {
              console.error("Error fetching vaccinations:", error);
              setVaccinations([]);
            } else {
              setVaccinations((data as Vaccination[]) || []);
            }
          } catch (err) {
            console.error("Error fetching vaccinations:", err);
            setVaccinations([]);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }
    }
  }, [user, authLoading, router]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2db3a0] to-[#00509d] bg-clip-text text-transparent">
            Vaccinations
          </h1>
          <p className="text-slate-500 mt-1">Track and manage your immunization schedule</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-3 bg-purple-100 rounded-xl">
          <Shield className="text-purple-600" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-purple-900">Stay Protected</h3>
          <p className="text-purple-700/80 text-sm mt-1">Regular vaccinations are crucial for maintaining your health.</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-[#2db3a0] border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-500">Loading records...</p>
           </div>
        </div>
      ) : (
        <VaccinationList initialData={vaccinations} />
      )}
    </div>
  );
}
