import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addCustomer,
  fetchCustomer,
  fetchCustomers,
  fetchPlaces,
  modifyCustomer,
  removeCustomer,
} from "./customerActions";
const initialState = {
  status: "idle",
  search: "",
  places: [],
};

export const getPlaces = createAsyncThunk(
  "GET_PLACES",
  async (requestObject) => {
    const { data, status } = await fetchPlaces(requestObject);
    return { data, status };
  }
);
export const createCustomer = createAsyncThunk(
  "CREATE_CUSTOMER",
  async (requestObject) => {
    const { data, status } = await addCustomer(requestObject);
    return { data, status };
  }
);
export const getCustomer = createAsyncThunk(
  "GET_CUSTOMER",
  async (requestObject) => {
    const { data, status } = await fetchCustomer(requestObject);
    return { data, status };
  }
);
export const updateCustomer = createAsyncThunk(
  "UPDATE_CUSTOMER",
  async (requestObject) => {
    const { data, status } = await modifyCustomer(requestObject);
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

export const deleteCustomer = createAsyncThunk(
  "DELETE_CUSTOMER",
  async (requestObject) => {
    const { data, status } = await removeCustomer(requestObject);
    return { data, status };
  }
);

export const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCustomer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createCustomer.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createCustomer.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getPlaces.fulfilled, (state, { payload }) => {
        state.places = payload.data;
      })

      .addCase(getCustomer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getCustomer.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getCustomer.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateCustomer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateCustomer.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateCustomer.rejected, (state) => {
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

      .addCase(deleteCustomer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCustomer.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteCustomer.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = customerSlice.actions;
export default customerSlice.reducer;
export const selectIsLoading = (state) => state.customer.status === "loading";
