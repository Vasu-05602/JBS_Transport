import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchBranches,
  fetchBanks,
  fetchBankAccounts,
  fetchSuppliers,
  fetchDrivers,
  fetchEmployees,
  fetchCustomers,
  fetchPettyTransactionsByDate,
  fetchPettyTransactions,
  addPettyTransaction,
  fetchLoadingSlips,
  fetchPettyCashBalance,
} from "./pettyCashActions";

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

export const getSuppliers = createAsyncThunk(
  "GET_SUPPLIERS",
  async (requestObject) => {
    const { data, status } = await fetchSuppliers(requestObject);
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

export const getCustomers = createAsyncThunk(
  "GET_CUSTOMERS",
  async (requestObject) => {
    const { data, status } = await fetchCustomers(requestObject);
    return { data, status };
  }
);

export const getEmployees = createAsyncThunk(
  "GET_EMPLOYEES",
  async (requestObject) => {
    const { data, status } = await fetchEmployees(requestObject);
    return { data, status };
  }
);

export const getDrivers = createAsyncThunk(
  "GET_DRIVERS",
  async (requestObject) => {
    const { data, status } = await fetchDrivers(requestObject);
    return { data, status };
  }
);

export const getPettyTransactions = createAsyncThunk(
  "GET_PETTY_TRANSACTIONS",
  async (requestObject) => {
    const { data, status } = await fetchPettyTransactions(requestObject);
    return { data, status };
  }
);

export const getPettyTransactionsByDate = createAsyncThunk(
  "GET_PETTY_TRANSACTIONS_BY_DATE",
  async (requestObject) => {
    const { data, status } = await fetchPettyTransactionsByDate(requestObject);
    return { data, status };
  }
);

export const createPettyTransaction = createAsyncThunk(
  "CREATE_PETTY_TRANSACTION",
  async (requestObject) => {
    const { data, status } = await addPettyTransaction(requestObject);
    return { data, status };
  }
);

export const getLoadingSlips = createAsyncThunk(
  "GET_LOADING_SLIPS",
  async (requestObject) => {
    const { data, status } = await fetchLoadingSlips(requestObject);
    return { data, status };
  }
);

export const getPettyCashBalance = createAsyncThunk(
  "GET_PETTY_CASH_BALANCE",
  async (requestObject) => {
    const { data, status } = await fetchPettyCashBalance(requestObject);
    return { data, status };
  }
);

export const pettyCashSlice = createSlice({
  name: "pettycash",
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

      .addCase(getBanks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBanks.fulfilled, (state) => {
        // state.status = "succeeded";
      })
      .addCase(getBanks.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getSuppliers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getSuppliers.fulfilled, (state) => {
        // state.status = "succeeded";
      })
      .addCase(getSuppliers.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBankAccounts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBankAccounts.fulfilled, (state) => {
        // state.status = "succeeded";
      })
      .addCase(getBankAccounts.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getDrivers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getDrivers.fulfilled, (state) => {
        // state.status = "succeeded";
      })
      .addCase(getDrivers.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getEmployees.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getEmployees.fulfilled, (state) => {
        // state.status = "succeeded";
      })
      .addCase(getEmployees.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getPettyTransactions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPettyTransactions.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getPettyTransactions.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getPettyTransactionsByDate.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPettyTransactionsByDate.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getPettyTransactionsByDate.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(createPettyTransaction.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createPettyTransaction.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createPettyTransaction.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLoadingSlips.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLoadingSlips.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLoadingSlips.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getPettyCashBalance.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPettyCashBalance.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getPettyCashBalance.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default pettyCashSlice.reducer;
export const selectIsLoading = (state) => state.pettycash.status === "loading";
