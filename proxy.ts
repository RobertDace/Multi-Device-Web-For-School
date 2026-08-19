import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rute publik yang boleh diakses tanpa login Clerk
const isPublicRoute = createRouteMatcher([
  "/",
  "/aktivitas(.*)",
  "/kalender(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/aktivitas(.*)",
  "/api/rapor/check(.*)",
  "/api/webhook(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};