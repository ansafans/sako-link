import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sako Link | Sako Sunon Pro 5.5Kw Telemetry Dashboard",
  description: "Real-time visual monitoring dashboard for Sako Sunon Pro 5.5Kw inverter telemetry, solar PV power, grid utility status, and battery storage reserve.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Sako Link | Sako Sunon Pro 5.5Kw Telemetry Dashboard",
    description: "Real-time visual monitoring dashboard for Sako Sunon Pro 5.5Kw inverter telemetry, solar PV power, grid utility status, and battery storage reserve.",
    siteName: "Sako Link",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sako Link | Sako Sunon Pro 5.5Kw Telemetry Dashboard",
    description: "Real-time visual monitoring dashboard for Sako Sunon Pro 5.5Kw inverter telemetry.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
