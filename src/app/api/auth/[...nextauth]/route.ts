import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const originalGET = handlers.GET;

export async function GET(request: NextRequest, context: any) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/api/auth/session")) {
    const isDev = process.env.NODE_ENV !== "production";
    const hasMockCookie = isDev && request.cookies.get("mock-session")?.value === "true";
    if (hasMockCookie) {
      return NextResponse.json({
        user: {
          id: "60c72b2f9b1d8e1f40000099",
          email: "test.collector@ramya.in",
          name: "Test Collector",
          role: "collector",
          referralCode: "RAMYA-TEST-1234",
          isTrustedReviewer: false,
          points: 0,
          tier: "none",
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });
    }
  }

  // NextAuth v5 handlers expect Request, but Next.js passes NextRequest.
  // We can just cast or call it directly.
  return originalGET(request);
}

export const POST = handlers.POST;
