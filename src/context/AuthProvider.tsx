"use client";
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  gender: string | null;
  blood_type: string | null;
  allergies: string | null;
  medical_conditions: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const authResolved = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Timeout - only warn if auth never resolved
    const timer = setTimeout(() => {
      if (mounted && !authResolved.current) {
        console.warn("Auth initialization slow, but continuing...");
        setLoading(false);
      }
    }, 5000);

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        authResolved.current = true;
        clearTimeout(timer);
        
        if (error) {
          console.error("Session error:", error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Set loading false BEFORE fetching profile
        
        if (session?.user) {
          // Fetch profile in background (non-blocking)
          fetchProfile(session.user.id);
        }
      } catch (err: any) {
        console.error("Auth init error:", err);
        if (mounted) {
          clearTimeout(timer);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        authResolved.current = true;
        clearTimeout(timer);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Set loading false immediately
        
        if (session?.user) {
          // Fetch profile in background (non-blocking)
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => { 
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    // Timeout wrapper to prevent hanging
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn("Profile fetch timed out");
        resolve(null);
      }, 5000);
    });

    try {
      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (result === null) {
        // Timeout occurred - use fallback profile
        setProfile({
          id: userId,
          name: "User",
          email: null,
          age: null, height_cm: null, weight_kg: null,
          gender: null, blood_type: null, allergies: null, medical_conditions: null
        });
      } else {
        const { data, error } = result;
        if (error && error.code !== "PGRST116") {
          console.error("Profile fetch error:", error);
        }
        setProfile(data as Profile | null);
      }
    } catch (e: any) {
      console.error("Profile fetch error:", e);
      // Use fallback profile on error
      setProfile({
        id: userId,
        name: "User",
        email: null,
        age: null, height_cm: null, weight_kg: null,
        gender: null, blood_type: null, allergies: null, medical_conditions: null
      });
    }
    // Note: setLoading is handled by caller
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Connection timed out")), 8000)
      );
      
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;
      
      if (error) {
        return { error };
      }
      
      // Update local state immediately on success
      if (data?.session) {
        setSession(data.session);
        setUser(data.user);
      }
      
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || "Sign in failed" } };
    }
  }

  async function signUp(email: string, password: string, name: string) {
    // Pass name as user metadata - the database trigger will use this to create the profile
    console.log("Starting signup for:", email, name);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    console.log("Signup response:", { data, error });
    
    if (error) {
      console.error("Signup error:", error);
    } else {
      console.log("User created:", data.user);
    }

    return { error };
  }

  async function signOut() {
    try {
      // Clear state first to ensure UI updates immediately
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Then sign out from Supabase (global to revoke refresh token)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }
      console.log("Sign out completed successfully");
    } catch (error) {
      console.error("Sign out failed:", error);
      // Still clear local state even if Supabase call fails
      setUser(null);
      setProfile(null);
      setSession(null);
      throw error;
    } finally {
      // Hard clear any persisted session to prevent stale login
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (url) {
          const ref = new URL(url).hostname.split(".")[0];
          const storageKey = `sb-${ref}-auth-token`;
          localStorage.removeItem(storageKey);
          sessionStorage.removeItem(storageKey);
        }
      } catch {
        // ignore storage cleanup errors
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
