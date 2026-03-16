/**
 * Migration: Add database indexes
 * 
 * This migration adds indexes to frequently queried fields:
 * - Post model: category, user, publicationStatus, tags
 * - User model: email, username, role
 * 
 * Run this migration after deploying schema changes with indexes.
 */

import mongoose from 'mongoose';

export async function up(): Promise<void> {
  const db = mongoose.connection.db;
  
  if (!db) {
    throw new Error('Database connection not available');
  }

  try {
    // Post model indexes
    const postsCollection = db.collection('posts');
    
    // These indexes are already defined in the schema, but this migration
    // ensures they exist in the database
    await postsCollection.createIndex({ category: 1, publicationStatus: 1, createdAt: -1 });
    await postsCollection.createIndex({ user: 1, publicationStatus: 1 });
    await postsCollection.createIndex({ tags: 1, publicationStatus: 1 });
    await postsCollection.createIndex({ publicationStatus: 1, createdAt: -1 });
    
    console.log('✓ Post indexes created');

    // User model indexes
    const usersCollection = db.collection('users');
    
    // These indexes are already defined in the schema
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ role: 1 });
    
    console.log('✓ User indexes created');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down(): Promise<void> {
  const db = mongoose.connection.db;
  
  if (!db) {
    throw new Error('Database connection not available');
  }

  try {
    const postsCollection = db.collection('posts');
    const usersCollection = db.collection('users');

    // Drop compound indexes
    await postsCollection.dropIndex('category_1_publicationStatus_1_createdAt_-1');
    await postsCollection.dropIndex('user_1_publicationStatus_1');
    await postsCollection.dropIndex('tags_1_publicationStatus_1');
    await postsCollection.dropIndex('publicationStatus_1_createdAt_-1');
    
    // Note: Unique indexes on email and username should not be dropped
    // as they are required for data integrity
    
    console.log('✓ Indexes dropped');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}
