import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${protocol}://${host}` : "http://localhost:3000";
  const socialImage = new URL("/og.png", origin).toString();

  return {
    title: {
      default: "AI Advokat",
      template: "%s · AI Advokat",
    },
    description: "Интеллектуальная правовая база Казахстана",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "AI Advokat",
      description: "Правовая база Казахстана",
      images: [{ url: socialImage, width: 1734, height: 907 }],
      locale: "ru_KZ",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "AI Advokat",
      description: "Правовая база Казахстана",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
