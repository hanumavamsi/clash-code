import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "MOCK_GOOGLE_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "MOCK_GOOGLE_SECRET",
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "MOCK_GITHUB_ID",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "MOCK_GITHUB_SECRET",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Guest Login",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Coder123" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username) return null;
        
        let user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });
        
        if (!user) {
          user = await prisma.user.create({
            data: { username: credentials.username, name: credentials.username }
          });
        }
        
        return user;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.eloRating = (user as any).eloRating;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
        // Fetch fresh ELO from DB
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { eloRating: true }
        });
        (session.user as any).eloRating = freshUser?.eloRating ?? 1200;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "my_super_secret_for_local_testing",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
