import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Note: DrizzleAdapter removed to support Edge middleware
  // JWT sessions work without a database adapter
  // We handle user creation manually in the signIn callback
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
        
        return null
      },
    }),
  ],
  callbacks: {
    // Create user in database on first sign-in
    async signIn({ user, account }) {
      if (!user.email) return false
      
      try {
        // Check if user already exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1)
        
        if (!existingUser) {
          // Create new user
          const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`
          await db.insert(users).values({
            id: userId,
            email: user.email,
            name: user.name || null,
            image: user.image || null,
          })
          console.log(`✅ Created new user: ${user.email} (${userId})`)
          
          // Store the generated ID for the JWT callback
          user.id = userId
        } else {
          // Update existing user's name/image if changed
          if (user.name !== existingUser.name || user.image !== existingUser.image) {
            await db.update(users)
              .set({ 
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                updatedAt: new Date()
              })
              .where(eq(users.id, existingUser.id))
          }
          
          // Use existing user's ID
          user.id = existingUser.id
          console.log(`✅ Existing user signed in: ${user.email} (${existingUser.id})`)
        }
        
        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        // Allow sign-in even if DB fails (user will be created later)
        return true
      }
    },
    
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.email = user.email
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
