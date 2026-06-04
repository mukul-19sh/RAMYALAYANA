"use client";

import React, { useState } from "react";
import { Button } from "./Button";

export const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      // Simulate newsletter subscribe endpoint
      const response = await new Promise<{ success: boolean; msg: string }>((resolve) =>
        setTimeout(() => resolve({ success: true, msg: "Thank you for joining the RAMYALAYANA newsletter." }), 1000)
      );

      if (response.success) {
        setStatus("success");
        setMessage(response.msg);
        setEmail("");
      } else {
        setStatus("error");
        setMessage("Subscription failed. Please check your email.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("An unexpected error occurred.");
    }
  };

  return (
    <div className="flex flex-col w-full font-sans max-w-md select-none">
      <h3 className="text-xs uppercase tracking-luxury text-text-primary mb-3">
        THE RAMYALAYANA NEWSLETTER
      </h3>
      <p className="text-xs text-text-secondary font-light mb-4">
        Subscribe to receive notification of seasonal releases, artisan profiles, and private lookbooks.
      </p>

      {status === "success" ? (
        <span className="text-sm text-text-primary font-medium tracking-wide">
          {message}
        </span>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative flex items-center border-b border-border-primary">
            <input
              type="email"
              required
              disabled={status === "loading"}
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent py-2.5 text-sm text-text-primary placeholder-text-secondary focus:outline-none disabled:text-text-secondary"
            />
            <Button
              type="submit"
              variant="tertiary"
              size="sm"
              loading={status === "loading"}
              className="absolute right-0 pr-0"
            >
              Join
            </Button>
          </div>
          {status === "error" && (
            <span className="text-xs text-red-500 mt-1">{message}</span>
          )}
        </form>
      )}
    </div>
  );
};
