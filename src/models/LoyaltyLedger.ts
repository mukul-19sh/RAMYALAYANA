import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILoyaltyLedger extends Document {
  user: mongoose.Types.ObjectId;
  points: number; // positive or negative
  transactionType: "purchase" | "referral" | "registration" | "deduction";
  reason: string;
  orderId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LoyaltyLedgerSchema = new Schema<ILoyaltyLedger>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    points: { type: Number, required: true },
    transactionType: {
      type: String,
      enum: ["purchase", "referral", "registration", "deduction"],
      required: true,
    },
    reason: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const LoyaltyLedger: Model<ILoyaltyLedger> =
  mongoose.models.LoyaltyLedger || mongoose.model<ILoyaltyLedger>("LoyaltyLedger", LoyaltyLedgerSchema);

export default LoyaltyLedger;
