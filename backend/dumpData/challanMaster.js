const mongoose = require("mongoose");
const path = require("path");
const { db } = require("../database/db");
const csv = require("csvtojson");
const { find, some, forEach } = require("lodash");
const Branch = require("../models/Branch");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Place = require("../models/Place");
const LoadingSlip = require("../models/LoadingSlip");
const LorryReceipt = require("../models/LorryReceipt");
const { convertTime12to24 } = require("../utils");

mongoose.Promise = global.Promise;
mongoose.set("strictQuery", true);

async function init() {
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await LoadingSlip.deleteMany({});
    console.log("Removed existing LoadingSlips");
    const filePath = path.resolve(
      process.cwd(),
      "dumpData",
      "challanMaster.csv"
    );
    const data = await csv().fromFile(filePath);

    const branchPath = path.resolve(process.cwd(), "dumpData", "branch.csv");
    const branchData = await csv().fromFile(branchPath);

    const vehiclePath = path.resolve(process.cwd(), "dumpData", "vehicle.csv");
    const vehicleData = await csv().fromFile(vehiclePath);

    const placePath = path.resolve(process.cwd(), "dumpData", "place.csv");
    const placeData = await csv().fromFile(placePath);
    const driverPath = path.resolve(process.cwd(), "dumpData", "driver.csv");
    const driverData = await csv().fromFile(driverPath);
    const lrPath = path.resolve(process.cwd(), "dumpData", "lrMaster.csv");
    const lrMasters = await csv().fromFile(lrPath);

    const transactionPath = path.resolve(
      process.cwd(),
      "dumpData",
      "challanDetails.csv"
    );
    const transactionData = await csv().fromFile(transactionPath);
    let challanList = [];

    const fetchedLRs = await LorryReceipt.find({}, "_id lrNo").lean();
    const fetchedBranches = await Branch.find({}, "_id name").lean();
    const fetchedVehicles = await Vehicle.aggregate([
      {
        $lookup: {
          from: "supplier",
          localField: "owner",
          foreignField: "_id",
          as: "supplier",
        },
      },
      { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true } },
    ]);
    const fetchedDrivers = await Driver.find({}, "_id name").lean();
    const fetchedPlaces = await Place.find({}, "_id name").lean();

    console.log(data.length + " records");

    for (let index = 0; index < data.length; index++) {
      const loadingSlip = data[index];
      const branch = find(
        branchData,
        ({ BranchID }) => BranchID === loadingSlip.branch
      );
      const driver = find(
        driverData,
        ({ DriverID }) => DriverID === loadingSlip.driver
      );
      const vehicle = find(
        vehicleData,
        ({ id }) => id === loadingSlip.vehicleId
      );
      const paybleAt = find(
        branchData,
        ({ BranchID }) => BranchID === loadingSlip.paybleAt
      );
      let from = "",
        to = "";
      some(placeData, ({ PlaceID, name }) => {
        if (loadingSlip.from === PlaceID) from = name;
        if (loadingSlip.to === PlaceID) to = name;
        return from && to;
      });
      let lrList = [];
      forEach(transactionData, ({ LoadingSlipID, ConsignID }) => {
        if (LoadingSlipID === loadingSlip.LoadingSlipID) {
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
      const fetchedPaybleAt = find(
        fetchedBranches,
        ({ name }) => name === paybleAt?.name
      );

      const fetchedVehicle = find(
        fetchedVehicles,
        ({ vehicleNo }) => vehicleNo === vehicle?.vehicleNo
      );
      const fetchedDriver = find(
        fetchedDrivers,
        ({ name }) => name === driver?.name
      );
      const fetchedFrom = find(fetchedPlaces, ({ name }) => name === from);
      const fetchedTo = find(fetchedPlaces, ({ name }) => name === to);

      const payable =
        +loadingSlip.totalFreight + +loadingSlip.advance - +loadingSlip.rent;
      const challanDetail = {
        ...loadingSlip,
        branch: fetchedBranch?._id,
        vehicle: fetchedVehicle?._id,
        vehicleNo: fetchedVehicle?.vehicleNo,
        vehicleOwner:
          loadingSlip?.vehicleOwner || fetchedVehicle?.supplier?.name,
        vehicleOwnerAddress:
          loadingSlip?.vehicleOwnerAddress || fetchedVehicle?.supplier?.address,
        vehicleOwnerPhone:
          loadingSlip?.vehicleOwnerPhone || fetchedVehicle?.supplier?.phone,
        driver: fetchedDriver?._id,
        driverName: loadingSlip?.driverName || fetchedDriver?.name,
        licenseNo: loadingSlip?.licenseNo || fetchedDriver?.licenseNo,
        phone: loadingSlip?.phone || fetchedDriver?.telephone,
        from: fetchedFrom?._id,
        fromName: fetchedFrom?.name,
        to: fetchedTo?._id,
        toName: fetchedTo?.name,
        paybleAt: fetchedPaybleAt?._id,
        lrList,
        totalPayable: payable,
        currentTime: convertTime12to24(loadingSlip.currentTime),
        reachTime: convertTime12to24(loadingSlip.reachTime),
      };
      if (fetchedBranch && lrList.length) {
        challanList = [...challanList, challanDetail];
        const newLoadingSlip = await LoadingSlip.create(challanDetail);

        const allLR = lrList.map((lr) => lr._id?.toString());
        if (allLR?.length) {
          await LorryReceipt.updateMany(
            { _id: { $in: allLR } },
            {
              $set: {
                status: 1,
                memoNo: newLoadingSlip?.lsNo,
                associatedLS: newLoadingSlip._id,
                updatedBy: "System",
              },
            },
            { multi: true }
          );
        }
      }
    }
    console.log("Finished creating LoadingSlips");
    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (e) {
    console.log(e.message);
  }
}

init();
