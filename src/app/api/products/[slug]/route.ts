import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await props.params;

    const product = await Product.findOne({ slug: slug.toLowerCase() });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Retrieve sibling variants (other colors/fabrics of the same base design)
    let siblings: any[] = [];
    if (product.variantGroupId) {
      siblings = await Product.find({
        variantGroupId: product.variantGroupId,
        _id: { $ne: product._id },
        status: { $ne: "Archived" }, // exclude archived siblings from active variants selector
      }).select("slug variantColor variantFabric status");
    }

    return NextResponse.json({
      product,
      siblings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch product details" }, { status: 500 });
  }
}
