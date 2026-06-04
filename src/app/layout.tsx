import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "RAMYA — Modern Indian Silhouette & Sculptural Heritage",
  description: "Bespoke handloom garments, structured tailoring, and deconstructed silhouettes crafted from organic linens, khadi, and raw silks.",
  metadataBase: new URL("https://ramya-alayana.vercel.app"),
  openGraph: {
    title: "RAMYA — Modern Indian Silhouette & Sculptural Heritage",
    description: "Bespoke handloom garments, structured tailoring, and deconstructed silhouettes crafted from organic linens, khadi, and raw silks.",
    url: "https://ramya-alayana.vercel.app",
    siteName: "RAMYA",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-canvas-bg text-text-primary antialiased">
        <SessionProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
