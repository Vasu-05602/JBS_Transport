import fetchFromApiServer from "@services/api";

export function fetchBranches() {
  const url = `api/master/getBranches`;
  return fetchFromApiServer("GET", url);
}

export function fetchLRAckWithCount(requestObject) {
  const url = `api/transactions/getLRAckWithCount`;
  return fetchFromApiServer("POST", url, requestObject);
}

export function fetchLoadingSlipsById(lsList) {
  const url = `api/transactions/getLoadingSlipsById`;
  return fetchFromApiServer("POST", url, { lsList: lsList });
}

export function fetchAllLRAck(requestObject) {
  const url = `api/transactions/getAllLRAck`;
  return fetchFromApiServer("POST", url, requestObject);
}
export function fetchChallanAck(id) {
  const url = `api/transactions/getChallanAck/${id}`;
  return fetchFromApiServer("GET", url);
}
export function modifyLorryReceiptAck(requestObject) {
  const url = `api/transactions/updateLorryReceiptAck/${requestObject._id}`;
  return fetchFromApiServer("PUT", url, requestObject);
}

export function modifyMultiLorryReceiptAck(requestObject) {
  const url = `api/transactions/updateMultiLorryReceiptAck`;
  return fetchFromApiServer("PUT", url, requestObject);
}
export function fetchLorryReceipt(id) {
  const url = `api/transactions/getLorryReceipt/${id}`;
  return fetchFromApiServer("GET", url);
}

export function fetchLRAck(lrNO) {
  const url = `api/transactions/getLRAck/${lrNO}`;
  return fetchFromApiServer("GET", url);
}
