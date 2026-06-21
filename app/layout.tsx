import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
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
  title: { default: "NativeMatrimony — Find your match from your native place", template: "%s | NativeMatrimony" },
  description: "Telugu matrimony focused on native place. Browse profiles by district, state, and region.",
  openGraph: {
    title: "NativeMatrimony — Find your match from your native place",
    description: "Thousands of verified Telugu profiles. Browse by native district, caste, and profession.",
    siteName: "NativeMatrimony",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "NativeMatrimony — Telugu matrimony by native place",
    description: "Find your match from Telangana & Andhra Pradesh. Free to join.",
  },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "NativeMatrimony" },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
