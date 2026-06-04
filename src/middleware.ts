import { auth } from "@/auth";

export default auth((req: any) => {
  const reqUrl = new URL(req.url);
  const isApiAdmin = reqUrl.pathname.startsWith("/api/admin");
  const isAdminPage = reqUrl.pathname.startsWith("/admin");

  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";

  if (isApiAdmin || isAdminPage) {
    if (!isLoggedIn) {
      if (isApiAdmin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Redirect page requests to login
      return Response.redirect(new URL("/auth/login", req.url));
    }
    if (!isAdmin) {
      if (isApiAdmin) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      // Redirect regular users requesting admin pages to home
      return Response.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
