import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInstagramPost extends Document {
  mediaId: string; // Unique ID from Instagram or custom unique ID
  mediaUrl: string;
  permalink?: string;
  caption?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  taggedProducts: mongoose.Types.ObjectId[]; // Allows linking to Product models for shop-the-look hotspot overlays
  isVisible: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InstagramPostSchema = new Schema<IInstagramPost>(
  {
    mediaId: { type: String, required: true, unique: true, index: true },
    mediaUrl: { type: String, required: true },
    permalink: { type: String },
    caption: { type: String },
    mediaType: {
      type: String,
      enum: ["IMAGE", "VIDEO", "CAROUSEL_ALBUM"],
      default: "IMAGE",
    },
    taggedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isVisible: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const InstagramFeed: Model<IInstagramPost> =
  mongoose.models.InstagramPost || mongoose.model<IInstagramPost>("InstagramPost", InstagramPostSchema);

export default InstagramFeed;
