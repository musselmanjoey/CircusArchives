import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';

// Create a dedicated prisma instance for auth to avoid module resolution issues
const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Name Login',
      credentials: {
        firstName: { label: 'First Name', type: 'text', placeholder: 'John' },
        lastName: { label: 'Last Name', type: 'text', placeholder: 'Doe' },
      },
      async authorize(credentials) {
        if (!credentials?.firstName || !credentials?.lastName) {
          return null;
        }

        const firstName = credentials.firstName as string;
        const lastName = credentials.lastName as string;

        try {
          // Find or create user by name
          let user = await prisma.user.findFirst({
            where: {
              firstName: firstName,
              lastName: lastName,
            },
          });

          if (!user) {
            // Create new user
            user = await prisma.user.create({
              data: {
                firstName,
                lastName,
              },
            });
          }

          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
    // Facebook provider ready for future use:
    // Facebook({
    //   clientId: process.env.FACEBOOK_CLIENT_ID,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    // }),
  ],
  session: {
    strategy: 'jwt', // Use JWT for credentials provider
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
