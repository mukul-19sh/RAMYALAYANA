"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/useCart";
import { CheckoutLayout } from "@/components/layouts/CheckoutLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { trackFunnelEvent } from "@/lib/analytics/track";

// Helper to load Razorpay script
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Cart state from Zustand
  const { items, coupon, appliedGiftCards, applyCoupon, removeCoupon, clearCart } = useCart();

  // Loading and error states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");

  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");

  // COD Eligibility states
  const [checkingCod, setCheckingCod] = useState(false);
  const [codEligible, setCodEligible] = useState(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Track if shipping form is completed (for analytics step 2)
  const [shippingFired, setShippingFired] = useState(false);

  const cartSubtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Autofill if logged in
  useEffect(() => {
    if (session?.user) {
      setEmail(session.user.email || "");
      setName(session.user.name || "");
    }
  }, [session]);

  // Calculations
  let couponDiscount = 0;
  if (coupon) {
    if (coupon.discountType === "percentage") {
      couponDiscount = (cartSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
      }
    } else {
      couponDiscount = coupon.discountValue;
    }
  }

  const shippingFee = deliveryMethod === "express" ? 200 : 0;
  const grandTotal = Math.max(0, cartSubtotal - couponDiscount + shippingFee);

  // 1. Mount: Trigger checkout_started (Step 1)
  useEffect(() => {
    if (items.length > 0) {
      trackFunnelEvent("checkout_started", 1, {
        orderValue: cartSubtotal,
        userId: session?.user?.id,
      });
    }
  }, [items, cartSubtotal, session]);

  // 2. Shipping Completed Tracker (Step 2)
  // We trigger this once the basic shipping fields look complete (pincode is 6-digit, street, email, phone have content)
  useEffect(() => {
    if (
      !shippingFired &&
      email.includes("@") &&
      phone.length >= 10 &&
      street1.length > 3 &&
      city.length > 1 &&
      state.length > 1 &&
      pincode.length === 6
    ) {
      setShippingFired(true);
      trackFunnelEvent("shipping_completed", 2, {
        orderValue: grandTotal,
        userId: session?.user?.id,
      });
    }
  }, [email, phone, street1, city, state, pincode, grandTotal, session, shippingFired]);

  // COD Eligibility Checker
  useEffect(() => {
    if (pincode.length === 6 && cartSubtotal > 0) {
      const verifyCodEligibility = async () => {
        setCheckingCod(true);
        try {
          const res = await fetch("/api/checkout/cod-eligible", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              postalCode: pincode,
              orderValue: grandTotal,
              sessionId: session?.user?.id || "guest",
            }),
          });
          const data = await res.json();
          setCodEligible(!!data.eligible);
          if (!data.eligible && paymentMethod === "cod") {
            setPaymentMethod("razorpay"); // Reset to Razorpay if no longer eligible
          }
        } catch {
          setCodEligible(false);
          setPaymentMethod("razorpay");
        } finally {
          setCheckingCod(false);
        }
      };
      verifyCodEligibility();
    } else {
      setCodEligible(false);
      if (paymentMethod === "cod") {
        setPaymentMethod("razorpay");
      }
    }
  }, [pincode, cartSubtotal, grandTotal, session, paymentMethod]);

  // Handle Delivery Choice change
  const handleDeliveryChange = (method: "standard" | "express") => {
    setDeliveryMethod(method);
    trackFunnelEvent("delivery_selected", 3, {
      orderValue: cartSubtotal - couponDiscount + (method === "express" ? 200 : 0),
      userId: session?.user?.id,
    });
  };

  // Handle Payment Choice change
  const handlePaymentChange = (method: "razorpay" | "cod") => {
    setPaymentMethod(method);
    trackFunnelEvent("payment_selected", 4, {
      orderValue: grandTotal,
      paymentMethod: method,
      userId: session?.user?.id,
    });
  };

  // Apply Coupon Action
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput) return;
    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCodeInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid coupon code");
      }

      applyCoupon({
        code: data.coupon.code,
        discountType: data.coupon.discountType,
        discountValue: data.coupon.discountValue,
        minOrderValue: data.coupon.minOrderValue,
        maxDiscount: data.coupon.maxDiscount,
      });
      setCouponCodeInput("");
    } catch (err: any) {
      setCouponError(err.message || "Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Place Order Action
  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    // Manual validations
    if (!name.trim()) return setErrorMessage("Full Name is required.");
    if (!email.trim() || !email.includes("@")) return setErrorMessage("A valid email is required.");
    if (phone.length < 10) return setErrorMessage("Enter a valid 10-digit phone number.");
    if (!street1.trim()) return setErrorMessage("Address Line 1 is required.");
    if (!city.trim()) return setErrorMessage("City is required.");
    if (!state.trim()) return setErrorMessage("State is required.");
    if (pincode.length !== 6) return setErrorMessage("Pincode must be exactly 6 digits.");

    setSubmitting(true);

    // Track payment_initiated (Step 5)
    await trackFunnelEvent("payment_initiated", 5, {
      orderValue: grandTotal,
      paymentMethod,
      userId: session?.user?.id,
    });

    const street = street2.trim() ? `${street1.trim()}, ${street2.trim()}` : street1.trim();
    const payload = {
      items: items.map((item) => ({
        product: item.product._id,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
      })),
      contactEmail: email.toLowerCase().trim(),
      paymentMethod,
      deliveryMethod,
      appliedCoupon: coupon?.code,
      shippingAddress: {
        street,
        city: city.trim(),
        state: state.trim(),
        postalCode: pincode.trim(),
        country,
        phone: phone.trim(),
      },
      sessionId: session?.user?.id || "guest",
    };

    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      const { orderNumber, razorpayOrderId, amount } = data;

      // ── COD or Free Flow: redirects directly ───────────────────────────────
      if (paymentMethod === "cod" || amount === 0) {
        // Track payment_success (Step 6) for COD/Free orders
        await trackFunnelEvent("payment_success", 6, {
          orderValue: grandTotal,
          orderNumber,
          paymentMethod,
          userId: session?.user?.id,
        });
        
        router.push(`/checkout/success?orderNumber=${orderNumber}&email=${encodeURIComponent(email)}`);
        return;
      }

      // ── Razorpay Flow: Open Gateway ────────────────────────────────────────
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Razorpay payment gateway failed to load. Please try again.");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_key", // Fallback to standard sandbox key
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "RAMYA",
        description: "Bespoke Handloom Order Checkout",
        order_id: razorpayOrderId,
        prefill: {
          name,
          email,
          contact: phone,
        },
        theme: {
          color: "#1A1C1E", // Matches border-primary
        },
        handler: async function (response: any) {
          try {
            // Verify signature on backend
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderNumber,
                appliedCoupon: coupon?.code,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Signature verification failed.");
            }

            // Track payment_success (Step 6)
            await trackFunnelEvent("payment_success", 6, {
              orderValue: grandTotal,
              orderNumber,
              paymentMethod: "razorpay",
              userId: session?.user?.id,
            });

            router.push(`/checkout/success?orderNumber=${orderNumber}&email=${encodeURIComponent(email)}`);
          } catch (err: any) {
            setErrorMessage(err.message || "Failed to verify signature.");
            await trackFunnelEvent("payment_failed", 7, {
              orderValue: grandTotal,
              orderNumber,
              paymentMethod: "razorpay",
              userId: session?.user?.id,
            });
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: async function () {
            // Trigger payment_failed (Step 7) on closure
            await trackFunnelEvent("payment_failed", 7, {
              orderValue: grandTotal,
              orderNumber,
              paymentMethod: "razorpay",
              userId: session?.user?.id,
            });
            setSubmitting(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  // If cart is empty, show empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-canvas-bg text-text-primary antialiased font-sans flex flex-col justify-between">
        <header className="border-b border-border-subtle h-16 flex items-center px-4 md:px-8 select-none">
          <Link href="/" className="text-xl font-serif tracking-widest uppercase font-semibold">
            RAMYA
          </Link>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 select-none">
          <span className="text-[10px] tracking-luxury uppercase font-medium text-text-secondary mb-3">
            YOUR CART IS EMPTY
          </span>
          <p className="text-sm font-light text-text-secondary text-center max-w-sm mb-6 leading-relaxed">
            Select coordinates from the curated series before checking out.
          </p>
          <Link href="/shop">
            <Button variant="primary">Shop Collection</Button>
          </Link>
        </main>
      </div>
    );
  }

  // Right column: Summary component node
  const SummaryNode = (
    <div className="border border-border-primary bg-canvas-bg p-6 font-sans">
      <h3 className="text-xs uppercase tracking-luxury font-medium border-b border-border-subtle pb-3 mb-4 text-text-primary">
        Order Summary
      </h3>
      
      {/* Items list */}
      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto mb-6 pr-2">
        {items.map((item) => (
          <div key={`${item.product._id}-${item.selectedSize}`} className="flex gap-4 items-center">
            <div className="relative h-16 w-12 bg-canvas-inset-bg border border-border-subtle overflow-hidden shrink-0">
              <Image
                src={item.product.images.studioFront}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs uppercase font-medium truncate text-text-primary">
                {item.product.name}
              </h4>
              <p className="text-[10px] text-text-secondary mt-0.5">
                Size: {item.selectedSize} × {item.quantity}
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-text-primary">
              ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>

      {/* Coupon Application Form */}
      <div className="border-t border-border-subtle pt-4 mb-4">
        {coupon ? (
          <div className="flex justify-between items-center bg-canvas-inset-bg/20 border border-border-subtle px-3 py-2">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-text-secondary block">COUPON APPLIED</span>
              <span className="text-xs uppercase font-medium text-emerald-800">{coupon.code}</span>
            </div>
            <button
              onClick={removeCoupon}
              className="text-[10px] uppercase font-semibold text-red-700 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              placeholder="ENTER COUPON CODE"
              value={couponCodeInput}
              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
              className="flex-1 min-w-0 px-3 py-1.5 text-xs uppercase tracking-wider border border-border-subtle focus:outline-none focus:border-border-primary bg-transparent text-text-primary"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={validatingCoupon}
              className="text-xs uppercase"
            >
              {validatingCoupon ? "..." : "Apply"}
            </Button>
          </form>
        )}
        {couponError && (
          <p className="text-[10px] text-red-700 mt-1 select-none font-medium">
            {couponError}
          </p>
        )}
      </div>

      {/* Totals table */}
      <div className="flex flex-col gap-2.5 text-xs text-text-secondary border-t border-border-subtle pt-4 pb-6">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-mono text-text-primary">₹{cartSubtotal.toLocaleString("en-IN")}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-800">
            <span>Coupon Discount</span>
            <span className="font-mono">-₹{couponDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping ({deliveryMethod === "express" ? "Express" : "Standard"})</span>
          <span className="font-mono text-text-primary">
            {shippingFee > 0 ? `₹${shippingFee.toLocaleString("en-IN")}` : "Free"}
          </span>
        </div>
        <div className="flex justify-between border-t border-border-subtle pt-3 font-semibold text-sm tracking-wider text-text-primary">
          <span>GRAND TOTAL</span>
          <span className="font-mono">₹{grandTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 p-3 text-xs select-none">
          {errorMessage}
        </div>
      )}

      <Button
        onClick={handlePlaceOrder}
        disabled={submitting}
        variant="primary"
        className="w-full text-xs uppercase tracking-luxury font-medium"
      >
        {submitting ? "Processing Order..." : paymentMethod === "cod" ? "Place COD Order" : "Initiate Secure Payment"}
      </Button>
    </div>
  );

  // Left column: Shipping forms
  const FormNode = (
    <div className="flex flex-col gap-8">
      {/* 1. Customer Info */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-luxury font-semibold border-b border-border-subtle pb-2 text-text-primary">
          1. Customer Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder="Ananya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="ananya@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      {/* 2. Shipping Address */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-luxury font-semibold border-b border-border-subtle pb-2 text-text-primary">
          2. Dispatch Address
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Address Line 1"
            placeholder="Flat No, Wing, Building Name"
            value={street1}
            onChange={(e) => setStreet1(e.target.value)}
            required
          />
          <Input
            label="Address Line 2 (Optional)"
            placeholder="Street Name, Locality, Landmark"
            value={street2}
            onChange={(e) => setStreet2(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="City"
            placeholder="Mumbai"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
          <Input
            label="State"
            placeholder="Maharashtra"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          />
          <Input
            label="Pincode"
            placeholder="400001"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            disabled
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
            required
          />
        </div>
      </div>

      {/* 3. Delivery Method */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-luxury font-semibold border-b border-border-subtle pb-2 text-text-primary">
          3. Delivery Mode
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => handleDeliveryChange("standard")}
            className={`border p-4 cursor-pointer flex flex-col justify-between transition-colors ${
              deliveryMethod === "standard"
                ? "border-border-primary bg-canvas-inset-bg/10"
                : "border-border-subtle hover:border-border-primary"
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">Standard Delivery</span>
              <span className="text-xs font-mono font-medium text-emerald-800">FREE</span>
            </div>
            <span className="text-[10px] text-text-secondary font-light">Dispatches within 48h. Delivers in 3-5 business days.</span>
          </div>

          <div
            onClick={() => handleDeliveryChange("express")}
            className={`border p-4 cursor-pointer flex flex-col justify-between transition-colors ${
              deliveryMethod === "express"
                ? "border-border-primary bg-canvas-inset-bg/10"
                : "border-border-subtle hover:border-border-primary"
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">Express Delivery</span>
              <span className="text-xs font-mono font-medium text-text-primary">₹200</span>
            </div>
            <span className="text-[10px] text-text-secondary font-light">Priority dispatch. Air shipping. Delivers in 1-2 business days.</span>
          </div>
        </div>
      </div>

      {/* 4. Payment Method */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-luxury font-semibold border-b border-border-subtle pb-2 text-text-primary">
          4. Settlement Channel
        </h3>
        <div className="flex flex-col gap-3">
          {/* Razorpay Option */}
          <div
            onClick={() => handlePaymentChange("razorpay")}
            className={`border p-4 cursor-pointer flex items-center justify-between transition-colors ${
              paymentMethod === "razorpay"
                ? "border-border-primary bg-canvas-inset-bg/10"
                : "border-border-subtle hover:border-border-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "razorpay"}
                onChange={() => {}}
                className="accent-text-primary"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">Card / UPI / NetBanking</span>
                <span className="text-[9px] text-text-secondary font-light">Instant settlement via Razorpay secure gateway.</span>
              </div>
            </div>
          </div>

          {/* COD Option */}
          <div
            onClick={() => {
              if (codEligible && !checkingCod) {
                handlePaymentChange("cod");
              }
            }}
            className={`border p-4 flex items-center justify-between transition-colors ${
              !codEligible
                ? "border-border-subtle opacity-50 cursor-not-allowed"
                : paymentMethod === "cod"
                ? "border-border-primary bg-canvas-inset-bg/10 cursor-pointer"
                : "border-border-subtle hover:border-border-primary cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment"
                disabled={!codEligible}
                checked={paymentMethod === "cod"}
                onChange={() => {}}
                className="accent-text-primary"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                  Cash On Delivery (COD)
                </span>
                <span className="text-[9px] text-text-secondary font-light">
                  {checkingCod
                    ? "Verifying code eligibility..."
                    : pincode.length !== 6
                    ? "Enter a 6-digit pincode above to check eligibility."
                    : codEligible
                    ? "Eligible for orders under ₹10,000."
                    : "Not available for this pincode or order value."}
                </span>
              </div>
            </div>
            {codEligible && (
              <span className="text-[9px] uppercase tracking-widest font-semibold text-emerald-800">
                Eligible
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <CheckoutLayout
      formNode={FormNode}
      summaryNode={SummaryNode}
    />
  );
}
