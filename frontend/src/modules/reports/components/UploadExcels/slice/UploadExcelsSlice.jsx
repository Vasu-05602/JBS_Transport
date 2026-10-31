import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    fetchUploadedExcels,
    fetchUploadExcel,
    fetchDownloadExcel,
    fetchDeleteExcel,
} from "./UploadExcelsActions";

const initialState = {
    status: "idle",
};

export const getUploadedExcels = createAsyncThunk(
    "GET_UPLOADED_EXCELS",
    async (requestObject) => {
        const { data, status } = await fetchUploadedExcels(requestObject);
        return { data, status };
    }
);

// export const uploadExcel = createAsyncThunk(
//   "UPLOAD_EXCEL",
//   async (requestObject) => {
//     const { data, status } = await fetchUploadExcel(requestObject);
//     return { data, status };
//   }
// );

// UploadExcelsSlice.js
export const uploadExcel = createAsyncThunk(
    "UPLOAD_EXCEL",
    async (file) => {                      // ← rename requestObject to file
        const { data, status } = await fetchUploadExcel(file);
        return { data, status };
    }
);

export const downloadExcel = createAsyncThunk(
    "DOWNLOAD_EXCEL",
    async (requestObject) => {
        const { data, status } = await fetchDownloadExcel(requestObject);
        return { data, status };
    }
);

export const deleteExcel = createAsyncThunk(
    "DELETE_EXCEL",
    async (requestObject) => {
        const { data, status } = await fetchDeleteExcel(requestObject);
        return { data, status };
    }
);

export const UploadExcelSlice = createSlice({
    name: "UploadExcel",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getUploadedExcels.pending, (state) => {
                state.status = "loading";
            })
            .addCase(getUploadedExcels.fulfilled, (state) => {
                state.status = "succeeded";
            })
            .addCase(getUploadedExcels.rejected, (state) => {
                state.status = "failed";
            })

            .addCase(uploadExcel.pending, (state) => {
                state.status = "loading";
            })
            .addCase(uploadExcel.fulfilled, (state) => {
                state.status = "succeeded";
            })
            .addCase(uploadExcel.rejected, (state) => {
                state.status = "failed";
            })

            .addCase(downloadExcel.pending, (state) => {
                state.status = "loading";
            })
            .addCase(downloadExcel.fulfilled, (state) => {
                state.status = "succeeded";
            })
            .addCase(downloadExcel.rejected, (state) => {
                state.status = "failed";
            })

            .addCase(deleteExcel.pending, (state) => {
                state.status = "loading";
            })
            .addCase(deleteExcel.fulfilled, (state) => {
                state.status = "succeeded";
            })
            .addCase(deleteExcel.rejected, (state) => {
                state.status = "failed";
            });
    },
});

export default UploadExcelSlice.reducer;

export const selectIsLoading = (state) =>
    state.UploadExcel?.status === "loading";