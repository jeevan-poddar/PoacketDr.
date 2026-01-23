"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getAlerts, Alert } from "@/app/actions/alerts";
import { MapPin, AlertTriangle, Activity, Shield, RefreshCw, Info, Wind, Thermometer, Droplets, Navigation } from "lucide-react";

// Dynamic import with SSR disabled
const OutbreakMap = dynamic(() => import("@/components/OutbreakMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-50 rounded-2xl">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-[#2db3a0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium">Loading outbreak data...</p>
      </div>
    </div>
  ),
});

interface LocationData {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  visibility: number;
}

interface AQIData {
  aqi: number;
  level: string;
  color: string;
  pm25: number;
  pm10: number;
}

export default function MapPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aqi, setAqi] = useState<AQIData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    fetchAlerts();
    getUserLocation();
  }, []);

  async function fetchAlerts() {
    try {
      // Use Server Action instead of direct DB call to get Fallback Data support
      const data = await getAlerts();
      if (data) setAlerts(data);
    } catch (e) {
       console.error("Failed to fetch alerts", e);
    }
  }

  function getUserLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchLocationData(latitude, longitude);
      },
      (error) => {
        // Error handled via state below
        // Fallback to Delhi, India
        fetchLocationData(28.6139, 77.2090);
        setLocationError("Using default location (Delhi)");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function fetchLocationData(lat: number, lon: number) {
    try {
      // Fetch location name using reverse geocoding (free API)
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const geoData = await geoRes.json();
      
      // Check multiple address fields for location name (Greater Noida might be suburb/county/etc)
      const addr = geoData.address || {};
      const cityName = addr.city || addr.suburb || addr.town || addr.county || 
                       addr.state_district || addr.district || addr.municipality || 
                       addr.village || addr.hamlet || "Unknown";
      const stateName = addr.state || "";
      
      setLocation({
        city: cityName,
        country: stateName ? `${stateName}, ${addr.country || "India"}` : (addr.country || "India"),
        lat,
        lon,
      });

      // Fetch weather data using Open-Meteo (free, no API key needed)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility`
      );
      const weatherData = await weatherRes.json();
      
      if (weatherData.current) {
        const weatherCode = weatherData.current.weather_code;
        setWeather({
          temp: Math.round(weatherData.current.temperature_2m),
          humidity: weatherData.current.relative_humidity_2m,
          description: getWeatherDescription(weatherCode),
          icon: getWeatherIcon(weatherCode),
          windSpeed: Math.round(weatherData.current.wind_speed_10m),
          visibility: Math.round((weatherData.current.visibility || 10000) / 1000),
        });
      }

      // Fetch AQI data using Open-Meteo Air Quality API (free)
      const aqiRes = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,us_aqi`
      );
      const aqiData = await aqiRes.json();
      
      if (aqiData.current) {
        const aqiValue = aqiData.current.us_aqi || 50;
        setAqi({
          aqi: aqiValue,
          level: getAQILevel(aqiValue),
          color: getAQIColor(aqiValue),
          pm25: Math.round(aqiData.current.pm2_5 || 0),
          pm10: Math.round(aqiData.current.pm10 || 0),
        });
      }
    } catch (e) {
      // Error handled via silent fail or UI message if needed
    } finally {
      setLoadingLocation(false);
    }
  }

  function getWeatherDescription(code: number): string {
    if (code === 0) return "Clear sky";
    if (code <= 3) return "Partly cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 57) return "Drizzle";
    if (code <= 67) return "Rain";
    if (code <= 77) return "Snow";
    if (code <= 82) return "Rain showers";
    if (code <= 86) return "Snow showers";
    return "Thunderstorm";
  }

  function getWeatherIcon(code: number): string {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 86) return "🌨️";
    return "⛈️";
  }

  function getAQILevel(aqi: number): string {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  }

  function getAQIColor(aqi: number): string {
    if (aqi <= 50) return "bg-green-500";
    if (aqi <= 100) return "bg-yellow-500";
    if (aqi <= 150) return "bg-orange-500";
    if (aqi <= 200) return "bg-red-500";
    if (aqi <= 300) return "bg-purple-500";
    return "bg-rose-900";
  }

  const highCount = alerts.filter(a => a.severity === "high").length;
  const mediumCount = alerts.filter(a => a.severity === "medium").length;
  const lowCount = alerts.filter(a => a.severity === "low").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2db3a0] to-[#00509d] bg-clip-text text-transparent">
            Outbreak Map
          </h1>
          <p className="text-slate-500 mt-1">Real-time disease & environment alerts</p>
        </div>
        <button 
          onClick={() => { fetchAlerts(); getUserLocation(); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Location & Weather Card */}
      <div className="bg-gradient-to-r from-[#2db3a0] to-[#00509d] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="relative z-10">
          {loadingLocation ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Detecting your location...</span>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Location Info */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Navigation size={24} />
                </div>
                <div>
                  <p className="text-white/70 text-sm flex items-center gap-1">
                    <MapPin size={14} /> Your Location
                  </p>
                  <h2 className="text-2xl font-bold">
                    {location?.city || "Unknown"}, {location?.country || ""}
                  </h2>
                  {locationError && (
                    <p className="text-white/60 text-xs mt-1">{locationError}</p>
                  )}
                </div>
              </div>

              {/* Weather */}
              {weather && (
                <div className="flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-center">
                    <span className="text-4xl">{weather.icon}</span>
                    <p className="text-xs text-white/70 mt-1">{weather.description}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <Thermometer size={18} className="mx-auto text-white/70" />
                      <p className="text-xl font-bold">{weather.temp}°C</p>
                      <p className="text-xs text-white/60">Temp</p>
                    </div>
                    <div className="text-center">
                      <Droplets size={18} className="mx-auto text-white/70" />
                      <p className="text-xl font-bold">{weather.humidity}%</p>
                      <p className="text-xs text-white/60">Humidity</p>
                    </div>
                    <div className="text-center">
                      <Wind size={18} className="mx-auto text-white/70" />
                      <p className="text-xl font-bold">{weather.windSpeed}</p>
                      <p className="text-xs text-white/60">km/h</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AQI */}
              {aqi && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-xs text-white/70 mb-2">Air Quality Index</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 ${aqi.color} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {aqi.aqi}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{aqi.level}</p>
                      <p className="text-xs text-white/60">PM2.5: {aqi.pm25} | PM10: {aqi.pm10}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl text-white">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total</p>
              <p className="text-xl font-bold text-slate-800">{alerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">High</p>
              <p className="text-xl font-bold text-red-600">{highCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl text-white">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Medium</p>
              <p className="text-xl font-bold text-orange-600">{mediumCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl text-white">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Low</p>
              <p className="text-xl font-bold text-yellow-600">{lowCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative z-0">
          <div className="h-[450px]">
            <OutbreakMap 
              alerts={alerts} 
              userLocation={location ? { lat: location.lat, lon: location.lon } : null} 
              focusLocation={focusedLocation}
            />
          </div>
        </div>

        {/* Sidebar - Alert List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Active Alerts
          </h2>
          
          {alerts.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No alerts found</p>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => setFocusedLocation({ lat: alert.lat, lon: alert.lng })}
                  className={`p-3 rounded-xl border-l-4 cursor-pointer transition-all hover:shadow-md ${
                    alert.severity === "high" 
                      ? "bg-red-50 border-red-500 hover:bg-red-100" 
                      : alert.severity === "medium"
                      ? "bg-orange-50 border-orange-500 hover:bg-orange-100"
                      : "bg-yellow-50 border-yellow-500 hover:bg-yellow-100"
                  }`}
                >
                  <h3 className="font-semibold text-slate-800 text-sm">{alert.title}</h3>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{alert.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend & Safety */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Info size={16} className="text-[#2db3a0]" />
            Severity Legend
          </h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500"></span>
              <span className="text-slate-600">High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-orange-500"></span>
              <span className="text-slate-600">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
              <span className="text-slate-600">Low</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-5">
          <h3 className="font-bold text-red-900 mb-2">🚨 Stay Safe</h3>
          <p className="text-red-800 text-sm">Wash hands frequently • Avoid crowded areas • Follow local health advisories</p>
        </div>
      </div>
    </div>
  );
}
