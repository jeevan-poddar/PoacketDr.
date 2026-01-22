"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Syringe, Map, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut, user } = useAuth();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/chat', label: 'Medical Chat', icon: MessageSquare },
    { href: '/vaccinations', label: 'Vaccinations', icon: Syringe },
    { href: '/map', label: 'Outbreak Map', icon: Map },
    { href: '/profile', label: 'My Profile', icon: User },
  ];

  async function handleLogout() {
    console.log("Logging out...");
    try {
      await signOut();
      console.log("Sign out successful, redirecting...");
      router.push('/login');
      router.refresh(); // Force refresh to clear any cached auth state
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect anyway to prevent being stuck
      router.push('/login');
    }
  }

  // Get display name
  const displayName = profile?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="w-64 bg-white border-r border-slate-100 h-screen flex flex-col fixed left-0 top-0 z-20">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2db3a0] to-[#00509d] flex items-center justify-center text-white font-bold text-lg shadow-md">
            P
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-[#2db3a0] to-[#00509d] bg-clip-text text-transparent">
            PocketDr.
          </span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 mt-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-[#2db3a0] to-[#00509d] text-white shadow-lg shadow-teal-500/20'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon 
                size={22} 
                className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#2db3a0] transition-colors'} 
              />
              <span className="font-semibold">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-50 space-y-3">
        <Link href="/profile">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2db3a0] to-[#00509d] flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700 truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </Link>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
