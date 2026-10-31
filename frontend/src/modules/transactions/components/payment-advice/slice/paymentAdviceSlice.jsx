import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  fetchBranches,
  addSupplierBill,
  fetchBanks,
  fetchBankAccounts,
  fetchLoadingSlipsBySupplier,
  addSupplierPayments,
  fetchPlaces,
  fetchSuppliersByType,
  fetchSupplierBills,
  modifySupplierBills,
  fetchSupplier,
} from "./paymentAdviceActions";

const initialState = {
  status: "idle",
  branches: [],
  suppliers: [],
  banks: [],
  bankAccounts: [],
  search: "",
};

export const getBranches = createAsyncThunk(
  "GET_BRANCHES",
  async (requestObject) => {
    const { data, status } = await fetchBranches(requestObject);
    return { data, status };
  }
);

export const getSupplier = createAsyncThunk(
  "GET_SUPPLIER",
  async (requestObject) => {
    const { data, status } = await fetchSupplier(requestObject);
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

export const createSupplierBill = createAsyncThunk(
  "CREATE_SUPPLIER_BILL",
  async (requestObject) => {
    const { data, status } = await addSupplierBill(requestObject);
    return { data, status };
  }
);

export const createSupplierPayments = createAsyncThunk(
  "CREATE_SUPPLIER_PAYMENTS",
  async (requestObject) => {
    const { data, status } = await addSupplierPayments(requestObject);
    return { data, status };
  }
);

export const getLoadingSlipsBySupplier = createAsyncThunk(
  "GET_LOADING_SLIPS_BY_SUPPLIER",
  async (requestObject) => {
    const { data, status } = await fetchLoadingSlipsBySupplier(requestObject);
    return { data, status };
  }
);

export const getSuppliersByType = createAsyncThunk(
  "GET_SUPPLIER_BY_TYPE",
  async (requestObject) => {
    const { data, status } = await fetchSuppliersByType(requestObject);
    return { data, status };
  }
);

export const getSupplierBills = createAsyncThunk(
  "GET_SUPPLIER_BILLS",
  async (requestObject) => {
    const { data, status } = await fetchSupplierBills(requestObject);
    return { data, status };
  }
);

export const updateSupplierBills = createAsyncThunk(
  "UPDATE_SUPPLIER_BILLS",
  async (requestObject) => {
    const { data, status } = await modifySupplierBills(requestObject);
    return { data, status };
  }
);

export const paymentAdviceSlice = createSlice({
  name: "paymentadvice",
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
      .addCase(getBranches.fulfilled, (state, { payload }) => {
        // state.status = "succeeded";
        state.branches = payload?.data?.map?.((account) => {
          return {
            ...account,
            label: account.accountNo,
            value: account.accountNo,
          };
        });
      })
      .addCase(getBranches.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBanks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBanks.fulfilled, (state, { payload }) => {
        // state.status = "succeeded";
        state.banks = payload?.data?.map?.((bank) => {
          return {
            ...bank,
            label: bank.name,
            value: bank.name,
          };
        });
      })
      .addCase(getBanks.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBankAccounts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBankAccounts.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.bankAccounts = payload?.data;
      })
      .addCase(getBankAccounts.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getSupplier.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getSupplier.fulfilled, (state, { payload }) => {
        // state.status = "succeeded";
        state.suppliers = payload?.data;
      })
      .addCase(getSupplier.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getPlaces.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPlaces.fulfilled, (state, { payload }) => {
        // state.status = "succeeded";
        state.places = payload?.data;
      })
      .addCase(getPlaces.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(createSupplierBill.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createSupplierBill.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createSupplierBill.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(createSupplierPayments.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createSupplierPayments.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createSupplierPayments.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLoadingSlipsBySupplier.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLoadingSlipsBySupplier.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLoadingSlipsBySupplier.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getSuppliersByType.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getSuppliersByType.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getSuppliersByType.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getSupplierBills.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getSupplierBills.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getSupplierBills.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateSupplierBills.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateSupplierBills.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateSupplierBills.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = paymentAdviceSlice.actions;
export default paymentAdviceSlice.reducer;
export const selectIsLoading = (state) =>
  state.paymentadvice.status === "loading";
