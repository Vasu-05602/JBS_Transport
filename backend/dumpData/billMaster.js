const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const LorryReceipt = require("../models/LorryReceipt");
const { find, forEach } = require("lodash");
const Branch = require("../models/Branch");
const Customer = require("../models/Customer");
const Bill = require("../models/Bill");

mongoose.Promise = global.Promise;
mongoose.set("strictQuery", true);

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await Bill.deleteMany({});
    console.log("Removed existing Bills");
    const filePath = path.resolve(process.cwd(), "dumpData", "billMaster.csv");
    const data = await csv().fromFile(filePath);

    const branchPath = path.resolve(process.cwd(), "dumpData", "branch.csv");
    const branchData = await csv().fromFile(branchPath);

    const customerPath = path.resolve(
      process.cwd(),
      "dumpData",
      "customer.csv"
    );
    const customerData = await csv().fromFile(customerPath);
    const lrPath = path.resolve(process.cwd(), "dumpData", "lrMaster.csv");
    const lrMasters = await csv().fromFile(lrPath);

    const billDetailPath = path.resolve(
      process.cwd(),
      "dumpData",
      "billDetails.csv"
    );
    const billDetailData = await csv().fromFile(billDetailPath);
    let billList = [];

    const fetchedLRs = await LorryReceipt.find({}, "_id lrNo").lean();
    const fetchedBranches = await Branch.find({}, "_id name").lean();
    const fetchedCustomers = await Customer.find({}, "_id name").lean();
    console.log(data.length + " records");

    for (let index = 0; index < data.length; index++) {
      const bill = data[index];
      const branch = find(
        branchData,
        ({ BranchID }) => BranchID === bill.branch
      );

      const customer = find(
        customerData,
        ({ CustomerID }) => CustomerID === bill.customer
      );
      let lrList = [];
      forEach(billDetailData, ({ RouteBillID, ConsignID }) => {
        if (RouteBillID === bill.RouteBillID) {
          const oldLr = find(
            lrMasters,
            ({ ConsignID: id }) => id === ConsignID
          );
          const lr = find(fetchedLRs, ({ lrNo }) => lrNo === oldLr?.lrNo);
          if (lr) {
            lrList = [...lrList, lr];
          }
        }
      });
      const fetchedBranch = find(
        fetchedBranches,
        ({ name }) => name === branch?.name
      );
      if (fetchedBranch && lrList.length) {
        const fetchedCustomer = find(
          fetchedCustomers,
          ({ name }) => name === customer?.name
        );
        const total =
          +(bill.totalFreight || 0) +
          +(bill.freight || 0) +
          +(bill.localFreight || 0);
        const grandTotal = total + +(bill.sgst || 0) + +(bill.cgst || 0);

        const billDetail = {
          ...bill,
          branch: fetchedBranch?._id,
          customer: fetchedCustomer?._id,
          lrList,
          total,
          grandTotal,
        };
        billList = [...billList, billDetail];

        const newBill = await Bill.create(billDetail);

        const allLR = lrList.map((lr) => lr._id?.toString());
        if (allLR?.length) {
          await LorryReceipt.updateMany(
            { _id: { $in: allLR } },
            {
              $set: {
                billGenerated: true,
                assoBill: newBill._id,
                updatedBy: "System",
              },
            },
            { multi: true }
          );
        }
      }
    }
    console.log("Finished creating Bills");
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (e) {
    console.log(e.message);
  }
}

init();
