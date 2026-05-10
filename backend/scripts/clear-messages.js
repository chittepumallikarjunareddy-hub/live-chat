/**
 * Wipes all chat messages from MongoDB (users are kept).
 * Usage: from backend folder,  npm run reset:messages
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { deleteAllMessages } = require("../models/store");

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const deleted = await deleteAllMessages();
  console.log(`Removed ${deleted} message(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
