import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchBranches,
  fetchCustomers,
  fetchLoadingSlipForReport,
  fetchLRChallanReport,
} from "./tripSheetActions";

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

export const getLoadingSlipForReport = createAsyncThunk(
  "GET_LOADING_SLIP_FOR_REPORT",
  async (requestObject) => {
    const { data, status } = await fetchLoadingSlipForReport(requestObject);
    return { data, status };
  }
);

export const downloadChallanReport = createAsyncThunk(
  "GET_LR_FOR_CHALLAN_REPORT",
  async (requestObject) => {
    const { data, status } = await fetchLRChallanReport(requestObject);

    return { data, status };
  }
);
export const tripSheetSlice = createSlice({
  name: "tripsheet",
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

      .addCase(getLoadingSlipForReport.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLoadingSlipForReport.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLoadingSlipForReport.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(downloadChallanReport.pending, (state) => {
        state.status = "loading";
      })
      .addCase(downloadChallanReport.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(downloadChallanReport.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default tripSheetSlice.reducer;
export const selectIsLoading = (state) =>
  state.tripsheetreport.status === "loading";
