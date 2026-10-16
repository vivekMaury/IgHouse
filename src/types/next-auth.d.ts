import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    tokenType?: string;
    expiresAt?: number;
    scope?: string;
    user?: {
      id?: string;
    } & DefaultSession["user"];
  }

  interface Account {
    access_token?: string;
    token_type?: string;
    expires_at?: number;
    scope?: string;
    providerAccountId?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    accessToken?: string;
    tokenType?: string;
    expiresAt?: number;
    scope?: string;
    providerAccountId?: string;
  }
}
