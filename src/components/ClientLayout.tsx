"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";
  const isAuthPage = isLoginPage || isSignupPage;
  const isAdminRoute = pathname?.startsWith("/admin");
  const isPublicRoute = isAuthPage || isAdminRoute;

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicRoute) {
      window.location.href = "/login";
      return;
    }

    if (user && isAuthPage) {
      window.location.href = "/dashboard";
    }
  }, [loading, user, isAuthPage, isPublicRoute]);

  if (isPublicRoute) {
    if (user && isAuthPage) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show sidebar for authenticated users
  return (
    <div className="flex min-h-screen bg-[#F4F1FF]">
      <Sidebar />
      {/* - ml-0: No margin on mobile so content is full-width 
          - md:ml-72: Adds margin on desktop to prevent sidebar overlap
      */}
      <main className="flex-1 ml-0 md:ml-72 relative min-w-0 transition-all duration-300 pb-20 md:pb-0">

        {/* Decorative backgrounds */}
        <div className="fixed top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="fixed bottom-0 left-0 md:left-72 w-64 md:w-80 h-64 md:h-80 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="relative z-10 w-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
