import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

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
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-ink-muted">
          Built from job_bot.py · static site rebuilds on every run
        </footer>
      </body>
    </html>
  );
}
