const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const VehicleType = require("../models/VehicleType");

mongoose.Promise = global.Promise;

mongoose.set("strictQuery", true);

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await VehicleType.deleteMany({});
    console.log("Removed existing VehicleTypes");
    const filePath = path.resolve(process.cwd(), "dumpData", "vehicleType.csv");
    const data = await csv().fromFile(filePath);
    console.log(data.length + " records");
    await VehicleType.insertMany(data, {
      ordered: false,
      silent: true,
    });
    console.log("Finished creating VehicleTypes");
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (e) {
    console.log(e);
  }
}

init();
