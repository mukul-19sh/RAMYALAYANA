import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import User from "@/models/User";
import { auth } from "@/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { reviewId, action } = await request.json(); // action = "approve" | "reject"

    if (!reviewId || !/^[0-9a-fA-F]{24}$/.test(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (action === "approve") {
      review.isApproved = true;
      await review.save();

      // Recalculate average rating cache in Product document
      const approvedReviews = await Review.find({ product: review.product, isApproved: true });
      const totalReviews = approvedReviews.length;
      const averageRating = totalReviews > 0
        ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      await Product.findByIdAndUpdate(review.product, {
        averageRating,
        totalReviews,
      });

      // Check if reviewer now qualifies for Trusted Reviewer status (e.g. >= 3 approved reviews)
      const reviewerId = review.user;
      const userApprovedCount = await Review.countDocuments({ user: reviewerId, isApproved: true });

      if (userApprovedCount >= 3) {
        await User.findByIdAndUpdate(reviewerId, { isTrustedReviewer: true });
      }

      return NextResponse.json({ message: "Review approved, average ratings updated.", review });
    } else if (action === "reject") {
      // If we reject, we can delete it or just keep it unapproved
      await Review.findByIdAndDelete(reviewId);
      return NextResponse.json({ message: "Review rejected and deleted." });
    }

    return NextResponse.json({ error: "Invalid moderation action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Review moderation failed" }, { status: 500 });
  }
}
