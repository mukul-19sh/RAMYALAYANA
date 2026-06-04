import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import ProductDetailClient from "./ProductDetailClient";

// Mock database matching shop catalog, providing rich fallback if DB is unseeded
const MOCK_PRODUCTS: Record<string, any> = {
  "kora-silk-wrap-shirt": {
    _id: "60c72b2f9b1d8e1f40000001",
    sku: "RM-KSS-01",
    name: "Kora Silk Wrap Shirt",
    slug: "kora-silk-wrap-shirt",
    price: 18500,
    status: "Active",
    category: "atelier",
    subCategory: "tops",
    images: {
      studioFront: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1594938384824-022ef7790b5b?auto=format&fit=crop&q=80&w=800",
      studioDetail: "https://images.unsplash.com/photo-1608234807905-4465853b9c01?auto=format&fit=crop&q=80&w=800",
      lookbook: [
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200"
      ]
    },
    description: {
      editorial: "Woven from fine mulberry kora silk, this wrap shirt features a fluid, deconstructed drape that celebrates the natural texture of hand-spun yarn.",
      fit: "Designed for an oversized, relaxed silhouette. Adjustable wrap waist tie allows for customized shaping.",
      artisanDetails: "Hand-woven by the masters of Chanderi, Madhya Pradesh. Each shirt is spun on a traditional foot-pedal loom over a course of four days."
    },
    artisanMetadata: {
      weaverName: "Ramesh Devangan",
      loomCoordinates: "24.7122° N, 78.1382° E",
      hoursToWeave: 32,
      region: "Chanderi, MP"
    },
    inventory: [
      { size: "XS", quantity: 2 },
      { size: "S", quantity: 5 },
      { size: "M", quantity: 8 },
      { size: "L", quantity: 3 },
      { size: "XL", quantity: 1 }
    ],
    variantGroupId: "vg-wrap-shirt",
    variantColor: { name: "Bone White", hex: "#F6F5F2" },
    variantFabric: "Mulberry Kora Silk",
    averageRating: 4.8,
    totalReviews: 4
  },
  "clay-tailored-blazer": {
    _id: "60c72b2f9b1d8e1f40000002",
    sku: "RM-CTB-02",
    name: "Clay Tailored Blazer",
    slug: "clay-tailored-blazer",
    price: 24000,
    status: "Active",
    category: "silhouette",
    subCategory: "jackets",
    images: {
      studioFront: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1591047139265-5c1cfb9b478d?auto=format&fit=crop&q=80&w=800",
      studioDetail: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=800",
      lookbook: [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200"
      ]
    },
    description: {
      editorial: "An architectural blazer tailored in structured khadi linen, featuring padded shoulders, a deep notched lapel, and asymmetric single-button closure.",
      fit: "Tailored fit through the waist with relaxed, structured shoulders. True to size.",
      artisanDetails: "Woven by weavers in the Bhuj district of Gujarat, using locally sourced organic indigo and madder root dyes."
    },
    artisanMetadata: {
      weaverName: "Amir Ali",
      loomCoordinates: "23.2420° N, 69.6669° E",
      hoursToWeave: 48,
      region: "Bhuj, Gujarat"
    },
    inventory: [
      { size: "XS", quantity: 0 },
      { size: "S", quantity: 4 },
      { size: "M", quantity: 6 },
      { size: "L", quantity: 2 },
      { size: "XL", quantity: 0 }
    ],
    variantGroupId: "vg-tailored-blazer",
    variantColor: { name: "Ochre Clay", hex: "#9C8259" },
    variantFabric: "Khadi Organic Linen",
    averageRating: 5.0,
    totalReviews: 2
  },
  "sanskrit-loom-wrap-dress": {
    _id: "60c72b2f9b1d8e1f40000003",
    sku: "RM-SLD-03",
    name: "Sanskrit Loom Wrap Dress",
    slug: "sanskrit-loom-wrap-dress",
    price: 21500,
    status: "Sold Out",
    category: "atelier",
    subCategory: "dresses",
    images: {
      studioFront: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1595777457317-af995163f45c?auto=format&fit=crop&q=80&w=800",
      studioDetail: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800",
      lookbook: [
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200"
      ]
    },
    description: {
      editorial: "A fluid midi-length wrap dress featuring asymmetric pleats, a deep V-neck, and self-tie detailing at the waist, rendered in lightweight hand-loomed cotton.",
      fit: "Adjustable waist tie provides custom fit. Flows loosely from hips down.",
      artisanDetails: "Spun from indigenous organic cotton and dyed in herbal baths by an artisan collective in Maheshwar."
    },
    artisanMetadata: {
      weaverName: "Sunita Bai",
      loomCoordinates: "22.1761° N, 75.5843° E",
      hoursToWeave: 40,
      region: "Maheshwar, MP"
    },
    inventory: [
      { size: "XS", quantity: 0 },
      { size: "S", quantity: 0 },
      { size: "M", quantity: 0 },
      { size: "L", quantity: 0 },
      { size: "XL", quantity: 0 }
    ],
    variantGroupId: "vg-wrap-dress",
    variantColor: { name: "Warm Cement", hex: "#D1CDC5" },
    variantFabric: "Organic Cotton",
    averageRating: 4.7,
    totalReviews: 3
  },
  "organic-khadi-trousers": {
    _id: "60c72b2f9b1d8e1f40000004",
    sku: "RM-OKT-04",
    name: "Organic Khadi Trousers",
    slug: "organic-khadi-trousers",
    price: 14000,
    status: "Active",
    category: "foundations",
    subCategory: "bottoms",
    images: {
      studioFront: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1624378440847-4a64ee1a889d?auto=format&fit=crop&q=80&w=800",
      studioDetail: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800",
      lookbook: [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200"
      ]
    },
    description: {
      editorial: "Wide-leg trousers crafted from heavy-weight handloom khadi cotton, complete with double front pleats, side slash pockets, and a clean hook-and-bar waistband.",
      fit: "High-waisted, wide-leg cut. True to size with standard inseam.",
      artisanDetails: "Spun and woven by hand in Ponduru, Andhra Pradesh, known for its fine-count hand-spun khadi."
    },
    artisanMetadata: {
      weaverName: "K. Venkat",
      loomCoordinates: "18.3741° N, 83.8443° E",
      hoursToWeave: 24,
      region: "Ponduru, AP"
    },
    inventory: [
      { size: "XS", quantity: 3 },
      { size: "S", quantity: 5 },
      { size: "M", quantity: 2 },
      { size: "L", quantity: 0 },
      { size: "XL", quantity: 4 }
    ],
    variantGroupId: "vg-khadi-trousers",
    variantColor: { name: "Charcoal Slate", hex: "#1A1C1E" },
    variantFabric: "Fine Khadi Cotton",
    averageRating: 4.5,
    totalReviews: 2
  },
  "draft-silk-cord-blazer": {
    _id: "60c72b2f9b1d8e1f40000005",
    sku: "RM-DSC-05",
    name: "Draft Silk Cord Blazer",
    slug: "draft-silk-cord-blazer",
    price: 26000,
    status: "Archived",
    category: "archive",
    subCategory: "jackets",
    images: {
      studioFront: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800",
      studioDetail: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800",
      lookbook: [
        "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800"
      ]
    },
    description: {
      editorial: "An archival single-breasted blazer in fine ribbed silk corduroy, featuring soft natural shoulder construction, patched utility pockets, and horn buttons.",
      fit: "Relaxed silhouette, perfect for seasonal layering.",
      artisanDetails: "Crafted from heritage wool-silk blends loomed in the valleys of Jammu & Kashmir."
    },
    artisanMetadata: {
      weaverName: "Ghulam Nabi",
      loomCoordinates: "34.0837° N, 74.7973° E",
      hoursToWeave: 56,
      region: "Srinagar, J&K"
    },
    inventory: [
      { size: "XS", quantity: 0 },
      { size: "S", quantity: 0 },
      { size: "M", quantity: 0 },
      { size: "L", quantity: 0 },
      { size: "XL", quantity: 0 }
    ],
    variantGroupId: "vg-silk-cord-blazer",
    variantColor: { name: "Raw Ochre", hex: "#9C8259" },
    variantFabric: "Ribbed Silk Corduroy",
    averageRating: 0,
    totalReviews: 0
  },
  "chanderi-silk-stole": {
    _id: "60c72b2f9b1d8e1f40000006",
    sku: "RM-CSS-06",
    name: "Chanderi Silk Stole",
    slug: "chanderi-silk-stole",
    price: 4500,
    status: "Active",
    category: "atelier",
    subCategory: "tops",
    images: {
      studioFront: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800",
      studioBack: "https://images.unsplash.com/photo-1594938384824-022ef7790b5b?auto=format&fit=crop&q=80&w=800",
      studioDetail: "https://images.unsplash.com/photo-1608234807905-4465853b9c01?auto=format&fit=crop&q=80&w=800",
      lookbook: [
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200"
      ]
    },
    description: {
      editorial: "A lightweight stole hand-loomed in sheer Chanderi silk, detailed with gold borders.",
      fit: "One size.",
      artisanDetails: "Woven in Chanderi, MP."
    },
    artisanMetadata: {
      weaverName: "Ramesh Devangan",
      loomCoordinates: "24.7122° N, 78.1382° E",
      hoursToWeave: 12,
      region: "Chanderi, MP"
    },
    inventory: [
      { size: "XS", quantity: 5 },
      { size: "S", quantity: 5 },
      { size: "M", quantity: 10 },
      { size: "L", quantity: 5 },
      { size: "XL", quantity: 5 }
    ],
    variantGroupId: "vg-stole",
    variantColor: { name: "Bone White", hex: "#F6F5F2" },
    variantFabric: "Chanderi Silk",
    averageRating: 5.0,
    totalReviews: 1
  }
};

// Helper: resolve dynamic parameters and query DB/mock fallback
async function getProductData(slug: string) {
  try {
    await dbConnect();
    const product = await Product.findOne({ slug: slug.toLowerCase() }).lean();

    if (product) {
      // Fetch sibling variants
      let siblings: any[] = [];
      if (product.variantGroupId) {
        siblings = await Product.find({
          variantGroupId: product.variantGroupId,
          _id: { $ne: product._id },
          status: { $ne: "Archived" }
        })
          .select("slug variantColor variantFabric status")
          .lean();
      }
      return { product: JSON.parse(JSON.stringify(product)), siblings: JSON.parse(JSON.stringify(siblings)) };
    }
  } catch (error) {
    console.error("DB connection error in product detail page:", error);
  }

  // Fallback to MOCK database
  const normalizedSlug = slug.toLowerCase();
  const mockProduct = MOCK_PRODUCTS[normalizedSlug];
  if (mockProduct) {
    // Sibling lookup in mock db
    const siblings = Object.values(MOCK_PRODUCTS).filter(
      (p: any) =>
        p.variantGroupId === mockProduct.variantGroupId &&
        p.slug !== mockProduct.slug &&
        p.status !== "Archived"
    );
    return { product: mockProduct, siblings };
  }

  return { product: null, siblings: [] };
}

// Generate Metadata for SEO indexability and bots
export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  const { product } = await getProductData(slug);

  if (!product) {
    return {
      title: "Garment Not Found — RAMYA Flagship",
      description: "This item is not present in our digital archives.",
    };
  }

  return {
    title: `${product.name} — RAMYA Flagship`,
    description: product.description.editorial,
    openGraph: {
      title: `${product.name} — RAMYA Flagship`,
      description: product.description.editorial,
      url: `https://ramyalayana.com/product/${product.slug}`,
      type: "website",
      images: [
        {
          url: product.images.studioFront,
          width: 800,
          height: 1066,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — RAMYA Flagship`,
      description: product.description.editorial,
      images: [product.images.studioFront],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const { product, siblings } = await getProductData(slug);

  if (!product) {
    return notFound();
  }

  // Fetch look products for "Complete the Look" (mock or db)
  let lookItems: any[] = [];
  try {
    await dbConnect();
    lookItems = await Product.find({
      _id: { $ne: product._id },
      status: "Active"
    })
      .limit(2)
      .lean();
    lookItems = JSON.parse(JSON.stringify(lookItems));
  } catch (e) {
    console.error("Failed to query DB complete the look products", e);
  }

  if (lookItems.length === 0) {
    // Select fallbacks from MOCK_PRODUCTS
    lookItems = Object.values(MOCK_PRODUCTS)
      .filter((p: any) => p.slug !== product.slug && p.status === "Active")
      .slice(0, 2);
  }

  // Product JSON-LD structured data schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": [product.images.studioFront, product.images.studioBack],
    "description": product.description.editorial,
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": "RAMYA"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://ramyalayana.com/product/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability":
        product.status === "Active"
          ? "https://schema.org/InStock"
          : product.status === "Sold Out"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/Discontinued"
    }
  };

  // Breadcrumbs JSON-LD structured data schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://ramyalayana.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Shop",
        "item": "https://ramyalayana.com/shop"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `https://ramyalayana.com/product/${product.slug}`
      }
    ]
  };

  return (
    <>
      {/* Structural JSON-LD schemas inside the head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ProductDetailClient
        initialProduct={product}
        siblings={siblings}
        fallbackLook={lookItems}
      />
    </>
  );
}
