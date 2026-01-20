import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Lazy initialization to avoid build-time errors
let _db: ReturnType<typeof drizzle> | null = null

function getDb() {
  if (_db) return _db
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    // During build, return a mock that will fail at runtime if used
    // This allows the build to complete
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      console.warn('DATABASE_URL not set - database operations will fail')
    }
    // Return a proxy that throws on use
    return new Proxy({} as any, {
      get: () => {
        throw new Error('DATABASE_URL environment variable is not set')
      }
    })
  }
  
  const sql = neon(databaseUrl)
  _db = drizzle(sql, { schema })
  return _db
}

export const db = getDb()
