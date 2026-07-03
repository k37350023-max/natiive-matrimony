import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import AppFooter from "./components/AppFooter";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "NativeMatrimony.com - Matches by native place", template: "%s | NativeMatrimony.com" },
  description: "Join NativeMatrimony for free. New members get a 100-day premium boost, and the first 1,000 profiles per district get 2 years of free premium.",
  openGraph: {
    title: "NativeMatrimony.com - Matches by native place",
    description: "Start free with a 100-day premium boost. Browse native profiles by roots and get notified when matching families join.",
    siteName: "NativeMatrimony.com",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "NativeMatrimony.com - Matches by native place",
    description: "Start free with a 100-day premium boost. Browse native profiles and connect only through accepted requests.",
  },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "NativeMatrimony.com" },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
