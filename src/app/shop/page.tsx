"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CollectionLayout } from "@/components/layouts/CollectionLayout";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { QuickViewDrawer } from "@/components/ui/QuickViewDrawer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

// Mocks for catalog fallback when DB is unseeded
const MOCK_CATALOG = [
  {
    _id: "60c72b2f9b1d8e1f40000001",
    name: "Kora Silk Wrap Shirt",
    slug: "kora-silk-wrap-shirt",
    price: 18500,
    status: "Active" as const,
    category: "atelier",
    subCategory: "tops",
    variantColor: { name: "Bone White", hex: "#F6F5F2" },
    images: {
      studioFront: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1594938384824-022ef7790b5b?auto=format&fit=crop&q=80&w=800",
    },
  },
  {
    _id: "60c72b2f9b1d8e1f40000002",
    name: "Clay Tailored Blazer",
    slug: "clay-tailored-blazer",
    price: 24000,
    status: "Active" as const,
    category: "silhouette",
    subCategory: "jackets",
    variantColor: { name: "Ochre Clay", hex: "#9C8259" },
    images: {
      studioFront: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1591047139265-5c1cfb9b478d?auto=format&fit=crop&q=80&w=800",
    },
  },
  {
    _id: "60c72b2f9b1d8e1f40000003",
    name: "Sanskrit Loom Wrap Dress",
    slug: "sanskrit-loom-wrap-dress",
    price: 21500,
    status: "Sold Out" as const,
    category: "atelier",
    subCategory: "dresses",
    variantColor: { name: "Warm Cement", hex: "#D1CDC5" },
    images: {
      studioFront: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1595777457317-af995163f45c?auto=format&fit=crop&q=80&w=800",
    },
  },
  {
    _id: "60c72b2f9b1d8e1f40000004",
    name: "Organic Khadi Trousers",
    slug: "organic-khadi-trousers",
    price: 14000,
    status: "Active" as const,
    category: "foundations",
    subCategory: "bottoms",
    variantColor: { name: "Charcoal Slate", hex: "#1A1C1E" },
    images: {
      studioFront: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1624378440847-4a64ee1a889d?auto=format&fit=crop&q=80&w=800",
    },
  },
  {
    _id: "60c72b2f9b1d8e1f40000005",
    name: "Draft Silk Cord Blazer",
    slug: "draft-silk-cord-blazer",
    price: 26000,
    status: "Active" as const,
    category: "archive",
    subCategory: "jackets",
    variantColor: { name: "Raw Ochre", hex: "#9C8259" },
    images: {
      studioFront: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800",
    },
  },
];

const COLLECTION_HEROES: Record<string, { title: string; desc: string; img: string }> = {
  atelier: {
    title: "THE ATELIER",
    desc: "Bespoke handloom garments, deconstructed folds, and sculptural forms tailored for ceremonies.",
    img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200",
  },
  silhouette: {
    title: "THE SILHOUETTE",
    desc: "Tailored outerwear, asymmetrical wrap blazers, and double-walled linen coordinates.",
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
  },
  foundations: {
    title: "THE FOUNDATIONS",
    desc: "Everyday luxury staples spun from raw khadi cottons and organic washed linen coordinates.",
    img: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&q=80&w=1200",
  },
  archive: {
    title: "THE ARCHIVE",
    desc: "Vintage iterations, historical weaves, and seasonal drapes preserved for collectors.",
    img: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=1200",
  },
};

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Search/Filter states from URL params
  const category = searchParams.get("category") || "";
  const subCategory = searchParams.get("subCategory") || "";
  const color = searchParams.get("color") || "";
  const size = searchParams.get("size") || "";
  const price = searchParams.get("price") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "newest";
  const search = searchParams.get("search") || "";
  const [page, setPage] = useState(1);

  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  // 1. Fetch Wishlist items
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      if (!session) return { products: [] };
      const res = await fetch("/api/wishlist");
      return res.json();
    },
    enabled: !!session,
  });

  const wishlistedIds = new Set(
    (wishlistData?.products || []).map((p: any) => p._id)
  );

  // 2. Fetch Catalog from API
  const { data: catalogData, isLoading, error } = useQuery({
    queryKey: ["catalog", category, subCategory, color, size, price, status, sort, search, page],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        limit: "12",
        page: page.toString(),
      });
      if (category) queryParams.set("category", category);
      if (subCategory) queryParams.set("subCategory", subCategory);
      if (status) queryParams.set("status", status);

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Catalog fetch failed");
      return res.json();
    },
  });

  // Fallback filtering in case database is empty
  const getFilteredCatalog = () => {
    if (catalogData?.products && catalogData.products.length > 0) {
      return catalogData.products;
    }
    // Filter Mock locally to ensure the user gets a working browse experience
    return MOCK_CATALOG.filter((item) => {
      if (category && item.category !== category) return false;
      if (subCategory && item.subCategory !== subCategory) return false;
      if (color && item.variantColor?.name !== color) return false;
      if (status && item.status !== status) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  };

  const productsList = getFilteredCatalog();

  // 3. Mutation for wishlist updates
  const wishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  // URL State updates
  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setPage(1); // reset page on filter change
    router.push(`/shop?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push("/shop");
    setPage(1);
  };

  // Counting active filter chips
  const activeFilters = [
    { key: "category", val: category },
    { key: "subCategory", val: subCategory },
    { key: "color", val: color },
    { key: "size", val: size },
    { key: "price", val: price },
    { key: "status", val: status },
    { key: "search", val: search },
  ].filter((f) => f.val);

  // Dynamic Hero Specs
  const heroSpecs = COLLECTION_HEROES[category] || {
    title: "THE SHOP CATALOG",
    desc: "Structured tailoring and deconstructed silhouettes crafted from organic linens, khadi, and raw silks.",
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
  };

  // Structured Breadcrumbs & JSON-LD metadata markup
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://ramya-alayana.vercel.app" },
      { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://ramya-alayana.vercel.app/shop" },
      ...(category ? [{ "@type": "ListItem", "position": 3, "name": category.toUpperCase(), "item": `https://ramya-alayana.vercel.app/shop?category=${category}` }] : []),
    ],
  };

  return (
    <>
      {/* Dynamic SEO JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb row */}
      <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-medium text-text-secondary mb-6 select-none font-sans">
        <Link href="/" className="hover:text-text-primary">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-text-primary">Shop</Link>
        {category && (
          <>
            <span>/</span>
            <span className="text-text-primary">{category}</span>
          </>
        )}
      </div>

      {/* 1. Collection Hero Section */}
      <section className="relative w-full aspect-[21/9] bg-canvas-inset-bg overflow-hidden flex items-end p-6 md:p-12 mb-12 select-none">
        <Image
          src={heroSpecs.img}
          alt={heroSpecs.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/15 z-1" />
        <div className="relative z-10 max-w-xl bg-canvas-bg/90 backdrop-blur-md p-6 border border-border-primary flex flex-col font-sans">
          <h1 className="text-xl md:text-2xl font-serif text-text-primary tracking-wide uppercase mb-2">
            {heroSpecs.title}
          </h1>
          <p className="text-xs text-text-secondary font-light leading-relaxed">
            {heroSpecs.desc}
          </p>
        </div>
      </section>

      {/* Active Filter Chips & Sort row */}
      <div className="flex flex-col gap-4 mb-8 select-none font-sans border-b border-border-subtle pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Active chips list */}
          <div className="flex flex-wrap gap-2 items-center">
            {activeFilters.length > 0 && (
              <span className="text-[10px] uppercase tracking-luxury text-text-secondary mr-2">Active:</span>
            )}
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => updateQuery(f.key, "")}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-canvas-inset-bg/50 border border-border-subtle text-[10px] uppercase tracking-wider text-text-primary hover:border-border-primary transition-all duration-300"
              >
                {f.val}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>

          {/* Sort Selection dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] uppercase tracking-luxury text-text-secondary">Sort:</span>
            <Select
              options={[
                { value: "newest", label: "Newest Arrivals" },
                { value: "best", label: "Best Selling" },
                { value: "price-low-high", label: "Price: Low to High" },
                { value: "price-high-low", label: "Price: High to Low" },
              ]}
              value={sort}
              onChange={(e) => updateQuery("sort", e.target.value)}
              className="mb-0 py-1"
            />
          </div>
        </div>
      </div>

      {/* 2. Collection Layout (Desktop filter sidebar / Mobile drawers) */}
      <CollectionLayout
        activeFiltersCount={activeFilters.length}
        onClearAll={clearAllFilters}
        sidebarFilters={
          <div className="flex flex-col gap-6 select-none font-sans text-xs">
            {/* Category Filter Group */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-text-secondary mb-1">Category</span>
              {["atelier", "silhouette", "foundations", "archive"].map((cat) => (
                <Checkbox
                  key={cat}
                  label={cat.toUpperCase()}
                  checked={category === cat}
                  onChange={() => updateQuery("category", category === cat ? "" : cat)}
                />
              ))}
            </div>

            {/* Color Filter Group */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-text-secondary mb-1">Color</span>
              {["Bone White", "Clay", "Charcoal Slate", "Raw Ochre"].map((clr) => (
                <Checkbox
                  key={clr}
                  label={clr}
                  checked={color === clr}
                  onChange={() => updateQuery("color", color === clr ? "" : clr)}
                />
              ))}
            </div>

            {/* Availability Filter Group */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-text-secondary mb-1">Availability</span>
              {["Active", "Sold Out", "Archived"].map((st) => (
                <Checkbox
                  key={st}
                  label={st === "Active" ? "In Stock" : st}
                  checked={status === st}
                  onChange={() => updateQuery("status", status === st ? "" : st)}
                />
              ))}
            </div>
          </div>
        }
      >
        {/* Products Grid layout with editorial storytelling injections */}
        {productsList.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {productsList.map((prod: any, idx: number) => {
              const card = (
                <ProductCard
                  key={prod._id}
                  product={prod}
                  isWishlisted={wishlistedIds.has(prod._id)}
                  onQuickView={(slug) => setQuickViewSlug(slug)}
                  onWishlistToggle={(id) => {
                    if (!session) {
                      alert("Please login to manage your wishlist collector portal.");
                      return;
                    }
                    wishlistMutation.mutate(id);
                  }}
                />
              );

              // 7. Insert Collection Storytelling modules between product rows
              // After the 4th product (index 3) in the grid list:
              if (idx === 3) {
                return (
                  <React.Fragment key={prod._id}>
                    {card}
                    {/* Storytelling Banner (Spans full grid width or acts as large banner) */}
                    <div className="col-span-2 md:col-span-4 bg-canvas-inset-bg p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-border-primary select-none my-4">
                      <div className="max-w-xl font-sans">
                        <span className="text-[10px] tracking-widest uppercase font-medium text-text-secondary mb-2 block">
                          CRAFTSMAN NARRATIVE
                        </span>
                        <h4 className="text-lg font-serif text-text-primary uppercase tracking-wide mb-2">
                          Woven slow-craft coordinates
                        </h4>
                        <p className="text-xs text-text-secondary font-light leading-relaxed">
                          Our organic cotton drapes are spun on traditional handlooms in Andhra Pradesh, taking 32 hours of continuous artisan dedication to weave a single length.
                        </p>
                      </div>
                      <Link href="/heritage">
                        <Button variant="secondary" size="sm">Explore Our Heritage</Button>
                      </Link>
                    </div>
                  </React.Fragment>
                );
              }

              // After the 8th product (index 7):
              if (idx === 7) {
                return (
                  <React.Fragment key={prod._id}>
                    {card}
                    {/* Fabric Close Up Spotlight Banner */}
                    <div className="col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-border-primary text-canvas-bg p-8 select-none my-4">
                      <div className="md:col-span-8 font-sans">
                        <span className="text-[10px] tracking-widest uppercase font-medium text-canvas-inset-bg mb-2 block">
                          DESIGN PHILOSOPHY
                        </span>
                        <h4 className="text-lg font-serif uppercase tracking-wide mb-2">
                          The deconstructed wrap
                        </h4>
                        <p className="text-xs text-canvas-inset-bg font-light leading-relaxed">
                          A detailed examination of asymmetry. We utilize double-felled seams and structured shoulders to ensure that drapes flow organically while maintaining tailoring lines.
                        </p>
                      </div>
                      <div className="md:col-span-4 flex justify-end">
                        <Link href="/artisans">
                          <Button variant="tertiary" size="sm" className="text-canvas-bg border-canvas-bg hover:text-accent">
                            Artisan Ledger
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </React.Fragment>
                );
              }

              return card;
            })}
          </div>
        ) : (
          // 9. Empty States
          <div className="flex flex-col items-center justify-center py-20 text-center select-none font-sans max-w-md mx-auto">
            <svg className="h-10 w-10 text-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base uppercase tracking-luxury text-text-primary font-medium mb-2">
              No Garments Found
            </h3>
            <p className="text-xs text-text-secondary font-light leading-relaxed mb-6">
              We couldn't find any products matching your current filters. Try resetting the toggles to view our full lineage catalog.
            </p>
            <Button onClick={clearAllFilters} variant="primary">
              Reset Filters
            </Button>
          </div>
        )}

        {/* 8. Infinite Scroll / Hybrid pagination action */}
        {productsList.length >= 12 && (
          <div className="flex justify-center mt-16 select-none font-sans">
            <Button
              onClick={() => setPage(page + 1)}
              variant="secondary"
              loading={isLoading}
            >
              Load More Garments
            </Button>
          </div>
        )}
      </CollectionLayout>

      {/* Quick View Portal overlay drawer */}
      <QuickViewDrawer
        isOpen={!!quickViewSlug}
        onClose={() => setQuickViewSlug(null)}
        productSlug={quickViewSlug}
      />
    </>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh] font-sans text-xs uppercase tracking-luxury select-none">
        Loading RAMYALAYANA catalog...
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
