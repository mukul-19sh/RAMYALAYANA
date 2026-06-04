"use client";

import React from "react";
import { EditorialLayout } from "./EditorialLayout";

export interface ProductLayoutProps {
  galleryNode: React.ReactNode; // Left side visual photos
  detailsNode: React.ReactNode; // Right side options actions
}

export const ProductLayout: React.FC<ProductLayoutProps> = ({ galleryNode, detailsNode }) => {
  return (
    <EditorialLayout width="wide">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4 select-none font-sans">
        
        {/* Left Side: Editorial & Studio Image Gallery Scroll segment */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {galleryNode}
        </div>

        {/* Right Side: Sticky Checkout / Description panel */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28 self-start flex flex-col gap-6">
            {detailsNode}
          </div>
        </div>
      </div>
    </EditorialLayout>
  );
};
export default ProductLayout;
