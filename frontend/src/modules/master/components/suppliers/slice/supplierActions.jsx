import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function addSupplier(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/master/addSupplier`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchSupplier(id) {
  const url = `api/master/getSupplier/${id}`;
  return fetchFromApiServer("GET", url);
}

export function modifySupplier(requestObject) {
  requestObject.updatedBy = getEmpId();
  const url = `api/master/updateSupplier/${requestObject.id}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function fetchSuppliers() {
  const url = `api/master/getSuppliers`;
  return fetchFromApiServer("GET", url);
}
export function removeSupplier(id) {
  const url = `api/master/removeSupplier/${id}`;
  return fetchFromApiServer("DELETE", url, { id: id, updatedBy: getEmpId() });
}
