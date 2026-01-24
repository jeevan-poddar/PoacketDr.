"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Alert, getAlerts, reportAlert } from "@/app/actions/alerts";
import { MapPin, Plus, X, Ambulance, ShieldAlert } from "lucide-react";

// Fix for default marker icon in Leaflet
const iconUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Reuse existing Props interface but make alerts optional since we fetch them
interface OutbreakMapProps {
  alerts?: Alert[];
  userLocation: { lat: number; lon: number } | null;
  focusLocation?: { lat: number; lon: number } | null;
}

// Component to handle map movement
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, 5, {
      duration: 1.5,
    });
  }, [center, map]);
  
  return null;
}

export default function OutbreakMap({ alerts: initialAlerts, userLocation, focusLocation }: OutbreakMapProps) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts || []);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India default
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    severity: "medium",
    description: "",
    city: "",
    state: ""
  });

  // Fetch alerts on mount if not provided
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!initialAlerts || initialAlerts.length === 0) {
        const fetched = await getAlerts();
        setAlerts(fetched);
      }
    };
    fetchAlerts();
  }, [initialAlerts]);

  // Sync map center
  useEffect(() => {
    if (userLocation) setMapCenter([userLocation.lat, userLocation.lon]);
  }, [userLocation?.lat, userLocation?.lon]);

  useEffect(() => {
    if (focusLocation) setMapCenter([focusLocation.lat, focusLocation.lon]);
  }, [focusLocation?.lat, focusLocation?.lon]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Create Optimistic Alert
    const newAlert: Alert = {
      id: `temp-${Date.now()}`,
      title: formData.title,
      description: formData.description || "Reported via Outbreak Alert System",
      // Use map center or user location for the report
      latitude: userLocation?.lat || mapCenter[0], 
      longitude: userLocation?.lon || mapCenter[1],
      severity: formData.severity as "high" | "medium" | "low",
      radius: 5 // default radius
    };

    // 2. Optimistic Update
    setAlerts((prev) => [...prev, newAlert]);
    setIsReportOpen(false);
    setShowToast(true);
    setFormData({ title: "", severity: "medium", description: "", city: "", state: "" });

    // Hide toast after 3s
    setTimeout(() => setShowToast(false), 3000);

    // 3. Server Action (Fire and forget from UI perspective, but handles errors internally)
    await reportAlert({
      title: newAlert.title,
      severity: newAlert.severity,
      latitude: newAlert.latitude,
      longitude: newAlert.longitude,
      description: newAlert.description,
      city: formData.city,
      state: formData.state
    });
    
    // Reset form properly
    setFormData({ title: "", severity: "medium", description: "", city: "", state: "" });
  };


  const getSeverityStyles = (severity: string) => {
    const s = severity?.toLowerCase() || "";
    if (s === "critical" || s === "high") {
      return { 
        marker: { color: "#ef4444", fillColor: "#ef4444" }, // Red
        circle: { color: "#fecaca", fillColor: "#fee2e2" },
        badge: "bg-red-500 text-white"
      };
    }
    if (s === "medium") {
      return { 
        marker: { color: "#f97316", fillColor: "#f97316" }, // Orange
        circle: { color: "#fed7aa", fillColor: "#ffedd5" },
        badge: "bg-orange-500 text-white"
      };
    }
    if (s === "low") {
      return { 
        marker: { color: "#ca8a04", fillColor: "#facc15" }, // Yellow/Gold
        circle: { color: "#fef08a", fillColor: "#fef9c3" },
        badge: "bg-yellow-500 text-white"
      };
    }
    // Default fallback (treat unknown as Red/Danger)
    return { 
      marker: { color: "#ef4444", fillColor: "#ef4444" },
      circle: { color: "#fecaca", fillColor: "#fee2e2" },
      badge: "bg-red-500 text-white"
    };
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl shadow-inner border border-slate-200">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom={true} // Enabled for interactivity
        className="h-full w-full z-0"
        style={{ background: "#f1f5f9" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={mapCenter} />

        {/* User Location */}
        {userLocation && (
          <Marker position={[userLocation!.lat, userLocation!.lon]} icon={defaultIcon}>
            <Popup>
              <div className="text-center font-sans">
                <span className="font-bold text-slate-800 block">Your Location</span>
                <span className="text-xs text-slate-500">Reporting from here</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Alerts */}
        {alerts.map((alert) => {
          // Safety Check: Strict Casting & Validation
          const lat = Number(alert.latitude);
          const lng = Number(alert.longitude);
          
          // Strict check: Must be non-zero (unless 0,0 is valid, but usually implies default/missing for this app) and valid numbers
          // Also explicitly checking for 0 because sometimes that's the default "missing" value in DBs
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

          const safeSeverity = alert.severity || "medium";
          const styles = getSeverityStyles(safeSeverity);
          const safeTitle = alert.title || "Unknown Alert";
          const safeDescription = alert.description || "No details available.";

          return (
            <div key={alert.id}>
              {/* Radius Circle */}
              <Circle
                center={[lat, lng]}
                radius={alert.radius || 500}
                pathOptions={{
                  color: styles.circle.color,
                  fillColor: styles.circle.fillColor,
                  fillOpacity: 0.4,
                  weight: 1,
                  dashArray: "4, 4",
                }}
              />
              {/* Pin */}
              <CircleMarker
                center={[lat, lng]}
                radius={12}
                pathOptions={{
                  color: styles.marker.color,
                  fillColor: styles.marker.fillColor,
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[200px] font-sans">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-2 ${styles.badge}`}>
                      {safeSeverity} Risk
                    </span>
                    <h3 className="font-bold text-base text-slate-900 m-0">{safeTitle}</h3>
                    <p className="text-sm text-slate-600 mt-1 mb-2 leading-tight">{safeDescription}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 border-t pt-2">
                       <ShieldAlert size={14} />
                       <span>Official Alert</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}
      </MapContainer>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsReportOpen(true)}
        className="absolute bottom-6 right-6 z-[1000] bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2 group"
      >
        <Plus size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-bold">
          Report Outbreak
        </span>
      </button>

      {/* Report Modal */}
      {isReportOpen && (
        <div className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Ambulance size={20} />
                Report Outbreak
              </h2>
              <button 
                onClick={() => setIsReportOpen(false)}
                className="hover:bg-red-700 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Disease Name / Issue
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unknown Viral Fever"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    City/District
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Delhi"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Severity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "low", label: "Low", color: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200" },
                    { val: "medium", label: "Med", color: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200" },
                    { val: "high", label: "High", color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setFormData({...formData, severity: opt.val})}
                      className={`p-2 rounded-lg border text-sm font-bold transition-all ${
                        formData.severity === opt.val 
                          ? "ring-2 ring-offset-1 ring-slate-900 scale-105 " + opt.color 
                          : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100 " + opt.color
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                   rows={2}
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
                   placeholder="Enter any additional details..."
                   value={formData.description}
                   onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                >
                  <MapPin size={18} />
                  Report to Authorities
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Location will be pinned to center of map
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2000] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3">
             <div className="bg-green-500 rounded-full p-1 text-slate-900">
               <ShieldAlert size={14} fill="currentColor" />
             </div>
             <div>
               <h4 className="font-bold text-sm">Alert Submitted</h4>
               <p className="text-xs text-slate-400">Authorities have been notified.</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
