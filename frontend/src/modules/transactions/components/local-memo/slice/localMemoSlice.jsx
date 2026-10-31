import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  fetchPlaces,
  fetchBranches,
  removeLoadingSlip,
  fetchLoadingSlips,
} from "./localMemoActions";

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

export const getPlaces = createAsyncThunk(
  "GET_PLACES",
  async (requestObject) => {
    const { data, status } = await fetchPlaces(requestObject);
    return { data, status };
  }
);
export const getLoadingSlips = createAsyncThunk(
  "GE_LORRY_RECEIPTS",
  async (requestObject) => {
    const { data, status } = await fetchLoadingSlips(requestObject);
    return { data, status };
  }
);

export const deleteLoadingSlip = createAsyncThunk(
  "DELETE_LOADING_BILL",
  async (requestObject) => {
    const { data, status } = await removeLoadingSlip(requestObject);
    return { data, status };
  }
);

export const localMemoSlice = createSlice({
  name: "localmemo",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getBranches.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBranches.fulfilled, (state) => {
        // state.status = "succeeded";
      })
      .addCase(getBranches.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getPlaces.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPlaces.fulfilled, (state) => {
        // state.status = "succeeded";
      })
      .addCase(getPlaces.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLoadingSlips.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLoadingSlips.fulfilled, (state) => {
        // state.status = "succeeded";
      })
      .addCase(getLoadingSlips.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteLoadingSlip.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteLoadingSlip.fulfilled, (state) => {
        // state.status = "succeeded";
      })
      .addCase(deleteLoadingSlip.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default localMemoSlice.reducer;
export const selectIsLoading = (state) => state.localmemo.status === "loading";
