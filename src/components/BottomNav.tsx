'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Map, User, Syringe } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    // Hide on auth or admin pages
    if (pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/signup') return null;

    const navLinks = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
        { href: '/chat', icon: MessageSquare, label: 'Aiva' },
        { href: '/map', icon: Map, label: 'Map' },
        { href: '/vaccinations', icon: Syringe, label: 'Vax' },
        { href: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-6 py-3 z-[100] flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className={`p-2 rounded-xl transition-all ${isActive
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                            : 'text-slate-400 group-active:scale-90'
                            }`}>
                            <Icon size={20} />
                        </div>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-purple-600' : 'text-slate-400'
                            }`}>
                            {link.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}