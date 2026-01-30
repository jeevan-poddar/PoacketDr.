import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";
import ClientLayout from "@/components/ClientLayout";

import ConsoleCleanup from "@/components/ConsoleCleanup";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PocketDr. - Your AI Health Assistant",
  description: "Your personalized medical assistant powered by AI",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                const originalError = console.error;
                console.error = (...args) => {
                  if (/AbortError|signal is aborted/i.test(args[0]?.toString())) return;
                  originalError.apply(console, args);
                };
              }
            `,
          }}
        />
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
