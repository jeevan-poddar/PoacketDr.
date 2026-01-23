"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  // Don't show sidebar on auth pages
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#2db3a0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Show auth pages without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  // Show sidebar for authenticated users
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 relative">
        {/* Decorative background */}
        <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#2db3a0]/10 to-[#00509d]/10 rounded-full blur-3xl -z-10"></div>
        <div className="fixed bottom-0 left-64 w-80 h-80 bg-gradient-to-tr from-[#00509d]/10 to-[#2db3a0]/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
