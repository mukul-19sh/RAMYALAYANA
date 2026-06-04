"use client";

import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  loading?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, loading = false, disabled, type = "text", ...props }, ref) => {
    return (
      <div className="flex flex-col w-full font-sans mb-4">
        {label && (
          <label className="text-xs uppercase tracking-luxury text-text-secondary mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            disabled={disabled || loading}
            type={type}
            className={`w-full bg-transparent border-b ${
              error ? "border-red-500 focus:border-red-600" : "border-border-subtle focus:border-border-primary"
            } py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none transition-all duration-300 disabled:text-text-secondary disabled:border-border-subtle ${className}`}
            {...props}
          />
          {loading && (
            <span className="absolute right-0 top-2">
              <svg className="animate-spin h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </span>
          )}
        </div>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
