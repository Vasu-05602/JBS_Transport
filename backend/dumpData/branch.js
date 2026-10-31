const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const Branch = require("../models/Branch");
const Place = require("../models/Place");
const { find } = require("lodash");
const { PRINTERS } = require("../utils/constant");

mongoose.Promise = global.Promise;

mongoose.set("strictQuery", true);

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await Branch.deleteMany({});
    console.log("Removed existing Branches");
    const filePath = path.resolve(process.cwd(), "dumpData", "branch.csv");
    const data = await csv().fromFile(filePath);

    const placeFilePath = path.resolve(process.cwd(), "dumpData", "place.csv");
    const placeData = await csv().fromFile(placeFilePath);
    console.log(data.length + " records");

    const fetchedPlaces = await Place.find({}, "_id name").lean();
    let branches = [];
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      const oldPlace = find(
        placeData,
        ({ place_id }) => place_id === element.place_id
      );
      const place =
        find(fetchedPlaces, ({ name }) => name === oldPlace?.name) ||
        fetchedPlaces[0];

      if (place) {
        branches = [
          ...branches,
          {
            ...element,
            printer: PRINTERS[element.printer - 1],
            place: place._id,
          },
        ];
      }
    }
    await Branch.insertMany(branches);
    console.log("Finished creating Branches");
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (e) {
    console.log(e.message);
  }
}

init();
