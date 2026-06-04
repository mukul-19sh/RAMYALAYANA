import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventoryItem {
  size: "XS" | "S" | "M" | "L" | "XL";
  quantity: number;
}

export interface IArtisanMetadata {
  weaverName: string;
  loomCoordinates: string;
  hoursToWeave: number;
  region: string;
}

export interface IProduct extends Document {
  sku: string;
  name: string;
  slug: string;
  description: {
    editorial: string;
    fit: string;
    artisanDetails: string;
  };
  price: number;
  category: "atelier" | "silhouette" | "foundations" | "archive";
  subCategory: "dresses" | "tops" | "bottoms" | "jackets" | "coords" | "occasion" | "new";
  images: {
    lookbook: string[]; // System A Editorial Campaign Images
    studioFront: string; // System B Flat Front View
    studioBack: string; // System B Flat Back View
    studioDetail: string; // System B Macro Texture View
  };
  inventory: IInventoryItem[];
  artisanMetadata: IArtisanMetadata;
  status: "Active" | "Sold Out" | "Archived";
  variantGroupId?: string;
  variantColor?: {
    name: string;
    hex: string;
  };
  variantFabric?: string;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    size: { type: String, enum: ["XS", "S", "M", "L", "XL"], required: true },
    quantity: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const ArtisanMetadataSchema = new Schema<IArtisanMetadata>(
  {
    weaverName: { type: String, required: true },
    loomCoordinates: { type: String, required: true },
    hoursToWeave: { type: Number, required: true },
    region: { type: String, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    description: {
      editorial: { type: String, required: true },
      fit: { type: String, required: true },
      artisanDetails: { type: String, required: true },
    },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ["atelier", "silhouette", "foundations", "archive"],
      required: true,
      index: true,
    },
    subCategory: {
      type: String,
      enum: ["dresses", "tops", "bottoms", "jackets", "coords", "occasion", "new"],
      required: true,
      index: true,
    },
    images: {
      lookbook: [{ type: String }],
      studioFront: { type: String, required: true },
      studioBack: { type: String, required: true },
      studioDetail: { type: String, required: true },
    },
    inventory: [InventoryItemSchema],
    artisanMetadata: { type: ArtisanMetadataSchema, required: true },
    status: {
      type: String,
      enum: ["Active", "Sold Out", "Archived"],
      default: "Active",
      index: true,
    },
    variantGroupId: { type: String, index: true },
    variantColor: {
      name: { type: String },
      hex: { type: String },
    },
    variantFabric: { type: String },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index to speed up filtering by category/subcategory and status
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ subCategory: 1, status: 1 });
ProductSchema.index({ variantGroupId: 1 });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
