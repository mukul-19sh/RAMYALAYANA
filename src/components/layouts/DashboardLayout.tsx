"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EditorialLayout } from "./EditorialLayout";

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  const links = [
    { label: "Profile Overview", href: "/dashboard" },
    { label: "Orders Ledger", href: "/dashboard/orders" },
    { label: "Loyalty Balance", href: "/dashboard/loyalty" },
    { label: "Wishlist Favorites", href: "/wishlist" },
  ];

  return (
    <EditorialLayout width="wide">
      <div className="flex flex-col mb-8 select-none font-sans">
        <h1 className="text-3xl font-serif text-text-primary mb-1 uppercase tracking-wide">COLLECTOR DASHBOARD</h1>
        <p className="text-xs text-text-secondary font-light">
          Manage shipping profiles, invite friends, and view membership tiers.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start select-none font-sans">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 flex flex-row md:flex-col gap-1 border-b md:border-b-0 md:border-r border-border-subtle pb-4 md:pb-0 md:pr-6 shrink-0 overflow-x-auto whitespace-nowrap md:whitespace-normal">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3 py-2 text-xs uppercase tracking-wider font-medium transition-colors ${
                  isActive
                    ? "bg-border-primary text-canvas-bg"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Content Pane */}
        <div className="flex-1 w-full min-h-[50vh]">
          {children}
        </div>
      </div>
    </EditorialLayout>
  );
};
export default DashboardLayout;
