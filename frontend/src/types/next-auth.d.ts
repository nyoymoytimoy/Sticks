import type { RoleCode } from "backend";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      roles: RoleCode[];
    };
  }

  interface User {
    roles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
  }
}
