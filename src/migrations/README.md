# Database Migrations

This directory contains database migration scripts for managing schema changes.

## Migration System Setup

This project uses a manual migration system. For production use, consider integrating a migration tool like:
- [migrate-mongo](https://www.npmjs.com/package/migrate-mongo)
- [node-migrate](https://github.com/tj/node-migrate)
- [db-migrate](https://www.npmjs.com/package/db-migrate)

## Current Migration Status

Migrations should be run manually or through a migration runner script.

## Creating a Migration

1. Create a new migration file in this directory with a timestamp prefix:
   ```
   YYYYMMDDHHMMSS-migration-name.ts
   ```

2. Export a migration function that performs the schema change:
   ```typescript
   import mongoose from 'mongoose';

   export async function up(): Promise<void> {
     // Apply migration
     await mongoose.connection.db.collection('posts').createIndex({ slug: 1 });
   }

   export async function down(): Promise<void> {
     // Rollback migration
     await mongoose.connection.db.collection('posts').dropIndex('slug_1');
   }
   ```

3. Document the migration in this README

## Running Migrations

Migrations should be run before deploying to production. Consider creating a migration runner script or using a migration tool.
