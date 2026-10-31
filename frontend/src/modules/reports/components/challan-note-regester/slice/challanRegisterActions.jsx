import fetchFromApiServer from "@services/api";

export function fetchBranches() {
  const url = `api/master/getBranches`;
  return fetchFromApiServer("GET", url);
}

export function fetchCustomers(data) {
  const url = `api/master/getCustomersForDrop`;
  return fetchFromApiServer("POST", url, { search: data });
}

export function fetchLoadingSlipForReport(requestObject) {
  const url = `api/transactions/getChallanForReport`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchLRChallanReport(requestObject) {
  const url = `api/transactions/getChallanForReport`;
  return fetchFromApiServer("BLOB", url, requestObject);
}
