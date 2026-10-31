const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const LorryReceipt = require("../models/LorryReceipt");
const { find, some, forEach } = require("lodash");
const Branch = require("../models/Branch");
const Customer = require("../models/Customer");
const {
  DELIVERY_TYPES,
  PAY_TYPES,
  SERVICE_TAX_BY,
  PAY_MODE,
  TO_BILLED,
} = require("../utils/constant");

mongoose.Promise = global.Promise;

mongoose.set("strictQuery", true);

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await LorryReceipt.deleteMany({});
    console.log("Removed existing LorryReceipts");
    const filePath = path.resolve(process.cwd(), "dumpData", "lrMaster.csv");
    const data = await csv().fromFile(filePath);

    const branchPath = path.resolve(process.cwd(), "dumpData", "branch.csv");
    const branchData = await csv().fromFile(branchPath);

    const customerPath = path.resolve(
      process.cwd(),
      "dumpData",
      "customer.csv"
    );
    const customerData = await csv().fromFile(customerPath);

    const placePath = path.resolve(process.cwd(), "dumpData", "place.csv");
    const placeData = await csv().fromFile(placePath);

    const vehiclePath = path.resolve(process.cwd(), "dumpData", "vehicle.csv");
    const vehicleData = await csv().fromFile(vehiclePath);

    const transactionsLRPath = path.resolve(
      process.cwd(),
      "dumpData",
      "lrDetails.csv"
    );
    const transactionsLRData = await csv().fromFile(transactionsLRPath);

    const articlePath = path.resolve(process.cwd(), "dumpData", "article.csv");
    const articleData = await csv().fromFile(articlePath);

    let lrList = [];

    const fetchedBranches = await Branch.find({}, "_id name").lean();
    const fetchedCustomers = await Customer.find(
      {},
      "_id name city telephone email address"
    ).lean();

    for (let index = 0; index < data.length; index++) {
      const lr = data[index];
      const branch = find(branchData, ({ BranchID }) => BranchID === lr.branch);

      const vehicle = find(vehicleData, ({ id }) => id === lr.vehicleId);

      let consignee = "",
        consignor = "";
      some(customerData, ({ CustomerID, name }) => {
        if (CustomerID === lr?.consignee) consignee = name;
        if (CustomerID === lr?.consignor) consignor = name;
        return consignee && consignor;
      });
      let from = "",
        to = "";
      some(placeData, ({ PlaceID, name }) => {
        if (lr.from === PlaceID) from = name;
        if (lr.to === PlaceID) to = name;
        return from && to;
      });
      const collectAt = find(
        branchData,
        ({ BranchID }) => BranchID === lr.collectAt
      );
      let transactions = [];
      forEach(transactionsLRData, (transaction) => {
        if (transaction.ConsignID === lr.ConsignID) {
          const article = find(
            articleData,
            ({ PackageID }) => PackageID === transaction.article
          );
          if (article) {
            transactions = [
              ...transactions,
              { ...transaction, article: article?.name },
            ];
          }
        }
      });
      const fetchedBranch = find(
        fetchedBranches,
        ({ name }) => name === branch?.name
      );
      const fetchedConsignee = find(
        fetchedCustomers,
        ({ name }) => name === consignee
      );

      const fetchedConsignor = find(
        fetchedCustomers,
        ({ name }) => name === consignor
      );

      const fetchedPlace = find(
        fetchedBranches,
        ({ name }) => name === collectAt?.name
      );

      const total =
        +lr.totalFreight + +lr.deliveryCharges + +lr.lrCharges + +lr.hamali;
      const lrDetails = {
        ...lr,
        branch: fetchedBranch?._id,
        consignee: fetchedConsignee?._id,
        consignor: fetchedConsignor?._id,
        consigneeName: fetchedConsignee?.name,
        consignorName: fetchedConsignor?.name,
        collectAt: fetchedPlace?._id,
        vehicleNo: vehicle?.vehicleNo || "",
        from,
        to,
        consignorPhone: fetchedConsignor?.telephone,
        consignorEmail: fetchedConsignor?.email,
        consignorAddress: lr?.consignorAddress || fetchedConsignor?.address,
        consigneePhone: fetchedConsignee?.telephone,
        consigneeAddress: lr?.fetchedConsignee || fetchedConsignee?.address,
        consigneeEmail: fetchedConsignee?.email,
        transactions,
        total,
        deliveryType: DELIVERY_TYPES[lr.deliveryType - 1]?.value,
        payType: PAY_TYPES[lr.payType - 1]?.value || "",
        payMode: PAY_MODE[lr.payMode - 1]?.value || "",
        serviceTaxBy: SERVICE_TAX_BY[lr.serviceTaxBy - 1]?.value || "",
        toBilled: TO_BILLED[lr.toBilled - 1]?.value || "",
      };
      lrList = [...lrList, lrDetails];
    }

    console.log(lrList.length + " records");
    await LorryReceipt.insertMany(lrList, {
      ordered: false,
      silent: true,
    });
    console.log("Finished creating LorryReceipts");
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (e) {
    console.log(e.message);
  }
}

init();
