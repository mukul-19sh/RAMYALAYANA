import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstagramFeed from "@/models/InstagramFeed";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const posts = await InstagramFeed.find({ isVisible: true })
      .populate({
        path: "taggedProducts",
        select: "name price slug images status",
      })
      .sort({ publishedAt: -1 });

    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch editorial content" }, { status: 500 });
  }
}
