import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lookbook from "@/models/Lookbook";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = request.nextUrl;
    const slug = searchParams.get("slug");

    if (slug) {
      const lookbook = await Lookbook.findOne({ slug: slug.toLowerCase(), isActive: true }).populate({
        path: "slides.taggedProducts",
        select: "name price slug images status",
      });

      if (!lookbook) {
        return NextResponse.json({ error: "Lookbook not found" }, { status: 404 });
      }

      return NextResponse.json({ lookbook });
    }

    const lookbooks = await Lookbook.find({ isActive: true })
      .select("title slug description coverImage createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({ lookbooks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch lookbooks" }, { status: 500 });
  }
}
