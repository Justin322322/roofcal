import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { MaintenanceGuard } from "@/components/maintenance-guard";

const interSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoofCalc - Professional Roof Calculator",
  description:
    "Professional roof calculator for accurate roofing measurements, material estimates, and cost calculations. Built for contractors and homeowners.",
  keywords: [
    "roof calculator",
    "roofing",
    "roof measurements",
    "roofing materials",
    "roof cost calculator",
  ],
  authors: [{ name: "RoofCal" }],
  creator: "RoofCal",
  publisher: "RoofCal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${interSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>
          <MaintenanceGuard>
            {children}
          </MaintenanceGuard>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
