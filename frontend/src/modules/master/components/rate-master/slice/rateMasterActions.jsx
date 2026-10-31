import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function addRateMaster(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/master/addToRateMaster`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchRateMaster(id) {
  const url = `api/master/getRateMasterById/${id}`;
  return fetchFromApiServer("GET", url);
}

export function modifyRateMaster(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/master/updateRateMaster`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchRateMasters(requestObject) {
  const url = `api/master/getRateListWithPagination`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchPlaces() {
  const url = `api/master/getPlaces`;
  return fetchFromApiServer("GET", url);
}

export function fetchArticles() {
  const url = `api/master/getArticles`;
  return fetchFromApiServer("GET", url);
}

export function fetchCustomersForRateMaster(search) {
  const url = `api/master/getCustomersForRateMaster`;
  return fetchFromApiServer("POST", url, { search });
}



export function fetchCustomersForAddRateMaster(search) {
  const url = `api/master/getforADDCustomersForRateMaster`;
  return fetchFromApiServer("POST", url, { search });
}

export function removeRateMaster(id) {
  const requestObject = {};
  requestObject.updatedBy = getEmpId();
  const url = `api/master/removeRateMaster/${id}`;
  return fetchFromApiServer("PATCH", url, requestObject);
}
