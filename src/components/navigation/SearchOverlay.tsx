"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setProducts([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        // Query products API with basic search param
        const res = await fetch(`/api/products?limit=5&status=Active`);
        if (res.ok) {
          const data = await res.json();
          // Filter client-side just to simulate simple query search on products name
          const filtered = (data.products || []).filter((p: any) =>
            p.name.toLowerCase().includes(query.toLowerCase())
          );
          setProducts(filtered);
        }
      } catch (err) {
        console.error("Search query error:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-overlay flex flex-col bg-canvas-bg/98 backdrop-blur-md font-sans">
      {/* Header section */}
      <div className="flex items-center justify-between px-space-md py-6 border-b border-border-subtle max-w-[1600px] w-full mx-auto">
        <div className="flex-1 max-w-2xl">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search catalog by silhouette, linen, category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xl md:text-2xl text-text-primary placeholder-text-secondary border-none focus:outline-none font-sans font-light"
          />
        </div>
        <button
          onClick={onClose}
          aria-label="Close search overlay"
          className="text-text-secondary hover:text-text-primary transition-colors focus:outline-none p-2 ml-4"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Results panel */}
      <div className="flex-1 overflow-y-auto max-w-[1600px] w-full mx-auto px-space-md py-8">
        {loading ? (
          <div className="text-xs uppercase tracking-luxury text-text-secondary">Searching catalog...</div>
        ) : products.length > 0 ? (
          <div className="flex flex-col gap-6">
            <h4 className="text-xs uppercase tracking-luxury text-text-secondary">Search Results ({products.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {products.map((prod) => (
                <Link
                  key={prod._id}
                  href={`/product/${prod.slug}`}
                  onClick={onClose}
                  className="flex flex-col group"
                >
                  <div className="relative aspect-[3/4] bg-canvas-inset-bg mb-2 overflow-hidden">
                    <Image
                      src={prod.images.studioFront}
                      alt={prod.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 20vw"
                    />
                  </div>
                  <span className="text-xs font-medium text-text-primary group-hover:underline">{prod.name}</span>
                  <span className="text-xs text-text-secondary font-light mt-0.5">₹{prod.price.toLocaleString("en-IN")}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : query ? (
          <div className="text-xs uppercase tracking-luxury text-text-secondary">No products matched your search.</div>
        ) : (
          <div className="flex flex-col gap-4">
            <h4 className="text-xs uppercase tracking-luxury text-text-secondary">Suggested Queries</h4>
            <div className="flex flex-wrap gap-2">
              {["Atelier", "Dresses", "シルエット", "Linens", "Silk"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-3 py-1.5 border border-border-subtle hover:border-border-primary text-xs uppercase tracking-wider text-text-primary bg-transparent transition-all duration-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
