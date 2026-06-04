"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute left-0 top-full w-full bg-canvas-bg border-b border-border-primary shadow-soft z-header font-sans animate-in slide-in-from-top-2 duration-300 select-none"
      onMouseLeave={onClose}
    >
      <div className="max-w-[1600px] mx-auto px-space-md py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Categories Section */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs uppercase tracking-luxury text-text-secondary">Shop Catalog</h4>
          <ul className="flex flex-col gap-2">
            {[
              { label: "New Arrivals", href: "/shop?subCategory=new" },
              { label: "Atelier Occasion", href: "/shop?category=atelier" },
              { label: "Structured Jackets", href: "/shop?subCategory=jackets" },
              { label: "Sculptural Dresses", href: "/shop?subCategory=dresses" },
              { label: "Organic Tops", href: "/shop?subCategory=tops" },
              { label: "Tailored Bottoms", href: "/shop?subCategory=bottoms" },
              { label: "Signature Co-ords", href: "/shop?subCategory=coords" },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="text-sm font-light text-text-primary hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Editorial Collections */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs uppercase tracking-luxury text-text-secondary">Campaign Collections</h4>
          <ul className="flex flex-col gap-2">
            {[
              { label: "The Atelier — Volume I", href: "/shop?category=atelier" },
              { label: "The Silhouette — Structured Drapes", href: "/shop?category=silhouette" },
              { label: "The Foundations — Organic Essentials", href: "/shop?category=foundations" },
              { label: "The Archive — Historical Lineage", href: "/shop?category=archive" },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="text-sm font-light text-text-primary hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Brand Narrative */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs uppercase tracking-luxury text-text-secondary">Narrative & Heritage</h4>
          <ul className="flex flex-col gap-2">
            {[
              { label: "Craft & Loom Coordinates", href: "/heritage" },
              { label: "Artisan Ledger", href: "/artisans" },
              { label: "Sizing Guidelines", href: "/size-guide" },
              { label: "Collector Portal", href: "/dashboard" },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="text-sm font-light text-text-primary hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual Editorial Spot */}
        <div className="relative aspect-[16/10] w-full bg-canvas-inset-bg flex flex-col justify-end p-4 text-canvas-bg overflow-hidden group">
          {/* Fallback pattern / gradient if image not active */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10 z-1" />
          <div className="relative z-10">
            <span className="text-[10px] tracking-widest uppercase font-medium mb-1 block">Editorial Campaign</span>
            <h5 className="text-lg font-serif tracking-wide mb-2 leading-tight">The Kora Silk Drapes</h5>
            <Link
              href="/shop?category=atelier"
              onClick={onClose}
              className="text-[11px] uppercase tracking-luxury font-medium hover:underline text-canvas-bg"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
