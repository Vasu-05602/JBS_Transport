const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const Supplier = require("../models/Supplier");

mongoose.Promise = global.Promise;

mongoose.set("strictQuery", true);

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await Supplier.deleteMany({});
    console.log("Removed existing Suppliers");
    const filePath = path.resolve(process.cwd(), "dumpData", "supplier.csv");
    const data = await csv().fromFile(filePath);
    console.log(data.length + " records");
    await Supplier.insertMany(data);
    console.log("Finished creating Suppliers");
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (e) {
    console.log(e);
  }
}

init();
