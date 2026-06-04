"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/useCart";
import { trackFunnelEvent } from "@/lib/analytics/track";
import { Button } from "@/components/ui/Button";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const clearCart = useCart((state) => state.clearCart);

  const orderNumber = searchParams.get("orderNumber");
  const email = searchParams.get("email");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear cart immediately on successful payment success mount
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Fetch order details
  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      setError("Missing order number in URL query parameters.");
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const queryUrl = email 
          ? `/api/orders/${orderNumber}?email=${encodeURIComponent(email)}`
          : `/api/orders/${orderNumber}`;

        const res = await fetch(queryUrl);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load order receipts.");
        }

        setOrder(data.order);

        // Trigger order_completed (Step 8)
        trackFunnelEvent("order_completed", 8, {
          orderValue: data.order.grandTotal,
          orderNumber: data.order.orderNumber,
          paymentMethod: data.order.paymentMethod,
          userId: session?.user?.id,
        });
      } catch (err: any) {
        setError(err.message || "Unable to fetch order information.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderNumber, email, session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-bg text-text-primary font-sans flex items-center justify-center select-none">
        <span className="text-xs uppercase tracking-luxury text-text-secondary animate-pulse">
          Validating Order Details...
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-canvas-bg text-text-primary font-sans flex flex-col items-center justify-center p-8 select-none">
        <span className="text-xs tracking-luxury text-red-700 uppercase font-semibold mb-3">ORDER FETCH FAILED</span>
        <p className="text-sm font-light text-text-secondary mb-6 text-center max-w-sm leading-relaxed">
          {error || "We could not find the order matching this transaction session."}
        </p>
        <Link href="/shop">
          <Button variant="primary">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  // Estimated delivery derivation
  const getDeliveryDateString = () => {
    if (order.shippingDetails?.estimatedDelivery) {
      return new Date(order.shippingDetails.estimatedDelivery).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    const daysToAdd = order.deliveryMethod === "express" ? 2 : 5;
    const date = new Date(order.createdAt || Date.now());
    date.setDate(date.getDate() + daysToAdd);
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const trackQuery = email
    ? `/account/orders?orderNumber=${order.orderNumber}&email=${encodeURIComponent(email)}`
    : `/account/orders?orderNumber=${order.orderNumber}`;

  return (
    <div className="min-h-screen bg-canvas-bg text-text-primary font-sans flex flex-col">
      {/* Securing Header */}
      <header className="border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-8 select-none">
        <Link href="/" className="hover:opacity-80 transition-opacity flex items-center gap-2">
          <Image
            src="/icon.svg"
            alt="RAMYALAYANA Icon"
            width={25}
            height={28}
            priority
            className="object-contain"
          />
          <Image
            src="/wordmark.svg"
            alt="RAMYALAYANA Wordmark"
            width={99}
            height={14}
            priority
            className="object-contain"
          />
        </Link>
      </header>

      <main className="flex-1 w-full max-w-[800px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center">
        {/* Animated Checkmark Visual */}
        <div className="h-16 w-16 rounded-full border border-emerald-800 bg-emerald-50 flex items-center justify-center text-emerald-800 mb-6 select-none animate-bounce">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="text-[10px] tracking-luxury uppercase font-medium text-text-secondary mb-2 select-none">
          TRANSACTION SECURED
        </span>
        <h1 className="text-2xl md:text-3xl font-serif uppercase tracking-wide text-text-primary mb-1 select-none text-center">
          Thank you for your Order
        </h1>
        <p className="text-xs text-text-secondary font-light text-center mb-8">
          A receipt has been dispatched to <strong className="text-text-primary">{order.contactEmail}</strong>.
        </p>

        {/* Info Grid */}
        <div className="w-full border border-border-primary p-6 mb-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-text-secondary block mb-0.5">Order Number</span>
              <span className="font-mono font-medium text-text-primary">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest text-text-secondary block mb-0.5">Payment Method</span>
              <span className="uppercase font-medium text-text-primary">
                {order.paymentMethod === "cod" ? "Cash On Delivery (COD)" : "Razorpay Payment"}
              </span>
            </div>
          </div>

          <div className="border-t border-border-subtle pt-4 text-xs">
            <span className="text-[9px] uppercase tracking-widest text-text-secondary block mb-1">Estimated Delivery</span>
            <span className="font-medium text-text-primary text-sm">
              {getDeliveryDateString()}
            </span>
            <span className="text-[10px] text-text-secondary block font-light mt-1">
              Method: {order.deliveryMethod === "express" ? "Express Courier Air Dispatch" : "Standard Loom Cargo"}
            </span>
          </div>

          {/* Items Summary list */}
          <div className="border-t border-border-subtle pt-4">
            <span className="text-[9px] uppercase tracking-widest text-text-secondary block mb-3">Items Purchased</span>
            <div className="flex flex-col gap-4">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="relative h-12 w-9 bg-canvas-inset-bg border border-border-subtle overflow-hidden shrink-0">
                    {item.product?.images?.studioFront ? (
                      <Image
                        src={item.product.images.studioFront}
                        alt={item.product.name || "Item image"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-canvas-inset-bg" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs uppercase font-medium truncate text-text-primary">
                      {item.product?.name || "Loom Product"}
                    </h4>
                    <p className="text-[9px] text-text-secondary mt-0.5">
                      Size: {item.selectedSize} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium text-text-primary">
                    ₹{(item.priceAtPurchase * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary table */}
          <div className="border-t border-border-subtle pt-4 flex flex-col gap-2 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-text-primary">₹{order.totalAmount?.toLocaleString("en-IN")}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Discounts Applied</span>
                <span className="font-mono">-₹{order.discountAmount?.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-mono text-text-primary">
                {order.shippingAmount > 0 ? `₹${order.shippingAmount.toLocaleString("en-IN")}` : "Free"}
              </span>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-2 font-semibold text-sm tracking-wider text-text-primary">
              <span>GRAND TOTAL</span>
              <span className="font-mono">₹{order.grandTotal?.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-wrap gap-4 justify-center w-full">
          <Link href={trackQuery}>
            <Button variant="primary" className="text-xs uppercase tracking-luxury">
              Track Order Status
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="secondary" className="text-xs uppercase tracking-luxury">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas-bg text-text-primary font-sans flex items-center justify-center select-none">
        <span className="text-xs uppercase tracking-luxury text-text-secondary animate-pulse">
          Validating Order Details...
        </span>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
