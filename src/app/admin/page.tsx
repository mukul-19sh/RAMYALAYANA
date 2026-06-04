"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function AdminDashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // Metrics, Funnel & Tables from dashboard API
  const [metrics, setMetrics] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [failedPayments, setFailedPayments] = useState<any[]>([]);

  // Orders list
  const [orders, setOrders] = useState<any[]>([]);

  // Page level states
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Status edit modal / overlay inline states
  const [editingOrderNo, setEditingOrderNo] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editCarrier, setEditCarrier] = useState("");
  const [editTrackingNo, setEditTrackingNo] = useState("");
  const [editEstDelivery, setEditEstDelivery] = useState("");

  const isAdmin = session?.user?.role === "admin";

  // Auth Guard
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [authStatus, router]);

  // Fetch Dashboard Stats & Funnel
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch("/api/admin/analytics/dashboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard statistics.");
      setMetrics(data.metrics);
      setFunnel(data.funnel);
      setTopProducts(data.topProducts || []);
      setFailedPayments(data.failedPayments || []);
    } catch (err: any) {
      setError(err.message || "Failed to compile admin metrics.");
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Fetch Orders
  const fetchOrdersList = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load orders list.");
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardStats();
      fetchOrdersList();
    }
  }, [isAdmin]);

  // Update order handler
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrderNo) return;
    setUpdatingOrderId(editingOrderNo);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: editingOrderNo,
          orderStatus: editStatus,
          carrier: editCarrier,
          trackingNumber: editTrackingNo,
          estimatedDelivery: editEstDelivery || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save order updates.");

      // Refresh orders list
      await fetchOrdersList();
      setEditingOrderNo(null);
    } catch (err: any) {
      alert(err.message || "Error updating order.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let bg = "bg-canvas-inset-bg/25 text-text-secondary";
    if (s === "delivered") bg = "bg-emerald-50 text-emerald-800 border border-emerald-200";
    if (s === "shipped") bg = "bg-blue-50 text-blue-800 border border-blue-200";
    if (s === "processing") bg = "bg-amber-50 text-amber-800 border border-amber-200";
    if (s === "cancelled") bg = "bg-red-50 text-red-800 border border-red-200";

    return (
      <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold rounded-sm ${bg}`}>
        {status}
      </span>
    );
  };

  // Auth Status Loading Screen
  if (authStatus === "loading" || (isAdmin && (loadingDashboard || loadingOrders))) {
    return (
      <div className="min-h-screen bg-canvas-bg text-text-primary font-sans flex items-center justify-center select-none">
        <span className="text-xs uppercase tracking-luxury text-text-secondary animate-pulse">
          Connecting Atelier Dashboard...
        </span>
      </div>
    );
  }

  // Non-Admin access block
  if (authStatus === "authenticated" && !isAdmin) {
    return (
      <div className="min-h-screen bg-canvas-bg text-text-primary font-sans flex flex-col items-center justify-center p-8 select-none">
        <span className="text-xs tracking-luxury text-red-700 uppercase font-semibold mb-3">ACCESS FORBIDDEN</span>
        <p className="text-xs font-light text-text-secondary mb-6 text-center max-w-xs leading-relaxed">
          You lack administrator privileges to access this console.
        </p>
        <Link href="/">
          <Button variant="primary">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-bg text-text-primary font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-8 select-none shrink-0 bg-canvas-bg">
        <div className="flex items-center gap-6">
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
          <span className="text-[9px] uppercase tracking-luxury bg-border-primary text-canvas-bg px-2 py-0.5 font-bold">
            Atelier Console
          </span>
        </div>
        <div className="flex gap-4">
          <Link href="/shop" className="text-xs uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors">
            Storefront
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
        
        {/* Intro */}
        <div className="flex flex-col select-none">
          <h1 className="text-2xl font-serif tracking-wide uppercase text-text-primary">Atelier Ledger & Metrics</h1>
          <p className="text-xs text-text-secondary font-light">Evaluate conversion pipelines, reconcile transactions, and coordinate shipments.</p>
        </div>

        {/* KPI Row */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="border border-border-subtle bg-canvas-bg p-4 flex flex-col shadow-soft">
              <span className="text-[9px] uppercase tracking-widest text-text-secondary mb-1">Total Orders</span>
              <span className="text-2xl font-serif font-light text-text-primary">{metrics.totalOrders}</span>
            </div>
            <div className="border border-border-subtle bg-canvas-bg p-4 flex flex-col shadow-soft">
              <span className="text-[9px] uppercase tracking-widest text-text-secondary mb-1">Total Revenue</span>
              <span className="text-2xl font-serif font-light text-text-primary">₹{metrics.totalRevenue?.toLocaleString("en-IN")}</span>
            </div>
            <div className="border border-border-subtle bg-canvas-bg p-4 flex flex-col shadow-soft">
              <span className="text-[9px] uppercase tracking-widest text-text-secondary mb-1">Conversion Rate</span>
              <span className="text-2xl font-serif font-light text-text-primary">{metrics.conversionRate}%</span>
            </div>
            <div className="border border-border-subtle bg-canvas-bg p-4 flex flex-col shadow-soft">
              <span className="text-[9px] uppercase tracking-widest text-text-secondary mb-1">Checkout Drop Rate</span>
              <span className="text-2xl font-serif font-light text-text-primary">{metrics.dropRate}%</span>
            </div>
            <div className="border border-border-subtle bg-canvas-bg p-4 flex flex-col shadow-soft col-span-2 lg:col-span-1">
              <span className="text-[9px] uppercase tracking-widest text-text-secondary mb-1">Payment Failure Rate</span>
              <span className="text-2xl font-serif font-light text-red-700">{metrics.paymentFailureRate}%</span>
            </div>
          </div>
        )}

        {/* Middle row: Funnel & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Funnel chart (Step-based widths) */}
          {funnel && (
            <div className="lg:col-span-7 border border-border-primary p-6 bg-canvas-bg select-none">
              <h3 className="text-xs uppercase tracking-luxury font-semibold border-b border-border-subtle pb-2 text-text-primary mb-4">
                Checkout Funnel Performance
              </h3>
              <div className="flex flex-col gap-3 font-sans">
                {[
                  { key: "checkout_started", label: "Checkout Starts (S1)" },
                  { key: "shipping_completed", label: "Shipping Saved (S2)" },
                  { key: "delivery_selected", label: "Delivery Chosen (S3)" },
                  { key: "payment_selected", label: "Payment Selected (S4)" },
                  { key: "payment_initiated", label: "Payment Initiated (S5)" },
                  { key: "payment_success", label: "Payment Success (S6)" },
                  { key: "order_completed", label: "Order Completed (S8)" }
                ].map((item, idx, arr) => {
                  const val = funnel[item.key] || 0;
                  const maxVal = funnel[arr[0].key] || 1;
                  const pct = Math.round((val / maxVal) * 100);
                  return (
                    <div key={item.key} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="font-medium text-text-primary">{item.label}</span>
                        <span className="font-mono text-text-secondary">{val} sessions ({pct}%)</span>
                      </div>
                      <div className="w-full bg-border-subtle/30 h-2.5 rounded-sm overflow-hidden border border-border-subtle/50">
                        <div 
                          className="bg-accent h-full transition-all duration-700" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Products */}
          <div className="lg:col-span-5 border border-border-primary p-6 bg-canvas-bg">
            <h3 className="text-xs uppercase tracking-luxury font-semibold border-b border-border-subtle pb-2 text-text-primary mb-4">
              Top Products by Sales
            </h3>
            {topProducts.length === 0 ? (
              <p className="text-xs text-text-secondary font-light">No records cataloged yet.</p>
            ) : (
              <div className="flex flex-col gap-4 font-sans">
                {topProducts.map((prod) => (
                  <div key={prod._id} className="flex justify-between items-center text-xs">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-text-primary block truncate uppercase">{prod.name}</span>
                      <span className="text-[10px] text-text-secondary">{prod.quantitySold} units sold</span>
                    </div>
                    <span className="font-mono text-text-primary ml-4">
                      ₹{prod.revenueGenerated?.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order list & Status update forms */}
        <div className="border border-border-primary p-6 bg-canvas-bg">
          <h3 className="text-xs uppercase tracking-luxury font-semibold border-b border-border-subtle pb-2 text-text-primary mb-4">
            Orders Database Management
          </h3>
          {loadingOrders ? (
            <span className="text-xs text-text-secondary">Syncing order lists...</span>
          ) : orders.length === 0 ? (
            <p className="text-xs text-text-secondary font-light">No orders registered in the system database.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-border-subtle text-xs font-sans">
                <thead>
                  <tr className="bg-canvas-inset-bg/15 uppercase tracking-widest text-[9px] text-text-primary border-b border-border-subtle">
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Grand Total</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Transit details</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-text-primary">
                  {orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-canvas-inset-bg/5 transition-colors">
                      <td className="p-3 font-mono font-medium">{ord.orderNumber}</td>
                      <td className="p-3 font-mono text-text-secondary">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-3 truncate max-w-[150px]">{ord.contactEmail}</td>
                      <td className="p-3 font-mono">₹{ord.grandTotal?.toLocaleString("en-IN")}</td>
                      <td className="p-3 uppercase text-[10px] font-medium">
                        {ord.paymentMethod === "cod" ? "COD" : "Razorpay"}
                      </td>
                      <td className="p-3">{renderStatusBadge(ord.orderStatus)}</td>
                      <td className="p-3 max-w-[160px] truncate">
                        {ord.shippingDetails?.trackingNumber ? (
                          <span className="text-[10px] text-text-secondary">
                            {ord.shippingDetails.carrier?.toUpperCase()}: {ord.shippingDetails.trackingNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-secondary italic">Awaiting dispatch</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setEditingOrderNo(ord.orderNumber);
                            setEditStatus(ord.orderStatus);
                            setEditCarrier(ord.shippingDetails?.carrier || "");
                            setEditTrackingNo(ord.shippingDetails?.trackingNumber || "");
                            setEditEstDelivery(
                              ord.shippingDetails?.estimatedDelivery
                                ? new Date(ord.shippingDetails.estimatedDelivery).toISOString().substring(0, 10)
                                : ""
                            );
                          }}
                          className="text-[10px] uppercase font-semibold text-accent hover:underline focus:outline-none"
                        >
                          Modify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inline edit modal overlay */}
        {editingOrderNo && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-modal select-none">
            <div className="bg-canvas-bg border border-border-primary max-w-md w-full p-6 shadow-glass animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-baseline border-b border-border-subtle pb-3 mb-4">
                <h4 className="text-xs uppercase tracking-luxury font-bold text-text-primary">
                  Modify Order Details
                </h4>
                <button
                  onClick={() => setEditingOrderNo(null)}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateOrder} className="flex flex-col gap-4 text-xs font-sans">
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary">Order Reference</span>
                  <span className="font-mono font-medium text-text-primary">{editingOrderNo}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-text-secondary">Order Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-border-subtle focus:outline-none focus:border-border-primary bg-transparent text-text-primary"
                  >
                    <option value="received">received</option>
                    <option value="processing">processing</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="returned">returned</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-text-secondary">Courier Carrier</label>
                  <input
                    type="text"
                    placeholder="Delhivery, BlueDart, etc."
                    value={editCarrier}
                    onChange={(e) => setEditCarrier(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-border-subtle focus:outline-none focus:border-border-primary bg-transparent text-text-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-text-secondary">Tracking Number</label>
                  <input
                    type="text"
                    placeholder="AWB1234567"
                    value={editTrackingNo}
                    onChange={(e) => setEditTrackingNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-border-subtle focus:outline-none focus:border-border-primary bg-transparent text-text-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-text-secondary">Estimated Delivery Date</label>
                  <input
                    type="date"
                    value={editEstDelivery}
                    onChange={(e) => setEditEstDelivery(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-border-subtle focus:outline-none focus:border-border-primary bg-transparent text-text-primary"
                  />
                </div>

                <div className="flex gap-4 mt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={updatingOrderId !== null}
                    className="flex-1 text-xs uppercase"
                  >
                    {updatingOrderId ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingOrderNo(null)}
                    className="flex-1 text-xs uppercase"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Failed payments list */}
        <div className="border border-border-primary p-6 bg-canvas-bg">
          <h3 className="text-xs uppercase tracking-luxury font-semibold border-b border-border-subtle pb-2 text-text-primary mb-4">
            Recent Failed Payments Logs
          </h3>
          {failedPayments.length === 0 ? (
            <p className="text-xs text-text-secondary font-light">No failed transactions reported in the pipeline.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-border-subtle text-xs font-sans">
                <thead>
                  <tr className="bg-canvas-inset-bg/15 uppercase tracking-widest text-[9px] text-text-primary border-b border-border-subtle">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Order Number Reference</th>
                    <th className="p-3">Session ID</th>
                    <th className="p-3">Cart Subtotal</th>
                    <th className="p-3">Device Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-text-primary">
                  {failedPayments.map((fp, i) => (
                    <tr key={i} className="hover:bg-canvas-inset-bg/5 transition-colors">
                      <td className="p-3 font-mono text-text-secondary">
                        {new Date(fp.completedAt).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 font-mono font-medium">{fp.orderNumber || "Awaiting submission"}</td>
                      <td className="p-3 font-mono truncate max-w-[120px]">{fp.sessionId}</td>
                      <td className="p-3 font-mono">₹{fp.orderValue?.toLocaleString("en-IN")}</td>
                      <td className="p-3 uppercase text-[10px] text-text-secondary">{fp.deviceType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
