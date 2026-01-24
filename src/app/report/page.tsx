"use client";

import { useState, useRef } from "react";
import { submitOutbreak } from "@/app/actions/alerts";
import { MapPin, Navigation, AlertTriangle, Send } from "lucide-react";

export default function ReportPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const getLocation = () => {
    setLocationError("");
    setLoading(true);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6))
        });
        setLoading(false);
      },
      (error) => {
        console.error("Error getting location", error);
        setLocationError("Unable to retrieve your location. Please check browser permissions.");
        setLoading(false);
      }
    );
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setSuccess(false);
    
    // Explicitly append lat/lng if not detected by form (though they should be via hidden inputs)
    // But better reliance is on the hidden inputs being present in the form data
    
    // Client-side validation
    const lat = formData.get("latitude");
    const lng = formData.get("longitude");

    if (!lat || !lng || lat === "0" || lng === "0") {
        alert("Please detect your location first.");
        setLoading(false);
        return;
    }

    const result = await submitOutbreak(formData);

    if (result.success) {
        setSuccess(true);
        formRef.current?.reset();
        setCoords(null);
    } else {
        alert("Failed to submit report: " + result.error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white text-center">
          <div className="mx-auto bg-red-500 w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-red-500/30 animate-pulse">
            <AlertTriangle size={24} />
          </div>
          <h1 className="text-2xl font-bold">Report an Outbreak</h1>
          <p className="text-slate-400 text-sm mt-1">Help your community stay safe</p>
        </div>

        <form ref={formRef} action={handleSubmit} className="p-8 space-y-6">
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="bg-green-200 p-1 rounded-full">✓</span>
              Report submitted successfully! Pending verification.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Issue Title <span className="text-red-500">*</span></label>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g. High fever cases"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City</label>
                <input
                  name="city"
                  type="text"
                  placeholder="e.g. New Delhi"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State</label>
                <input
                  name="state"
                  type="text"
                  placeholder="e.g. Delhi"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm"
                />
              </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location <span className="text-red-500">*</span></label>
            
            {/* Hidden Inputs for Server Action */}
            <input type="hidden" name="latitude" value={coords?.lat || 0} />
            <input type="hidden" name="longitude" value={coords?.lng || 0} />

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                 {!coords ? (
                    <button
                        type="button"
                        onClick={getLocation}
                        className="w-full py-3 rounded-lg bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:shadow-md transition-all text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <Navigation size={18} />
                        📍 Detect My Location
                    </button>
                 ) : (
                    <div className="flex items-center justify-center gap-2 text-green-700 font-bold bg-green-50 p-3 rounded-lg border border-green-200">
                        <MapPin size={18} />
                        Location Detected: [{coords.lat}, {coords.lng}]
                    </div>
                 )}
                 {locationError && <p className="text-red-500 text-xs mt-2 font-medium">{locationError}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description <span className="text-red-500">*</span></label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Please provide details..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Send size={18} />
                Submit Report
              </>
            )}
          </button>
          
          <p className="text-xs text-center text-slate-400">
            Reports are verified by health officials before being public.
          </p>
        </form>
      </div>
    </div>
  );
}
