'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion'; // Animation library
import { Lock, Mail, Loader2, ArrowRight, HeartPulse, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/chat');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F4F1FF] flex items-center justify-center font-sans selection:bg-purple-200">

      {/* --- BACKGROUND ANIMATIONS (The "Aiva" Vibe) --- */}
      <div className="absolute inset-0 w-full h-full z-0">
        {/* Purple Blob */}
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300/40 rounded-full blur-[100px]"
        />
        {/* Blue Blob */}
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-300/40 rounded-full blur-[120px]"
        />
        {/* Pink Accent */}
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-pink-200/30 rounded-full blur-[80px]"
        />
      </div>

      {/* --- MAIN GLASS CONTAINER --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-5xl p-4 md:p-8 flex flex-col md:flex-row items-center justify-center gap-12"
      >

        {/* LEFT SIDE: 3D Avatar & Intro (Matches Video Hero) */}
        <div className="flex-1 text-center md:text-left space-y-6 max-w-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center"
          >
            {/* 3D Glass Card Background behind Avatar */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-2xl shadow-purple-500/10 transform -rotate-6 z-0" />

            {/* 3D Avatar Image */}
            <img
              src="/PocketDr. avatar.png"
              alt="Aiva 3D Avatar"
              className="w-full h-full object-contain relative z-10 w-[80%] h-auto drop-shadow-2xl animate-float -rotate-[2deg]"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            />

            {/* Floating Badge */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -right-4 top-10 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-2 z-20"
            >
              <div className="bg-green-100 p-1.5 rounded-full">
                <HeartPulse className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800">Trusted Partner</p>
                <p className="text-slate-500">WHO Verified Data</p>
              </div>
            </motion.div>
          </motion.div>

          <div className="space-y-2 relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 leading-tight">
              Hi, I'm Aiva.
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Your personal AI health assistant. <br />
              <span className="text-sm font-normal text-slate-500">From daily habits to symptom triage.</span>
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Glass Login Form */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-xl shadow-purple-900/5">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white mb-4 shadow-lg shadow-purple-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
              <p className="text-slate-500 text-sm mt-1">Access your health dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50/80 border border-red-100 text-xs text-red-600 text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400 text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400 text-sm text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-purple-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200/60 text-center">
              <p className="text-xs text-slate-500">
                New to PocketDr?{' '}
                <Link href="/signup" className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" /> Encrypted & Private. Verified by Medical Experts.
            </p>
          </div>
        </motion.div>

      </motion.div>

      {/* CSS for custom float animation if framer motion isn't enough for the image */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}