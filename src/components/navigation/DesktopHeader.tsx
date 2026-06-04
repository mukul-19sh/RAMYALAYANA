"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/store/useCart";
import { MegaMenu } from "./MegaMenu";
import { SearchOverlay } from "./SearchOverlay";
import { useSession } from "next-auth/react";

export const DesktopHeader: React.FC = () => {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useCart((state) => state.items);
  const { data: session } = useSession();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="relative w-full bg-canvas-bg/95 backdrop-blur-xs border-b border-border-subtle z-header font-sans select-none hidden md:block">
      <div className="max-w-[1600px] mx-auto px-space-md h-20 flex items-center justify-between">
        
        {/* Left Side: Navigation Links & MegaMenu Trigger */}
        <nav className="flex items-center gap-6">
          <button
            onMouseEnter={() => setMegaMenuOpen(true)}
            onClick={() => setMegaMenuOpen(!megaMenuOpen)}
            className="text-xs uppercase tracking-luxury text-text-primary hover:text-accent transition-colors font-medium focus:outline-none"
          >
            Menu
          </button>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-luxury text-text-primary hover:text-accent transition-colors font-medium"
          >
            Shop All
          </Link>
          <Link
            href="/heritage"
            className="text-xs uppercase tracking-luxury text-text-primary hover:text-accent transition-colors font-medium"
          >
            Lineage
          </Link>
        </nav>

        {/* Center: Brand Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className="text-2xl font-serif tracking-widest text-text-primary hover:opacity-80 transition-opacity uppercase font-semibold"
          >
            RAMYA
          </Link>
        </div>

        {/* Right Side: Search, Account, Cart Links */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1 text-text-primary hover:text-accent transition-colors focus:outline-none"
            aria-label="Open search bar"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <Link
            href={session ? "/dashboard" : "/auth/login"}
            className="p-1 text-text-primary hover:text-accent transition-colors"
            aria-label={session ? "Go to Dashboard" : "Login to account"}
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>

          <Link
            href="/cart"
            className="p-1 text-text-primary hover:text-accent transition-colors flex items-center gap-1.5"
            aria-label="Open shopping cart"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="text-[10px] font-sans font-medium bg-border-primary text-canvas-bg rounded-full h-4.5 w-4.5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* MegaMenu Portal */}
      <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />

      {/* Search Overlay Portal */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};
