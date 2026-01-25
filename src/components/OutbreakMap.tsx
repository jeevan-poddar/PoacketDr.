'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons
const iconUrl = (color: string) =>
  `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`;

const createIcon = (color: string) => new L.Icon({
  iconUrl: iconUrl(color),
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper: Get Color based on Severity
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'High': return '#ef4444';   // Red
    case 'Medium': return '#f97316'; // Orange
    case 'Low': return '#3b82f6';    // Blue
    default: return '#3b82f6';
  }
};

// Helper: Get Icon Color Name
const getIconColor = (severity: string) => {
  switch (severity) {
    case 'High': return 'red';
    case 'Medium': return 'orange';
    case 'Low': return 'blue';
    default: return 'blue';
  }
};

// Helper: Handle clicks
function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Helper: Fly to location
function FlyToLocation({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      // Zoom out slightly (11) to see the full 20km circle
      map.flyTo(coords, 11, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

export default function OutbreakMap({
  alerts,
  onMapClick,
  focusedLocation
}: {
  alerts: any[],
  onMapClick: (lat: number, lng: number) => void,
  focusedLocation: [number, number] | null
}) {

  const defaultCenter = [28.4744, 77.5040];

  return (
    <MapContainer
      center={defaultCenter as [number, number]}
      zoom={10} // Zoomed out default to fit large circles
      style={{ height: "100%", width: "100%", borderRadius: "1.5rem" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationMarker onLocationSelect={onMapClick} />
      <FlyToLocation coords={focusedLocation} />

      {alerts.map((alert) => (
        alert.lat && alert.lng ? (
          <div key={alert.id}>
            {/* 1. Transparent Risk Circle (20km Radius) */}
            <Circle
              center={[alert.lat, alert.lng]}
              radius={20000} // 20 km = 20,000 meters
              pathOptions={{
                color: getSeverityColor(alert.severity),       // Border Color
                fillColor: getSeverityColor(alert.severity),   // Fill Color
                fillOpacity: 0.15,                             // Slightly more transparent for large areas
                weight: 1                                      // Border width
              }}
            />

            {/* 2. Pin Marker */}
            <Marker
              position={[alert.lat, alert.lng]}
              icon={createIcon(getIconColor(alert.severity))}
            >
              <Popup className="font-sans">
                <div className="p-1 min-w-[150px]">
                  <h3 className="font-bold text-slate-900">{alert.title}</h3>
                  <p className="text-xs text-slate-500 my-1">{alert.location}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white`}
                    style={{ backgroundColor: getSeverityColor(alert.severity) }}>
                    {alert.severity} Risk
                  </span>
                  <p className="text-xs mt-2 text-slate-600 line-clamp-3">{alert.description}</p>
                </div>
              </Popup>
            </Marker>
          </div>
        ) : null
      ))}
    </MapContainer>
  );
}