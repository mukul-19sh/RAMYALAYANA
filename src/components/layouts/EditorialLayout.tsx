"use client";

import React from "react";
import { DesktopHeader } from "../navigation/DesktopHeader";
import { MobileHeader } from "../navigation/MobileHeader";
import { Footer } from "../navigation/Footer";

export interface EditorialLayoutProps {
  children: React.ReactNode;
  width?: "standard" | "wide";
}

export const EditorialLayout: React.FC<EditorialLayoutProps> = ({ children, width = "wide" }) => {
  const widthClass = width === "standard" ? "max-w-[1200px]" : "max-w-[1600px]";

  return (
    <div className="min-h-screen flex flex-col bg-canvas-bg text-text-primary antialiased">
      {/* Dynamic Headers */}
      <DesktopHeader />
      <MobileHeader />

      {/* Main page block */}
      <main className="flex-1 w-full mx-auto px-4 md:px-8 py-8">
        <div className={`${widthClass} mx-auto w-full`}>{children}</div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
export default EditorialLayout;
