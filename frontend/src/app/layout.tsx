import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASTRO-GUARD | Autonomous Deep-Space Medical Interface",
  description:
    "NASA Space Apps 2026: Real-time autonomous AI flight-surgeon dashboard centered around a relativistic black hole simulation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full overflow-hidden">
      <body className="bg-void-950 text-slate-100 antialiased h-full w-full overflow-hidden relative selection:bg-amber-500 selection:text-black">
        {/* Subtle edge film grain overlay */}
        <div className="fixed inset-0 pointer-events-none film-grain z-50 opacity-20" />
        {children}
      </body>
    </html>
  );
}
