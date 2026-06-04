"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/store/useCart";
import { SearchOverlay } from "./SearchOverlay";
import { Drawer } from "../ui/Drawer";
import { useSession } from "next-auth/react";

export const MobileHeader: React.FC = () => {
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useCart((state) => state.items);
  const { data: session } = useSession();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="relative w-full bg-canvas-bg/95 backdrop-blur-xs border-b border-border-subtle z-header font-sans select-none block md:hidden">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Hamburger Menu Toggle (Left) */}
        <button
          onClick={() => setNavDrawerOpen(true)}
          className="p-1.5 text-text-primary hover:text-accent transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center: Brand Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className="text-lg font-serif tracking-widest text-text-primary uppercase font-semibold"
          >
            RAMYA
          </Link>
        </div>

        {/* Right Side: Persistent Search and Cart (never hidden) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 text-text-primary hover:text-accent transition-colors focus:outline-none"
            aria-label="Open search overlay"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <Link
            href="/cart"
            className="p-1.5 text-text-primary hover:text-accent transition-colors flex items-center gap-1"
            aria-label="View shopping cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="text-[9px] font-sans font-medium bg-border-primary text-canvas-bg rounded-full h-4.5 w-4.5 flex items-center justify-center -ml-1">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Navigation Drawer Overlay */}
      <Drawer
        isOpen={navDrawerOpen}
        onClose={() => setNavDrawerOpen(false)}
        position="left"
        title="RAMYA"
      >
        <nav className="flex flex-col gap-6 py-4 uppercase font-sans tracking-luxury text-sm">
          <Link href="/shop" onClick={() => setNavDrawerOpen(false)} className="hover:text-accent">
            Shop All
          </Link>
          <Link href="/shop?category=atelier" onClick={() => setNavDrawerOpen(false)} className="hover:text-accent">
            Atelier Occasion
          </Link>
          <Link href="/shop?category=silhouette" onClick={() => setNavDrawerOpen(false)} className="hover:text-accent">
            Structured Drapes
          </Link>
          <Link href="/shop?category=foundations" onClick={() => setNavDrawerOpen(false)} className="hover:text-accent">
            Organic Foundations
          </Link>
          <Link href="/heritage" onClick={() => setNavDrawerOpen(false)} className="hover:text-accent">
            Heritage & Lineage
          </Link>
          <Link href="/artisans" onClick={() => setNavDrawerOpen(false)} className="hover:text-accent">
            Artisan Ledger
          </Link>
          <hr className="border-border-subtle w-full" />
          <Link href={session ? "/dashboard" : "/auth/login"} onClick={() => setNavDrawerOpen(false)} className="hover:text-accent">
            {session ? "Collector Portal" : "Sign In"}
          </Link>
        </nav>
      </Drawer>

      {/* Search Overlay Portal */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};
