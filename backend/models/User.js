const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = new Schema(
  {
    branch: {
      type: String,
      required: function () {
        return this.type.toLowerCase() !== "superadmin";
      },
    },
    type: {
      type: String, //['Admin', 'User']
      required: true,
    },
    employee: {
      type: String,
      required: function () {
        return this.type.toLowerCase() !== "superadmin";
      },
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    userBranches: [mongoose.Types.ObjectId],
    permissions: {
      Admin: {
        MoneyTransfer: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Place: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Branch: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Article: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Package: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Vehicle: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Customers: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Employee: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Driver: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Supplier: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        VehicleTaxPay: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        VehicleType: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        GCNoteStatement: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Tyre: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Kilometer: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        TyreFitRemove: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        TyreOutward: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        RateMaster: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
      },
      "Sales/Purchase": {
        TripSheet: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        BankTransaction1: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        BankPettyCash: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        ChallanReceiptReg: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        MaterialInwardRegisterReport: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        MaterialOutwardRegReport: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        InwardStatus: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        StockLRRegister: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PetrolPump: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PetrolPump1: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        BankMaster: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        BankAccountMaster: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PaymentAdvicePetrol: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        TyreSupplier: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        TyreSupplierList: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        FundTransfer: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        RateMasterList: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        RateMaster: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        DeliveryStatus: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        DeliveryStatusReport: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Add_FO_No: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Acknowledge: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PaymentAdvice: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        DebitNote: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PendingCheque: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        MaterialInward: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        MaterialOutward: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        StockReport: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        CashMemo: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        LorryReceipt: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        LoadingSlip: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        LRAcknowledge: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        LorryReceiptReg: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        LoadingSlipRegister: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        LRStatus: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
      },
      Accounts: {
        RouteBill: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PaymentCollection: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Voucher: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        BillRegister: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        BilledLRStatus: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PaymentCollectionReport: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        VendorRegister: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PettyCashRegister: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Place: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Branch: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Package: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Vehicle: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Customers: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Driver: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Supplier: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        LorryReceipt: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        LoadingSlip: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        MaterialInward: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        MaterialOutward: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PATyreReport: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        BankTransaction: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PetrolReport: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
      },
      User: {
        RoleMaster: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        PendingRequest: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        UserActivation: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        Designation: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        ChangePassword: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
        UserRegister: {
          read: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
          write: {
            type: Boolean,
            default: function () {
              return this.type.toLowerCase() === "superadmin";
            },
          },
        },
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: function () {
        return !this.updatedBy;
      },
    },
    updatedBy: {
      type: String,
      required: function () {
        return !this.createdBy;
      },
    },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

User.index({ employee: "text", username: "text" });

module.exports = mongoose.model("User", User);
