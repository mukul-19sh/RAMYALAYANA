"use client";

import React from "react";
import { Badge } from "./Badge";

export interface ReviewCardProps {
  reviewerName?: string;
  rating?: number;
  comment?: string;
  isTrustedReviewer?: boolean;
  createdAt?: string;
  loading?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  reviewerName,
  rating = 5,
  comment,
  isTrustedReviewer = false,
  createdAt,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col w-full font-sans border-b border-border-subtle py-4 animate-pulse">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 bg-canvas-inset-bg w-1/4" />
          <div className="h-3 bg-canvas-inset-bg w-1/6" />
        </div>
        <div className="h-3 bg-canvas-inset-bg w-1/3 mb-2" />
        <div className="h-4 bg-canvas-inset-bg w-5/6" />
      </div>
    );
  }

  if (!reviewerName || !comment) return null;

  return (
    <div className="flex flex-col w-full font-sans border-b border-border-subtle py-6">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary uppercase tracking-wider">
            {reviewerName}
          </span>
          {isTrustedReviewer && <Badge variant="accent">Trusted Reviewer</Badge>}
        </div>
        {createdAt && (
          <span className="text-xs text-text-secondary">
            {new Date(createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Render simple star ratings */}
      <div className="flex gap-1 text-text-primary mb-3">
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={i}
            className={`h-3 w-3 ${i < rating ? "fill-current" : "stroke-current fill-none"}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.286 3.97c.3.921-.755 1.688-1.54 1.118l-3.388-2.46a1 1 0 00-1.175 0l-3.388 2.46c-.784.57-1.838-.197-1.539-1.118l1.288-3.97a1 1 0 00-.364-1.118L2.05 9.397c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z" />
          </svg>
        ))}
      </div>

      <p className="text-sm text-text-secondary font-light leading-relaxed whitespace-pre-line">
        {comment}
      </p>
    </div>
  );
};
