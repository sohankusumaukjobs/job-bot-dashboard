import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import BottomNav from "@/components/BottomNav";
import { themePreloadScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Job Bot Dashboard",
  description: "Daily new-job feed powered by a personal job-hunting bot.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Apply saved theme before React hydrates so the page doesn't flash
            the wrong palette. */}
        <script
          dangerouslySetInnerHTML={{ __html: themePreloadScript }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <Sidebar />

        {/* Content column is offset by the sidebar on md+ screens. The
            top header sticks to the top within this column. */}
        <div className="md:pl-[60px] lg:pl-sidebar">
          <TopHeader />
          <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10 pb-24 md:pb-10">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-[1200px] px-4 pb-10 pt-2 text-center text-xs text-ink-muted sm:px-6 lg:px-10">
            Built from job_bot.py · static site rebuilds on every run
          </footer>
        </div>

        {/* Mobile bottom nav (hidden on md+). */}
        <BottomNav />
      </body>
    </html>
  );
}
