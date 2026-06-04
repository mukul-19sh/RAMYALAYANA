import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "RAMYALAYANA — Modern Indian Silhouette & Sculptural Heritage",
  description: "Bespoke handloom garments, structured tailoring, and deconstructed silhouettes crafted from organic linens, khadi, and raw silks.",
  metadataBase: new URL("https://ramya-alayana.vercel.app"),
  openGraph: {
    title: "RAMYALAYANA — Modern Indian Silhouette & Sculptural Heritage",
    description: "Bespoke handloom garments, structured tailoring, and deconstructed silhouettes crafted from organic linens, khadi, and raw silks.",
    url: "https://ramya-alayana.vercel.app",
    siteName: "RAMYALAYANA",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.jpg",
        width: 1000,
        height: 1000,
        alt: "RAMYALAYANA official brand logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RAMYALAYANA — Modern Indian Silhouette & Sculptural Heritage",
    description: "Bespoke handloom garments, structured tailoring, and deconstructed silhouettes crafted from organic linens, khadi, and raw silks.",
    images: ["/logo.jpg"],
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
