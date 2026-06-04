import mongoose, { Schema, Document, Model } from "mongoose";
import { IShippingAddress } from "./User";

export interface IOrderItem {
  product: mongoose.Types.ObjectId; // References Product
  selectedSize: "XS" | "S" | "M" | "L" | "XL";
  quantity: number;
  priceAtPurchase: number;
}

export interface IPaymentDetails {
  razorpayOrderId?: string; // Optional: COD orders don't create a Razorpay order
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: "pending" | "paid" | "failed" | "cod_pending";
  paidAt?: Date;
}

export interface IShippingDetails {
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  user?: mongoose.Types.ObjectId; // Optional: guest checkout
  contactEmail: string; // Required for both guest and authenticated checkouts
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: "razorpay" | "cod";
  paymentDetails: IPaymentDetails;
  codStatus?: "pending_delivery" | "collected" | "refused"; // Only for COD orders
  deliveryMethod: "standard" | "express";
  orderStatus: "received" | "processing" | "shipped" | "delivered" | "returned" | "cancelled";
  shippingDetails: IShippingDetails;
  totalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  grandTotal: number;
  appliedCoupon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    selectedSize: { type: String, enum: ["XS", "S", "M", "L", "XL"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PaymentDetailsSchema = new Schema<IPaymentDetails>(
  {
    razorpayOrderId: { type: String, index: true, sparse: true }, // Optional for COD
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cod_pending"],
      default: "pending",
      required: true,
    },
    paidAt: { type: Date },
  },
  { _id: false }
);

const ShippingDetailsSchema = new Schema<IShippingDetails>(
  {
    carrier: { type: String },
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true, sparse: true }, // Optional for guest checkout
    contactEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    items: [OrderItemSchema],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      required: true,
    },
    paymentDetails: { type: PaymentDetailsSchema, required: true },
    codStatus: {
      type: String,
      enum: ["pending_delivery", "collected", "refused"],
    },
    deliveryMethod: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },
    orderStatus: {
      type: String,
      enum: ["received", "processing", "shipped", "delivered", "returned", "cancelled"],
      default: "received",
      index: true,
    },
    shippingDetails: { type: ShippingDetailsSchema, default: () => ({}) },
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, required: true, default: 0 },
    shippingAmount: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true },
    appliedCoupon: { type: String },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ contactEmail: 1, createdAt: -1 });
OrderSchema.index({ paymentMethod: 1, orderStatus: 1 });
OrderSchema.index({ user: 1, paymentMethod: 1, codStatus: 1 }); // For refused COD history check

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
