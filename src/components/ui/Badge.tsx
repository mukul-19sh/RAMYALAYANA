"use client";

import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "accent" | "subtle" | "outline" | "danger" | "success";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "neutral", className = "" }) => {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 text-[10px] font-sans tracking-widest uppercase font-medium border";

  const variantStyles = {
    neutral: "bg-border-primary text-canvas-bg border-border-primary",
    accent: "bg-accent text-canvas-bg border-accent",
    subtle: "bg-canvas-inset-bg text-text-primary border-canvas-inset-bg",
    outline: "bg-transparent text-text-primary border-border-primary",
    danger: "bg-transparent text-red-600 border-red-500",
    success: "bg-transparent text-emerald-700 border-emerald-600",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
