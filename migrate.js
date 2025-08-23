// migrateIndexes.js
require("dotenv").config();
const mongoose   = require("mongoose");

// Import all models
const Bill       = require("./src/models/Bill");
const Counter    = require("./src/models/Counter");
const Customer   = require("./src/models/Customer");
const Expense    = require("./src/models/Expense");
const Product    = require("./src/models/Product");
const SafeDropIn = require("./src/models/SafeDropIn");

const migrateIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("▶ MongoDB connected");

    const models = [
      { name: "Bill", model: Bill },
      { name: "Counter", model: Counter },
      { name: "Customer", model: Customer },
      { name: "Expense", model: Expense },
      { name: "Product", model: Product },
      { name: "SafeDropIn", model: SafeDropIn },
    ];

    for (const { name, model } of models) {
      await model.syncIndexes();
      console.log(`✅ ${name} indexes migrated (ensured).`);
    }

  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

migrateIndexes();
