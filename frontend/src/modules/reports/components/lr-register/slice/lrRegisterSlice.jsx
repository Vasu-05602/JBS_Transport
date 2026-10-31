import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchBranches,
  fetchCustomers,
  fetchLorryReceiptsForReport,
  fetchLRReport,
} from "./lrRegisterActions";

const initialState = {
  status: "idle",
};
export const getBranches = createAsyncThunk(
  "GET_BRANCHES",
  async (requestObject) => {
    const { data, status } = await fetchBranches(requestObject);
    return { data, status };
  }
);

export const getCustomers = createAsyncThunk(
  "GET_CUSTOMER",
  async (requestObject) => {
    const { data, status } = await fetchCustomers(requestObject);
    return { data, status };
  }
);

export const getLorryReceiptsForReport = createAsyncThunk(
  "GET_LR_RECEIPT_FOR_REPORT",
  async (requestObject) => {
    const { data, status } = await fetchLorryReceiptsForReport(requestObject);
    return { data, status };
  }
);

export const downloadLRReport = createAsyncThunk(
  "GET_LR_FOR_REPORT",
  async (requestObject) => {
    const { data, status } = await fetchLRReport(requestObject);

    return { data, status };
  }
);
export const lrRegisterSlice = createSlice({
  name: "lrRegister",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getBranches.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBranches.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBranches.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLorryReceiptsForReport.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLorryReceiptsForReport.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLorryReceiptsForReport.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(downloadLRReport.pending, (state) => {
        state.status = "loading";
      })
      .addCase(downloadLRReport.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(downloadLRReport.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default lrRegisterSlice.reducer;
export const selectIsLoading = (state) =>
  state.lrregisterreport.status === "loading";
