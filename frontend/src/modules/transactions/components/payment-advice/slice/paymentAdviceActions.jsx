import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function fetchBranches() {
  const url = `api/master/getBranches`;
  return fetchFromApiServer("GET", url);
}

export function fetchSupplier(id) {
  const url = `api/master/getSupplier/${id}`;
  return fetchFromApiServer("GET", url);
}

export function fetchPlaces() {
  const url = `api/master/getPlaces`;
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
export function fetchLoadingSlipsBySupplier({ supplier, branch }) {
  const url = `api/transactions/getLoadingSlipsBySupplier/${supplier}`;
  return fetchFromApiServer("POST", url, { branch });
}

export function addSupplierBill(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/transactions/saveSupplierBill`;
  return fetchFromApiServer("POST", url, requestObject);
}
export function addSupplierPayments(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/transactions/saveSupplierPayments`;
  return fetchFromApiServer("POST", url, { loadingSlips: requestObject });
}

export function modifySupplierBills(requestObject) {
  const url = `api/transactions/updateSupplierBills`;
  return fetchFromApiServer("POST", url, { supplierBills: requestObject });
}

export function fetchSuppliersByType(supplierType) {
  const url = `api/master/getSuppliersByType`;
  return fetchFromApiServer("POST", url, { supplierType: supplierType });
}

export function fetchSupplierBills({ supplier, branch }) {
  const url = `api/transactions/getSupplierBills/${supplier}`;
  return fetchFromApiServer("POST", url, { branch });
}
