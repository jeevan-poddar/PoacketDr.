'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Syringe, Map, User, LogOut, LayoutGrid } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Initialize Supabase Client (Standard way)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Local state to hold user data
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState('User');
  const [initials, setInitials] = useState('U');

  // Hide sidebar on admin or auth pages if needed
  if (pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/signup') return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/chat', label: 'Talk to Aiva', icon: MessageSquare },
    { href: '/vaccinations', label: 'Vaccinations', icon: Syringe },
    { href: '/map', label: 'Outbreak Map', icon: Map },
    { href: '/profile', label: 'My Profile', icon: User },
  ];

  // --- FETCH USER & PROFILE ---
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // Fetch real name from 'user_profiles'
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const name = profile?.full_name || user.email?.split('@')[0] || 'User';
        setProfileName(name);

        // Generate Initials
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        setInitials(initials);
      }
    };

    fetchUserData();
  }, []);

  // --- LOGOUT LOGIC ---
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect anyway
      window.location.href = '/login';
    }
  }

  return (
    <aside className="hidden md:flex w-64 bg-white/80 backdrop-blur-xl border-r border-slate-100 h-screen flex-col fixed left-0 top-0 z-50">

      {/* Brand Logo */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <LayoutGrid size={20} />
          </div>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            PocketDr.
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-6">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group font-medium ${isActive
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 translate-x-1'
                  : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600'
                }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-600 transition-colors'}
              />
              <span>{link.label}</span>

              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 mx-4 mb-6 border-t border-slate-100 pt-6">
        <Link href="/profile">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0 group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700 truncate group-hover:text-purple-700 transition-colors">
                {profileName}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-medium">View Profile</p>
            </div>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs font-bold uppercase tracking-wider"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}