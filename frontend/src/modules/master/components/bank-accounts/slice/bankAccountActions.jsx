import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function addBankAccount(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/master/addBankAccount`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchBankAccount(id) {
  const url = `api/master/getBankAccount/${id}`;
  return fetchFromApiServer("GET", url);
}

export function modifyBankAccount(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/master/updateBankAccount/${requestObject._id}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function fetchBankAccounts() {
  const url = `api/master/getBankAccountList`;
  return fetchFromApiServer("GET", url);
}

export function removeBankAccount(id) {
  const url = `api/master/removeBankAccount/${id}`;
  return fetchFromApiServer("DELETE", url, { id: id, updatedBy: getEmpId() });
}

export function fetchBanks() {
  const url = `api/master/getBanks`;
  return fetchFromApiServer("GET", url);
}
