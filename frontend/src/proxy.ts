import { withAuth } from "next-auth/middleware";

// Next.js 16 renamed the `middleware.ts`/`middleware()` convention to
// `proxy.ts`/`proxy()` -- this file's name and this function's name both
// matter per the framework's migration guide.
export default withAuth(function proxy() {}, {
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/tickets/:path*", "/reports/:path*", "/admin/:path*"],
};
