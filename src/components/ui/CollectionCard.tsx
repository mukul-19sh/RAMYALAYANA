"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface CollectionCardProps {
  title?: string;
  slug?: string;
  coverImage?: string;
  description?: string;
  loading?: boolean;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  title,
  slug,
  coverImage,
  description,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col w-full font-sans animate-pulse">
        <div className="aspect-[16/9] w-full bg-canvas-inset-bg mb-4" />
        <div className="h-6 bg-canvas-inset-bg w-1/3 mb-2" />
        <div className="h-4 bg-canvas-inset-bg w-2/3" />
      </div>
    );
  }

  if (!slug || !coverImage || !title) return null;

  return (
    <div className="flex flex-col w-full font-sans group select-none">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-canvas-inset-bg mb-4">
        <Link href={`/shop?category=${slug}`} className="block h-full w-full">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover h-full w-full transition-transform duration-700 ease-quint group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
        </Link>
      </div>
      <div className="flex flex-col">
        <Link href={`/shop?category=${slug}`} className="hover:underline">
          <h2 className="text-xl md:text-2xl font-serif text-text-primary tracking-wide mb-1">
            {title}
          </h2>
        </Link>
        {description && (
          <p className="text-xs md:text-sm text-text-secondary font-light max-w-xl">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
