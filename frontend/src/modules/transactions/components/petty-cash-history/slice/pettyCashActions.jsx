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
export function fetchEmployees() {
  const url = `api/master/getEmployees`;
  return fetchFromApiServer("GET", url, "");
}
export function fetchSuppliers() {
  const url = `api/master/getSuppliers`;
  return fetchFromApiServer("GET", url);
}

export function fetchDrivers() {
  const url = `api/master/getDrivers`;
  return fetchFromApiServer("GET", url);
}

export function fetchBanks() {
  const url = `api/master/getBanks`;
  return fetchFromApiServer("GET", url);
}
export function fetchBankAccounts() {
  const url = `api/master/getBankAccounts`;
  return fetchFromApiServer("GET", url);
}

export function fetchPettyTransactions(branch) {
  const url = `api/transactions/getPettyTransactions`;
  return fetchFromApiServer("POST", url, { branch });
}

export function fetchPettyTransactionsByDate(requestObject) {
  const updatedTransaction = { ...requestObject };
  const year = new Date(updatedTransaction.endDate).getFullYear();
  const month = new Date(updatedTransaction.endDate).getMonth() + 1;
  const day = new Date(updatedTransaction.endDate).getDate();
  const newDate = `${year}-${month}-${day + 1}`;
  let endDate = new Date(newDate).setUTCHours(23, 59, 59, 999);
  endDate = new Date(endDate).toISOString();
  updatedTransaction.endDate = endDate;
  const url = `api/transactions/getPettyTransactionsByDate`;
  return fetchFromApiServer("POST", url, updatedTransaction);
}

export function addPettyTransaction(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/transactions/addPettyTransaction`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchLoadingSlips(requestObject) {
  const url = `api/transactions/getLoadingSlips`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchPettyCashBalance() {
  const url = `api/transactions/getPettyCashBalance`;
  return fetchFromApiServer("GET", url, {});
}
