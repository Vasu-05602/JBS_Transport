import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchBranches,
  fetchBanks,
  fetchBankAccounts,
  fetchCustomersByBranch,
  modifyBills,
  fetchBillsByCustomer,
  viewPaymentCollection,
} from "./paymentCollectionActions";

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

export const getCustomersByBranch = createAsyncThunk(
  "GET_CUSTOMER_BY_BRANCH",
  async (requestObject) => {
    const { data, status } = await fetchCustomersByBranch(requestObject);
    return { data, status };
  }
);

export const downloadPaymentCollection = createAsyncThunk(
  "DOWNLOAD_COLLECTION",
  async (requestObject) => {
    const { data, status } = await viewPaymentCollection(requestObject);
    return { data, status };
  }
);

export const getBanks = createAsyncThunk("GET_BANKS", async (requestObject) => {
  const { data, status } = await fetchBanks(requestObject);
  return { data, status };
});

export const getBankAccounts = createAsyncThunk(
  "GET_BANK_ACCOUNTS",
  async (requestObject) => {
    const { data, status } = await fetchBankAccounts(requestObject);
    return { data, status };
  }
);

export const getBillsByCustomer = createAsyncThunk(
  "GET_BILLS_BY_CUSTOMER",
  async (requestObject) => {
    const { data, status } = await fetchBillsByCustomer(requestObject);
    return { data, status };
  }
);

export const updateBills = createAsyncThunk(
  "UPDATE_BILLS",
  async (requestObject) => {
    const { data, status } = await modifyBills(requestObject);
    return { data, status };
  }
);

export const paymentCollectionSlice = createSlice({
  name: "paymentcollection",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
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

      .addCase(downloadPaymentCollection.pending, (state) => {
        state.status = "loading";
      })
      .addCase(downloadPaymentCollection.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(downloadPaymentCollection.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBanks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBanks.fulfilled, () => {
        // state.status = "succeeded";
      })
      .addCase(getBanks.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBankAccounts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBankAccounts.fulfilled, () => {
        // state.status = "succeeded";
      })
      .addCase(getBankAccounts.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBillsByCustomer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBillsByCustomer.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBillsByCustomer.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateBills.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateBills.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateBills.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = paymentCollectionSlice.actions;
export default paymentCollectionSlice.reducer;
export const selectIsLoading = (state) =>
  state.paymentcollection.status === "loading";
