"use client";

import React from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  loading?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, options, error, loading = false, disabled, ...props }, ref) => {
    return (
      <div className="flex flex-col w-full font-sans mb-4">
        {label && (
          <label className="text-xs uppercase tracking-luxury text-text-secondary mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled || loading}
            className={`w-full bg-transparent border-b ${
              error ? "border-red-500 focus:border-red-600" : "border-border-subtle focus:border-border-primary"
            } py-2 pr-8 text-sm text-text-primary focus:outline-none appearance-none cursor-pointer transition-all duration-300 disabled:text-text-secondary disabled:border-border-subtle ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-canvas-bg text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
          <span className="absolute right-0 top-3 pointer-events-none text-text-secondary">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </span>
        </div>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
