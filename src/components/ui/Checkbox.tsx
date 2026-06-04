"use client";

import React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, error = false, disabled, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-3 cursor-pointer select-none font-sans py-1">
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            disabled={disabled}
            type="checkbox"
            className={`peer sr-only`}
            {...props}
          />
          <div
            className={`h-4.5 w-4.5 border ${
              error ? "border-red-500" : "border-border-primary"
            } bg-transparent transition-all duration-300 peer-checked:bg-border-primary peer-checked:border-border-primary peer-disabled:border-canvas-inset-bg peer-disabled:bg-canvas-inset-bg`}
          >
            <svg
              className="h-3 w-3 text-canvas-bg opacity-0 peer-checked:opacity-100 transition-opacity duration-300 absolute left-[3px] top-[4px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        {label && (
          <span className={`text-sm text-text-primary ${disabled ? "text-text-secondary cursor-not-allowed" : ""}`}>
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
