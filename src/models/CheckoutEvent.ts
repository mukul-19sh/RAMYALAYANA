import mongoose, { Schema, Document, Model } from "mongoose";

export type CheckoutEventName =
  | "checkout_started"
  | "shipping_completed"
  | "delivery_selected"
  | "payment_selected"
  | "payment_initiated"
  | "payment_success"
  | "payment_failed"
  | "order_completed";

export type SessionSource =
  | "direct"
  | "instagram"
  | "google"
  | "facebook"
  | "referral"
  | "email"
  | "unknown";

export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export interface ICheckoutEvent extends Document {
  event: CheckoutEventName;
  step: number; // 1-8 matching event order
  sessionType: "guest" | "authenticated";
  sessionSource: SessionSource; // Traffic attribution channel
  deviceType: DeviceType; // Device category at time of event
  sessionId: string; // Anonymous UUID from localStorage for guests; userId string for authenticated
  userId?: mongoose.Types.ObjectId; // Only set for authenticated sessions
  orderValue: number; // Cart subtotal at time of event (in rupees)
  orderNumber?: string; // Set once order is created (steps 5+)
  paymentMethod?: "razorpay" | "cod"; // Set once payment method is selected (step 4+)
  completedAt: Date;
  abandonedAt?: Date; // Set by background process when session stalls for 30+ min
}

const CheckoutEventSchema = new Schema<ICheckoutEvent>(
  {
    event: {
      type: String,
      enum: [
        "checkout_started",
        "shipping_completed",
        "delivery_selected",
        "payment_selected",
        "payment_initiated",
        "payment_success",
        "payment_failed",
        "order_completed",
      ],
      required: true,
    },
    step: { type: Number, required: true, min: 1, max: 8 },
    sessionType: { type: String, enum: ["guest", "authenticated"], required: true },
    sessionSource: {
      type: String,
      enum: ["direct", "instagram", "google", "facebook", "referral", "email", "unknown"],
      required: true,
      default: "unknown",
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      required: true,
      default: "unknown",
    },
    sessionId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, sparse: true },
    orderValue: { type: Number, required: true, min: 0 },
    orderNumber: { type: String, index: true, sparse: true },
    paymentMethod: { type: String, enum: ["razorpay", "cod"] },
    completedAt: { type: Date, required: true, default: Date.now },
    abandonedAt: { type: Date },
  },
  { timestamps: false }
);

// Primary lookup indexes
CheckoutEventSchema.index({ sessionId: 1, step: 1 });
CheckoutEventSchema.index({ sessionId: 1, completedAt: -1 });
CheckoutEventSchema.index({ event: 1, completedAt: -1 });
CheckoutEventSchema.index({ sessionType: 1, event: 1, completedAt: -1 });

// Channel attribution analytics
CheckoutEventSchema.index({ sessionSource: 1, event: 1, completedAt: -1 });
CheckoutEventSchema.index({ sessionSource: 1, sessionType: 1, completedAt: -1 });

// Abandonment detection + retention TTL: raw events purged after 180 days.
// Before purge, a scheduled aggregation job must have run to roll up data into FunnelSummary.
CheckoutEventSchema.index(
  { completedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 180 } // TTL: 180 days
);

const CheckoutEvent: Model<ICheckoutEvent> =
  mongoose.models.CheckoutEvent ||
  mongoose.model<ICheckoutEvent>("CheckoutEvent", CheckoutEventSchema);

export default CheckoutEvent;
