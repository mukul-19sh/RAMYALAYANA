import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const subCategory = searchParams.get("subCategory");
    const status = searchParams.get("status"); // "Active", "Sold Out", "Archived"
    const variantGroupId = searchParams.get("variantGroupId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (category) {
      query.category = category;
    }
    if (subCategory) {
      query.subCategory = subCategory;
    }
    if (variantGroupId) {
      query.variantGroupId = variantGroupId;
    }

    // Default: Return Active and Sold Out. Allow explicit request for Archived.
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ["Active", "Sold Out"] };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 });
  }
}
