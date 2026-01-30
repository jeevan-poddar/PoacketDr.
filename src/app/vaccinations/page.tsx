'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Syringe, Calendar, CheckCircle2,
  Clock, AlertTriangle, Plus, FileCheck, Loader2, X, Save,
  FileText, CalendarDays, AlertCircle, Hourglass, Trash2
} from 'lucide-react';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- TYPE DEFINITION ---
type Vaccine = {
  id: string;
  name: string;
  status: 'pending' | 'completed';
  date_administered: string; // Planned Start
  due_date: string;          // Deadline
  notes?: string;
};

// Derived Frontend Status
type DisplayStatus = 'upcoming' | 'pending' | 'overdue' | 'completed';

export default function VaccinationPage() {
  // --- STATES ---
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form States
  const [newName, setNewName] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPlannedDate, setNewPlannedDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // --- HELPER: DATE FORMATTER ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchVaccines = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) {
        console.error("Error fetching:", error.message);
      } else if (data) {
        setVaccines(data as Vaccine[]);
      }
      setLoading(false);
    };

    fetchVaccines();
  }, [router]);

  // --- LOGIC: CALCULATE STATUS ---
  const getDisplayStatus = (v: Vaccine): DisplayStatus => {
    if (v.status === 'completed') return 'completed';

    const today = new Date().toISOString().split('T')[0];

    if (today < v.date_administered) return 'upcoming';
    if (today > v.due_date) return 'overdue';
    return 'pending';
  };

  // --- ACTION: MARK AS DONE ---
  const handleMarkAsDone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vaccinations')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;

      setVaccines(prev => prev.map(v =>
        v.id === id ? { ...v, status: 'completed' } : v
      ));

    } catch (err: any) {
      console.error("Error completing:", err.message);
      alert("Failed to update status.");
    }
  };

  // --- ACTION: DELETE VACCINE (No Alert) ---
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('vaccinations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVaccines(prev => prev.filter(v => v.id !== id));
    } catch (err: any) {
      console.error("Error deleting:", err.message);
      alert("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  // --- ACTION: ADD VACCINE ---
  const handleAddVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newDueDate || !newPlannedDate) {
      alert("Please fill in Name, Planned Date, and Due Date.");
      return;
    }

    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // FIX: Write to 'next_due_date', OMIT 'due_date'
      const payload = {
        user_id: user.id,
        name: newName,
        status: 'pending',
        date_administered: newPlannedDate,
        next_due_date: newDueDate,
        notes: newNotes || null
      };

      const { data, error } = await supabase
        .from('vaccinations')
        .insert([payload])
        .select();

      if (error) {
        console.error("Error adding:", error.message);
        alert(`Error: ${error.message}`);
      } else if (data) {
        setVaccines(prev => [...prev, data[0] as Vaccine]);
        setIsAddOpen(false);
        setNewName('');
        setNewDueDate('');
        setNewPlannedDate('');
        setNewNotes('');
      }
    }
    setIsSaving(false);
  };

  // --- FILTER LOGIC ---
  const filteredVaccines = vaccines.filter(v => {
    const status = getDisplayStatus(v);
    if (filter === 'all') return true;
    if (filter === 'completed') return status === 'completed';
    if (filter === 'active') return status !== 'completed';
    return true;
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F4F1FF] font-sans selection:bg-purple-200">


      {/* --- HEADER --- */}
      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-8">
        <header className="flex items-center justify-end mb-8">
          {/* Removed Dashboard Button */}

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg shadow-purple-600/20 hover:opacity-90 active:scale-95 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Vaccine
          </button>
        </header>

        {/* --- HERO SECTION --- */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-blue-200">
            <Syringe className="w-3 h-3" />
            Immunization Tracker
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Your Vaccination Schedule
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto leading-relaxed text-sm md:text-base">
            <span className="inline-block mx-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1"></span>Planned</span>
            <span className="inline-block mx-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1"></span>Pending</span>
            <span className="inline-block mx-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1"></span>Overdue</span>
          </p>
        </div>

        {/* --- TABS --- */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white/40 backdrop-blur-md p-1 rounded-2xl border border-white/50 shadow-sm">
            {['all', 'active', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  relative px-6 py-2 rounded-xl text-sm font-medium transition-all capitalize z-10
                  ${filter === f
                    ? 'bg-white text-purple-600 shadow-sm text-shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/30'}
                `}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* --- LIST SECTION --- */}
        <div className="space-y-4 pb-20">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-32 bg-white/40 rounded-3xl animate-pulse" />)
          ) : filteredVaccines.length === 0 ? (
            <div className="text-center py-16 bg-white/30 backdrop-blur-md rounded-3xl border border-white/40">
              <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/60">
                <FileCheck className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No records found</h3>
              <p className="text-slate-500 text-sm">No vaccinations match this filter.</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredVaccines.map((vax, i) => {
                const status = getDisplayStatus(vax);
                const isDeleting = deletingId === vax.id;

                return (
                  <motion.div
                    key={vax.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isDeleting ? 0.5 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative bg-white/70 backdrop-blur-xl border border-white/60 p-5 rounded-3xl shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row items-start md:items-start gap-4 md:gap-6 pr-12"
                  >
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(vax.id)}
                      disabled={isDeleting}
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Record"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>

                    {/* Status Icon */}
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/50 shadow-sm
                      ${status === 'completed' ? 'bg-green-100 text-green-600' :
                        status === 'overdue' ? 'bg-red-100 text-red-600' :
                          status === 'pending' ? 'bg-amber-100 text-amber-600' :
                            'bg-blue-100 text-blue-600'}
                    `}>
                      {status === 'completed' ? <CheckCircle2 className="w-7 h-7" /> :
                        status === 'overdue' ? <AlertCircle className="w-7 h-7" /> :
                          status === 'pending' ? <Clock className="w-7 h-7" /> :
                            <CalendarDays className="w-7 h-7" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-800">{vax.name}</h3>

                        {/* Status Badges */}
                        {status === 'overdue' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-full border border-red-200">Overdue</span>
                        )}
                        {status === 'pending' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-full border border-amber-200">Pending</span>
                        )}
                        {status === 'upcoming' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full border border-blue-200">Planned</span>
                        )}
                        {status === 'completed' && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full border border-green-200">Done</span>
                        )}
                      </div>

                      {/* Dates Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        {/* Planned Date */}
                        <div className="flex items-center gap-1.5" title="Planned Date">
                          <Hourglass className="w-4 h-4 opacity-70 text-blue-500" />
                          <span className="text-slate-600">Start: {formatDate(vax.date_administered)}</span>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-1.5" title="Deadline">
                          <Clock className={`w-4 h-4 opacity-70 ${status === 'overdue' ? 'text-red-500' : 'text-purple-500'}`} />
                          <span className={`font-medium ${status === 'overdue' ? 'text-red-600' : 'text-slate-600'}`}>
                            Due: {formatDate(vax.due_date)}
                          </span>
                        </div>
                      </div>

                      {/* Notes Row */}
                      {vax.notes && (
                        <div className="flex items-start gap-2 pt-1 text-sm text-slate-500 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                          <FileText className="w-3.5 h-3.5 mt-0.5 opacity-50 shrink-0" />
                          <p className="leading-snug text-xs md:text-sm">{vax.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="w-full md:w-auto mt-2 md:mt-0 self-center">
                      {status === 'completed' ? (
                        <div className="inline-flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-50/50 px-4 py-2 rounded-xl border border-green-100">
                          Verified <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkAsDone(vax.id)}
                          className={`
                            flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95
                            ${status === 'upcoming'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:shadow-md'}
                          `}
                          disabled={status === 'upcoming'}
                          title={status === 'upcoming' ? "Too early to take" : "Mark as Done"}
                        >
                          Mark as Done
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* --- ADD VACCINE MODAL --- */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setIsAddOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50"
            >
              <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-b border-purple-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">Add New Vaccine</h3>
                  <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddVaccine} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-600">Vaccine Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Polio Booster"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Planned Date */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Planned Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={newPlannedDate}
                      onChange={(e) => setNewPlannedDate(e.target.value)}
                      title="Earliest eligible date"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-slate-800 text-sm"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Due Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      title="Deadline"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-600">Notes <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Doctor name, details..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-slate-800 text-sm resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Record</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}