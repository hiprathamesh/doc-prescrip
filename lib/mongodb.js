import { MongoClient } from 'mongodb';

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  throw new Error('This module should only be used on the server side');
}

// Get MongoDB URI from environment variables
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'doc_prescrip';

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global variable to store the MongoDB client connection
let client;
let clientPromise;

// In development, use a global variable to preserve the connection across module reloads
// This prevents connection issues during development
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client instance
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

/**
 * Get MongoDB database instance
 * @returns {Promise<Db>} MongoDB database instance
 */
export async function getDatabase() {
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Get a specific collection from the database
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Collection>} MongoDB collection instance
 */
export async function getCollection(collectionName) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

// Export the client promise for other uses
export default clientPromise;