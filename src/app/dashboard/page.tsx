"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { Activity, ShieldAlert, User, Syringe, MapPin, MessageSquare, Heart, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/app/actions/dashboard";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<{
    vaccineCount: number;
    outbreakCount: number;
    nextDue: string | null;
    healthScore: number;
  }>({
    vaccineCount: 0,
    outbreakCount: 0,
    nextDue: "Loading...",
    healthScore: 92
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      try {
        const data = await getDashboardStats(user.id);
        setStats(data);
      } catch (e) {
        console.error("Failed to load dashboard stats", e);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadStats();
    }
  }, [user]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#2db3a0] to-[#00509d] rounded-3xl p-8 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Good Morning, {profile?.name?.split(' ')[0] || "Guest"}! 👋</h1>
              <p className="text-white/80">Here's your health overview for today</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Health Score</p>
              <p className="text-2xl font-bold mt-1">{stats.healthScore}%</p>
              <TrendingUp className="w-4 h-4 mt-2 text-green-300" />
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Active Outbreaks</p>
              <p className="text-2xl font-bold mt-1">{stats.outbreakCount}</p>
              <p className="text-[10px] text-white/50 mt-1">Verified Alerts</p>
              <ShieldAlert className="w-4 h-4 mt-2 text-yellow-300" />
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Immunization</p>
              <p className="text-2xl font-bold mt-1">{stats.vaccineCount}</p>
              <p className="text-[10px] text-white/50 mt-1">Pending</p>
              <Calendar className="w-4 h-4 mt-2 text-blue-300" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Chat */}
        <Link href="/chat" className="group">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-[#2db3a0] to-[#00509d] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-teal-200">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">AI Doctor Chat</h3>
            <p className="text-slate-500 text-sm mt-1">Get instant health advice from our AI assistant</p>
          </div>
        </Link>

        {/* Card 2: Vaccinations */}
        <Link href="/vaccinations" className="group">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-200">
              <Syringe className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Vaccinations</h3>
            <p className="text-slate-500 text-sm mt-1">
              {stats.nextDue ? `Next: ${stats.nextDue}` : "All Caught Up!"}
            </p>
          </div>
        </Link>
        
        {/* Card 3: Map */}
        <Link href="/outbreak-map" className="group">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-red-200">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Outbreak Map</h3>
            <p className="text-slate-500 text-sm mt-1">View disease alerts in your area</p>
          </div>
        </Link>
      </div>

      {/* Health Tips */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">💡 Daily Health Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <span className="text-2xl">🥦</span>
            <div>
              <p className="font-semibold text-slate-700">Eat More Greens</p>
              <p className="text-sm text-slate-500">Include leafy vegetables in your daily diet</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <span className="text-2xl">💧</span>
            <div>
              <p className="font-semibold text-slate-700">Stay Hydrated</p>
              <p className="text-sm text-slate-500">Drink at least 8 glasses of water daily</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
            <span className="text-2xl">🏃</span>
            <div>
              <p className="font-semibold text-slate-700">Exercise Regularly</p>
              <p className="text-sm text-slate-500">30 minutes of activity keeps you fit</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <span className="text-2xl">😴</span>
            <div>
              <p className="font-semibold text-slate-700">Sleep Well</p>
              <p className="text-sm text-slate-500">Aim for 7-8 hours of quality sleep</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
