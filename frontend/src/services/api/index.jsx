import axios from "axios";
import { API_BASE_PATH } from "../constants";
import { getToken } from "../utils";

const fetchFromApiServer = (requestType, url, data, params) => {
  return fetchApiWrapper(url, requestType, data, params);
};

// const getHeaderConfig = (requestType, params) => {
//   const token = getToken();
//   const config = {
//     headers: {
//       "Content-Type":
//         requestType === "MULTIPART"
//           ? "multipart/form-data"
//           : "application/json",
//       Authorization: "Bearer " + token,
//       Accept: "*/*",
//       "Access-Control-Allow-Origin": "*",
//     },
//     params: { ...params },
//     timeout: 60 * 10 * 1000,
//   };

//   return config;
// };

const getHeaderConfig = (requestType, params) => {
  const token = getToken();
  const config = {
    headers: {
      // ✅ Don't set Content-Type for UPLOAD — browser sets it with boundary
      ...(requestType !== "UPLOAD" && {
        "Content-Type": requestType === "MULTIPART"
          ? "multipart/form-data"
          : "application/json",
      }),
      Authorization: "Bearer " + token,
      Accept: "*/*",
      "Access-Control-Allow-Origin": "*",
    },
    params: { ...params },
    timeout: 60 * 10 * 1000,
  };

  return config;
};


const fetchApiWrapper = (uri, requestType, data, options = {}) => {
  const cleanUri = uri ? (uri.startsWith("/") ? uri.slice(1) : uri) : "";
  const base = (API_BASE_PATH || "").endsWith("/") ? API_BASE_PATH : `${API_BASE_PATH}/`;
  const url = base + cleanUri;
  const config = getHeaderConfig(requestType, options);

  if (requestType === "GET") {
    return axios({ url, method: "get", ...config });
  } else if (requestType === "POST" || requestType === "MULTIPART") {
    return axios({ url, method: "post", data, ...config });
  } else if (requestType === "UPLOAD") {          // ✅ ADD THIS CASE
    return axios({ url, method: "post", data, ...config });
  } else if (requestType === "DELETE") {
    return axios({ url, method: "delete", data, ...config });
  } else if (requestType === "PUT") {
    return axios({ url, method: "put", data, ...config });
  } else if (requestType === "PATCH") {
    return axios({ url, method: "patch", data, ...config });
  } else if (requestType === "BLOB") {
    return axios({
      url,
      method: "post",
      data,
      ...config,
      responseType: "blob",
    });
  }
};

export default fetchFromApiServer;
