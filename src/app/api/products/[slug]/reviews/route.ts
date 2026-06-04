import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import User from "@/models/User";
import { auth } from "@/auth";
import { ReviewCreateSchema } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await props.params;
    console.log("[REVIEWS API GET] Resolved slug:", slug);
    const product = await Product.findOne({ slug: slug.toLowerCase() }).select("_id");
    console.log("[REVIEWS API GET] Product found in DB:", product);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch approved reviews, populating user details (specifically isTrustedReviewer)
    const reviews = await Review.find({ product: product._id, isApproved: true })
      .populate("user", "isTrustedReviewer email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { slug } = await props.params;
    console.log("[REVIEWS API POST] Resolved slug:", slug);
    const product = await Product.findOne({ slug: slug.toLowerCase() });
    console.log("[REVIEWS API POST] Product found in DB:", product);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const parseResult = ReviewCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const dbUser = await User.findById(session.user.id);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { rating, comment } = parseResult.data;

    // Create the review. Note: All reviews require moderation initially (isApproved: false)
    const review = await Review.create({
      product: product._id,
      user: dbUser._id,
      reviewerName: dbUser.email.split("@")[0], // Default name
      rating,
      comment,
      isApproved: false,
    });

    return NextResponse.json({
      message: "Review submitted successfully and is awaiting moderation.",
      review,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit review" }, { status: 500 });
  }
}
