import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

/**
 * Get MongoDB database instance
 * @returns {Promise<Db>} MongoDB database instance
 */
export async function getDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'doc-prescrip');

    // Test the connection
    await db.admin().ping();

    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

/**
 * Get a specific collection from the database
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Collection>} MongoDB collection instance
 */
export async function getCollection(collectionName) {
  try {
    const db = await getDatabase();
    return db.collection(collectionName);
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    throw new Error(`Failed to get collection ${collectionName}: ${error.message}`);
  }
}