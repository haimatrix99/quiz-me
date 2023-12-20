import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
  publicRoutes: [
    "/",
    "/pricing",
    "/api/uploadthing",
    "/api/webhook/stripe",
    "/auth-callback",
    "/sign-in",
    "/sign-up",
  ],
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    "/pricing",
    "/auth-callback",
    "/api/uploadthing",
    "/api/webhook/stripe",
    "/sign-in",
    "/sign-up",
  ],
};
