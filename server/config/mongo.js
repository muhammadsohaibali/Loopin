const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri); // No extra options needed

let dbInstance;

async function connectDB() {
    if (!dbInstance) {
        try {
            if (!client.topology || !client.topology.isConnected()) {
                await client.connect();
                console.log("Connected to MongoDB");
            }
            dbInstance = client.db("Loopin");
        } catch (err) {
            console.error("MongoDB connection error:", err);
            throw err;
        }
    }
    return dbInstance;
}

module.exports = { connectDB, ObjectId };
