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


export function fetchClientConsignee(data) {
  const url = `api/master/getClientConsigneeForDrop`;
  return fetchFromApiServer("POST", url, { search: data });
}

export function fetchClientConsignors(data) {
  const url = `api/master/getClientConsignorsForDrop`;
  return fetchFromApiServer("POST", url, { search: data });
}
export function fetchVehicles() {
  const url = `api/master/getVehicles`;
  return fetchFromApiServer("GET", url);
}
export function fetchSuppliers() {
  const url = `api/master/getSuppliers`;
  return fetchFromApiServer("GET", url);
}
export function fetchPlaces() {
  const url = `api/master/getPlaces`;
  return fetchFromApiServer("GET", url);
}
export function fetchDrivers() {
  const url = `api/master/getDrivers`;
  return fetchFromApiServer("GET", url);
}

export function fetchArticles() {
  const url = `api/master/getArticles`;
  return fetchFromApiServer("GET", url);
}

export function fetchLastLR() {
  const url = `api/transactions/getLastLR`;
  return fetchFromApiServer("GET", url);
}

export function addFONum(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/transactions/addFONum`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function addLorryReceipt(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/transactions/addLorryReceipt`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function viewLorryReceipt({ id, email, isWithoutAmount, user }) {
  const url = `api/transactions/viewLorryReceipt/${id}`;
  return fetchFromApiServer("POST", url, { email, isWithoutAmount, user });
}

export function fetchLoadingSlips(requestObject) {
  const url = `api/transactions/getLoadingSlips`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function removeLorryReceipt(id) {
  const url = `api/transactions/removeLorryReceipt/${id}`;
  return fetchFromApiServer("DELETE", url, {
    id: id,
    updatedBy: getEmpId(),
  });
}

export function fetchRateMasterByCustomer(id) {
  const url = `api/master/getRateMasterByCustomer/${id}`;
  return fetchFromApiServer("GET", url, "");
}

export function fetchLorryReceipts(requestObject) {
  const url = `api/transactions/getLorryReceipts`;
  return fetchFromApiServer("POST", url, requestObject);
}
export function fetchLorryReceiptsFO(requestObject) {
  const url = `api/transactions/getLorryReceiptsFO`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function modifyLorryReceipt(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/transactions/updateLorryReceipt/${requestObject.ids}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function fetchLorryReceipt(id) {
  const url = `api/transactions/getLorryReceipt/${id}`;
  return fetchFromApiServer("GET", url, {});
}

export function fetchLorryReceiptsWithCount(requestObject) {
  const url = `api/transactions/getLorryReceiptsWithCount`;
  return fetchFromApiServer("POST", url, requestObject);
}


export function fetchClientLorryReceiptsWithCount(requestObject) {
  const url = `api/transactions/getClientLorryReceiptsWithCount`;
  return fetchFromApiServer("POST", url, requestObject);
}


export function fetchLRNumber(code) {
  const url = `api/master/getTransactionPrefix/${code}`;
  return fetchFromApiServer("GET", url);
}

export function addLRNumber(requestObject) {
  const url = `api/master/addTransactionPrefix`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function exportToExcelLorryReceipts(requestObject) {
  const url = `api/transactions/exportToExcelLorryReceipts`;
  return fetchFromApiServer("BLOB", url, requestObject);
}