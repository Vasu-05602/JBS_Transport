import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addBank,
  fetchBank,
  fetchBanks,
  modifyBank,
  removeBank,
} from "./bankActions";
const initialState = {
  status: "idle",
  search: "",
};

export const createBank = createAsyncThunk(
  "CREATE_BANK",
  async (requestObject) => {
    const { data, status } = await addBank(requestObject);
    return { data, status };
  }
);
export const getBank = createAsyncThunk("GET_BANK", async (requestObject) => {
  const { data, status } = await fetchBank(requestObject);
  return { data, status };
});
export const updateBank = createAsyncThunk(
  "UPDATE_BANK",
  async (requestObject) => {
    const { data, status } = await modifyBank(requestObject);
    return { data, status };
  }
);
export const getBanks = createAsyncThunk("GET_BANKS", async (requestObject) => {
  const { data, status } = await fetchBanks(requestObject);
  return { data, status };
});

export const deleteBank = createAsyncThunk(
  "DELETE_BANK",
  async (requestObject) => {
    const { data, status } = await removeBank(requestObject);
    return { data, status };
  }
);

export const bankSlice = createSlice({
  name: "bank",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBank.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createBank.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createBank.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBank.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBank.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBank.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateBank.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateBank.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateBank.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBanks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBanks.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBanks.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteBank.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBank.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteBank.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = bankSlice.actions;
export default bankSlice.reducer;
export const selectIsLoading = (state) => state.bank.status === "loading";
