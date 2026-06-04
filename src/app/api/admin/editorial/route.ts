import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstagramFeed from "@/models/InstagramFeed";
import Lookbook from "@/models/Lookbook";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    const { type } = body; // "instagram" | "lookbook"

    if (type === "instagram") {
      const { mediaId, mediaUrl, permalink, caption, mediaType, taggedProducts, publishedAt } = body;
      if (!mediaId || !mediaUrl) {
        return NextResponse.json({ error: "Media ID and Media URL are required" }, { status: 400 });
      }

      const post = await InstagramFeed.create({
        mediaId,
        mediaUrl,
        permalink,
        caption,
        mediaType: mediaType || "IMAGE",
        taggedProducts: taggedProducts || [],
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        isVisible: true,
      });

      return NextResponse.json({ message: "Instagram editorial post indexed successfully", post });
    } else if (type === "lookbook") {
      const { slug, title, description, coverImage, slides } = body;
      if (!slug || !title || !coverImage || !slides) {
        return NextResponse.json({ error: "Missing required lookbook fields" }, { status: 400 });
      }

      const lookbook = await Lookbook.create({
        slug: slug.toLowerCase(),
        title,
        description,
        coverImage,
        slides,
        isActive: true,
      });

      return NextResponse.json({ message: "Lookbook created successfully", lookbook });
    }

    return NextResponse.json({ error: "Invalid editorial type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create editorial entry" }, { status: 500 });
  }
}
