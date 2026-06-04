import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import User from "@/models/User";

export async function seedDatabase() {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log("Seeding catalog products into memory database...");
      await Product.insertMany([
        {
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
        {
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
        {
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
        {
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
        {
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
        {
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
      ]);
      console.log("Catalog products seeded successfully!");
    }

    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      console.log("Seeding default coupons...");
      await Coupon.insertMany([
        {
          code: "WELCOME10",
          discountType: "percentage",
          discountValue: 10,
          minOrderValue: 5000,
          expiryDate: new Date("2030-12-31"),
          usageLimit: 1000,
          usageCount: 0,
          isActive: true,
        },
        {
          code: "ATELIER15",
          discountType: "percentage",
          discountValue: 15,
          minOrderValue: 10000,
          expiryDate: new Date("2030-12-31"),
          usageLimit: 500,
          usageCount: 0,
          isActive: true,
        }
      ]);
      console.log("Default coupons seeded successfully!");
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("Seeding default test user...");
      await User.create({
        _id: "60c72b2f9b1d8e1f40000099",
        email: "test.collector@ramya.in",
        role: "collector",
        referralCode: "RAMYA-TEST-1234",
        loomClub: {
          points: 0,
          tier: "none",
          joinedDate: new Date(),
        },
        isTrustedReviewer: false,
        refusedCodCount: 0,
      });
      console.log("Default test user seeded successfully!");
    }
  } catch (error) {
    console.error("Error during database seeding:", error);
  }
}
