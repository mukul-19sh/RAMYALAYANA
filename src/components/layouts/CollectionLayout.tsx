"use client";

import React, { useState } from "react";
import { EditorialLayout } from "./EditorialLayout";

export interface CollectionLayoutProps {
  children: React.ReactNode; // Product grid list
  sidebarFilters: React.ReactNode; // Filter options node
  activeFiltersCount?: number;
  onClearAll?: () => void;
}

export const CollectionLayout: React.FC<CollectionLayoutProps> = ({
  children,
  sidebarFilters,
  activeFiltersCount = 0,
  onClearAll,
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <EditorialLayout width="wide">
      {/* Title / Header segment */}
      <div className="flex flex-col mb-8 select-none font-sans">
        <h1 className="text-3xl md:text-4xl font-serif text-text-primary mb-2">SHOP CATALOG</h1>
        <p className="text-xs text-text-secondary font-light max-w-xl">
          Sculptural silhouettes and modern drapes handwoven by master artisans.
        </p>
      </div>

      {/* Filter trigger button for mobile */}
      <div className="flex items-center justify-between md:hidden border-t border-b border-border-subtle py-3 mb-6 select-none font-sans">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="text-xs uppercase tracking-luxury text-text-primary font-medium flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
        {activeFiltersCount > 0 && (
          <button onClick={onClearAll} className="text-xs uppercase tracking-luxury text-accent underline">
            Clear All
          </button>
        )}
      </div>

      {/* Core Grid layout */}
      <div className="flex gap-8 items-start">
        {/* Desktop Sidebar filters (static) */}
        <aside className="w-64 shrink-0 hidden md:block select-none font-sans border-r border-border-subtle pr-6 sticky top-28 self-start">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs uppercase tracking-luxury font-medium text-text-primary">Filters</h3>
            {activeFiltersCount > 0 && (
              <button onClick={onClearAll} className="text-[10px] uppercase tracking-luxury text-text-secondary underline hover:text-text-primary">
                Clear All
              </button>
            )}
          </div>
          {sidebarFilters}
        </aside>

        {/* Dynamic products list grid (responsive) */}
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>

      {/* Mobile Sidebar filters Drawer (visible on click) */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-drawer flex md:hidden font-sans">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={() => setShowMobileFilters(false)} />
          <div className="relative w-full max-w-xs bg-canvas-bg shadow-soft flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle">
              <h3 className="text-xs uppercase tracking-luxury font-medium text-text-primary">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1">{sidebarFilters}</div>
          </div>
        </div>
      )}
    </EditorialLayout>
  );
};
export default CollectionLayout;
