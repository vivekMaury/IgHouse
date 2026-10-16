import type { NextAuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";

const facebookAppId =
  process.env.FACEBOOK_APP_ID?.trim() ||
  process.env.META_APP_ID?.trim() ||
  "";

const facebookAppSecret =
  process.env.FACEBOOK_APP_SECRET?.trim() ||
  process.env.META_APP_SECRET?.trim() ||
  "";

export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId: facebookAppId,
      clientSecret: facebookAppSecret,
      authorization: {
        url: "https://www.facebook.com/v20.0/dialog/oauth",
        params: {
          scope:
            "public_profile,email,instagram_basic,instagram_manage_messages,pages_show_list,pages_messaging",
        },
      },
      token: {
        url: "https://graph.facebook.com/v20.0/oauth/access_token",
      },
      userinfo: {
        url: "https://graph.facebook.com/v20.0/me",
        params: {
          fields: "id,name,email,picture",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      // Capture the Meta user access token from the account object on initial sign-in
      if (account) {
        token.accessToken = account.access_token;
        token.tokenType = account.token_type;
        token.expiresAt = account.expires_at;
        token.scope = account.scope;
        token.providerAccountId = account.providerAccountId;
      }

      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      // Forward the accessToken and user details from JWT token to session
      if (session) {
        session.accessToken = token.accessToken as string | undefined;
        session.tokenType = token.tokenType as string | undefined;
        session.expiresAt = token.expiresAt as number | undefined;
        session.scope = token.scope as string | undefined;

        if (session.user) {
          session.user.id = (token.sub ?? token.id ?? token.providerAccountId) as string;
        }
      }

      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
