import { MongoClient } from "mongodb";

let dbPromise;

async function connect() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("booknook");
    await db.collection("borrows").createIndex({ bookId: 1, userEmail: 1 }, { unique: true });
  return db;
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = connect().catch((err) => {
      dbPromise = undefined;
      throw err;
    });
  }
  return dbPromise;
}
