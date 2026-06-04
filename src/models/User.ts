import mongoose, { Schema, Document, Model } from "mongoose";

export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface ILoomClub {
  points: number;
  tier: "none" | "bronze" | "silver" | "gold";
  joinedDate: Date;
}

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  role: "admin" | "collector";
  shippingAddress?: IShippingAddress;
  loomClub: ILoomClub;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  isTrustedReviewer: boolean;
  refusedCodCount: number; // Incremented by admin when a COD delivery is refused
  createdAt: Date;
  updatedAt: Date;
}

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

const LoomClubSchema = new Schema<ILoomClub>(
  {
    points: { type: Number, default: 0 },
    tier: { type: String, enum: ["none", "bronze", "silver", "gold"], default: "none" },
    joinedDate: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String },
    role: { type: String, enum: ["admin", "collector"], default: "collector" },
    shippingAddress: { type: ShippingAddressSchema },
    loomClub: { type: LoomClubSchema, default: () => ({}) },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    isTrustedReviewer: {
      type: Boolean,
      default: false,
    },
    refusedCodCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
