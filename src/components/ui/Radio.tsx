"use client";

import React from "react";

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className = "", label, error = false, disabled, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-3 cursor-pointer select-none font-sans py-1">
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            disabled={disabled}
            type="radio"
            className="peer sr-only"
            {...props}
          />
          <div
            className={`h-4.5 w-4.5 rounded-full border ${
              error ? "border-red-500" : "border-border-primary"
            } bg-transparent transition-all duration-300 peer-checked:border-border-primary peer-disabled:border-canvas-inset-bg`}
          >
            <div className="h-2 w-2 rounded-full bg-border-primary opacity-0 peer-checked:opacity-100 transition-opacity duration-300 absolute left-[5px] top-[5px]" />
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

Radio.displayName = "Radio";
