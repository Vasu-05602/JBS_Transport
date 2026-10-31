import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function addDriver(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/master/addDriver`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchDriver(id) {
  const url = `api/master/getDriver/${id}`;
  return fetchFromApiServer("GET", url);
}

export function modifyDriver(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/master/updateDriver/${requestObject.id}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function fetchDrivers() {
  const url = `api/master/getDrivers`;
  return fetchFromApiServer("GET", url);
}
export function removeDriver(id) {
  const url = `api/master/removeDriver/${id}`;
  return fetchFromApiServer("DELETE", url, { id: id, updatedBy: getEmpId() });
}

export function fetchLastDriver() {
  const url = `api/master/getLastDriver`;
  return fetchFromApiServer("GET", url);
}
