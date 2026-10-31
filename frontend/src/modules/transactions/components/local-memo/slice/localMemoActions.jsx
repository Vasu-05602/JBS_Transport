import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function fetchBranches() {
  const url = `api/master/getBranches`;
  return fetchFromApiServer("GET", url);
}

export function fetchPlaces() {
  const url = `api/master/getPlaces`;
  return fetchFromApiServer("GET", url);
}

export function addLoadingSlip(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/transactions/addLoadingSlip`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchLoadingSlips(requestObject) {
  const url = `api/transactions/getLoadingSlips`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function removeLoadingSlip(id) {
  const url = `api/transactions/removeLoadingSlip/${id}`;
  return fetchFromApiServer("DELETE", url, {
    id: id,
    updatedBy: getEmpId(),
  });
}
