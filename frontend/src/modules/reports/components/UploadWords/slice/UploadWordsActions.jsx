import fetchFromApiServer from "@services/api";

export function fetchUploadedWords() {
    const url = `api/transactions/getUploadedWords`;
    return fetchFromApiServer("GET", url);
}

export function fetchUploadWord(file) {
    const url = `api/transactions/uploadWord`;
    const formData = new FormData();
    formData.append("file", file);
    return fetchFromApiServer("UPLOAD", url, formData);
}

export function fetchDownloadWord(requestObject) {
    const url = `api/transactions/downloadWord`;
    return fetchFromApiServer("BLOB", url, requestObject);
}

export function fetchDeleteWord(requestObject) {
    const url = `api/transactions/deleteWord`;
    return fetchFromApiServer("POST", url, requestObject);
}
