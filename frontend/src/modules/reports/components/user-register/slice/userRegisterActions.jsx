import fetchFromApiServer from "@services/api";

export function fetchUsers() {
  const url = `api/user/userRegister`;
  return fetchFromApiServer("GET", url, "");
}
