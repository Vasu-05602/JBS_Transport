import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function fetchBranches() {
  const url = `api/master/getBranches`;
  return fetchFromApiServer("GET", url);
}

export function fetchCustomers(data) {
  const url = `api/master/getCustomersForDrop`;
  return fetchFromApiServer("POST", url, { search: data });
}

export function addBill(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/transactions/addBill`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchLorryReceiptsByConsignor(requestObject) {
  console.log(requestObject)
  const url = `api/transactions/getLorryReceiptsByConsignor`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchLorryReceiptsByConsignorforupdate(requestObject) {
  const url = `api/transactions/getLorryMasterListForBillUpdate`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function printBill({ id, email }) {
  const url = `api/transactions/printBill/${id}`;
  return fetchFromApiServer("POST", url, { email: email });
}

export function fetchBills(requestObject) {
  const url = `api/transactions/getBills`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function removeBill(id) {
  const url = `api/transactions/removeBill/${id}`;
  return fetchFromApiServer("DELETE", url, {
    id: id,
    updatedBy: getEmpId(),
  });
}

export function fetchBill(id) {
  const url = `api/transactions/getBill/${id}`;
  return fetchFromApiServer("GET", url);
}

export function modifyBill(requestObject) {
  requestObject.updatedBy = getEmpId();

  const url = `api/transactions/updateBill/${requestObject.id}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function exportToExcelBill({ id }) {
  const url = `api/transactions/exportToExcelBill/${id}`;
  return fetchFromApiServer("BLOB", url);
}

export function exportToExcelBills(requestObject) {
  const url = `api/transactions/exportToExcelBills`;
  return fetchFromApiServer("BLOB", url, requestObject);
}

export function fetchPaymentCollectionHistory(billId) {
  const url = `api/transactions/getPaymentCollectionHistory/${billId}`;
  return fetchFromApiServer("GET", url);
}

export function modifyPaymentCollection(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/transactions/updatePaymentCollection/${requestObject.id}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function recordPaymentCollectionForBill(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/transactions/recordPaymentCollectionForBill`;
  return fetchFromApiServer("POST", url, requestObject);
}

