import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function fetchBranches() {
  const url = `api/master/getBranches`;
  return fetchFromApiServer("GET", url);
}

export function addMoneyTransfer(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/transactions/addMoneyTransfer`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function removeMoneyTransfer(id) {
  const url = `api/transactions/removeMoneyTransfer/${id}`;
  return fetchFromApiServer("DELETE", url, {
    id: id,
    updatedBy: getEmpId(),
  });
}

export function fetchMoneyTransfers(branch) {
  const url = `api/transactions/getMoneyTransfers`;
  return fetchFromApiServer("POST", url, { branch });
}

export function modifyMoneyTransfer(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/transactions/updateMoneyTransfer/${requestObject._id}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function fetchMoneyTransfer(id) {
  const url = `api/transactions/getMoneyTransfer/${id}`;
  return fetchFromApiServer("GET", url, {});
}
