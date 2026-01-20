import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Lazy initialization to avoid build-time errors
let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (_db) return _db
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  const sql = neon(databaseUrl)
  _db = drizzle(sql, { schema })
  return _db
}

// Proxy that lazily initializes the database on first use
// This prevents the build from hanging
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const instance = getDb()
    return (instance as any)[prop]
  }
})
