import fetchFromApiServer from "@services/api";

export function fetchUploadedExcels() {
    const url = `api/transactions/getUploadedExcels`;
    return fetchFromApiServer("GET", url);
}

// UploadExcelsActions.jsx
// Change this:
export function fetchUploadExcel(file) {
    const url = `api/transactions/uploadExcel`;
    const formData = new FormData();
    formData.append("file", file);
    return fetchFromApiServer("UPLOAD", url, formData);
}

export function fetchDownloadExcel(requestObject) {
    const url = `api/transactions/downloadExcel`;
    return fetchFromApiServer("BLOB", url, requestObject);
}

export function fetchDeleteExcel(requestObject) {
    const url = `api/transactions/deleteExcel`;
    return fetchFromApiServer("POST", url, requestObject);
}