"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, UserPlus, Heart, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

interface FieldErrors {
  name?: boolean;
  email?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  // Reset shake animation after it completes
  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  // Clear field error and global error when user starts typing
  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: false }));
    }
    if (error) setError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    clearFieldError('name');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    clearFieldError('email');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    clearFieldError('password');
    // Also clear confirmPassword error if passwords might now match
    if (fieldErrors.confirmPassword && e.target.value === confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: false }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    clearFieldError('confirmPassword');
    // Also clear password error if it was a mismatch error
    if (fieldErrors.password && password === e.target.value) {
      setFieldErrors(prev => ({ ...prev, password: false }));
    }
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
    const errors: FieldErrors = {};
    let errorMessage = "";

    // Name validation
    if (!name.trim()) {
      errors.name = true;
    }

    // Email validation
    if (!email.trim()) {
      errors.email = true;
    } else if (!isValidEmail(email)) {
      errors.email = true;
      errorMessage = "Please enter a valid email address";
    }

    // Password validation
    if (!password.trim()) {
      errors.password = true;
    } else if (password.length < 6) {
      errors.password = true;
      errorMessage = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      errors.confirmPassword = true;
    } else if (password !== confirmPassword) {
      errors.password = true;
      errors.confirmPassword = true;
      errorMessage = "Passwords do not match";
    }

    // Check for any empty field errors first
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(errorMessage || "Please fill in all required fields");
      setShake(true);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, name);
    
    if (error) {
      setError(error.message);
      setFieldErrors({ email: true });
      setShake(true);
      setLoading(false);
    } else {
      // Show email confirmation message instead of redirecting
      setLoading(false);
      setShowEmailConfirmation(true);
    }
  }

  // Helper function for input classes
  const getInputClasses = (hasError: boolean) => `
    w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all
    ${hasError 
      ? 'border-red-300 bg-red-50/50 focus:ring-red-200 focus:border-red-400' 
      : 'border-slate-200 focus:ring-[#2db3a0]/50 focus:border-[#2db3a0]'
    }
  `;

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
          <p className="text-slate-500 mt-2">Create your health profile</p>
        </div>

        {/* Signup Card */}
        <div className={`bg-white rounded-2xl shadow-xl p-8 border border-slate-100 ${shake ? 'animate-shake' : ''}`}>
          
          {/* Email Confirmation Success Screen */}
          {showEmailConfirmation ? (
            <div className="text-center py-4 animate-slide-in">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2db3a0] to-[#00509d] rounded-full mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Check Your Email!</h2>
              <p className="text-slate-500 mb-6">
                We've sent a confirmation link to<br />
                <span className="font-semibold text-slate-700">{email}</span>
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Click the link in the email to activate your account and start your health journey.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/login" 
                  className="w-full py-3 bg-gradient-to-r from-[#2db3a0] to-[#00509d] text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go to Login
                </Link>
                <button
                  onClick={() => setShowEmailConfirmation(false)}
                  className="w-full py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all"
                >
                  Use Different Email
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-6">Create Account</h2>
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-200 flex items-center gap-2 animate-slide-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${fieldErrors.name ? 'text-red-500' : 'text-slate-700'}`}>
                Full Name
              </label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.name ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="John Doe"
                  className={getInputClasses(!!fieldErrors.name)}
                />
              </div>
            </div>

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
                  className={getInputClasses(!!fieldErrors.email)}
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
                  className={getInputClasses(!!fieldErrors.password)}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${fieldErrors.confirmPassword ? 'text-red-500' : 'text-slate-700'}`}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="••••••••"
                  className={getInputClasses(!!fieldErrors.confirmPassword)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#2db3a0] to-[#00509d] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-200 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-[#2db3a0] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
