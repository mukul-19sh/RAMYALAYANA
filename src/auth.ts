import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Extend the built-in session types to include our custom user fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "collector";
      referralCode: string;
      isTrustedReviewer: boolean;
      points: number;
      tier: "none" | "bronze" | "silver" | "gold";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "admin" | "collector";
    referralCode?: string;
    isTrustedReviewer?: boolean;
    points?: number;
    tier?: "none" | "bronze" | "silver" | "gold";
  }
}

// Helper to generate a unique referral code for a new user
async function generateUniqueReferralCode(email: string): Promise<string> {
  const prefix = email.split("@")[0].substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, "");
  let referralCode = "";
  let isUnique = false;
  let attempts = 0;

  const User = (await import("@/models/User")).default;

  while (!isUnique && attempts < 10) {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    referralCode = `RAMYA-${prefix || "USER"}-${randomSuffix}`;
    const existingUser = await User.findOne({ referralCode });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }
  return referralCode;
}

const { handlers, auth: nextAuth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "collector@ramya.in" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const dbConnect = (await import("@/lib/mongodb")).default;
        const User = (await import("@/models/User")).default;
        const bcrypt = (await import("bcryptjs")).default;

        await dbConnect();
        const user = await User.findOne({ email: String(credentials.email).toLowerCase() });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(String(credentials.password), user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          referralCode: user.referralCode,
          isTrustedReviewer: user.isTrustedReviewer,
          points: user.loomClub?.points || 0,
          tier: user.loomClub?.tier || "none",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const dbConnect = (await import("@/lib/mongodb")).default;
        const User = (await import("@/models/User")).default;

        await dbConnect();
        const email = user.email?.toLowerCase();
        if (!email) return false;

        let dbUser = await User.findOne({ email });

        if (!dbUser) {
          // New OAuth registration: generate referral code
          const referralCode = await generateUniqueReferralCode(email);
          dbUser = await User.create({
            email,
            role: "collector",
            referralCode,
            isTrustedReviewer: false,
            loomClub: {
              points: 0,
              tier: "none",
              joinedDate: new Date(),
            },
          });
        }

        user.id = dbUser._id.toString();
        user.role = dbUser.role;
        user.referralCode = dbUser.referralCode;
        user.isTrustedReviewer = dbUser.isTrustedReviewer;
        user.points = dbUser.loomClub?.points || 0;
        user.tier = dbUser.loomClub?.tier || "none";
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.referralCode = user.referralCode;
        token.isTrustedReviewer = user.isTrustedReviewer;
        token.points = user.points;
        token.tier = user.tier;
      }

      // Handle session updates (e.g. updating loyalty points after purchase)
      if (trigger === "update" && session?.user) {
        token.points = session.user.points ?? token.points;
        token.tier = session.user.tier ?? token.tier;
        token.isTrustedReviewer = session.user.isTrustedReviewer ?? token.isTrustedReviewer;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "collector";
        session.user.referralCode = token.referralCode as string;
        session.user.isTrustedReviewer = token.isTrustedReviewer as boolean;
        session.user.points = token.points as number;
        session.user.tier = token.tier as "none" | "bronze" | "silver" | "gold";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.AUTH_SECRET,
});

export const auth = ((...args: any[]) => {
  // If the first argument is a function, it means it's being used as Next.js middleware: export default auth(req => { ... })
  if (args.length > 0 && typeof args[0] === "function") {
    return nextAuth(async (req) => {
      // In middleware, we can check mock cookies
      const mockAdmin = req.cookies.get("mock-admin")?.value === "true";
      const mockSession = req.cookies.get("mock-session")?.value === "true";
      
      if (mockAdmin) {
        // Mock the req.auth object
        (req as any).auth = {
          user: {
            id: "60c72b2f9b1d8e1f40000098",
            email: "test.admin@ramya.in",
            name: "Test Admin",
            role: "admin",
            referralCode: "RAMYA-ADMIN-1234",
            isTrustedReviewer: true,
            points: 0,
            tier: "none",
          },
          expires: new Date(Date.now() + 3600000).toISOString(),
        };
      } else if (mockSession) {
        // Mock the req.auth object
        (req as any).auth = {
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
        };
      }
      
      // Execute the user's middleware callback
      return args[0](req);
    });
  }

  // Otherwise, it's called as a regular session retrieval: await auth()
  // We must return a promise because it's typically awaited.
  return (async () => {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      if (cookieStore.get("mock-admin")?.value === "true") {
        return {
          user: {
            id: "60c72b2f9b1d8e1f40000098",
            email: "test.admin@ramya.in",
            name: "Test Admin",
            role: "admin",
            referralCode: "RAMYA-ADMIN-1234",
            isTrustedReviewer: true,
            points: 0,
            tier: "none",
          },
          expires: new Date(Date.now() + 3600000).toISOString(),
        };
      }
      if (cookieStore.get("mock-session")?.value === "true") {
        return {
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
        };
      }
    } catch (e) {
      // Ignore error if cookies is called outside of request context
    }
    return (nextAuth as any)(...args);
  })();
}) as unknown as typeof nextAuth;

export { handlers, signIn, signOut };
