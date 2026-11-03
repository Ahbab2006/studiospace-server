const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

let db;

const connectDB = async () => {
  try {
    await client.connect();

    db = client.db("studioSpaceDB");

    console.log("MongoDB connected successfully!");

    return db;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database is not connected yet!");
  }

  return db;
};

module.exports = { connectDB, getDB };
