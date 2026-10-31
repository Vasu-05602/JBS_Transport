import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function addBank(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/master/addBank`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchBank(id) {
  const url = `api/master/getBank/${id}`;
  return fetchFromApiServer("GET", url);
}

export function modifyBank(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/master/updateBank/${requestObject._id}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function fetchBanks() {
  const url = `api/master/getBanks`;
  return fetchFromApiServer("GET", url);
}
export function removeBank(id) {
  const url = `api/master/removeBank/${id}`;
  return fetchFromApiServer("DELETE", url, { id: id, updatedBy: getEmpId() });
}
