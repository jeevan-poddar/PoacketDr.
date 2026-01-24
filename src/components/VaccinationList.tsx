"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Trash2, Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { addVaccination, deleteVaccination, markAsDone } from "@/app/actions/vaccinations";

interface Vaccination {
  id: string;
  name: string;
  date_administered: string | null;
  next_due_date: string | null;
  status: "completed" | "pending" | "overdue" | "upcoming";
  notes: string | null;
}

const COMMON_VACCINES = [
  "Hepatitis B",
  "Polio",
  "DTP",
  "MMR",
  "Influenza",
  "COVID-19",
  "Typhoid",
  "Tetanus",
  "Chickenpox"
];

export default function VaccinationList({ initialData }: { initialData: Vaccination[] }) {
  const { user } = useAuth();
  const router = useRouter();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>(initialData);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for form fields
  // Using native HTML datalist so no complex autocomplete state needed for name
  
  // Sync state when server data updates (after revalidatePath)
  useEffect(() => {
    setVaccinations(initialData);
  }, [initialData]);

  const handleDelete = async (id: string) => {
    setVaccinations(prev => prev.filter(v => v.id !== id)); // Optimistic delete
    
    try {
      const result = await deleteVaccination(id);
      if (result && (result as any).error) throw new Error((result as any).error);
    } catch (error: any) {
      alert("Delete failed: " + (error?.message || "Unknown error"));
      router.refresh(); // Or revert state
      setVaccinations(initialData);
    }
  };

  const handleMarkComplete = async (id: string) => {
      // Optimistic Update
      setVaccinations(prev => prev.map(v => 
          v.id === id ? { ...v, status: "completed" as const, date_administered: new Date().toISOString() } : v
      ));

      try {
          const result = await markAsDone(id);
          if (result && result.error) throw new Error(result.error);
      } catch (error: any) {
          alert("Update failed: " + error.message);
          setVaccinations(initialData); // Revert
      }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Calculate status optimistically for UI
    const dateAdministeredRaw = formData.get("date_administered") as string;
    const nextDueDateRaw = formData.get("next_due_date") as string;
    
    const givenDate = new Date(dateAdministeredRaw);
    const dueDate = new Date(nextDueDateRaw);
    const today = new Date();
    
    // Normalization
    today.setHours(0, 0, 0, 0);
    givenDate.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    let simulatedStatus: Vaccination["status"] = "pending";

    // 1. If Given Date is in the Future -> UPCOMING
    if (givenDate > today) {
        simulatedStatus = 'upcoming';
    }
    // 2. If Due Date is in the Past -> OVERDUE
    else if (dueDate < today) {
        simulatedStatus = 'overdue';
    }
    // 3. Everything else -> PENDING
    else {
        simulatedStatus = 'pending';
    }

    // Optimistic Add
    const newVax: Vaccination = {
        id: crypto.randomUUID(), // Use proper UUID to avoid delete errors
        name: formData.get("name") as string,
        date_administered: dateAdministeredRaw || null,
        next_due_date: nextDueDateRaw || null,
        status: simulatedStatus,
        notes: formData.get("notes") as string || null,
    };
    
    setVaccinations(prev => [...prev, newVax]);
    setIsAddOpen(false);

    try {
        formData.append("user_id", user.id);
        const result = await addVaccination(formData);

        if (!result.success) {
            throw new Error(result.message || "Failed to add");
        }

       form.reset();
       // router.refresh(); // Let the action revalidate
    } catch (error: any) {
      alert("Error adding vaccination: " + (error?.message || "Unknown error"));
      setVaccinations(initialData); // Revert
    } finally {
      setIsSubmitting(false);
    }
  };


  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'completed':
              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 size={12}/> Completed</span>;
          case 'overdue':
              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle size={12}/> Overdue</span>;
          case 'pending':
               return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12}/> Pending</span>;
          case 'upcoming':
          default:
               return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Calendar size={12}/> Upcoming</span>;
      }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Your Vaccinations</h2>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2db3a0] text-white rounded-xl hover:bg-[#259c8d] transition-colors shadow-sm text-sm font-medium"
        >
          <Plus size={18} />
          Add Record
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vaccinations.length === 0 ? (
             <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                 <p>No vaccination records found. Add one to get started!</p>
             </div>
        ) : (
            vaccinations.map((vax) => (
            <div key={vax.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-semibold text-slate-800 text-lg">{vax.name}</h3>
                        <div className="mt-1">{getStatusBadge(vax.status)}</div>
                    </div>
                    <div className="flex gap-2">
                        {vax.status !== 'completed' && (
                             <button
                                onClick={() => handleMarkComplete(vax.id)}
                                title="Mark as Completed"
                                className="text-slate-300 hover:text-emerald-500 transition-colors p-1"
                             >
                                <CheckCircle2 size={18} />
                             </button>
                        )}
                        <button 
                            onClick={() => handleDelete(vax.id)}
                            title="Delete"
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-500 mt-4">
                    {vax.date_administered && (
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span>Given: {new Date(vax.date_administered).toLocaleDateString()}</span>
                        </div>
                    )}
                    {vax.next_due_date && (
                        <div className="flex items-center gap-2">
                             <Clock size={14} className="text-blue-500" />
                             <span>Due: {new Date(vax.next_due_date).toLocaleDateString()}</span>
                        </div>
                    )}
                    {vax.notes && (
                        <p className="mt-2 text-slate-400 italic text-xs border-t border-slate-50 pt-2">{vax.notes}</p>
                    )}
                </div>
            </div>
            ))
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-lg text-slate-800">Add Vaccination</h3>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vaccine Name</label>
                    <input 
                        list="vaccine-suggestions"
                        name="name"
                        type="text"
                        required 
                        placeholder="Select or type name..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2db3a0]/20 focus:outline-none"
                        autoComplete="off"
                    />
                    <datalist id="vaccine-suggestions">
                        {COMMON_VACCINES.map((vax) => (
                            <option key={vax} value={vax} />
                        ))}
                    </datalist>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Planned Date</label>
                        <input 
                            name="date_administered" 
                            type="date"
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2db3a0]/20 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                        <input 
                            name="next_due_date" 
                            type="date"
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2db3a0]/20 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Status selection removed - calculated automatically */}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea 
                        name="notes" 
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2db3a0]/20 focus:outline-none resize-none"
                    ></textarea>
                </div>

                <div className="pt-2 flex gap-3">
                    <button 
                        type="button" 
                        onClick={() => setIsAddOpen(false)}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 bg-[#2db3a0] text-white rounded-xl hover:bg-[#259c8d] font-medium disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Save Record"}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
