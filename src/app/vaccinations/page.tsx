"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";
import { Syringe, Calendar, CheckCircle2, Clock, AlertCircle, Plus, Shield, X } from "lucide-react";

interface Vaccination {
  id: string;
  name: string;
  due_date: string;
  status: "completed" | "upcoming" | "overdue";
  notes?: string;
}

// Common vaccines for autocomplete
const VACCINE_SUGGESTIONS = [
  "COVID-19 Vaccine (Pfizer)",
  "COVID-19 Vaccine (Moderna)",
  "COVID-19 Vaccine (Covaxin)",
  "COVID-19 Booster",
  "Influenza (Flu) Vaccine",
  "Hepatitis A Vaccine",
  "Hepatitis B Vaccine",
  "MMR (Measles, Mumps, Rubella)",
  "Tetanus (Td/Tdap)",
  "Polio Vaccine (IPV)",
  "Typhoid Vaccine",
  "Chickenpox (Varicella)",
  "Pneumococcal Vaccine",
  "Meningococcal Vaccine",
  "HPV Vaccine",
  "Rabies Vaccine",
  "Yellow Fever Vaccine",
  "Japanese Encephalitis",
  "BCG (Tuberculosis)",
  "Rotavirus Vaccine",
  "DPT (Diphtheria, Pertussis, Tetanus)",
];

export default function VaccinationsPage() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [vaccineName, setVaccineName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"upcoming" | "completed">("upcoming");
  const [notes, setNotes] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user, loading: authLoading } = useAuth(); // Get current user & auth loading state
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push("/login");
      } else {
        // Fetch data if authenticated
        fetchVaccinations();
      }
    }
  }, [user, authLoading, router]);

  async function fetchVaccinations() {
    try {
      const { data, error } = await supabase
        .from("vaccinations")
        .select("*")
        .eq("user_id", user?.id) // Handle potential null user
        .order("due_date", { ascending: true });
      if (error) {
        console.error("Error fetching vaccinations:", error);
      } else if (data) {
        setVaccinations(data as Vaccination[]);
      }
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleNameChange = (value: string) => {
    setVaccineName(value);
    if (value.length > 0) {
      const filtered = VACCINE_SUGGESTIONS.filter(v => 
        v.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setVaccineName(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleAddVaccine = async () => {
    if (!vaccineName.trim() || !dueDate || !user) return; // Check for user
    
    setSaving(true);
    try {
      const { data, error } = await supabase.from("vaccinations").insert({
        name: vaccineName.trim(),
        due_date: dueDate,
        status: status,
        notes: notes.trim() || null,
        user_id: user.id // Add user_id to the insert payload
      }).select().single();
      
      if (error) {
        console.error("Error adding vaccine:", error);
        alert("Failed to add vaccine. Please try again.");
      } else if (data) {
        setVaccinations(prev => [...prev, data as Vaccination].sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        ));
        // Reset form
        setVaccineName("");
        setDueDate("");
        setStatus("upcoming");
        setNotes("");
        setShowModal(false);
      }
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setSaving(false);
    }
  };

  const markAsComplete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("vaccinations")
        .update({ status: "completed" })
        .eq("id", id);
      
      if (error) {
        console.error("Error updating vaccine:", error);
        alert("Failed to update. Please try again.");
      } else {
        setVaccinations(prev => 
          prev.map(v => v.id === id ? { ...v, status: "completed" as const } : v)
        );
      }
    } catch (e) {
      console.error("Error:", e);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "completed": return { bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle2 size={16} />, gradient: "from-emerald-400 to-emerald-600" };
      case "upcoming": return { bg: "bg-blue-100", text: "text-blue-700", icon: <Clock size={16} />, gradient: "from-blue-400 to-blue-600" };
      case "overdue": return { bg: "bg-red-100", text: "text-red-700", icon: <AlertCircle size={16} />, gradient: "from-red-400 to-red-600" };
      default: return { bg: "bg-slate-100", text: "text-slate-700", icon: <Syringe size={16} />, gradient: "from-slate-400 to-slate-600" };
    }
  };

  const completedCount = vaccinations.filter(v => v.status === "completed").length;
  const upcomingCount = vaccinations.filter(v => v.status === "upcoming").length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2db3a0] to-[#00509d] bg-clip-text text-transparent">
            Vaccinations
          </h1>
          <p className="text-slate-500 mt-1">Track and manage your immunization schedule</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#2db3a0] to-[#00509d] text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-teal-200"
        >
          <Plus size={20} />
          Add Vaccine
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Vaccines</p>
              <p className="text-4xl font-bold text-slate-800 mt-2">{vaccinations.length}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl text-white shadow-lg shadow-purple-200">
              <Syringe size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Completed</p>
              <p className="text-4xl font-bold text-emerald-600 mt-2">{completedCount}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200">
              <CheckCircle2 size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Upcoming</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{upcomingCount}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Calendar size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Vaccines List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#2db3a0] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500">Loading vaccinations...</p>
          </div>
        </div>
      ) : vaccinations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#2db3a0]/20 to-[#00509d]/20 rounded-full flex items-center justify-center mb-6">
            <Syringe className="text-[#2db3a0]" size={36} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Vaccinations Yet</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">Start tracking your immunization history by adding your first vaccine record.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-[#2db3a0] to-[#00509d] text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg"
          >
            Add Your First Vaccine
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">📋 Vaccination Records</h2>
          
          {vaccinations.map((vaccine) => {
            const statusStyle = getStatusStyles(vaccine.status);
            return (
              <div 
                key={vaccine.id} 
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${statusStyle.gradient} flex items-center justify-center shadow-lg`}>
                  <Syringe className="text-white" size={26} />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">{vaccine.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Calendar size={14} />
                      {new Date(vaccine.due_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    {vaccine.notes && (
                      <span className="text-sm text-slate-400">• {vaccine.notes}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {vaccine.status === "upcoming" && (
                    <button
                      onClick={() => markAsComplete(vaccine.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-full transition-colors shadow-sm"
                    >
                      <CheckCircle2 size={16} />
                      Mark Complete
                    </button>
                  )}
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold capitalize ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.icon}
                    {vaccine.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {/* Add Vaccine Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#2db3a0] to-[#00509d] rounded-xl">
                  <Syringe className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Add Vaccine</h2>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Vaccine Name with Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Vaccine Name *
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={vaccineName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => vaccineName.length > 0 && setShowSuggestions(filteredSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Type to search vaccines..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2db3a0]/50 focus:border-[#2db3a0] transition-all"
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-50 last:border-0 flex items-center gap-2"
                      >
                        <Syringe size={14} className="text-[#2db3a0]" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Due Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2db3a0]/50 focus:border-[#2db3a0] transition-all"
                />
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStatus("upcoming")}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      status === "upcoming" 
                        ? "bg-blue-100 text-blue-700 border-2 border-blue-300" 
                        : "bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100"
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setStatus("completed")}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      status === "completed" 
                        ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300" 
                        : "bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100"
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2db3a0]/50 focus:border-[#2db3a0] transition-all resize-none"
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVaccine}
                disabled={!vaccineName.trim() || !dueDate || saving}
                className="flex-1 py-3 bg-gradient-to-r from-[#2db3a0] to-[#00509d] text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Add Vaccine"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
