const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const Article = require("../models/Article");

mongoose.Promise = global.Promise;

mongoose.set("strictQuery", true);

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await Article.deleteMany({});
    console.log("Removed existing Articles");
    const filePath = path.resolve(process.cwd(), "dumpData", "article.csv");
    const data = await csv().fromFile(filePath);
    console.log(data.length + " records");
    await Article.insertMany(data, {
      ordered: false,
      silent: true,
    });
    console.log("Finished creating Articles");
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (e) {
    console.log(e.message);
  }
}

init();
