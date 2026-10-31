import fetchFromApiServer from "@services/api";
import { getEmpId } from "@services/utils";

export function fetchBranches() {
  const url = `api/master/getBranches`;
  return fetchFromApiServer("GET", url);
}

export function fetchBanks() {
  const url = `api/master/getBanks`;
  return fetchFromApiServer("GET", url);
}
export function fetchBankAccounts() {
  const url = `api/master/getBankAccounts`;
  return fetchFromApiServer("GET", url);
}

export function fetchBillsByCustomer({ customer, branch }) {
  const url = `api/transactions/getBillsByCustomer`;
  return fetchFromApiServer("POST", url, { customer, branch });
}

export function modifyBills(requestObject) {
  requestObject?.forEach?.((bill) => {
    if (bill.payment) {
      bill.payment.createdBy = getEmpId();
    }
  });
  const url = `api/transactions/updateBills`;
  return fetchFromApiServer("POST", url, { bills: requestObject });
}

export function fetchCustomersByBranch(search) {
  const url = `api/master/getCustomersForDrop`;
  return fetchFromApiServer("POST", url, { search });
}

export function viewPaymentCollection({ billId, collectionId, email }) {
  const url = `api/transactions/viewPaymentCollection/${billId}/${collectionId}`;
  return fetchFromApiServer("POST", url, { email: email });
}
