"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

  useEffect(() => {
    let mounted = true;

    // Check for critical env vars
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Exists' : 'Missing');
    console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Exists' : 'Missing');

    // 1. Force stop loading after 3 seconds no matter what
    const timer = setTimeout(() => {
      if (mounted) {
        console.warn("Supabase connection timed out. Falling back to public mode.");
        setLoading(false);
      }
    }, 3000);

    // 2. Try to get session
    const initAuth = async () => {
      console.log("AuthProvider: Getting session...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        console.log("AuthProvider: Session retrieved", { session, error });
        
        if (error) {
           console.error("AuthProvider: Session error", error);
        } else {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              console.log("AuthProvider: Fetching profile for user", session.user.id);
              await fetchProfile(session.user.id);
            } else {
               console.log("AuthProvider: No user detected");
            }
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('timeout')) {
            console.warn("Auth check timed out - defaulting to Public Mode");
        } else {
            console.error("AuthProvider: Unexpected error", err);
        }
      } finally {
        if (mounted) {
          clearTimeout(timer); // Cancel the emergency timer
          setLoading(false); 
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log("AuthProvider: Auth state changed", event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => { 
        mounted = false;
        clearTimeout(timer);
        subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error; // Throw to be caught by catch block
      }
      setProfile(data as Profile | null);
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message?.includes('timeout') || e.message?.includes('fetch failed')) {
          console.warn("Profile fetch timed out - using guest profile");
          setProfile({
            id: userId,
            name: "Guest User",
            email: user?.email || "guest@example.com",
            age: null, height_cm: null, weight_kg: null,
            gender: null, blood_type: null, allergies: null, medical_conditions: null
          });
      } else {
        console.error("Profile fetch error:", e);
      }
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
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
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out:", error);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
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
