const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const Place = require("../models/Place");

mongoose.Promise = global.Promise;

mongoose.set("strictQuery", true);

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await Place.deleteMany({});
    console.log("Removed existing Places");
    const filePath = path.resolve(process.cwd(), "dumpData", "place.csv");
    const data = await csv().fromFile(filePath);
    console.log(data.length + " records");
    await Place.insertMany(data, {
      ordered: false,
      silent: true,
    });
    console.log("Finished creating Places");
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (e) {
    console.log(e);
  }
}

init();
