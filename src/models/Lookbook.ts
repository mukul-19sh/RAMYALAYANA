import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILookbookSlide {
  imageUrl: string;
  caption?: string;
  taggedProducts: mongoose.Types.ObjectId[];
}

export interface ILookbook extends Document {
  slug: string; // unique URL identifier
  title: string;
  description?: string;
  coverImage: string;
  slides: ILookbookSlide[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LookbookSlideSchema = new Schema<ILookbookSlide>(
  {
    imageUrl: { type: String, required: true },
    caption: { type: String },
    taggedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { _id: false }
);

const LookbookSchema = new Schema<ILookbook>(
  {
    slug: { type: String, required: true, unique: true, index: true, lowercase: true },
    title: { type: String, required: true },
    description: { type: String },
    coverImage: { type: String, required: true },
    slides: [LookbookSlideSchema],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const Lookbook: Model<ILookbook> = mongoose.models.Lookbook || mongoose.model<ILookbook>("Lookbook", LookbookSchema);

export default Lookbook;
