"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "./Badge";

export interface ProductCardProps {
  product?: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    status: "Active" | "Sold Out" | "Archived";
    images: {
      studioFront: string;
      studioBack: string;
      lookbook?: string[];
    };
    variantColor?: {
      name: string;
      hex: string;
    };
  };
  siblings?: {
    slug: string;
    variantColor?: {
      name: string;
      hex: string;
    };
  }[];
  loading?: boolean;
  error?: string;
  onQuickView?: (slug: string) => void;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  siblings = [],
  loading = false,
  error,
  onQuickView,
  onWishlistToggle,
  isWishlisted = false,
}) => {
  const [hovered, setHovered] = useState(false);

  // 1. Loading State (Skeleton)
  if (loading) {
    return (
      <div className="flex flex-col w-full font-sans animate-pulse">
        <div className="aspect-[3/4] w-full bg-canvas-inset-bg mb-4" />
        <div className="h-4 bg-canvas-inset-bg w-2/3 mb-2" />
        <div className="h-4 bg-canvas-inset-bg w-1/3 mb-3" />
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-canvas-inset-bg" />
          <div className="h-3 w-3 rounded-full bg-canvas-inset-bg" />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center aspect-[3/4] w-full border border-red-200 bg-red-50/50 p-6 text-center font-sans">
        <svg className="h-8 w-8 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs uppercase tracking-luxury text-red-600 font-semibold mb-1">Failed to load item</p>
        <p className="text-xs text-text-secondary">{error || "Product details unavailable"}</p>
      </div>
    );
  }

  // Choose appropriate hover image
  const primaryImage = product.images.studioFront;
  const hoverImage = product.images.lookbook?.[0] || product.images.studioBack || product.images.studioFront;

  return (
    <div
      className="flex flex-col w-full font-sans group select-none relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Visual Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-canvas-inset-bg mb-4">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <Image
            src={hovered ? hoverImage : primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover h-full w-full transition-transform duration-700 ease-quint group-hover:scale-105"
            priority={false}
          />
        </Link>

        {/* Wishlist Icon Button (Top Right) */}
        {onWishlistToggle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWishlistToggle(product._id);
            }}
            className="absolute top-3 right-3 z-10 p-1.5 bg-canvas-bg/85 backdrop-blur-xs border border-border-subtle hover:border-border-primary transition-colors focus:outline-none"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg
              className={`h-4 w-4 ${isWishlisted ? "fill-red-500 stroke-red-500" : "stroke-text-primary fill-none"}`}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          </button>
        )}

        {/* Status badges */}
        {product.status !== "Active" && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant={product.status === "Sold Out" ? "subtle" : "outline"}>
              {product.status}
            </Badge>
          </div>
        )}

        {/* Quick View Hover overlay button */}
        {onQuickView && product.status === "Active" && (
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-quint z-10 bg-gradient-to-t from-black/20 to-transparent">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product.slug);
              }}
              className="w-full py-2 bg-canvas-bg text-text-primary text-xs uppercase tracking-luxury border border-border-primary hover:bg-border-primary hover:text-canvas-bg transition-colors duration-300 font-semibold"
            >
              Quick View
            </button>
          </div>
        )}
      </div>

      {/* Info elements */}
      <div className="flex flex-col">
        <Link href={`/product/${product.slug}`} className="hover:underline">
          <h3 className="text-sm font-sans font-medium text-text-primary mb-1">
            {product.name}
          </h3>
        </Link>
        <span className="text-sm text-text-secondary font-sans font-light mb-2">
          ₹{product.price.toLocaleString("en-IN")}
        </span>

        {/* Variant color siblings */}
        {(product.variantColor || siblings.length > 0) && (
          <div className="flex gap-2 items-center mt-1">
            {product.variantColor && (
              <span
                title={product.variantColor.name}
                className="h-3 w-3 rounded-full border border-border-primary ring-1 ring-offset-1 ring-border-primary"
                style={{ backgroundColor: product.variantColor.hex }}
              />
            )}
            {siblings.map((sib, i) =>
              sib.variantColor ? (
                <Link
                  key={i}
                  href={`/product/${sib.slug}`}
                  title={sib.variantColor.name}
                  className="h-3 w-3 rounded-full border border-border-subtle hover:border-border-primary transition-colors"
                  style={{ backgroundColor: sib.variantColor.hex }}
                />
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
};
