import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function addBranch(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/master/addBranch`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchBranch(id) {
  const url = `api/master/getBranch/${id}`;
  return fetchFromApiServer("GET", url);
}

export function modifyBranch(requestObject) {
  console.log('Branch ID:', requestObject.branchId);
  requestObject.updatedBy = getEmpId();
  const url = `api/master/updateBranch/${requestObject.branchId}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function fetchBranches() {
  const url = `api/master/getBranchList`;
  return fetchFromApiServer("GET", url);
}
export function removeBranch(id) {
  const url = `api/master/removeBranch/${id}`;
  return fetchFromApiServer("DELETE", url, { id: id, updatedBy: getEmpId() });
}

export function fetchPlaces() {
  const url = `api/master/getPlaces`;
  return fetchFromApiServer("GET", url);
}
