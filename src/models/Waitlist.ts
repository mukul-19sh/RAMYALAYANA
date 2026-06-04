import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWaitlist extends Document {
  email: string;
  user?: mongoose.Types.ObjectId;
  waitlistType: "product" | "collection" | "limited-edition";
  product?: mongoose.Types.ObjectId; // populated if waitlistType is product or limited-edition
  selectedSize?: "XS" | "S" | "M" | "L" | "XL"; // optional, size preference for product waitlists
  collectionSlug?: string; // populated if waitlistType is collection
  limitedEditionName?: string; // populated if waitlistType is limited-edition
  notified: boolean;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistSchema = new Schema<IWaitlist>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    waitlistType: {
      type: String,
      enum: ["product", "collection", "limited-edition"],
      required: true,
      index: true,
    },
    product: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    selectedSize: { type: String, enum: ["XS", "S", "M", "L", "XL"] },
    collectionSlug: { type: String, index: true },
    limitedEditionName: { type: String, index: true },
    notified: { type: Boolean, default: false, index: true },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for querying specific waitlists
WaitlistSchema.index({ waitlistType: 1, product: 1, notified: 1 });
WaitlistSchema.index({ waitlistType: 1, collectionSlug: 1, notified: 1 });

const Waitlist: Model<IWaitlist> = mongoose.models.Waitlist || mongoose.model<IWaitlist>("Waitlist", WaitlistSchema);

export default Waitlist;
