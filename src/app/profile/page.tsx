'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Calendar, Droplet, Edit2, Save, LogOut, Loader2,
  HeartPulse, Ruler, Weight, Activity
} from 'lucide-react';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type UserProfile = {
  id: string;
  full_name: string;
  gender: string;
  blood_group: string;
  date_of_birth: string | null;
  weight: string; // New Field
  height: string; // New Field
  email?: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    full_name: '',
    gender: '',
    blood_group: '',
    date_of_birth: '',
    weight: '',
    height: '',
    email: ''
  });

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // --- HELPER: CALCULATE AGE ---
  const calculateAge = (dob: string | null) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} years` : 'N/A';
  };

  // --- FETCH PROFILE ---
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({ ...data, email: user.email });
      } else {
        setProfile(prev => ({ ...prev, id: user.id, email: user.email }));
      }
      setLoading(false);
    };

    getProfile();
  }, [router]);

  // --- UPDATE PROFILE ---
  const handleSave = async () => {
    setSaving(true);
    try {
      const { email, ...rawUpdates } = profile;

      const updates = {
        ...rawUpdates,
        date_of_birth: rawUpdates.date_of_birth === '' ? null : rawUpdates.date_of_birth
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(updates);

      if (error) throw error;
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      alert('Error updating profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1FF]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F4F1FF] font-sans selection:bg-purple-200">

      {/* --- BACKGROUND ANIMATION --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-200/40 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-blue-200/40 rounded-full blur-[120px]"
        />
      </div>

      {/* --- CONTENT --- */}
      <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-8">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-slate-600 hover:text-purple-600 hover:bg-white transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium text-sm">Dashboard</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </header>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Cover / Banner */}
          <div className="h-32 bg-gradient-to-r from-teal-500 to-blue-500 relative">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : <User />}
                </div>
              </div>
            </div>

            {/* Edit Toggle */}
            <div className="absolute bottom-4 right-4">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-teal-700 rounded-full shadow-sm font-bold text-sm hover:bg-teal-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-full shadow-sm font-bold text-sm hover:bg-white/30 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Form Content */}
          <div className="pt-16 pb-8 px-8">

            {/* Name & Age Badge */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="text-3xl font-bold text-slate-800 bg-transparent border-b-2 border-teal-200 focus:border-teal-500 outline-none w-full placeholder:text-slate-300"
                    placeholder="Your Full Name"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-slate-800">{profile.full_name || 'Anonymous User'}</h1>
                )}
                <div className="flex items-center gap-2 text-slate-500 mt-1">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
              </div>

              {/* Age Badge (Calculated from DOB) */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
                <Activity className="w-5 h-5" />
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Current Age</span>
                  <span className="text-lg font-bold">{calculateAge(profile.date_of_birth)}</span>
                </div>
              </div>
            </div>

            {/* --- MEDICAL DETAILS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* DOB */}
              <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-white/60">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full bg-transparent outline-none font-bold text-slate-800 border-b border-blue-200 focus:border-blue-500 h-8"
                      value={profile.date_of_birth || ''}
                      onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                    />
                  ) : (
                    <p className="font-bold text-lg text-slate-800">
                      {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-GB') : 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Weight */}
              <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-white/60">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Weight className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Weight</label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="w-20 bg-transparent outline-none font-bold text-slate-800 border-b border-purple-200 focus:border-purple-500 h-8"
                        value={profile.weight || ''}
                        onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                        placeholder="0"
                      />
                      <span className="text-sm font-medium text-slate-400">kg</span>
                    </div>
                  ) : (
                    <p className="font-bold text-lg text-slate-800">{profile.weight ? `${profile.weight} kg` : 'Not set'}</p>
                  )}
                </div>
              </div>

              {/* Height */}
              <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-white/60">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Ruler className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Height</label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="w-20 bg-transparent outline-none font-bold text-slate-800 border-b border-orange-200 focus:border-orange-500 h-8"
                        value={profile.height || ''}
                        onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                        placeholder="0"
                      />
                      <span className="text-sm font-medium text-slate-400">cm / ft</span>
                    </div>
                  ) : (
                    <p className="font-bold text-lg text-slate-800">{profile.height || 'Not set'}</p>
                  )}
                </div>
              </div>

              {/* Blood Group */}
              <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-white/60">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <Droplet className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Blood Group</label>
                  {isEditing ? (
                    <select
                      className="w-full bg-transparent outline-none font-bold text-slate-800 border-b border-red-200 focus:border-red-500 h-8"
                      value={profile.blood_group || ''}
                      onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  ) : (
                    <p className="font-bold text-lg text-slate-800">{profile.blood_group || 'Not set'}</p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-white/60 md:col-span-2">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Gender</label>
                  {isEditing ? (
                    <div className="flex gap-4">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <label key={g} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={profile.gender === g}
                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                            className="accent-pink-500 w-4 h-4"
                          />
                          <span className="text-sm font-medium text-slate-700">{g}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="font-bold text-lg text-slate-800">{profile.gender || 'Not set'}</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}