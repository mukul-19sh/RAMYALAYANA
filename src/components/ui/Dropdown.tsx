"use client";

import React, { useState, useRef, useEffect } from "react";

export interface DropdownItem {
  label: string;
  onClick: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = "left" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const alignStyles = {
    left: "left-0",
    right: "right-0",
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left font-sans select-none z-10">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute mt-2 w-48 bg-canvas-bg border border-border-primary shadow-soft py-1 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-200 ${alignStyles[align]}`}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className="flex w-full px-4 py-2 text-left text-xs uppercase tracking-wider text-text-primary hover:bg-canvas-inset-bg transition-colors duration-200"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
