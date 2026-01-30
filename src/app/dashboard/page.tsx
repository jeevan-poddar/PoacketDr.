'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageSquarePlus, Sparkles, ChevronRight,
  Activity, Syringe, Bell, Loader2
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [userName, setUserName] = useState('Friend'); // Default name
  const [alertCount, setAlertCount] = useState<number>(0);
  const [vaccineCount, setVaccineCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get Current User
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // 2. FETCH NAME: Get full_name from 'user_profiles' table
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          // Extract first name
          setUserName(profile.full_name.split(' ')[0]);
        }

        // 3. REAL DATA: Count Active Alerts
        const { count: activeAlerts } = await supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'verified');

        // 4. REAL DATA: Count Pending/Overdue Vaccines
        const { count: pendingVax } = await supabase
          .from('vaccinations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['pending', 'overdue']);

        setAlertCount(activeAlerts || 0);
        setVaccineCount(pendingVax || 0);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F1FF]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F4F1FF] font-sans selection:bg-purple-200">
      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 max-w-6xl mx-auto p-6 md:p-12">

        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">PocketDr.</span>
          </div>

          {/* Added Profile Link in Header for easy access */}
          <Link href="/profile" className="w-10 h-10 rounded-full bg-white border border-purple-100 flex items-center justify-center shadow-sm hover:scale-105 transition-transform text-purple-600 font-bold">
            {userName.charAt(0)}
          </Link>
        </header>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-16">
          {/* Left Text */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider"
            >
              <Activity className="w-3 h-3" />
              Health Dashboard
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
              Good Morning,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {userName}
              </span>
            </h1>

            <p className="text-lg text-slate-500 max-w-lg mx-auto md:mx-0">
              Your vitals are looking good. I'm ready to assist you with symptoms, vaccinations, or general health advice.
            </p>

            <Link href="/chat">
              <button className="group mt-4 flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all mx-auto md:mx-0">
                <MessageSquarePlus className="w-6 h-6" />
                Start New Consultation
                <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          {/* Right Avatar (3D) */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 relative w-full max-w-md h-[400px]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/20 to-blue-400/20 rounded-full blur-[80px]" />
            <img
              src="/PocketDr. avatar.png"
              alt="Aiva Avatar"
              className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            />
          </motion.div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Active Alerts Card */}
          <Link href="/map" className="block">
            <DashboardCard
              icon={Bell}
              title="Active Alerts"
              desc={alertCount > 0 ? `${alertCount} Active verified alerts` : "No active alerts"}
              color="bg-red-100 text-red-600"
              badge={alertCount > 0}
              badgeCount={alertCount}
            />
          </Link>

          {/* Immunization Card */}
          <Link href="/vaccinations" className="block">
            <DashboardCard
              icon={Syringe}
              title="Immunization"
              desc={vaccineCount > 0 ? `${vaccineCount} Vaccines pending/overdue` : "All vaccinations up to date"}
              color="bg-blue-100 text-blue-600"
              badge={vaccineCount > 0}
              badgeCount={vaccineCount}
            />
          </Link>

        </div>

      </div>

      {/* Float Animation CSS */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}

// Sub-component for Cards
function DashboardCard({ icon: Icon, title, desc, color, badge, badgeCount }: any) {
  return (
    <div className="group p-6 bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden h-full">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shrink-0`}>
        <Icon className="w-7 h-7" />
      </div>

      <div className="flex-1 pr-6">
        <h3 className="text-xl font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-500 text-sm font-medium">{desc}</p>
      </div>

      {/* Notification Badge with Count */}
      {badge && (
        <div className="absolute top-6 right-6 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/50 animate-pulse">
          {badgeCount}
        </div>
      )}

      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 absolute bottom-6 right-6">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
}