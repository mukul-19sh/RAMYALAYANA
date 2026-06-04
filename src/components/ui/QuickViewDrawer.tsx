"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Drawer } from "./Drawer";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { useCart } from "@/store/useCart";

export interface QuickViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productSlug: string | null;
}

export const QuickViewDrawer: React.FC<QuickViewDrawerProps> = ({ isOpen, onClose, productSlug }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<"XS" | "S" | "M" | "L" | "XL" | null>(null);
  const addToCart = useCart((state) => state.addToCart);

  useEffect(() => {
    if (!isOpen || !productSlug) {
      setProduct(null);
      setSelectedSize(null);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${productSlug}`);
        if (!res.ok) {
          throw new Error("Failed to load product details.");
        }
        const data = await res.json();
        setProduct(data.product);
      } catch (err: any) {
        setError(err.message || "Failed to load details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [isOpen, productSlug]);

  const handleAddToCart = () => {
    if (!product || !selectedSize) return;

    addToCart({
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        slug: product.slug,
        images: { studioFront: product.images.studioFront },
      },
      selectedSize,
      quantity: 1,
    });

    alert(`${product.name} (Size ${selectedSize}) added to cart.`);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="right" title="Quick View">
      {loading ? (
        <div className="flex flex-col gap-4 animate-pulse select-none">
          <div className="aspect-[3/4] w-full bg-canvas-inset-bg" />
          <div className="h-6 bg-canvas-inset-bg w-2/3" />
          <div className="h-4 bg-canvas-inset-bg w-1/3" />
          <div className="h-10 bg-canvas-inset-bg w-full" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <svg className="h-8 w-8 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs uppercase tracking-luxury text-red-600 font-semibold mb-1">Failed to load details</p>
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      ) : product ? (
        <div className="flex flex-col gap-6 font-sans select-none">
          {/* Main Visual Image */}
          <div className="relative aspect-[3/4] w-full bg-canvas-inset-bg overflow-hidden">
            <Image
              src={product.images.studioFront}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            {product.status !== "Active" && (
              <div className="absolute top-3 left-3">
                <Badge variant={product.status === "Sold Out" ? "subtle" : "outline"}>{product.status}</Badge>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h3 className="text-xl font-serif uppercase tracking-wide text-text-primary mb-1">
              {product.name}
            </h3>
            <span className="text-sm text-text-secondary font-light mb-4">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            <p className="text-xs text-text-secondary font-light leading-relaxed mb-6">
              {product.description.editorial}
            </p>

            {/* Size Select Grid */}
            <div className="flex flex-col gap-2 mb-6">
              <span className="text-[10px] tracking-widest uppercase font-medium text-text-secondary">
                Select Size
              </span>
              <div className="grid grid-cols-5 gap-2">
                {(["XS", "S", "M", "L", "XL"] as const).map((size) => {
                  const inv = product.inventory.find((i: any) => i.size === size);
                  const isAvailable = inv && inv.quantity > 0 && product.status === "Active";

                  return (
                    <button
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 text-xs uppercase font-medium border text-center transition-all duration-300 ${
                        selectedSize === size
                          ? "border-border-primary bg-border-primary text-canvas-bg"
                          : isAvailable
                          ? "border-border-subtle hover:border-border-primary text-text-primary"
                          : "border-border-subtle bg-canvas-inset-bg/30 text-text-secondary cursor-not-allowed line-through"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              variant="primary"
              className="w-full"
            >
              {selectedSize ? "Add to Cart" : "Select Size"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-text-secondary uppercase tracking-luxury text-center py-12">
          No product selected
        </div>
      )}
    </Drawer>
  );
};
