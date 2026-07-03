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
  title: { default: "NativeMatrimony.com - Telugu matches by native place", template: "%s | NativeMatrimony.com" },
  description: "A Telugu-first pelli registry where families search by native place, see real profile signals, send requests, and unlock biodata only after acceptance.",
  openGraph: {
    title: "NativeMatrimony.com - Telugu matches by native place",
    description: "Search by Telugu roots first. Photos are visible unless hidden, while biodata and contact unlock only after request acceptance.",
    siteName: "NativeMatrimony.com",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "NativeMatrimony.com - Telugu matches by native place",
    description: "Search Telugu native place first. Connect only through accepted requests.",
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
