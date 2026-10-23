// ===================================================================
// MongoDB connection (Unit 4: MongoDB Setup, Atlas)
// ===================================================================
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/esports_db';
  try {
    await mongoose.connect(uri);
    console.log(`[MongoDB] connected -> ${mongoose.connection.name} @ ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[MongoDB] connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
