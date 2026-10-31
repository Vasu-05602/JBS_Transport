import { combineReducers } from "@reduxjs/toolkit";
import localStorage from "redux-persist/lib/storage";
import userReducer from "../modules/user/slice/userSlice";
import challanRegisterReducer from "../modules/reports/components/challan-note-regester/slice/challanRegisterSlice";
import unacknowledgedReducer from "../modules/reports/components/unacknowledged/slice/unacknowledgedSlice";
import lrStatusReducer from "../modules/reports/components/lorry-receipt-status/slice/lrStatusSlice";
import userRegisterReducer from "../modules/reports/components/user-register/slice/userRegisterSlice";
import pendingLRReducer from "../modules/reports/components/pending-lr-status/slice/pendingLRSlice";
import lrRegisterReducer from "../modules/reports/components/lr-register/slice/lrRegisterSlice";
import tripSheetReducer from "../modules/reports/components/loading-trip-sheet/slice/tripSheetSlice";
import acknowledgeReducer from "../modules/transactions/components/acknowledgement/slice/acknowledgeSlice";
import billReducer from "../modules/transactions/components/bills/slice/billSlice";
import lorryReceiptReducer from "../modules/transactions/components/lorry-receipts/slice/lorryReceiptSlice";
import localMemoReducer from "../modules/transactions/components/local-memo/slice/localMemoSlice";
import loadingSlipReducer from "../modules/transactions/components/loading-slips/slice/loadingSlipSlice";
import moneyTransferReducer from "../modules/transactions/components/money-transfers/slice/moneyTransferSlice";
import paymentAdviceReducer from "../modules/transactions/components/payment-advice/slice/paymentAdviceSlice";
import paymentCollectionReducer from "../modules/transactions/components/payment-collection/slice/paymentCollectionSlice";
import pettyCashReducer from "../modules/transactions/components/petty-cash-history/slice/pettyCashSlice";
import quotationReducer from "../modules/transactions/components/quotations/slice/quotationSlice";
import articleReducer from "../modules/master/components/articles/slice/articleSlice";
import bankAccountReducer from "../modules/master/components/bank-accounts/slice/bankAccountSlice";
import bankReducer from "../modules/master/components/banks/slice/bankSlice";
import branchReducer from "../modules/master/components/branches/slice/branchSlice";
import customerReducer from "../modules/master/components/customers/slice/customerSlice";
import driverReducer from "../modules/master/components/drivers/slice/driverSlice";
import employeeReducer from "../modules/master/components/employees/slice/employeeSlice";
import placeReducer from "../modules/master/components/places/slice/placeSlice";
import rateMasterReducer from "../modules/master/components/rate-master/slice/rateMasterSlice";
import supplierReducer from "../modules/master/components/suppliers/slice/supplierSlice";
import vehicleTypeReducer from "../modules/master/components/vehicle-types/slice/vehicleTypeSlice";
import vehicleReducer from "../modules/master/components/vehicles/slice/vehicleSlice";
import BillRegisterReducer from "../modules/reports/components/Bill-Register/slice/BillRegisterSlice";
import ClientlorryReceiptReducer from "../modules/transactions/components/Client-lorry-receipts/slice/ClientlorryReceiptSlice";
import UploadExcelReducer from "../modules/reports/components/UploadExcels/slice/UploadExcelsSlice";
import UploadWordReducer from "../modules/reports/components/UploadWords/slice/UploadWordsSlice";
const appReducer = combineReducers({
  user: userReducer,
  lrregisterreport: lrRegisterReducer,
  challanregister: challanRegisterReducer,
  lrstatus: lrStatusReducer,
  pendinglr: pendingLRReducer,
  userregister: userRegisterReducer,
  tripsheetreport: tripSheetReducer,
  acknowledge: acknowledgeReducer,
  bill: billReducer,
  localmemo: localMemoReducer,
  loadingslip: loadingSlipReducer,
  lorryreceipt: lorryReceiptReducer,
  moneytransfer: moneyTransferReducer,
  paymentadvice: paymentAdviceReducer,
  paymentcollection: paymentCollectionReducer,
  pettycash: pettyCashReducer,
  quotation: quotationReducer,
  article: articleReducer,
  bankaccount: bankAccountReducer,
  bank: bankReducer,
  branch: branchReducer,
  customer: customerReducer,
  driver: driverReducer,
  employee: employeeReducer,
  place: placeReducer,
  ratemaster: rateMasterReducer,
  supplier: supplierReducer,
  vehicletype: vehicleTypeReducer,
  vehicle: vehicleReducer,
  unacknowledged: unacknowledgedReducer,
  BillRegister: BillRegisterReducer,
  Clientlorryreceipt: ClientlorryReceiptReducer,
  UploadExcel: UploadExcelReducer,
  UploadWord: UploadWordReducer,
});

export const rootReducer = (state, action) => {
  if (action.type === "user/removeUser") {
    // this applies to all keys defined in persistConfig(s)
    localStorage.removeItem("persist:root");
    localStorage.removeItem("jwt_token");
    state = {};
  }
  return appReducer(state, action);
};
