import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBackInStockSubscription extends Document {
  product: mongoose.Types.ObjectId;
  size: "XS" | "S" | "M" | "L" | "XL";
  email: string;
  user?: mongoose.Types.ObjectId;
  isNotified: boolean;
  notifiedAt?: Date;
  createdAt: Date;
}

const BackInStockSubscriptionSchema = new Schema<IBackInStockSubscription>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    size: { type: String, enum: ["XS", "S", "M", "L", "XL"], required: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    isNotified: { type: Boolean, default: false, index: true },
    notifiedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Compound index for querying active subscriptions
BackInStockSubscriptionSchema.index({ product: 1, size: 1, isNotified: 1 });

const BackInStockSubscription: Model<IBackInStockSubscription> =
  mongoose.models.BackInStockSubscription ||
  mongoose.model<IBackInStockSubscription>("BackInStockSubscription", BackInStockSubscriptionSchema);

export default BackInStockSubscription;
