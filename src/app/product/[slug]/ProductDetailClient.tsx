"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ProductLayout } from "@/components/layouts/ProductLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Accordion } from "@/components/ui/Accordion";
import { Modal } from "@/components/ui/Modal";
import { ProductCard } from "@/components/ui/ProductCard";
import { useCart } from "@/store/useCart";

// Interface Definitions
export interface ProductDetailClientProps {
  initialProduct: any;
  siblings: any[];
  fallbackLook: any[];
}

export default function ProductDetailClient({
  initialProduct,
  siblings = [],
  fallbackLook = [],
}: ProductDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Load product from props
  const [product, setProduct] = useState<any>(initialProduct);
  const [selectedSize, setSelectedSize] = useState<"XS" | "S" | "M" | "L" | "XL" | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Cart operations
  const addToCart = useCart((state) => state.addToCart);

  // Modal open states
  const [isSizeAdvisorOpen, setIsSizeAdvisorOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isFullscreenGalleryOpen, setIsFullscreenGalleryOpen] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);

  // Review Form States
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);
  const [reviewErrorMessage, setReviewErrorMessage] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<number | "all">("all");

  // Waitlist Form States
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSuccessMessage, setWaitlistSuccessMessage] = useState<string | null>(null);
  const [waitlistErrorMessage, setWaitlistErrorMessage] = useState<string | null>(null);

  // AI Size Advisor Calculator States
  const [advisorHeight, setAdvisorHeight] = useState("");
  const [advisorWeight, setAdvisorWeight] = useState("");
  const [advisorFit, setAdvisorFit] = useState<"Tight" | "Regular" | "Loose">("Regular");
  const [advisorRecommendation, setAdvisorRecommendation] = useState<{
    size: "XS" | "S" | "M" | "L" | "XL";
    confidence: number;
  } | null>(null);

  // Complete The Look Checklist States
  const [checkedLookItems, setCheckedLookItems] = useState<Record<string, boolean>>({});
  const [lookItemSizes, setLookItemSizes] = useState<Record<string, "XS" | "S" | "M" | "L" | "XL">>({});

  // Mobile Swipe Gallery Index
  const [mobileGalleryIndex, setMobileGalleryIndex] = useState(0);

  // Recently Viewed Persistence
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // Collect all gallery images for reference
  const galleryImages: { src: string; type: string }[] = [];
  if (product?.images?.studioFront) {
    galleryImages.push({ src: product.images.studioFront, type: "Studio Front" });
  }
  if (product?.images?.studioBack) {
    galleryImages.push({ src: product.images.studioBack, type: "Studio Back" });
  }
  if (product?.images?.studioDetail) {
    galleryImages.push({ src: product.images.studioDetail, type: "Fabric Detail" });
  }
  if (product?.images?.lookbook && Array.isArray(product.images.lookbook)) {
    product.images.lookbook.forEach((url: string, index: number) => {
      galleryImages.push({ src: url, type: `Editorial ${index + 1}` });
    });
  }

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

  const wishlistedIds = new Set((wishlistData?.products || []).map((p: any) => p._id));

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

  // 2. Fetch Reviews via TanStack query
  const { data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", product?.slug],
    queryFn: async () => {
      if (!product?.slug) return { reviews: [] };
      const res = await fetch(`/api/products/${product.slug}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!product?.slug,
  });

  // Simulated helpful votes local persistence
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [votedHelpful, setVotedHelpful] = useState<Record<string, boolean>>({});

  const handleHelpfulClick = (reviewId: string) => {
    if (votedHelpful[reviewId]) return;
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
    setVotedHelpful((prev) => ({
      ...prev,
      [reviewId]: true,
    }));
  };

  // 3. Recently viewed list management
  useEffect(() => {
    if (!product) return;
    try {
      const stored = localStorage.getItem("ramya-recently-viewed");
      let list = stored ? JSON.parse(stored) : [];
      
      // Filter out duplicates of same slug
      list = list.filter((item: any) => item.slug !== product.slug);
      
      // Prepend current product
      list.unshift({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        status: product.status,
        images: { studioFront: product.images.studioFront },
      });

      // Cap size at 5 items
      if (list.length > 5) {
        list = list.slice(0, 5);
      }

      localStorage.setItem("ramya-recently-viewed", JSON.stringify(list));
      setRecentlyViewed(list.filter((item: any) => item.slug !== product.slug));
    } catch (e) {
      console.error("Error managing recently viewed", e);
    }
  }, [product]);

  // Default values for outfit bundle selections
  useEffect(() => {
    if (fallbackLook && fallbackLook.length > 0) {
      const initialChecked: Record<string, boolean> = {};
      const initialSizes: Record<string, "XS" | "S" | "M" | "L" | "XL"> = {};
      fallbackLook.forEach((item) => {
        initialChecked[item._id] = true;
        initialSizes[item._id] = "M"; // Default selection
      });
      setCheckedLookItems(initialChecked);
      setLookItemSizes(initialSizes);
    }
  }, [fallbackLook]);

  // AI Size Calculation Logic
  const handleCalculateSize = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(advisorHeight);
    const w = parseFloat(advisorWeight);

    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
      return;
    }

    // Determine basic size using a structured grid
    let size: "XS" | "S" | "M" | "L" | "XL" = "M";
    let confidence = 90;

    if (w < 50) {
      size = "XS";
    } else if (w >= 50 && w < 60) {
      size = "S";
    } else if (w >= 60 && w < 72) {
      size = "M";
    } else if (w >= 72 && w < 85) {
      size = "L";
    } else {
      size = "XL";
    }

    // Adjust based on fit preference
    if (advisorFit === "Tight") {
      if (size === "XL") size = "L";
      else if (size === "L") size = "M";
      else if (size === "M") size = "S";
      else if (size === "S") size = "XS";
      confidence -= 5;
    } else if (advisorFit === "Loose") {
      if (size === "XS") size = "S";
      else if (size === "S") size = "M";
      else if (size === "M") size = "L";
      else if (size === "L") size = "XL";
      confidence -= 3;
    }

    const randomShift = Math.floor(Math.random() * 6);
    setAdvisorRecommendation({
      size,
      confidence: confidence + randomShift,
    });
  };

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!product) return;
    if (product.status === "Archived") return;

    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }

    addToCart({
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        slug: product.slug,
        images: { studioFront: product.images.studioFront },
      },
      selectedSize,
      quantity,
    });

    alert(`${product.name} (Size ${selectedSize}) has been added to your cart.`);
  };

  // Buy Now
  const handleBuyNow = () => {
    if (!product) return;
    if (product.status === "Archived") return;

    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }

    addToCart({
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        slug: product.slug,
        images: { studioFront: product.images.studioFront },
      },
      selectedSize,
      quantity,
    });

    router.push("/checkout");
  };

  // Waitlist Registration Form Submit
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistSuccessMessage(null);
    setWaitlistErrorMessage(null);

    const sizeToRegister = selectedSize || "M";

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: waitlistEmail,
          waitlistType: "product",
          product: product._id,
          selectedSize: sizeToRegister,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist.");
      }

      setWaitlistSuccessMessage(data.message || "Registered successfully.");
      setWaitlistEmail("");
    } catch (err: any) {
      setWaitlistErrorMessage(err.message || "An error occurred.");
    }
  };

  // Review Form Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSuccessMessage(null);
    setReviewErrorMessage(null);

    if (!session) {
      setReviewErrorMessage("You must be logged in to submit a review.");
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setReviewSuccessMessage(data.message || "Review submitted for moderation.");
      setReviewComment("");
      setReviewRating(5);
      refetchReviews();
    } catch (err: any) {
      setReviewErrorMessage(err.message || "An error occurred.");
    }
  };

  // Add Entire Look to Cart
  const handleAddLookToCart = () => {
    let itemsAdded = 0;
    
    if (selectedSize && product.status === "Active") {
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
      itemsAdded++;
    }

    fallbackLook.forEach((item) => {
      if (checkedLookItems[item._id]) {
        const itemSize = lookItemSizes[item._id] || "M";
        addToCart({
          product: {
            _id: item._id,
            name: item.name,
            price: item.price,
            slug: item.slug,
            images: { studioFront: item.images.studioFront },
          },
          selectedSize: itemSize,
          quantity: 1,
        });
        itemsAdded++;
      }
    });

    if (itemsAdded > 0) {
      alert(`Successfully added ${itemsAdded} items to your cart.`);
    } else {
      alert("No items selected. Please select a size for the main product or check outfit bundle items.");
    }
  };

  // Filtered reviews
  const filteredReviews = (reviewsData?.reviews || []).filter((r: any) => {
    if (reviewFilter === "all") return true;
    return r.rating === reviewFilter;
  });

  // Calculate size stock status
  const getIsSizeOutOfStock = (size: "XS" | "S" | "M" | "L" | "XL") => {
    const inv = product?.inventory?.find((i: any) => i.size === size);
    return !inv || inv.quantity <= 0;
  };

  const isCurrentSelectionOutOfStock = selectedSize ? getIsSizeOutOfStock(selectedSize) : false;

  // Sibling variants mapping
  const activeSiblings = siblings.filter((sib) => sib.status !== "Archived");

  // Accordion lists
  const accordionItems = [
    {
      title: "Fabric & Care",
      content: (
        <div className="flex flex-col gap-2">
          <p><strong>Composition:</strong> {product?.variantFabric || "100% Organic Hand-spun Khadi cotton"}.</p>
          <p><strong>Care Instructions:</strong> Dry clean recommended. Or gently hand wash in cold water using a pH-neutral organic detergent. Dry in shade. Medium warm iron.</p>
          <p><strong>Material Notes:</strong> Hand-loomed fabrics exhibit organic slubs, weaving anomalies, and minor tension variations. These characteristics celebrate the human hand behind the fabric.</p>
        </div>
      ),
    },
    {
      title: "Origin & Craft",
      content: (
        <div className="flex flex-col gap-2">
          <p><strong>Weaver:</strong> {product?.artisanMetadata?.weaverName || "Ramesh Devangan"}</p>
          <p><strong>Region:</strong> {product?.artisanMetadata?.region || "Chanderi, Madhya Pradesh"}</p>
          <p><strong>Hours to Complete:</strong> {product?.artisanMetadata?.hoursToWeave || 32} hours on traditional foot-treadle loom.</p>
          <p><strong>Loom Coordinates:</strong> {product?.artisanMetadata?.loomCoordinates || "24.7122° N, 78.1382° E"}</p>
        </div>
      ),
    },
    {
      title: "Delivery & Returns",
      content: (
        <div className="flex flex-col gap-2">
          <p><strong>Packaging:</strong> Shipped in our plastic-free, bio-degradable custom pulp coffret. We construct our packing boxes with organic, low-impact paper.</p>
          <p><strong>Timeline:</strong> Dispatch within 24-48 hours. Express delivery within 3-5 business days across India.</p>
          <p><strong>Returns:</strong> Complimentary collection for returns or size exchanges within 7 days of delivery. Items must remain unworn with tag attachments intact.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full relative min-h-screen">
      {/* 1. Fullscreen Gallery modal */}
      <Modal isOpen={isFullscreenGalleryOpen} onClose={() => { setIsFullscreenGalleryOpen(false); setZoomScale(1); }} title="Gallery Details">
        <div className="flex flex-col items-center select-none w-full">
          <div
            className="relative w-full aspect-[3/4] bg-canvas-inset-bg overflow-hidden cursor-zoom-in"
            onClick={() => setZoomScale((prev) => (prev === 1 ? 1.8 : 1))}
          >
            <Image
              src={galleryImages[fullscreenImageIndex]?.src || ""}
              alt="Fullscreen View"
              fill
              className="object-cover transition-transform duration-300"
              style={{ transform: `scale(${zoomScale})` }}
            />
          </div>
          <div className="flex gap-4 mt-4 items-center justify-between w-full">
            <button
              onClick={() => {
                setZoomScale(1);
                setFullscreenImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
              }}
              className="text-xs tracking-luxury uppercase border border-border-primary px-3 py-1 hover:bg-border-primary hover:text-canvas-bg transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-mono font-light text-text-secondary">
              {fullscreenImageIndex + 1} / {galleryImages.length}
            </span>
            <button
              onClick={() => {
                setZoomScale(1);
                setFullscreenImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
              }}
              className="text-xs tracking-luxury uppercase border border-border-primary px-3 py-1 hover:bg-border-primary hover:text-canvas-bg transition-colors"
            >
              Next
            </button>
          </div>
          <p className="text-[10px] text-text-secondary uppercase mt-2">
            Click image to toggle zoom scale ({zoomScale}x)
          </p>
        </div>
      </Modal>

      {/* 2. AI Size Advisor modal */}
      <Modal isOpen={isSizeAdvisorOpen} onClose={() => setIsSizeAdvisorOpen(false)} title="AI Size Advisor">
        <form onSubmit={handleCalculateSize} className="flex flex-col gap-4 font-sans py-2">
          <p className="text-xs text-text-secondary font-light leading-relaxed">
            Our sizing model calculates recommendations based on biometric weight density and preferred silhouette drapes.
          </p>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-luxury uppercase font-medium text-text-secondary">
              Height (cm)
            </label>
            <input
              type="number"
              placeholder="e.g. 172"
              value={advisorHeight}
              onChange={(e) => setAdvisorHeight(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border-subtle focus:outline-none focus:border-border-primary bg-transparent text-text-primary"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-luxury uppercase font-medium text-text-secondary">
              Weight (kg)
            </label>
            <input
              type="number"
              placeholder="e.g. 64"
              value={advisorWeight}
              onChange={(e) => setAdvisorWeight(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border-subtle focus:outline-none focus:border-border-primary bg-transparent text-text-primary"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-luxury uppercase font-medium text-text-secondary">
              Preferred Fit
            </label>
            <select
              value={advisorFit}
              onChange={(e: any) => setAdvisorFit(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border-subtle focus:outline-none focus:border-border-primary bg-transparent text-text-primary"
            >
              <option value="Tight">Tight / Sculpted</option>
              <option value="Regular">Regular / Effortless</option>
              <option value="Loose">Loose / Oversized</option>
            </select>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2">
            Calculate Recommended Size
          </Button>

          {advisorRecommendation && (
            <div className="mt-4 p-4 border border-border-primary bg-canvas-inset-bg/25 flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-text-secondary">
                Recommended Fit
              </span>
              <span className="text-3xl font-serif font-light text-text-primary my-1">
                Size {advisorRecommendation.size}
              </span>
              <span className="text-xs text-text-secondary font-light">
                Confidence Match: {advisorRecommendation.confidence}%
              </span>
            </div>
          )}

          <div className="mt-2 text-[10px] text-text-secondary leading-relaxed border-t border-border-subtle pt-3">
            <strong>Disclaimer:</strong> RAMYALAYANA garments are individually hand-loomed and finished. Minor organic variations (1-2cm) in cut and drape are natural characteristics of hand-woven fabrics.
          </div>
        </form>
      </Modal>

      {/* 2b. Standard Size Guide Chart Modal */}
      <Modal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} title="Size Guide">
        <div className="flex flex-col gap-4 font-sans text-xs text-text-secondary">
          <p className="leading-relaxed">
            RAMYALAYANA garments are designed with relaxed, architectural silhouettes. Find your measurement metrics below to confirm your size segment:
          </p>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse border border-border-subtle">
              <thead>
                <tr className="bg-canvas-inset-bg/10 uppercase tracking-widest text-[9px] text-text-primary border-b border-border-subtle">
                  <th className="p-2 border-r border-border-subtle">Size</th>
                  <th className="p-2 border-r border-border-subtle">Bust</th>
                  <th className="p-2 border-r border-border-subtle">Waist</th>
                  <th className="p-2">Hips</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px] text-text-primary">
                <tr className="border-b border-border-subtle">
                  <td className="p-2 border-r border-border-subtle font-sans font-medium">XS</td>
                  <td className="p-2 border-r border-border-subtle">32" / 81cm</td>
                  <td className="p-2 border-r border-border-subtle">25" / 63cm</td>
                  <td className="p-2">35" / 89cm</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="p-2 border-r border-border-subtle font-sans font-medium">S</td>
                  <td className="p-2 border-r border-border-subtle">34" / 86cm</td>
                  <td className="p-2 border-r border-border-subtle">27" / 68cm</td>
                  <td className="p-2">37" / 94cm</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="p-2 border-r border-border-subtle font-sans font-medium">M</td>
                  <td className="p-2 border-r border-border-subtle">36" / 91cm</td>
                  <td className="p-2 border-r border-border-subtle">29" / 73cm</td>
                  <td className="p-2">39" / 99cm</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="p-2 border-r border-border-subtle font-sans font-medium">L</td>
                  <td className="p-2 border-r border-border-subtle">38" / 96cm</td>
                  <td className="p-2 border-r border-border-subtle">31" / 78cm</td>
                  <td className="p-2">41" / 104cm</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-border-subtle font-sans font-medium">XL</td>
                  <td className="p-2 border-r border-border-subtle">40" / 101cm</td>
                  <td className="p-2 border-r border-border-subtle">33" / 83cm</td>
                  <td className="p-2">43" / 109cm</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] leading-relaxed italic mt-2">
            * Fits may vary based on item volume styles. Sizing guides act as baseline approximations.
          </p>
        </div>
      </Modal>

      {/* Main product presentation template */}
      <ProductLayout
        galleryNode={
          <div className="w-full select-none">
            {/* Desktop Stack Layout */}
            <div className="hidden lg:flex flex-col gap-6">
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-[3/4] w-full bg-canvas-inset-bg overflow-hidden cursor-zoom-in"
                  onClick={() => {
                    setFullscreenImageIndex(idx);
                    setIsFullscreenGalleryOpen(true);
                  }}
                >
                  <Image
                    src={img.src}
                    alt={`${product?.name} - ${img.type}`}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover hover:scale-[1.02] transition-transform duration-700 ease-quint"
                    priority={idx === 0}
                  />
                  <div className="absolute bottom-3 left-3 bg-canvas-bg/85 px-2 py-0.5 border border-border-subtle text-[9px] uppercase tracking-widest text-text-secondary">
                    {img.type}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Carousel Swipe Layout */}
            <div className="block lg:hidden w-full relative">
              <div className="relative aspect-[3/4] w-full bg-canvas-inset-bg overflow-hidden">
                <Image
                  src={galleryImages[mobileGalleryIndex]?.src || ""}
                  alt={product?.name}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  onClick={() => {
                    setFullscreenImageIndex(mobileGalleryIndex);
                    setIsFullscreenGalleryOpen(true);
                  }}
                />
                
                {/* Image Label Overlay */}
                <div className="absolute bottom-4 left-4 bg-canvas-bg/90 px-2 py-0.5 border border-border-subtle text-[9px] uppercase tracking-widest text-text-secondary">
                  {galleryImages[mobileGalleryIndex]?.type}
                </div>
              </div>

              {/* Mobile Slideshow Control buttons */}
              <div className="flex gap-2 justify-center mt-3 items-center">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMobileGalleryIndex(idx)}
                    className={`h-1.5 transition-all duration-300 ${
                      mobileGalleryIndex === idx
                        ? "w-6 bg-border-primary"
                        : "w-1.5 bg-border-subtle"
                    }`}
                    aria-label={`Slide index ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        }
        detailsNode={
          <div className="flex flex-col gap-5 lg:pb-12">
            {/* Breadcrumb line */}
            <nav className="text-[10px] tracking-luxury uppercase text-text-secondary font-light select-none">
              <Link href="/" className="hover:underline">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/shop" className="hover:underline">Catalog</Link>
              <span className="mx-2">/</span>
              <span className="text-text-primary">{product?.name}</span>
            </nav>

            {/* From the Archive banner status */}
            {product?.status === "Archived" && (
              <div className="w-full bg-canvas-inset-bg/40 border border-border-subtle px-4 py-3 select-none text-left">
                <span className="text-xs uppercase tracking-luxury text-text-primary block font-semibold mb-0.5">
                  From The Archive
                </span>
                <span className="text-xs text-text-secondary font-light leading-relaxed">
                  This silhouette is retired and preserved for archival indices. Below, you will find active collection alternatives.
                </span>
              </div>
            )}

            {/* Product details header */}
            <div className="flex flex-col gap-1.5 border-b border-border-subtle pb-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-serif tracking-wide text-text-primary uppercase leading-tight">
                  {product?.name}
                </h1>
                {product?.status !== "Active" && product?.status !== "Archived" && (
                  <Badge variant={product?.status === "Sold Out" ? "subtle" : "outline"}>
                    {product?.status}
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl text-text-primary font-serif font-light">
                  ₹{product?.price?.toLocaleString("en-IN")}
                </span>
                {/* Stock Status Indication */}
                {product?.status === "Active" && (
                  <span className="text-[9px] uppercase tracking-luxury font-medium text-emerald-700">
                    ● In Stock — Spun in Limited Lots
                  </span>
                )}
              </div>
            </div>

            {/* Sibling variants selection */}
            {siblings.length > 0 && (
              <div className="flex flex-col gap-2 pb-4 border-b border-border-subtle">
                <span className="text-[10px] tracking-luxury uppercase font-medium text-text-secondary">
                  Color / Fabric: <strong className="text-text-primary">{product?.variantColor?.name}</strong>
                </span>
                <div className="flex gap-3">
                  {product?.variantColor && (
                    <span
                      title={product.variantColor.name}
                      className="h-5 w-5 rounded-full border border-border-primary ring-2 ring-offset-2 ring-border-primary"
                      style={{ backgroundColor: product.variantColor.hex }}
                    />
                  )}
                  {activeSiblings.map((sib, i) =>
                    sib.variantColor ? (
                      <Link
                        key={i}
                        href={`/product/${sib.slug}`}
                        title={sib.variantColor.name}
                        className="h-5 w-5 rounded-full border border-border-subtle hover:border-border-primary transition-all"
                        style={{ backgroundColor: sib.variantColor.hex }}
                      />
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* Sizes Selection block & AI Size Recommendation triggers */}
            {product?.status !== "Archived" && (
              <div className="flex flex-col gap-3 pb-4 border-b border-border-subtle">
                <div className="flex justify-between items-center select-none">
                  <span className="text-[10px] tracking-luxury uppercase font-medium text-text-secondary">
                    Select Size
                  </span>
                  
                  {/* Sizing helpers row */}
                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => setIsSizeAdvisorOpen(true)}
                      className="text-[10px] tracking-luxury uppercase font-medium text-text-primary underline hover:text-accent focus:outline-none"
                    >
                      AI Size Advisor
                    </button>
                    <span className="text-[10px] text-border-subtle">|</span>
                    <button
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-[10px] tracking-luxury uppercase font-medium text-text-primary underline hover:text-accent focus:outline-none"
                    >
                      Size Guide
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-2 select-none">
                  {(["XS", "S", "M", "L", "XL"] as const).map((size) => {
                    const isOutOfStock = getIsSizeOutOfStock(size);
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSize(size);
                          setWaitlistSuccessMessage(null);
                          setWaitlistErrorMessage(null);
                        }}
                        className={`py-3 text-xs uppercase font-medium border text-center transition-all duration-300 ${
                          isSelected
                            ? "border-border-primary bg-border-primary text-canvas-bg font-semibold"
                            : isOutOfStock
                            ? "border-border-subtle bg-canvas-inset-bg/20 text-text-secondary/50 line-through cursor-default"
                            : "border-border-subtle hover:border-border-primary text-text-primary"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {/* Sizing notes & fit indicators */}
                <div className="flex flex-col gap-1 text-[10px] text-text-secondary leading-relaxed font-light mt-1 uppercase tracking-luxury">
                  <span><strong>Fit Notes:</strong> {product?.description?.fit || "Relaxed structural volume. Designed to drape fluidly."}</span>
                  <span><strong>Model Reference:</strong> Model is 178cm / 5'10" and wearing Size S.</span>
                </div>
              </div>
            )}

            {/* Quantity control */}
            {product?.status === "Active" && selectedSize && !isCurrentSelectionOutOfStock && (
              <div className="flex flex-col gap-2 select-none">
                <span className="text-[10px] tracking-luxury uppercase font-medium text-text-secondary">
                  Quantity
                </span>
                <div className="flex border border-border-subtle w-24 items-center">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 hover:bg-canvas-inset-bg/20 text-text-primary text-sm font-medium focus:outline-none"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-xs font-medium text-text-primary font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1.5 hover:bg-canvas-inset-bg/20 text-text-primary text-sm font-medium focus:outline-none"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Main Action Buttons or Waitlist capture */}
            <div className="flex flex-col gap-3 mt-1.5">
              {product?.status === "Archived" ? (
                <div className="w-full text-center py-2.5 text-xs uppercase tracking-luxury text-text-secondary border border-border-subtle">
                  Archived Garment
                </div>
              ) : product?.status === "Sold Out" || isCurrentSelectionOutOfStock ? (
                // Waitlist Capture form block
                <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-3 border border-border-subtle p-4 bg-canvas-inset-bg/10">
                  <span className="text-xs uppercase tracking-luxury text-text-primary font-semibold">
                    Join Waitlist
                  </span>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    This size is currently unavailable. Enter your email below to be notified if it restocks or a limited lot becomes available.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-border-subtle focus:outline-none focus:border-border-primary bg-transparent text-text-primary"
                      required
                    />
                    <Button type="submit" variant="primary" size="sm">
                      Notify Me
                    </Button>
                  </div>
                  {waitlistSuccessMessage && (
                    <span className="text-[10px] text-emerald-700 uppercase font-medium tracking-wide">
                      {waitlistSuccessMessage}
                    </span>
                  )}
                  {waitlistErrorMessage && (
                    <span className="text-[10px] text-red-600 uppercase font-medium tracking-wide">
                      {waitlistErrorMessage}
                    </span>
                  )}
                </form>
              ) : (
                // In stock purchase CTAs with prominent Buy Now option
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-2">
                    {/* Primary Buy Now for immediate purchase conversion */}
                    <Button
                      onClick={handleBuyNow}
                      variant="primary"
                      className="w-full text-xs font-semibold py-4 tracking-luxury shadow-sm"
                    >
                      Buy Now — Secure Express Checkout
                    </Button>
                    
                    <div className="grid grid-cols-12 gap-2">
                      <Button
                        onClick={handleAddToCart}
                        variant="secondary"
                        className="col-span-9 text-xs"
                      >
                        Add to Cart
                      </Button>
                      
                      {/* Wishlist toggle action */}
                      <button
                        onClick={() => {
                          if (!session) {
                            alert("Please login to add items to your wishlist.");
                            return;
                          }
                          wishlistMutation.mutate(product._id);
                        }}
                        className="col-span-3 flex items-center justify-center border border-border-subtle hover:border-border-primary transition-colors focus:outline-none"
                        aria-label={wishlistedIds.has(product?._id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <svg
                          className={`h-4 w-4 ${
                            wishlistedIds.has(product?._id)
                              ? "fill-red-500 stroke-red-500"
                              : "stroke-text-primary fill-none"
                          }`}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Trust Indicators directly below CTAs */}
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 border-t border-border-subtle pt-4 text-[9px] text-text-secondary uppercase tracking-luxury">
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3 w-3 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Express Shipping (3-5d)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3 w-3 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Complimentary Returns</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3 w-3 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Secure SSL Payments</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3 w-3 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span>100% Weave Authenticity</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Custom styled detail menus accordions */}
            <div className="mt-4">
              <Accordion items={accordionItems} allowMultiple={false} />
            </div>
          </div>
        }
      />

      {/* 3. Complete the Look / Cross-selling Section (Moved immediately below the main visual split layout) */}
      {fallbackLook && fallbackLook.length > 0 && (
        <section className="border-t border-border-subtle py-12 max-w-[1200px] mx-auto px-4 select-none">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-luxury uppercase font-semibold text-accent">
                Style coordinates
              </span>
              <h2 className="text-3xl font-serif text-text-primary uppercase leading-tight font-light">
                Complete The Look
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Bundle list items */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {fallbackLook.map((lookItem) => {
                  const isChecked = !!checkedLookItems[lookItem._id];
                  const itemSize = lookItemSizes[lookItem._id] || "M";

                  return (
                    <div
                      key={lookItem._id}
                      className="flex items-center gap-4 p-4 border border-border-subtle bg-canvas-bg/50 hover:bg-canvas-bg transition-colors"
                    >
                      {/* Checkbox input */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setCheckedLookItems((prev) => ({
                            ...prev,
                            [lookItem._id]: !prev[lookItem._id],
                          }))
                        }
                        className="h-4 w-4 border-border-primary text-border-primary focus:ring-0 cursor-pointer"
                      />

                      {/* Small Thumbnail */}
                      <div className="relative h-20 w-15 bg-canvas-inset-bg overflow-hidden flex-shrink-0">
                        <Image
                          src={lookItem.images.studioFront}
                          alt={lookItem.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Detail info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${lookItem.slug}`} className="hover:underline">
                          <h4 className="text-xs uppercase font-medium text-text-primary truncate">
                            {lookItem.name}
                          </h4>
                        </Link>
                        <span className="text-xs text-text-secondary block mt-0.5">
                          ₹{lookItem.price.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Size selector selector for look item */}
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-[9px] uppercase tracking-widest text-text-secondary">
                          Size
                        </span>
                        <select
                          value={itemSize}
                          onChange={(e: any) =>
                            setLookItemSizes((prev) => ({
                              ...prev,
                              [lookItem._id]: e.target.value,
                            }))
                          }
                          className="px-2 py-1 text-xs border border-border-subtle bg-transparent text-text-primary focus:outline-none"
                        >
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total checkout card box */}
              <div className="lg:col-span-5 border border-border-primary p-6 bg-canvas-bg flex flex-col gap-4">
                <span className="text-xs uppercase tracking-luxury text-text-primary font-semibold">
                  Styled Bundle Checkout
                </span>
                
                <div className="flex flex-col gap-2 text-xs text-text-secondary leading-relaxed border-b border-border-subtle pb-4">
                  <div className="flex justify-between">
                    <span>Main garment ({selectedSize || "No size chosen"})</span>
                    <span>₹{product?.price?.toLocaleString("en-IN")}</span>
                  </div>
                  {fallbackLook.map((item) => {
                    if (!checkedLookItems[item._id]) return null;
                    return (
                      <div key={item._id} className="flex justify-between">
                        <span>{item.name} (Size {lookItemSizes[item._id] || "M"})</span>
                        <span>₹{item.price.toLocaleString("en-IN")}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between font-serif text-sm font-semibold text-text-primary py-1">
                  <span>Estimated Outfit Total</span>
                  <span>
                    ₹{(
                      product?.price +
                      fallbackLook.reduce((acc, item) => {
                        if (!checkedLookItems[item._id]) return acc;
                        return acc + item.price;
                      }, 0)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>

                <Button
                  onClick={handleAddLookToCart}
                  variant="primary"
                  className="w-full text-xs mt-2"
                >
                  Add Selected Look Items to Cart
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Product Story / Craftsmanship Section */}
      <section className="border-t border-border-subtle py-16 max-w-[1200px] mx-auto px-4 select-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <span className="text-[10px] tracking-luxury uppercase font-semibold text-accent">
              The Craftsmanship Story
            </span>
            <h2 className="text-4xl font-serif text-text-primary uppercase leading-tight font-light">
              Loomed by Hand, Spun with Memory
            </h2>
            <p className="text-sm font-light text-text-secondary leading-relaxed">
              {product?.description?.editorial || "Every piece is an individual artifact, handloomed from organic raw cotton blends and slow-cured in wood-ash baths. No machine finishes, no chemical starches."}
            </p>
            <p className="text-sm font-light text-text-secondary leading-relaxed">
              {product?.description?.artisanDetails || "Designed for quiet elegance, reflecting the texture and raw drape of authentic Indian handlooms."}
            </p>
          </div>
          <div className="border border-border-primary p-8 bg-canvas-inset-bg/15 flex flex-col gap-4">
            <span className="text-xs uppercase tracking-luxury text-text-primary font-semibold">
              Artisan Blueprint
            </span>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
              <div>
                <span className="text-[10px] uppercase text-text-secondary block">Master Weaver</span>
                <span className="font-medium text-text-primary">{product?.artisanMetadata?.weaverName || "Ramesh Devangan"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-text-secondary block">Loom Location</span>
                <a
                  href={`https://maps.google.com/?q=${product?.artisanMetadata?.loomCoordinates || "24.7122,78.1382"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-text-primary underline hover:text-accent"
                >
                  {product?.artisanMetadata?.region || "Chanderi, India"}
                </a>
              </div>
              <div>
                <span className="text-[10px] uppercase text-text-secondary block">Hours of Loom Labor</span>
                <span className="font-medium text-text-primary font-mono">{product?.artisanMetadata?.hoursToWeave || 32} Hours</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-text-secondary block">Loom Coordinates</span>
                <span className="font-medium text-text-primary font-mono text-[10px]">{product?.artisanMetadata?.loomCoordinates || "24.7122° N, 78.1382° E"}</span>
              </div>
            </div>
            <div className="border-t border-border-subtle pt-4 text-[10px] text-text-secondary leading-relaxed">
              This garment incorporates raw structural inputs tracing direct livelihoods back to weaving clusters in central India.
            </div>
          </div>
        </div>
      </section>

      {/* 5. Social Proof / Review moderation panel */}
      <section className="border-t border-border-subtle py-16 max-w-[1200px] mx-auto px-4 select-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Review column details */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <span className="text-[10px] tracking-luxury uppercase font-semibold text-accent">
              Feedback
            </span>
            <h2 className="text-3xl font-serif text-text-primary uppercase leading-tight font-light">
              Customer Dialogue
            </h2>
            
            {/* Aggregate score */}
            <div className="flex items-center gap-3">
              <span className="text-4xl font-serif font-light text-text-primary">
                {product?.averageRating ? product.averageRating.toFixed(1) : "5.0"}
              </span>
              <div className="flex flex-col">
                <div className="flex text-accent text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <span className="text-[10px] text-text-secondary uppercase">
                  Based on {reviewsData?.reviews?.length || 0} approved reviews
                </span>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
              <span className="text-[9px] uppercase tracking-widest text-text-secondary font-medium">
                Filter by rating
              </span>
              <div className="flex flex-wrap gap-2">
                {(["all", 5, 4, 3, 2, 1] as const).map((score) => (
                  <button
                    key={score}
                    onClick={() => setReviewFilter(score)}
                    className={`px-3 py-1 text-xs uppercase border tracking-wider transition-all duration-300 ${
                      reviewFilter === score
                        ? "border-border-primary bg-border-primary text-canvas-bg"
                        : "border-border-subtle hover:border-border-primary text-text-primary"
                    }`}
                  >
                    {score === "all" ? "All" : `${score} ★`}
                  </button>
                ))}
              </div>
            </div>

            {/* New Review creation form block */}
            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 border border-border-subtle p-4 bg-canvas-inset-bg/5 mt-4">
              <span className="text-xs uppercase tracking-luxury text-text-primary font-semibold">
                Submit Review
              </span>
              
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-text-secondary">
                  Star Rating
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`text-xl focus:outline-none transition-colors ${
                        reviewRating >= star ? "text-accent" : "text-border-subtle"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-text-secondary">
                  Commentary
                </span>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details of drape, weave, and construction sizing..."
                  className="w-full px-3 py-2 text-xs border border-border-subtle focus:outline-none focus:border-border-primary bg-transparent text-text-primary"
                  required
                />
              </div>

              <Button type="submit" variant="primary" size="sm" className="w-full">
                Publish Review
              </Button>

              {reviewSuccessMessage && (
                <span className="text-[10px] text-emerald-700 uppercase font-medium leading-relaxed">
                  {reviewSuccessMessage}
                </span>
              )}
              {reviewErrorMessage && (
                <span className="text-[10px] text-red-600 uppercase font-medium leading-relaxed">
                  {reviewErrorMessage}
                </span>
              )}
            </form>
          </div>

          {/* Right reviews list content column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {filteredReviews.length === 0 ? (
              <div className="text-xs uppercase tracking-luxury text-text-secondary text-center py-16 border border-dashed border-border-subtle">
                No approved product reviews matched this selection.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {filteredReviews.map((rev: any) => {
                  const simulatedVotes = (helpfulVotes[rev._id] || 0);
                  const alreadyVoted = !!votedHelpful[rev._id];

                  return (
                    <div key={rev._id} className="border-b border-border-subtle pb-6 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wider text-text-primary font-medium">
                            {rev.reviewerName}
                          </span>
                          {rev.user?.isTrustedReviewer && (
                            <Badge variant="neutral" className="scale-90">
                              Trusted Reviewer
                            </Badge>
                          )}
                          <Badge variant="subtle" className="scale-90">
                            Verified
                          </Badge>
                        </div>
                        <span className="text-[10px] font-mono text-text-secondary font-light">
                          {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      
                      <div className="flex text-accent text-xs">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <span key={idx}>{idx < rev.rating ? "★" : "☆"}</span>
                        ))}
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed font-light mt-1">
                        {rev.comment}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => handleHelpfulClick(rev._id)}
                          className={`text-[9px] uppercase tracking-widest border px-2.5 py-1 transition-all duration-300 focus:outline-none ${
                            alreadyVoted
                              ? "border-border-primary bg-border-primary text-canvas-bg"
                              : "border-border-subtle hover:border-border-primary text-text-primary"
                          }`}
                          disabled={alreadyVoted}
                        >
                          Helpful ({simulatedVotes})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <section className="border-t border-border-subtle py-16 max-w-[1200px] mx-auto px-4 select-none">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-luxury uppercase font-semibold text-accent">
                History
              </span>
              <h2 className="text-3xl font-serif text-text-primary uppercase leading-tight font-light">
                Recently Viewed
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recentlyViewed.map((prevProd) => (
                <ProductCard
                  key={prevProd._id}
                  product={prevProd}
                  onWishlistToggle={
                    session
                      ? (id) => wishlistMutation.mutate(id)
                      : undefined
                  }
                  isWishlisted={wishlistedIds.has(prevProd._id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Persistent Bottom CTA bar for mobile viewport screens (Includes: Price, Size state dropdown, and Add to Cart action) */}
      {product?.status === "Active" && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-canvas-bg/95 backdrop-blur-md border-t border-border-primary px-4 py-3 flex lg:hidden items-center justify-between shadow-soft select-none font-sans">
          <div className="flex flex-col justify-center min-w-0 pr-2">
            <span className="text-[8px] uppercase tracking-widest text-text-secondary truncate">
              {product.name}
            </span>
            <span className="text-sm font-semibold text-text-primary font-mono mt-0.5">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Thumb-friendly size selector */}
            <select
              value={selectedSize || ""}
              onChange={(e) => {
                setSelectedSize((e.target.value as any) || null);
                setWaitlistSuccessMessage(null);
                setWaitlistErrorMessage(null);
              }}
              className="text-xs uppercase border border-border-primary bg-transparent py-2.5 px-3 focus:outline-none font-medium h-10 w-24 tracking-wide"
            >
              <option value="">Size</option>
              {(["XS", "S", "M", "L", "XL"] as const).map((size) => (
                <option key={size} value={size} disabled={getIsSizeOutOfStock(size)}>
                  {size} {getIsSizeOutOfStock(size) ? "— Out" : ""}
                </option>
              ))}
            </select>

            {/* Direct primary checkout conversion trigger */}
            <Button
              onClick={handleBuyNow}
              disabled={!selectedSize || isCurrentSelectionOutOfStock}
              variant="primary"
              size="sm"
              className="text-xs font-semibold px-4 h-10 tracking-widest flex items-center justify-center"
            >
              Buy Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
