"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface Alert {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: "high" | "medium" | "low";
  radius?: number;
}

interface OutbreakMapProps {
  alerts: Alert[];
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

export default function OutbreakMap({ alerts, userLocation, focusLocation }: OutbreakMapProps) {
  // Center on India by default
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lon]);
    }
  }, [userLocation]);

  useEffect(() => {
    if (focusLocation) {
      setMapCenter([focusLocation.lat, focusLocation.lon]);
    }
  }, [focusLocation]);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "high": 
        return { 
          marker: { color: "#dc2626", fillColor: "#ef4444" },
          circle: { color: "#fecaca", fillColor: "#fee2e2" },
          badge: "bg-red-500 text-white"
        };
      case "medium": 
        return { 
          marker: { color: "#ea580c", fillColor: "#f97316" },
          circle: { color: "#fed7aa", fillColor: "#ffedd5" },
          badge: "bg-orange-500 text-white"
        };
      case "low": 
        return { 
          marker: { color: "#ca8a04", fillColor: "#eab308" },
          circle: { color: "#fef08a", fillColor: "#fef9c3" },
          badge: "bg-yellow-500 text-white"
        };
      default: 
        return { 
          marker: { color: "#6b7280", fillColor: "#9ca3af" },
          circle: { color: "#e5e7eb", fillColor: "#f3f4f6" },
          badge: "bg-gray-500 text-white"
        };
    }
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      scrollWheelZoom={true}
      className="h-full w-full z-0"
      style={{ background: "#f1f5f9" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Control map movement */}
      <MapController center={mapCenter} />

      {/* User Location Marker */}
      {userLocation && (
        <Marker 
          position={[userLocation.lat, userLocation.lon]}
          icon={defaultIcon}
        >
          <Popup>
            <div className="text-center">
              <span className="font-bold text-slate-800">Available Location</span>
              <p className="text-xs text-slate-500">You are here</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Outbreak radius circles (outer glow) */}
      {alerts.map((alert) => {
        const styles = getSeverityStyles(alert.severity);
        return (
          <Circle
            key={`outer-${alert.id}`}
            center={[alert.latitude, alert.longitude]}
            radius={(alert.radius || 10) * 8000}
            pathOptions={{
              color: styles.circle.color,
              fillColor: styles.circle.fillColor,
              fillOpacity: 0.4,
              weight: 2,
              dashArray: "8, 4",
            }}
          />
        );
      })}
      
      {/* Center markers with popups */}
      {alerts.map((alert) => {
        const styles = getSeverityStyles(alert.severity);
        return (
          <CircleMarker
            key={alert.id}
            center={[alert.latitude, alert.longitude]}
            radius={12}
            pathOptions={{
              color: styles.marker.color,
              fillColor: styles.marker.fillColor,
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                {/* Severity badge */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase mb-2 ${styles.badge}`}>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  {alert.severity} risk
                </span>
                
                {/* Title */}
                <h3 className="font-bold text-base text-slate-800 mt-1">
                  {alert.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-slate-600 mt-1 leading-snug">
                  {alert.description}
                </p>
                
                {/* Tips */}
                <div className="bg-slate-50 rounded-lg p-2 mt-2 text-xs text-slate-500">
                  <strong>⚠️ Stay safe:</strong> Follow local guidelines
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
