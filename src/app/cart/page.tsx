"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/useCart";
import { EditorialLayout } from "@/components/layouts/EditorialLayout";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart } = useCart();

  const cartSubtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <EditorialLayout width="standard">
      <div className="w-full max-w-4xl mx-auto py-8 font-sans text-text-primary">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-medium text-text-secondary mb-6 select-none">
          <Link href="/" className="hover:text-text-primary">Home</Link>
          <span>/</span>
          <span className="text-text-primary">Shopping Cart</span>
        </div>

        <h1 className="text-3xl font-serif uppercase tracking-wide mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="border border-border-subtle p-12 flex flex-col items-center justify-center text-center select-none bg-canvas-bg">
            <span className="text-[10px] tracking-luxury uppercase font-medium text-text-secondary mb-3">
              YOUR CART IS CURRENTLY EMPTY
            </span>
            <p className="text-xs font-light text-text-secondary max-w-xs mb-8 leading-relaxed">
              Before proceeding to checkout, choose from our curated hand-loomed series.
            </p>
            <Link href="/shop">
              <Button variant="primary" className="text-xs uppercase tracking-luxury">
                Shop Collection
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items List */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="border border-border-primary divide-y divide-border-subtle bg-canvas-bg">
                {items.map((item) => (
                  <div
                    key={`${item.product._id}-${item.selectedSize}`}
                    className="p-6 flex gap-6 items-center"
                  >
                    {/* Image */}
                    <div className="relative h-24 w-18 bg-canvas-inset-bg border border-border-subtle overflow-hidden shrink-0">
                      <Image
                        src={item.product.images.studioFront}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-xs uppercase tracking-wider font-semibold truncate text-text-primary">
                            {item.product.name}
                          </h4>
                          <span className="text-xs font-mono font-medium text-text-primary shrink-0">
                            ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary mt-1">
                          Size: {item.selectedSize}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex border border-border-subtle items-center">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.selectedSize, item.quantity - 1)}
                            className="px-2.5 py-1 hover:bg-canvas-inset-bg/20 text-text-primary text-xs font-medium focus:outline-none"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-medium text-text-primary font-mono select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.selectedSize, item.quantity + 1)}
                            className="px-2.5 py-1 hover:bg-canvas-inset-bg/20 text-text-primary text-xs font-medium focus:outline-none"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product._id, item.selectedSize)}
                          className="text-[10px] uppercase font-semibold text-red-700 hover:underline focus:outline-none"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-4 border border-border-primary bg-canvas-bg p-6">
              <h3 className="text-xs uppercase tracking-luxury font-medium border-b border-border-subtle pb-3 mb-4 text-text-primary">
                Order Summary
              </h3>

              <div className="flex flex-col gap-3 text-xs text-text-secondary pb-6">
                <div className="flex justify-between">
                  <span>Items Count</span>
                  <span className="text-text-primary font-mono">{totalItems}</span>
                </div>
                <div className="flex justify-between border-t border-border-subtle pt-3 text-xs">
                  <span>Subtotal</span>
                  <span className="font-mono text-text-primary">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between border-t border-border-subtle pt-3 font-semibold text-sm tracking-wider text-text-primary">
                  <span>ESTIMATED TOTAL</span>
                  <span className="font-mono">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button variant="primary" className="w-full text-xs uppercase tracking-luxury font-medium py-3.5">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </EditorialLayout>
  );
}
