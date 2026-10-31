import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchBranches,
  fetchCustomers,
  fetchLoadingSlipForReport,
  fetchLRReport,
  fetchLRChallanReport,
  fetchgetBillRegisterReport,
} from "./BillresgisterAction";

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

export const getBillRegisterReport = createAsyncThunk(
  "GET_LR_RECEIPT_FOR_REPORT",
  async (requestObject) => {
    const { data, status } = await fetchgetBillRegisterReport(requestObject);
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

export const BillRegisterSlice = createSlice({
  name: "BillRegister",
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
      })

      .addCase(getBillRegisterReport.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBillRegisterReport.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBillRegisterReport.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getCustomers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getCustomers.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getCustomers.rejected, (state) => {
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

export default BillRegisterSlice.reducer;

export const selectIsLoading = (state) => state.BillRegister.status === "loading";
