import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    // Google OAuth (configure in .env.local)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    
    // Microsoft OAuth (configure in .env.local)
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      issuer: 'https://login.microsoftonline.com/common/v2.0', // Allow any Microsoft account
    }),
    
    // Credentials for demo/development
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // For demo purposes - in production, validate against database
        if (
          credentials?.email === 'demo@recepcionista.com' &&
          credentials?.password === 'demo123'
        ) {
          return {
            id: 'demo-user-1',
            email: 'demo@recepcionista.com',
            name: 'María García',
            image: null,
          }
        }
        
        // In production, check against your database:
        // const user = await db.query.users.findFirst({
        //   where: eq(users.email, credentials.email)
        // })
        // if (user && await bcrypt.compare(credentials.password, user.passwordHash)) {
        //   return user
        // }
        
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
