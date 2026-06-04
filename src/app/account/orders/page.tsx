"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { DesktopHeader } from "@/components/navigation/DesktopHeader";
import { MobileHeader } from "@/components/navigation/MobileHeader";
import { Footer } from "@/components/navigation/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ORDER_STATUS_STEPS = ["received", "processing", "shipped", "delivered"];

function getStepIndex(status: string): number {
  const normalized = status.toLowerCase();
  if (normalized === "cancelled" || normalized === "returned") return -1;
  const idx = ORDER_STATUS_STEPS.indexOf(normalized);
  return idx !== -1 ? idx : 0;
}

function getStepLabel(step: string): string {
  switch (step) {
    case "received": return "Order Received";
    case "processing": return "Packed & Processed";
    case "shipped": return "Dispatched & In Transit";
    case "delivered": return "Delivered";
    default: return step;
  }
}

// Inner component to safely use search params
function OrdersContent() {
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();

  // Search parameters for guests/success redirects
  const urlOrderNumber = searchParams.get("orderNumber");
  const urlEmail = searchParams.get("email");

  // Orders list and selected tracking
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest Search Fields
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  const isAuthenticated = authStatus === "authenticated";

  // 1. Fetch user orders history if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchHistory = async () => {
        setLoadingList(true);
        setError(null);
        try {
          const res = await fetch("/api/orders");
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to load order history.");
          setOrders(data.orders || []);
          
          // Auto-select first order or URL-specified order
          if (data.orders?.length > 0) {
            const initial = urlOrderNumber 
              ? data.orders.find((o: any) => o.orderNumber === urlOrderNumber) || data.orders[0]
              : data.orders[0];
            setSelectedOrder(initial);
          }
        } catch (err: any) {
          setError(err.message || "Failed to load orders.");
        } finally {
          setLoadingList(false);
        }
      };
      fetchHistory();
    }
  }, [isAuthenticated, urlOrderNumber]);

  // 2. Fetch specific guest order if search params are in URL on load
  useEffect(() => {
    if (!isAuthenticated && urlOrderNumber && urlEmail) {
      setSearchOrderNo(urlOrderNumber);
      setSearchEmail(urlEmail);
      fetchSingleOrder(urlOrderNumber, urlEmail);
    }
  }, [isAuthenticated, urlOrderNumber, urlEmail]);

  // Fetch a single order (for guest lookup or details loading)
  const fetchSingleOrder = async (orderNo: string, contactEmail: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderNo}?email=${encodeURIComponent(contactEmail)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to locate order details.");
      }
      setSelectedOrder(data.order);
    } catch (err: any) {
      setError(err.message || "Failed to find order.");
      setSelectedOrder(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGuestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchOrderNo.trim() || !searchEmail.trim()) {
      setError("Please input both the Order Number and associated Email.");
      return;
    }
    fetchSingleOrder(searchOrderNo.trim(), searchEmail.trim());
  };

  // Stepper UI Renderer
  const renderStepper = (status: string) => {
    const currentIndex = getStepIndex(status);

    if (currentIndex === -1) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 text-xs font-medium uppercase tracking-wider text-center select-none">
          Order status is: {status}
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col gap-6 py-4 font-sans select-none">
        <div className="relative flex justify-between items-center w-full">
          {/* Progress bar lines */}
          <div className="absolute top-[9px] left-2 right-2 h-0.5 bg-border-subtle -z-10" />
          <div 
            className="absolute top-[9px] left-2 h-0.5 bg-border-primary -z-10 transition-all duration-500" 
            style={{ width: `${(currentIndex / (ORDER_STATUS_STEPS.length - 1)) * 100}%` }}
          />

          {/* Stepper Dots */}
          {ORDER_STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isActive = idx === currentIndex;

            return (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`h-5 w-5 rounded-full border flex items-center justify-center text-[9px] font-semibold transition-all duration-300 ${
                    isActive 
                      ? "border-border-primary bg-border-primary text-canvas-bg ring-4 ring-canvas-inset-bg/30"
                      : isCompleted
                      ? "border-border-primary bg-border-primary text-canvas-bg"
                      : "border-border-subtle bg-canvas-bg text-text-secondary"
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className={`text-[9px] uppercase tracking-wider mt-2 text-center font-medium ${
                  isActive ? "text-text-primary font-bold" : "text-text-secondary"
                }`}>
                  {getStepLabel(step)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-12 flex flex-col lg:flex-row gap-12 items-start">
      {/* Left panel: Lookup or History List */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
        {isAuthenticated ? (
          // Logged-in History
          <div className="flex flex-col gap-4">
            <h2 className="text-xs uppercase tracking-luxury font-semibold border-b border-border-subtle pb-2 text-text-primary">
              Order History
            </h2>
            {loadingList ? (
              <span className="text-xs text-text-secondary animate-pulse">Loading list...</span>
            ) : orders.length === 0 ? (
              <p className="text-xs text-text-secondary font-light">No orders logged under this account yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((ord) => (
                  <div
                    key={ord._id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`border p-4 cursor-pointer transition-colors ${
                      selectedOrder?.orderNumber === ord.orderNumber
                        ? "border-border-primary bg-canvas-inset-bg/10"
                        : "border-border-subtle hover:border-border-primary"
                    }`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-mono font-medium text-text-primary">{ord.orderNumber}</span>
                      <span className="text-[10px] uppercase font-mono font-bold text-accent">
                        ₹{ord.grandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-text-secondary font-light">
                      <span>{new Date(ord.createdAt).toLocaleDateString("en-IN")}</span>
                      <span className="uppercase">{ord.orderStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Guest Search Card
          <div className="border border-border-primary p-6 bg-canvas-bg font-sans">
            <h2 className="text-xs uppercase tracking-luxury font-semibold border-b border-border-subtle pb-2 text-text-primary mb-4">
              Guest Order Tracking
            </h2>
            <form onSubmit={handleGuestSearch} className="flex flex-col gap-4">
              <Input
                label="Order Number"
                placeholder="RAMYA-ORD-20260602-1234"
                value={searchOrderNo}
                onChange={(e) => setSearchOrderNo(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="ananya@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                required
              />
              {error && (
                <p className="text-[10px] text-red-700 font-medium select-none">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" className="w-full text-xs uppercase tracking-luxury">
                Track Order
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Right panel: Visual Stepper and Tracking Details */}
      <div className="flex-1 w-full border border-border-primary p-6 md:p-8 bg-canvas-bg">
        {loadingDetail ? (
          <div className="w-full h-64 flex items-center justify-center">
            <span className="text-xs uppercase tracking-luxury text-text-secondary animate-pulse">
              Locating order details...
            </span>
          </div>
        ) : selectedOrder ? (
          <div className="flex flex-col gap-8">
            {/* Header info */}
            <div className="border-b border-border-subtle pb-4 flex flex-col md:flex-row justify-between gap-4 select-none">
              <div>
                <span className="text-[10px] tracking-luxury uppercase font-medium text-text-secondary mb-1 block">
                  ORDER STATUS DETAILS
                </span>
                <h1 className="text-xl md:text-2xl font-serif text-text-primary uppercase font-medium">
                  {selectedOrder.orderNumber}
                </h1>
              </div>
              <div className="md:text-right text-xs">
                <span className="text-[9px] uppercase tracking-widest text-text-secondary block">Date Logged</span>
                <span className="font-mono font-medium text-text-primary">
                  {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Stepper progress */}
            {renderStepper(selectedOrder.orderStatus)}

            {/* Shipping details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border-subtle pt-6 text-xs font-sans">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-text-secondary block mb-2">Delivery Address</span>
                <p className="font-medium text-text-primary">{selectedOrder.shippingAddress?.street}</p>
                <p className="text-text-secondary font-light mt-0.5">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}
                </p>
                <p className="text-text-secondary font-light mt-0.5">{selectedOrder.shippingAddress?.country}</p>
                <p className="text-text-secondary font-light mt-1">Phone: {selectedOrder.shippingAddress?.phone}</p>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-widest text-text-secondary block mb-2">Transit Details</span>
                {selectedOrder.shippingDetails?.trackingNumber ? (
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-text-primary">
                      Carrier: <span className="uppercase">{selectedOrder.shippingDetails.carrier}</span>
                    </p>
                    <p className="font-semibold text-text-primary">
                      Tracking No: <span className="font-mono font-medium text-accent">{selectedOrder.shippingDetails.trackingNumber}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-text-secondary font-light">Cargo is awaiting pickup by the local logisticians.</p>
                )}
                <p className="text-[10px] text-text-secondary block font-light mt-2">
                  Delivery Method: {selectedOrder.deliveryMethod === "express" ? "Express Courier Dispatch" : "Standard Loom Cargo"}
                </p>
              </div>
            </div>

            {/* Items summary */}
            <div className="border-t border-border-subtle pt-6">
              <span className="text-[9px] uppercase tracking-widest text-text-secondary block mb-4">Coordinates List</span>
              <div className="flex flex-col gap-4">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="relative h-12 w-9 bg-canvas-inset-bg border border-border-subtle overflow-hidden shrink-0">
                      {item.product?.images?.studioFront ? (
                        <Image
                          src={item.product.images.studioFront}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-canvas-inset-bg" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs uppercase font-medium truncate text-text-primary">
                        {item.product?.name || "Archived product"}
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

            {/* Price breakdown */}
            <div className="border-t border-border-subtle pt-6 flex flex-col gap-2.5 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-text-primary">₹{selectedOrder.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Coupon Discounts</span>
                  <span className="font-mono">-₹{selectedOrder.discountAmount?.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-mono text-text-primary">
                  {selectedOrder.shippingAmount > 0 ? `₹${selectedOrder.shippingAmount.toLocaleString("en-IN")}` : "Free"}
                </span>
              </div>
              <div className="flex justify-between border-t border-border-subtle pt-3 font-semibold text-sm tracking-wider text-text-primary">
                <span>GRAND TOTAL</span>
                <span className="font-mono">₹{selectedOrder.grandTotal?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center select-none">
            <span className="text-xs uppercase tracking-luxury text-text-secondary mb-2">No Order Selected</span>
            <p className="text-xs text-text-secondary font-light text-center max-w-xs leading-relaxed">
              Use the lookup panel on the left or sign in to track active orders.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas-bg text-text-primary antialiased">
      <DesktopHeader />
      <MobileHeader />
      
      <main className="flex-1 w-full bg-canvas-bg">
        <Suspense fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <span className="text-xs uppercase tracking-luxury text-text-secondary animate-pulse">Loading Tracking Portal...</span>
          </div>
        }>
          <OrdersContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
