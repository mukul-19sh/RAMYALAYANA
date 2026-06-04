"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { NewsletterForm } from "../ui/NewsletterForm";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-canvas-bg border-t border-border-subtle font-sans py-16 px-4 md:px-8 select-none">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        
        {/* Newsletter Subscription column */}
        <div className="md:col-span-2">
          <NewsletterForm />
        </div>

        {/* Directory Links column */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs uppercase tracking-luxury text-text-primary">DIRECTORY</h4>
          <ul className="flex flex-col gap-2.5 text-xs text-text-secondary font-light">
            <li>
              <Link href="/shop" className="hover:text-text-primary transition-colors">
                Shop Catalog
              </Link>
            </li>
            <li>
              <Link href="/heritage" className="hover:text-text-primary transition-colors">
                Our Lineage
              </Link>
            </li>
            <li>
              <Link href="/artisans" className="hover:text-text-primary transition-colors">
                Artisan Coordinates
              </Link>
            </li>
            <li>
              <Link href="/size-guide" className="hover:text-text-primary transition-colors">
                Sizing Table
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Policies column */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs uppercase tracking-luxury text-text-primary">CLIENT SERVICES</h4>
          <ul className="flex flex-col gap-2.5 text-xs text-text-secondary font-light">
            <li>
              <Link href="/returns" className="hover:text-text-primary transition-colors">
                Exchanges & Returns
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-text-primary transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-text-primary transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <span className="text-text-secondary">Support: care@ramyalayana.in</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Trademark footer boundary */}
      <div className="max-w-[1600px] mx-auto pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Image
            src="/icon.svg"
            alt="RAMYALAYANA Icon"
            width={18}
            height={20}
            className="object-contain"
          />
          <Image
            src="/wordmark.svg"
            alt="RAMYALAYANA Wordmark"
            width={71}
            height={10}
            className="object-contain"
          />
        </div>
        <span className="text-[10px] font-sans tracking-luxury uppercase text-text-secondary font-light text-center md:text-left md:flex-1">
          © {new Date().getFullYear()} RAMYALAYANA. All Rights Reserved.
        </span>
        <span className="text-[10px] font-sans tracking-luxury uppercase text-text-secondary font-light text-center md:text-right">
          Atelier Bengaluru, Karnataka, India.
        </span>
      </div>
    </footer>
  );
};
