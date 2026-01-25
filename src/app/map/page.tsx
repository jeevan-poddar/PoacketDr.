'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldAlert, AlertTriangle,
  MapPin, Plus, X, Loader2, CheckCircle2, LocateFixed, Navigation
} from 'lucide-react';

// Dynamically import Map
const OutbreakMap = dynamic(() => import('@/components/OutbreakMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-3xl text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  )
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Alert = {
  id: string;
  title: string;
  location: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  status: 'verified' | 'pending';
  lat: number;
  lng: number;
  created_at: string;
};

export default function MapPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Map State
  const [focusedLocation, setFocusedLocation] = useState<[number, number] | null>(null);

  const router = useRouter();

  // Report Form States
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSeverity, setNewSeverity] = useState('Medium');
  const [newDesc, setNewDesc] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);

  // --- FETCH VERIFIED ALERTS ---
  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'verified')
        .order('created_at', { ascending: false });

      if (data) setAlerts(data as Alert[]);
      setLoading(false);
    };

    fetchAlerts();
  }, []);

  // --- HANDLE LIST CLICK (Fly to Pin) ---
  const handleAlertClick = (alertItem: Alert) => {
    if (alertItem.lat && alertItem.lng) {
      setFocusedLocation([alertItem.lat, alertItem.lng]);
    } else {
      window.alert("No coordinates available for this report.");
    }
  };

  // --- HANDLE MAP CLICK (Set Pin for Report) ---
  const handleMapClick = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    setIsReportOpen(true);
    setNewLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  // --- SUBMIT REPORT ---
  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await supabase
      .from('alerts')
      .insert([{
        title: newTitle,
        location: newLocation,
        severity: newSeverity,
        description: newDesc,
        status: 'pending',
        lat: selectedCoords?.lat || null,
        lng: selectedCoords?.lng || null
      }]);

    if (!error) {
      setSubmitted(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setSubmitted(false);
        setNewTitle('');
        setNewLocation('');
        setNewDesc('');
        setSelectedCoords(null);
      }, 2000);
    } else {
      window.alert("Failed to report.");
    }
    setIsSaving(false);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#F4F1FF] font-sans selection:bg-purple-200 flex flex-col">

      {/* Header */}
      <header className="flex-none p-4 md:p-6 flex items-center justify-between z-20 bg-white/80 backdrop-blur-md border-b border-white/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-slate-600 hover:text-purple-600 shadow-sm border border-slate-100 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-bold text-sm hidden md:inline">Dashboard</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full border border-red-200">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Bio-Radar</span>
          </div>
        </div>

        <button
          onClick={() => { setSelectedCoords(null); setIsReportOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-full shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all text-sm font-bold active:scale-95"
        >
          <Plus className="w-4 h-4" /> <span className="hidden md:inline">Report Outbreak</span>
        </button>
      </header>

      {/* Main Content: Split View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10 p-4 md:p-6 gap-6">

        {/* LEFT: ALERT LIST */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-hidden h-full">
          <h2 className="text-xl font-extrabold text-slate-800 shrink-0 px-2">Verified Threats</h2>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-20 scrollbar-hide">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 bg-white/50 rounded-3xl animate-pulse" />)
            ) : alerts.length === 0 ? (
              <div className="text-center py-12 bg-white/40 rounded-3xl border border-white/50 border-dashed">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3 opacity-50" />
                <p className="text-slate-500 font-medium">No verified threats in your area.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className="group bg-white/80 backdrop-blur-sm border border-white/60 p-5 rounded-3xl shadow-sm hover:shadow-md hover:bg-white hover:scale-[1.02] transition-all relative overflow-hidden cursor-pointer active:scale-95"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                    ${alert.severity === 'High' ? 'bg-red-500' :
                      alert.severity === 'Medium' ? 'bg-orange-400' : 'bg-blue-400'}`}
                  />
                  <div className="pl-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 group-hover:text-purple-700 transition-colors">{alert.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${alert.severity === 'High' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" /> {alert.location}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{alert.description}</p>

                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Navigation className="w-3 h-3" /> Show on Map
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: MAP */}
        <div className="w-full md:w-2/3 h-[400px] md:h-full bg-white rounded-[2rem] shadow-xl border border-white/50 overflow-hidden relative">
          <OutbreakMap
            alerts={alerts}
            onMapClick={handleMapClick}
            focusedLocation={focusedLocation}
          />

          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-500 z-[400] pointer-events-none flex items-center gap-2 border border-slate-100">
            <LocateFixed className="w-3 h-3 text-purple-600" />
            Click map to report location
          </div>
        </div>

      </div>

      {/* REPORT MODAL */}
      <AnimatePresence>
        {isReportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setIsReportOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {submitted ? (
                <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Report Submitted</h3>
                  <p className="text-slate-500 text-sm">Your report has been sent to the admin team for verification.</p>
                </div>
              ) : (
                <>
                  <div className="p-6 bg-red-50 border-b border-red-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5" /> Report Outbreak
                    </h3>
                    <button onClick={() => setIsReportOpen(false)} className="p-2 hover:bg-white rounded-full text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleReport} className="p-6 space-y-4">

                    {/* Coordinates Display */}
                    {selectedCoords && (
                      <div className="bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-blue-700 border border-blue-100">
                        <MapPin className="w-3.5 h-3.5" />
                        Pinned: {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Alert Title</label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Dengue Cluster"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-slate-800 text-sm font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Location Name</label>
                        <input
                          type="text"
                          required
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          placeholder="Sector / Area"
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-slate-800 text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Severity</label>
                        <select
                          value={newSeverity}
                          onChange={(e) => setNewSeverity(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-slate-800 text-sm font-medium"
                        >
                          <option value="Low">Low Risk</option>
                          <option value="Medium">Medium Risk</option>
                          <option value="High">High Risk</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                      <textarea
                        rows={3}
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Details..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-slate-800 resize-none text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/30 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 mt-2"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Submit Report"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}