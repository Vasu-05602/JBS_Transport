import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  fetchBranches,
  addMoneyTransfer,
  modifyMoneyTransfer,
  fetchMoneyTransfer,
  fetchMoneyTransfers,
  removeMoneyTransfer,
} from "./moneyTransferActions";

const initialState = {
  status: "idle",
  search: "",
};

export const getBranches = createAsyncThunk(
  "GET_BRANCHES",
  async (requestObject) => {
    const { data, status } = await fetchBranches(requestObject);
    return { data, status };
  }
);

export const createMoneyTransfer = createAsyncThunk(
  "CREATE_MONEY_TRANSFER",
  async (requestObject) => {
    const { data, status } = await addMoneyTransfer(requestObject);
    return { data, status };
  }
);

export const updateMoneyTransfer = createAsyncThunk(
  "UPDATE_MONEY_TRANSFER",
  async (requestObject) => {
    const { data, status } = await modifyMoneyTransfer(requestObject);
    return { data, status };
  }
);

export const getMoneyTransfers = createAsyncThunk(
  "GET_MONEY_TRANSFERS",
  async (requestObject) => {
    const { data, status } = await fetchMoneyTransfers(requestObject);
    return { data, status };
  }
);

export const getMoneyTransfer = createAsyncThunk(
  "GET_MONEY_TRANSFER",
  async (requestObject) => {
    const { data, status } = await fetchMoneyTransfer(requestObject);
    return { data, status };
  }
);

export const deleteMoneyTransfer = createAsyncThunk(
  "DELETE_MONEY_TRANSFER",
  async (requestObject) => {
    const { data, status } = await removeMoneyTransfer(requestObject);
    return { data, status };
  }
);

export const moneyTransferSlice = createSlice({
  name: "moneytransfer",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBranches.pending, (state) => {
        // state.status = "loading";
      })
      .addCase(getBranches.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBranches.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(createMoneyTransfer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createMoneyTransfer.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createMoneyTransfer.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateMoneyTransfer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateMoneyTransfer.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateMoneyTransfer.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getMoneyTransfers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getMoneyTransfers.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getMoneyTransfers.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getMoneyTransfer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getMoneyTransfer.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getMoneyTransfer.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteMoneyTransfer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteMoneyTransfer.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteMoneyTransfer.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = moneyTransferSlice.actions;
export default moneyTransferSlice.reducer;
export const selectIsLoading = (state) =>
  state.moneytransfer.status === "loading";
