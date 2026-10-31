import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addBankAccount,
  fetchBankAccount,
  fetchBankAccounts,
  fetchBanks,
  modifyBankAccount,
  removeBankAccount,
} from "./bankAccountActions";
const initialState = {
  status: "idle",
  search: "",
  banks: [],
};

export const createBankAccount = createAsyncThunk(
  "CREATE_BANK_ACCOUNT",
  async (requestObject) => {
    const { data, status } = await addBankAccount(requestObject);
    return { data, status };
  }
);
export const getBankAccount = createAsyncThunk(
  "GET_BANK_ACCOUNT",
  async (requestObject) => {
    const { data, status } = await fetchBankAccount(requestObject);
    return { data, status };
  }
);
export const updateBankAccount = createAsyncThunk(
  "UPDATE_BANK_ACCOUNT",
  async (requestObject) => {
    const { data, status } = await modifyBankAccount(requestObject);
    return { data, status };
  }
);
export const getBankAccounts = createAsyncThunk(
  "GET_BANK_ACCOUNTS",
  async (requestObject) => {
    const { data, status } = await fetchBankAccounts(requestObject);
    return { data, status };
  }
);

export const deleteBankAccount = createAsyncThunk(
  "DELETE_BANK_ACCOUNT",
  async (requestObject) => {
    const { data, status } = await removeBankAccount(requestObject);
    return { data, status };
  }
);

export const getBanks = createAsyncThunk("GET_BANKS", async (requestObject) => {
  const { data, status } = await fetchBanks(requestObject);
  return { data, status };
});

export const bankAccountSlice = createSlice({
  name: "bankAccount",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBankAccount.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createBankAccount.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createBankAccount.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBankAccount.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBankAccount.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBankAccount.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateBankAccount.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateBankAccount.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateBankAccount.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBankAccounts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBankAccounts.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBankAccounts.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteBankAccount.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBankAccount.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteBankAccount.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBanks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBanks.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.banks = payload.data?.map?.((bank) => ({
          ...bank,
          label: bank.name,
          value: bank._id,
        }));
      })
      .addCase(getBanks.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = bankAccountSlice.actions;
export default bankAccountSlice.reducer;
export const selectIsLoading = (state) =>
  state.bankaccount.status === "loading";
