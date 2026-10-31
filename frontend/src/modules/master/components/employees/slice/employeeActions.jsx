import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function addEmployee(requestObject) {
  requestObject.createdBy = getEmpId();

  // Log the request object and any other relevant info
  console.log('Adding employee with request:', requestObject);

  const url = `api/master/addEmployee`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchEmployee(id) {
  const url = `api/master/getEmployee/${id}`;
  return fetchFromApiServer("GET", url);
}

export function modifyEmployee(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/master/updateEmployee/${requestObject.id}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function fetchEmployees() {
  const url = `api/master/getEmployees`;
  return fetchFromApiServer("GET", url);
}
export function removeEmployee(id) {
  const url = `api/master/removeEmployee/${id}`;
  return fetchFromApiServer("DELETE", url, { id: id, updatedBy: getEmpId() });
}

export function fetchLastEmployee() {
  const url = `api/master/getLastEmployee`;
  return fetchFromApiServer("GET", url);
}
