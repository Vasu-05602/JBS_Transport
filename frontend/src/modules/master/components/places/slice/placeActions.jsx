import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function addPlace(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/master/addPlace`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchPlace(id) {
  const url = `api/master/getPlace/${id}`;
  return fetchFromApiServer("GET", url);
}

export function modifyPlace(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/master/updatePlace/${requestObject.placeId}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function fetchPlaces() {
  const url = `api/master/getPlaces`;
  return fetchFromApiServer("GET", url);
}
export function removePlace(id) {
  console.log(id)
  const url = `api/master/removePlace/${id}`;
  return fetchFromApiServer("DELETE", url, { id: id, updatedBy: getEmpId() });
}
