const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const Driver = require("../models/Driver");

mongoose.Promise = global.Promise;

mongoose.set("strictQuery", true);

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await Driver.deleteMany({});
    console.log("Removed existing Drivers");
    const filePath = path.resolve(process.cwd(), "dumpData", "driver.csv");
    const data = await csv().fromFile(filePath);
    console.log(data.length + " records");
    await Driver.insertMany(data, {
      ordered: false,
      silent: true,
    });
    console.log("Finished creating drivers");
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (e) {
    console.log(e);
  }
}

init();
