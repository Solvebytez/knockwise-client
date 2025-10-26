import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Throttle middleware calls to prevent excessive refresh requests
const lastRefreshTime = new Map<string, number>();
const REFRESH_THROTTLE_MS = 5000; // 5 seconds

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const accessToken = request.cookies.get("accessToken")?.value;

  console.log("🔍 Middleware Debug:");
  console.log("  pathname:", pathname);
  console.log("  accessToken:", accessToken ? "✅ Present" : "❌ Missing");
  console.log("  refreshToken:", refreshToken ? "✅ Present" : "❌ Missing");

  // Define protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/territory-map",
    "/routes",
    "/route-planner",
    "/create-team",
    "/create-and-assign-zone",
    "/territory-management",
    "/agent",
    "/knockmap",
    "/my-territories",
    "/street",
    "/knockform",
  ];
  const authRoutes = ["/login", "/select-user-type", "/forgot-password"];

  // 1. Handle protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    console.log("🛡️ Protected route detected, checking authentication...");

    if (!refreshToken) {
      console.log("❌ No refresh token found, redirecting to login");
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      response.headers.set("x-clear-auth", "true");
      return response;
    }

    try {
      // Throttle refresh calls to prevent excessive requests
      const now = Date.now();
      const lastRefresh = lastRefreshTime.get(refreshToken) || 0;

      if (now - lastRefresh < REFRESH_THROTTLE_MS) {
        console.log("⏱️ Refresh throttled, skipping...");
        return NextResponse.next();
      }

      lastRefreshTime.set(refreshToken, now);
      console.log("🔄 Attempting to refresh token and get user info...");

      // Refresh the token and get user info in one call
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://knockwise-backend.onrender.com/api";
      const refreshResponse = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refreshToken=${refreshToken}`,
        },
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        console.log("❌ Token refresh failed:", refreshResponse.status);
        throw new Error("Token refresh failed");
      }

      console.log("✅ Token refresh successful");

      // Get user data from refresh response
      const refreshData = await refreshResponse.json();
      const userRole = refreshData.data?.user?.role;
      const userName = refreshData.data?.user?.name;

      console.log("👤 User role from refresh:", userRole);
      console.log("👤 User name from refresh:", userName);
      console.log("📍 Requested path:", pathname);

      // Check if we have valid user data
      if (userRole && userName) {
        // Check route permissions based on user role
        if (userRole === "AGENT") {
          // Agent can only access agent routes
          const agentRoutes = [
            "/agent",
            "/knockmap",
            "/my-territories",
            "/create-my-zone",
            "/my-territory", // Allow agents to edit their own territories
            "/route-planner",
            "/street",
            "/knockform",
          ];
          if (!agentRoutes.some((route) => pathname.startsWith(route))) {
            console.log(`🚫 Access denied: AGENT cannot access ${pathname}`);
            return NextResponse.redirect(new URL("/agent", request.url));
          }
          console.log("✅ AGENT access granted");
        } else if (userRole === "SUPERADMIN" || userRole === "SUBADMIN") {
          // Admin can only access admin routes
          const adminRoutes = [
            "/dashboard",
            "/territory-map",
            "/routes",
            "/create-team",
            "/create-and-assign-zone",
            "/territory-management",
          ];
          if (!adminRoutes.some((route) => pathname.startsWith(route))) {
            console.log(
              `🚫 Access denied: ${userRole} cannot access ${pathname}`
            );
            return NextResponse.redirect(new URL("/dashboard", request.url));
          }
          console.log("✅ ADMIN access granted");
        }
      } else {
        console.log(
          "❌ Invalid user data in refresh response - missing role or name"
        );
        throw new Error("Invalid user data");
      }

      return NextResponse.next();
    } catch (error) {
      console.error("💥 Middleware error:", error);
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("refreshToken");
      response.cookies.delete("accessToken");
      response.headers.set("x-clear-auth", "true");
      return response;
    }
  }

  // 2. Handle auth routes (redirect if already logged in)
  if (authRoutes.includes(pathname) && refreshToken) {
    console.log(
      "🔐 Auth route with refresh token, checking if user is logged in..."
    );
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://knockwise-backend.onrender.com/api";
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refreshToken=${refreshToken}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        // Get user role from refresh response
        const refreshData = await response.json();
        const userRole = refreshData.data?.user?.role;

        console.log("✅ Valid refresh token, user role:", userRole);

        if (userRole) {
          // Redirect based on user role
          if (userRole === "AGENT") {
            console.log("🔄 Redirecting AGENT to /agent");
            return NextResponse.redirect(new URL("/agent", request.url));
          } else {
            console.log("🔄 Redirecting ADMIN to /dashboard");
            return NextResponse.redirect(new URL("/dashboard", request.url));
          }
        }
      } else {
        console.log("❌ Refresh token invalid, staying on auth page");
      }
    } catch (error) {
      const response = NextResponse.next();
      response.cookies.delete("refreshToken");
      response.cookies.delete("accessToken");
      response.headers.set("x-clear-auth", "true");
      return response;
    }
  }

  return NextResponse.next();
}
