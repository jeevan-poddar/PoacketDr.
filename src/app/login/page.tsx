"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, Heart, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{email?: boolean; password?: boolean}>({});
  const { signIn } = useAuth();
  const router = useRouter();

  // Reset shake animation after it completes
  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  // Clear field error when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: false }));
    }
    if (error) setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: false }));
    }
    if (error) setError(null);
  };

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors: {email?: boolean; password?: boolean} = {};
    
    if (!email.trim()) {
      errors.email = true;
    } else if (!isValidEmail(email)) {
      errors.email = true;
      setError("Please enter a valid email address");
      setShake(true);
      setFieldErrors(errors);
      return;
    }

    if (!password.trim()) {
      errors.password = true;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill in all required fields");
      setShake(true);
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
      setFieldErrors({ email: true, password: true });
      setShake(true);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      {/* Decorative elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#2db3a0]/20 to-[#00509d]/20 rounded-full blur-3xl -z-10"></div>
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#00509d]/20 to-[#2db3a0]/20 rounded-full blur-3xl -z-10"></div>
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2db3a0] to-[#00509d] rounded-2xl shadow-lg mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2db3a0] to-[#00509d] bg-clip-text text-transparent">
            PocketDr.
          </h1>
          <p className="text-slate-500 mt-2">Your AI Health Assistant</p>
        </div>

        {/* Login Card */}
        <div className={`bg-white rounded-2xl shadow-xl p-8 border border-slate-100 ${shake ? 'animate-shake' : ''}`}>
          <h2 className="text-xl font-bold text-slate-800 mb-6">Welcome Back</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-200 flex items-center gap-2 animate-slide-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${fieldErrors.email ? 'text-red-500' : 'text-slate-700'}`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.email ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.email 
                      ? 'border-red-300 bg-red-50/50 focus:ring-red-200 focus:border-red-400' 
                      : 'border-slate-200 focus:ring-[#2db3a0]/50 focus:border-[#2db3a0]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${fieldErrors.password ? 'text-red-500' : 'text-slate-700'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.password ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.password 
                      ? 'border-red-300 bg-red-50/50 focus:ring-red-200 focus:border-red-400' 
                      : 'border-slate-200 focus:ring-[#2db3a0]/50 focus:border-[#2db3a0]'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#2db3a0] to-[#00509d] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#2db3a0] font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
