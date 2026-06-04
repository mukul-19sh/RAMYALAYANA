"use client";

import React from "react";
import Link from "next/link";

export interface CheckoutLayoutProps {
  formNode: React.ReactNode; // Left side inputs
  summaryNode: React.ReactNode; // Right side order summary
}

export const CheckoutLayout: React.FC<CheckoutLayoutProps> = ({ formNode, summaryNode }) => {
  return (
    <div className="min-h-screen bg-canvas-bg text-text-primary antialiased font-sans flex flex-col">
      {/* Secure Header */}
      <header className="border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-8 select-none">
        <Link href="/" className="text-xl font-serif tracking-widest uppercase font-semibold">
          RAMYA
        </Link>
        <div className="flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider font-light">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure Checkout
        </div>
      </header>

      {/* Checkout Grid body */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Shipping / Payment forms */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {formNode}
          </div>

          {/* Right Side: Sticky Checkout Cart Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 self-start">
            {summaryNode}
          </div>
        </div>
      </main>
    </div>
  );
};
export default CheckoutLayout;
