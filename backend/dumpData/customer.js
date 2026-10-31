const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const Customer = require("../models/Customer");
const { map, find } = require("lodash");
const Place = require("../models/Place");

mongoose.Promise = global.Promise;

mongoose.set("strictQuery", true);

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await Customer.deleteMany({});
    console.log("Removed existing Customers");
    const filePath = path.resolve(process.cwd(), "dumpData", "customer.csv");
    const placePath = path.resolve(process.cwd(), "dumpData", "place.csv");

    const data = await csv().fromFile(filePath);
    const places = await csv().fromFile(placePath);
    const fetchedPlaces = await Place.find().lean();
    const list = map(data, (customer) => {
      const place = find(places, ({ PlaceID }) => PlaceID === customer.PlaceID);
      const fetchedPlace = find(
        fetchedPlaces,
        ({ name }) => name === place?.name
      );
      return {
        ...customer,
        city: fetchedPlace?._id,
        address: customer?.address || place?.name,
      };
    });

    console.log(list.length + " records");
    await Customer.insertMany(list, {
      ordered: false,
      silent: true,
    });
    console.log("Finished creating customers");
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (e) {
    console.log(e.message);
  }
}

init();
