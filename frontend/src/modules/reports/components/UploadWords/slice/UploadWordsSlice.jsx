import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    fetchUploadedWords,
    fetchUploadWord,
    fetchDownloadWord,
    fetchDeleteWord,
} from "./UploadWordsActions";

const initialState = {
    status: "idle",
};

export const getUploadedWords = createAsyncThunk(
    "GET_UPLOADED_WORDS",
    async (requestObject) => {
        const { data, status } = await fetchUploadedWords(requestObject);
        return { data, status };
    }
);

export const uploadWord = createAsyncThunk(
    "UPLOAD_WORD",
    async (file) => {
        const { data, status } = await fetchUploadWord(file);
        return { data, status };
    }
);

export const downloadWord = createAsyncThunk(
    "DOWNLOAD_WORD",
    async (requestObject) => {
        const { data, status } = await fetchDownloadWord(requestObject);
        return { data, status };
    }
);

export const deleteWord = createAsyncThunk(
    "DELETE_WORD",
    async (requestObject) => {
        const { data, status } = await fetchDeleteWord(requestObject);
        return { data, status };
    }
);

export const UploadWordSlice = createSlice({
    name: "UploadWord",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getUploadedWords.pending, (state) => {
                state.status = "loading";
            })
            .addCase(getUploadedWords.fulfilled, (state) => {
                state.status = "succeeded";
            })
            .addCase(getUploadedWords.rejected, (state) => {
                state.status = "failed";
            })

            .addCase(uploadWord.pending, (state) => {
                state.status = "loading";
            })
            .addCase(uploadWord.fulfilled, (state) => {
                state.status = "succeeded";
            })
            .addCase(uploadWord.rejected, (state) => {
                state.status = "failed";
            })

            .addCase(downloadWord.pending, (state) => {
                state.status = "loading";
            })
            .addCase(downloadWord.fulfilled, (state) => {
                state.status = "succeeded";
            })
            .addCase(downloadWord.rejected, (state) => {
                state.status = "failed";
            })

            .addCase(deleteWord.pending, (state) => {
                state.status = "loading";
            })
            .addCase(deleteWord.fulfilled, (state) => {
                state.status = "succeeded";
            })
            .addCase(deleteWord.rejected, (state) => {
                state.status = "failed";
            });
    },
});

export default UploadWordSlice.reducer;

export const selectIsLoading = (state) =>
    state.UploadWord?.status === "loading";
