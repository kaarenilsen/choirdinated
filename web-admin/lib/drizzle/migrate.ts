import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL!
  
  // Create a connection specifically for migrations with a small pool
  const migrationClient = postgres(connectionString, { 
    max: 1, // Use only 1 connection for migrations
    prepare: false 
  })
  
  const db = drizzle(migrationClient)

  
  try {
    await migrate(db, { migrationsFolder: './drizzle/migrations' })
  } catch (error) {
    process.exit(1)
  } finally {
    await migrationClient.end()
  }
}

runMigrations()