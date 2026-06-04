"use client";

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  error?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", loading = false, error = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-sans tracking-luxury uppercase transition-all duration-300 focus:outline-none select-none";

    const variantStyles = {
      primary: `bg-border-primary text-canvas-bg border border-border-primary hover:bg-transparent hover:text-text-primary active:bg-text-secondary disabled:bg-canvas-inset-bg disabled:border-canvas-inset-bg disabled:text-text-secondary`,
      secondary: `bg-transparent text-text-primary border border-border-primary hover:bg-border-primary hover:text-canvas-bg active:bg-text-secondary disabled:border-canvas-inset-bg disabled:text-text-secondary`,
      tertiary: `bg-transparent text-text-primary border border-transparent underline hover:text-accent disabled:text-text-secondary`,
    };

    const sizeStyles = {
      sm: "px-space-sm py-2 text-xs",
      md: "px-space-md py-3 text-sm md:text-sm sm:text-xs",
      lg: "px-space-lg py-4 text-base md:text-sm sm:text-xs",
    };

    const errorStyles = error ? "border-red-500 text-red-500 hover:bg-transparent hover:text-red-600" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || loading || error}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${errorStyles} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </span>
        ) : error ? (
          "Error Occurred"
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
