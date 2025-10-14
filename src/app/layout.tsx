import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoofCal - Professional Roof Calculator",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
