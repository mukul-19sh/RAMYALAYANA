"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartStoreItem {
  product: {
    _id: string;
    name: string;
    price: number;
    slug: string;
    images: {
      studioFront: string;
    };
  };
  selectedSize: "XS" | "S" | "M" | "L" | "XL";
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
}

interface CartState {
  items: CartStoreItem[];
  coupon: AppliedCoupon | null;
  appliedGiftCards: string[]; // List of gift card codes applied
  addToCart: (item: CartStoreItem) => void;
  removeFromCart: (productId: string, size: "XS" | "S" | "M" | "L" | "XL") => void;
  updateQuantity: (productId: string, size: "XS" | "S" | "M" | "L" | "XL", quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  applyGiftCard: (code: string) => void;
  removeGiftCard: (code: string) => void;
  syncWithServer: (isLoggedIn: boolean) => Promise<void>;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      appliedGiftCards: [],
      addToCart: (newItem) => {
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(
          (item) =>
            item.product._id === newItem.product._id &&
            item.selectedSize === newItem.selectedSize
        );

        let updatedItems = [...currentItems];

        if (existingItemIndex > -1) {
          updatedItems[existingItemIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push(newItem);
        }

        set({ items: updatedItems });
      },
      removeFromCart: (productId, size) => {
        const updatedItems = get().items.filter(
          (item) => !(item.product._id === productId && item.selectedSize === size)
        );
        set({ items: updatedItems });
      },
      updateQuantity: (productId, size, quantity) => {
        const updatedItems = get().items.map((item) =>
          item.product._id === productId && item.selectedSize === size
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        );
        set({ items: updatedItems });
      },
      clearCart: () => set({ items: [], coupon: null, appliedGiftCards: [] }),
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),
      applyGiftCard: (code) => {
        const currentCards = get().appliedGiftCards;
        if (!currentCards.includes(code.toUpperCase())) {
          set({ appliedGiftCards: [...currentCards, code.toUpperCase()] });
        }
      },
      removeGiftCard: (code) => {
        set({
          appliedGiftCards: get().appliedGiftCards.filter((card) => card !== code.toUpperCase()),
        });
      },
      syncWithServer: async (isLoggedIn) => {
        if (!isLoggedIn) return;
        try {
          // Push local Zustand items to database cart
          const itemsPayload = get().items.map((item) => ({
            product: item.product._id,
            selectedSize: item.selectedSize,
            quantity: item.quantity,
          }));

          const response = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: itemsPayload }),
          });

          if (!response.ok) {
            console.error("Failed to sync cart to server");
          }
        } catch (error) {
          console.error("Cart synchronization error:", error);
        }
      },
    }),
    {
      name: "ramya-cart-storage", // local storage key
    }
  )
);
