"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { addVaccination, deleteVaccination, toggleVaccinationStatus } from "@/app/actions/vaccinations";
import { Plus, Trash2, Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface Vaccination {
  id: string;
  name: string;
  date_administered: string | null;
  next_due_date: string | null;
  status: "completed" | "upcoming" | "overdue";
  notes: string | null;
}

export default function VaccinationList({ initialData }: { initialData: Vaccination[] }) {
  const { user } = useAuth();
  const router = useRouter();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>(initialData);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when server data updates (after revalidatePath)
  useEffect(() => {
    setVaccinations(initialData);
  }, [initialData]);

  const handleDelete = async (id: string) => {
    setVaccinations(prev => prev.filter(v => v.id !== id)); // Optimistic delete
    
    try {
        await deleteVaccination(id);
    } catch (error) {
        alert("Delete failed");
        router.refresh();
        // Since we optimistically deleted, the refresh should bring it back if the server delete failed.
        // But to be immediate, we could also revert state here. 
        // For simplicity as requested: alert + refresh.
    }
  };

  const handleMarkComplete = async (id: string) => {
      // Optimistic Update
      setVaccinations(prev => prev.map(v => 
          v.id === id ? { ...v, status: "completed" as const } : v
      ));

      await toggleVaccinationStatus(id, "completed");
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("user_id", user.id);

    // Optimistic Add
    const newVax: Vaccination = {
        id: Math.random().toString(), // Temp ID
        name: formData.get("name") as string,
        date_administered: formData.get("date_administered") as string || null,
        next_due_date: formData.get("next_due_date") as string || null,
        status: formData.get("status") as any,
        notes: formData.get("notes") as string || null,
    };
    
    setVaccinations(prev => [...prev, newVax]);
    setIsAddOpen(false);

    const result = await addVaccination(formData);
    
    setIsSubmitting(false);
    
    if (result.error) {
        alert("Error adding vaccination: " + result.error);
        // Revert optimistic add if needed, but for demo we assume success or handle generic error
        setVaccinations(initialData); 
    } else {
        form.reset();
        router.refresh();
    }
  };

  const getStatusBadge = (status: string, dueDate: string | null) => {
      switch(status) {
          case 'completed':
              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 size={12}/> Completed</span>;
          case 'overdue':
              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle size={12}/> Overdue</span>;
          default:
               if (dueDate) {
                   const due = new Date(dueDate);
                   const today = new Date();
                   const diffTime = due.getTime() - today.getTime();
                   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                   if (diffDays <= 30 && diffDays >= 0) {
                       return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12}/> Due Soon</span>;
                   }
               }
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
                        <div className="mt-1">{getStatusBadge(vax.status, vax.next_due_date)}</div>
                    </div>
                    <div className="flex gap-2">
                        {vax.status === 'upcoming' && (
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
                        name="name" 
                        required 
                        placeholder="e.g. Flu Shot, Tetanus"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2db3a0]/20 focus:outline-none"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date Given</label>
                        <input 
                            name="date_administered" 
                            type="date"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2db3a0]/20 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Next Due</label>
                        <input 
                            name="next_due_date" 
                            type="date"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2db3a0]/20 focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select 
                        name="status" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2db3a0]/20 focus:outline-none"
                    >
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>

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
