"use client";

import React, { useEffect } from "react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: "left" | "right";
  title?: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  position = "right",
  title,
  children,
}) => {
  // Prevent page scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const positionStyles = {
    left: "left-0 top-0 h-full w-full max-w-sm border-r border-border-primary slide-in-from-left duration-300",
    right: "right-0 top-0 h-full w-full max-w-md border-l border-border-primary slide-in-from-right duration-300",
  };

  return (
    <div className="fixed inset-0 z-drawer flex">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative bg-canvas-bg shadow-soft flex flex-col z-10 focus:outline-none animate-in ease-quint ${positionStyles[position]}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-space-md border-b border-border-subtle">
          {title ? (
            <h2 className="text-base font-serif uppercase tracking-widest text-text-primary">
              {title}
            </h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="text-text-secondary hover:text-text-primary transition-colors focus:outline-none p-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-space-md font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};
