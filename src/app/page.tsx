"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { DesktopHeader } from "@/components/navigation/DesktopHeader";
import { MobileHeader } from "@/components/navigation/MobileHeader";
import { Footer } from "@/components/navigation/Footer";
import { ProductCard } from "@/components/ui/ProductCard";
import { CollectionCard } from "@/components/ui/CollectionCard";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/store/useCart";

// 1. Mock Data Fallbacks for Products, Reviews, and Collections
const MOCK_PRODUCTS = [
  {
    _id: "60c72b2f9b1d8e1f40000001",
    name: "Kora Silk Wrap Shirt",
    slug: "kora-silk-wrap-shirt",
    price: 18500,
    status: "Active" as const,
    images: {
      studioFront: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1594938384824-022ef7790b5b?auto=format&fit=crop&q=80&w=800",
      lookbook: ["https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800"],
    },
    variantColor: { name: "Bone White", hex: "#F6F5F2" },
  },
  {
    _id: "60c72b2f9b1d8e1f40000002",
    name: "Clay Tailored Blazer",
    slug: "clay-tailored-blazer",
    price: 24000,
    status: "Active" as const,
    images: {
      studioFront: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1591047139265-5c1cfb9b478d?auto=format&fit=crop&q=80&w=800",
      lookbook: ["https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800"],
    },
    variantColor: { name: "Ochre Clay", hex: "#9C8259" },
  },
  {
    _id: "60c72b2f9b1d8e1f40000003",
    name: "Sanskrit Loom Wrap Dress",
    slug: "sanskrit-loom-wrap-dress",
    price: 21500,
    status: "Sold Out" as const,
    images: {
      studioFront: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1595777457317-af995163f45c?auto=format&fit=crop&q=80&w=800",
    },
    variantColor: { name: "Warm Cement", hex: "#D1CDC5" },
  },
  {
    _id: "60c72b2f9b1d8e1f40000004",
    name: "Organic Khadi Trousers",
    slug: "organic-khadi-trousers",
    price: 14000,
    status: "Active" as const,
    images: {
      studioFront: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1624378440847-4a64ee1a889d?auto=format&fit=crop&q=80&w=800",
    },
    variantColor: { name: "Charcoal Slate", hex: "#1A1C1E" },
  },
];

const MOCK_REVIEWS = [
  {
    reviewerName: "Ananya Iyer",
    rating: 5,
    comment: "The drape of the Kora Silk Shirt is incredibly sculptural. Truly wearable art.",
    isTrustedReviewer: true,
    createdAt: "2026-05-12T10:00:00Z",
  },
  {
    reviewerName: "Devendra Singh",
    rating: 5,
    comment: "The tailoring details on the Clay Blazer are immaculate. Exceptional craft coordinate.",
    isTrustedReviewer: true,
    createdAt: "2026-05-20T10:00:00Z",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"new" | "sellers" | "limited" | "seasonal">("new");
  const [slowNetwork, setSlowNetwork] = useState(false);
  const addToCart = useCart((state) => state.addToCart);

  // Check network speed on mount to toggle lightweight assets
  useEffect(() => {
    if (typeof window !== "undefined" && (navigator as any).connection) {
      const conn = (navigator as any).connection;
      if (conn.saveData || conn.effectiveType === "2g" || conn.effectiveType === "3g") {
        setSlowNetwork(true);
      }
    }
  }, []);

  // 2. Fetch products using TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["homepage-products"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=4&status=Active");
      if (!res.ok) throw new Error("Failed to load products catalog");
      return res.json();
    },
  });

  const productsList = data?.products && data.products.length > 0 ? data.products : MOCK_PRODUCTS;

  // 3. Shop the Look Bundle addition logic (Cross-selling)
  const handleShopLookBundle = () => {
    // Add Kora Silk Wrap Shirt and Organic Khadi Trousers to cart
    const shirt = MOCK_PRODUCTS[0];
    const trouser = MOCK_PRODUCTS[3];

    addToCart({
      product: {
        _id: shirt._id,
        name: shirt.name,
        price: shirt.price,
        slug: shirt.slug,
        images: { studioFront: shirt.images.studioFront },
      },
      selectedSize: "M",
      quantity: 1,
    });

    addToCart({
      product: {
        _id: trouser._id,
        name: trouser.name,
        price: trouser.price,
        slug: trouser.slug,
        images: { studioFront: trouser.images.studioFront },
      },
      selectedSize: "M",
      quantity: 1,
    });

    alert("Complete outfit added to your cart!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas-bg text-text-primary antialiased">
      {/* Navigation Headers */}
      <DesktopHeader />
      <MobileHeader />

      {/* 1. Hero Section (Full-screen Campaign Image / Video) */}
      <section className="relative w-full h-[90vh] bg-canvas-inset-bg overflow-hidden flex items-end p-4 md:p-12 select-none">
        {slowNetwork ? (
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1920"
            alt="RAMYALAYANA Editorial Campaign"
            fill
            priority
            className="object-cover h-full w-full"
          />
        ) : (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1920"
            className="absolute inset-0 object-cover h-full w-full"
          >
            {/* Short lightweight looping video fragments */}
            <source src="https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-neutral-outfit-posing-40546-large.mp4" type="video/mp4" />
          </video>
        )}

        <div className="absolute inset-0 bg-black/10 z-1" />

        {/* Content Overlap Above the Fold */}
        <div className="relative z-10 max-w-xl bg-canvas-bg/90 backdrop-blur-md p-6 md:p-8 border border-border-primary flex flex-col select-none font-sans">
          <span className="text-[10px] tracking-widest uppercase font-medium text-text-secondary mb-2 block">
            THE ATELIER — SERIES I
          </span>
          <h1 className="text-2xl md:text-3xl font-serif text-text-primary tracking-wide mb-4 uppercase leading-tight font-medium">
            Modern Indian Silhouette & Sculptural Heritage
          </h1>
          <div className="flex flex-wrap gap-4">
            <Link href="/shop">
              <Button variant="primary" size="md">
                Shop New Arrivals
              </Button>
            </Link>
            <Link href="/shop?category=atelier">
              <Button variant="secondary" size="md">
                Explore Collections
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Featured Collections Segment */}
      <section className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-16 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 select-none">
          <h2 className="text-xl md:text-2xl font-serif tracking-wide uppercase text-text-primary">
            Curated Collections
          </h2>
          {/* Tabs selectors */}
          <div className="flex gap-4 overflow-x-auto whitespace-nowrap w-full md:w-auto pb-2 md:pb-0">
            {[
              { id: "new", label: "New Arrivals" },
              { id: "sellers", label: "Best Sellers" },
              { id: "limited", label: "Limited Edition" },
              { id: "seasonal", label: "Seasonal Edit" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs uppercase tracking-wider font-medium pb-1 border-b transition-all duration-300 ${
                  activeTab === tab.id ? "border-border-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collections Grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CollectionCard
            title="The Atelier"
            slug="atelier"
            coverImage="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800"
            description="Bespoke handloom garments, structured drapes, and deconstructed silhouettes crafted for occasion ceremonies."
          />
          <CollectionCard
            title="The Silhouette"
            slug="silhouette"
            coverImage="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800"
            description="Premium structured jackets, tailored wool blazers, and sculptural coordinates for day drapes."
          />
          <CollectionCard
            title="The Foundations"
            slug="foundations"
            coverImage="https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&q=80&w=800"
            description="Organic khadi shirts, raw linen staples, and everyday silhouettes engineered with clean seams."
          />
        </div>
      </section>

      {/* 3. Brand Manifesto Section */}
      <section className="w-full bg-canvas-inset-bg py-20 px-4 md:px-8 select-none">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <span className="text-[10px] tracking-widest uppercase font-medium text-text-secondary mb-4">
            OUR MANIFESTO
          </span>
          <p className="text-xl md:text-3xl font-serif text-text-primary tracking-wide leading-relaxed font-light mb-6">
            "We reject the locked tagline. We reject the fast cycle. RAMYALAYANA is an editorial exploration of Indian drapes, structural forms, and slow craftsmanship."
          </p>
          <span className="h-0.5 w-12 bg-accent block" />
        </div>
      </section>

      {/* 4. Signature Products (Shoppable Grid) */}
      <section className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-16">
        <div className="flex flex-col mb-8 select-none font-sans">
          <h2 className="text-xl md:text-2xl font-serif tracking-wide uppercase text-text-primary">
            Signature Silhouettes
          </h2>
          <p className="text-xs text-text-secondary font-light">
            Each piece is custom cut and hand-tailored. Price calculations are verified server-side.
          </p>
        </div>

        {/* Products mapping with Loading/Error states */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCard key={i} loading={true} />
            ))}
          </div>
        ) : error ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCard key={i} error="Failed to fetch active catalog." />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {productsList.map((prod: any) => (
              <ProductCard key={prod._id} product={prod as any} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Shop the Look Section (Cross-selling bundle) */}
      <section className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-16 border-t border-border-subtle">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Outfit visual */}
          <div className="lg:col-span-7 relative aspect-[4/5] bg-canvas-inset-bg overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200"
              alt="RAMYALAYANA Lookbook Outfit drapes"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/5" />
          </div>

          {/* Right Column: Bundle Checkout details */}
          <div className="lg:col-span-5 flex flex-col font-sans">
            <span className="text-[10px] tracking-widest uppercase font-medium text-text-secondary mb-2">
              SHOP THE LOOK
            </span>
            <h2 className="text-2xl md:text-3xl font-serif text-text-primary tracking-wide mb-4 uppercase font-medium">
              The Kora Weave Outfit
            </h2>
            <p className="text-sm text-text-secondary font-light leading-relaxed mb-6">
              A balanced blend of structural tailored lines and organic drapes. This bundle includes the Kora Silk Wrap Shirt and the Charcoal Organic Khadi Trousers.
            </p>

            {/* Checklist of products */}
            <div className="flex flex-col gap-4 border-t border-b border-border-subtle py-6 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-text-primary">1. Kora Silk Wrap Shirt</span>
                <span className="text-text-secondary">₹18,500</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-text-primary">2. Organic Khadi Trousers</span>
                <span className="text-text-secondary">₹14,000</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm font-semibold tracking-wider mb-2">
                <span>BUNDLE TOTAL</span>
                <span>₹32,500</span>
              </div>
              <Button onClick={handleShopLookBundle} variant="primary" className="w-full">
                Add Complete Look to Cart
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Craftsmanship Section */}
      <section className="w-full bg-border-primary text-canvas-bg py-20 px-4 md:px-8 font-sans select-none">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col">
            <span className="text-[10px] tracking-widest uppercase font-medium text-canvas-inset-bg mb-3">01 / MATERIALS</span>
            <h4 className="text-lg font-serif tracking-wide mb-3 uppercase">Organic Silk & Raw Linen</h4>
            <p className="text-xs text-canvas-inset-bg font-light leading-relaxed">
              We source organic kora silks from Karnataka and hand-spun khadi cottons from Andhra Pradesh, celebrating pure loom lineages.
            </p>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] tracking-widest uppercase font-medium text-canvas-inset-bg mb-3">02 / CONSTRUCTION</span>
            <h4 className="text-lg font-serif tracking-wide mb-3 uppercase">Deconstructed Tailoring</h4>
            <p className="text-xs text-canvas-inset-bg font-light leading-relaxed">
              Structured shoulders, asymmetrical wraps, and double-felled seams ensure durability and comfort.
            </p>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] tracking-widest uppercase font-medium text-canvas-inset-bg mb-3">03 / ARTISAN LEDGER</span>
            <h4 className="text-lg font-serif tracking-wide mb-3 uppercase">Loom Coordinates</h4>
            <p className="text-xs text-canvas-inset-bg font-light leading-relaxed">
              Every garment is stamped with the weaver's name, region, and coordinates, mapping craftsmanship trace paths.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Social Proof Section */}
      <section className="w-full max-w-[1200px] mx-auto px-4 py-16 border-b border-border-subtle">
        <div className="flex flex-col items-center mb-8 select-none font-sans text-center">
          <h2 className="text-xl font-serif tracking-wide uppercase text-text-primary">
            Collector Reviews
          </h2>
          <p className="text-xs text-text-secondary font-light">
            Read certified opinions from our collectors.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {MOCK_REVIEWS.map((rev, idx) => (
            <ReviewCard
              key={idx}
              reviewerName={rev.reviewerName}
              rating={rev.rating}
              comment={rev.comment}
              isTrustedReviewer={rev.isTrustedReviewer}
              createdAt={rev.createdAt}
            />
          ))}
        </div>
      </section>

      {/* 8. Editorial Lookbook Slides Section */}
      <section className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-16">
        <div className="relative aspect-[16/7] w-full bg-canvas-inset-bg overflow-hidden flex items-center justify-center text-canvas-bg select-none">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1920"
            alt="Editorial Campaign Lookbook slide"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/25 z-1" />
          <div className="relative z-10 text-center font-sans max-w-lg px-6">
            <span className="text-[10px] tracking-widest uppercase font-medium text-canvas-inset-bg mb-2 block">VOLUME II LOOKBOOK</span>
            <h3 className="text-2xl md:text-3xl font-serif tracking-wide mb-4 leading-tight">THE ANCIENT DRAPES</h3>
            <Link href="/shop?category=silhouette">
              <Button variant="secondary" className="border-canvas-bg text-canvas-bg hover:bg-canvas-bg hover:text-text-primary">Explore Volume II</Button>
            </Link>
          </div>
        </div>
      </section>



      {/* 10. Footer Section */}
      <Footer />
    </div>
  );
}
