const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const RateMaster = require("../models/RateMaster");
const { groupBy } = require("lodash");
const Customer = require("../models/Customer");
const Place = require("../models/Place");

mongoose.Promise = global.Promise;

mongoose.set("strictQuery", true);

async function loadData() {
  const filePath = path.resolve(process.cwd(), "dumpData", "rateMaster.csv");
  const data = await csv().fromFile(filePath);

  const mainData = groupBy(data, "customerName");

  const rateList = await Promise.all(
    Object.keys(mainData).map(async (key) => {
      const element = mainData[key];
      const customer = await Customer.findOne({ name: key }, "_id name").lean();
      if (customer) {
        let rates = [];
        await Promise.all(
          element.map(async (rateDetail) => {
            const place = await Place.findOne(
              { name: rateDetail.stationName },
              "_id name"
            ).lean();
            if (place) {
              const { rate, ddCharges, article } = rateDetail;
              rates = [
                ...rates,
                {
                  article: article,
                  station: place._id,
                  stationName: place.name,
                  rate,
                  ddCharges,
                },
              ];
              return;
            }
          })
        );

        if (rates.length > 0) {
          const rate = {
            customer: customer._id,
            customerName: customer.name,
            rates: rates,
            createdBy: "System",
          };
          await RateMaster.create(rate);
          return rate;
        }
      }
    })
  );

  return rateList.filter(Boolean);
}

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await RateMaster.deleteMany({});
    console.log("Removed existing RateMasters");

    const rateList = await loadData();

    console.log(rateList.length + " records");

    console.log("Finished creating RateMasters");
  } catch (e) {
    console.error(e);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

init();
