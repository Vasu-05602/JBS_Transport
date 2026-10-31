import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function fetchPlaces() {
  const url = `api/master/getPlaces`;
  return fetchFromApiServer("GET", url);
}
export function fetchBranches() {
  const url = `api/master/getBranches`;
  return fetchFromApiServer("GET", url);
}

export function fetchCustomers(data) {
  const url = `api/master/getCustomersForDrop`;
  return fetchFromApiServer("POST", url, { search: data });
}

export function addQuotation(requestObject) {
  requestObject.createdBy = getEmpId();
  const url = `api/transactions/addQuotation`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchQuotation(id) {
  const url = `api/transactions/getQuotation/${id}`;
  return fetchFromApiServer("GET", url, {});
}

export function modifyQuotation(requestObject) {
  const url = `api/transactions/updateQuotation`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchQuotations(branch) {
  const url = `api/transactions/getQuotations`;
  return fetchFromApiServer("GET", url, {}, { branch });
}

export function removeQuotation(idOrObj) {
  const id =
    typeof idOrObj === "object" && idOrObj !== null
      ? idOrObj.id || idOrObj._id
      : idOrObj;
  const url = `api/transactions/removeQuotation/${id}`;
  return fetchFromApiServer("POST", url, {
    id: id,
    updatedBy: getEmpId(),
  });
}

export function viewQuotationFile({ id, email }) {
  const url = `api/transactions/viewQuotation/${id}`;
  return fetchFromApiServer("POST", url, { email: email });
}
