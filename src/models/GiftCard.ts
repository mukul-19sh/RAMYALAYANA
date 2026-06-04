import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGiftCard extends Document {
  codeHash: string; // SHA-256 hash of redemption code
  codeMask: string; // e.g. ****-****-1234
  initialValue: number;
  currentValue: number;
  expiryDate: Date;
  isActive: boolean;
  recipientEmail?: string;
  senderName?: string;
  message?: string;
  purchasedBy?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  sent90DayReminder: boolean;
  sent30DayReminder: boolean;
  sent7DayReminder: boolean;
  extendedByAdmin: boolean;
  extendedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GiftCardSchema = new Schema<IGiftCard>(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    codeMask: { type: String, required: true },
    initialValue: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, required: true, min: 0 },
    expiryDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 365 days
    },
    isActive: { type: Boolean, default: true, index: true },
    recipientEmail: { type: String, trim: true, lowercase: true },
    senderName: { type: String },
    message: { type: String },
    purchasedBy: { type: Schema.Types.ObjectId, ref: "User" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    sent90DayReminder: { type: Boolean, default: false },
    sent30DayReminder: { type: Boolean, default: false },
    sent7DayReminder: { type: Boolean, default: false },
    extendedByAdmin: { type: Boolean, default: false },
    extendedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for finding expiring active gift cards
GiftCardSchema.index({ isActive: 1, expiryDate: 1 });

const GiftCard: Model<IGiftCard> = mongoose.models.GiftCard || mongoose.model<IGiftCard>("GiftCard", GiftCardSchema);

export default GiftCard;
