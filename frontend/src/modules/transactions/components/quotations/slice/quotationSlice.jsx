import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addQuotation,
  fetchBranches,
  fetchCustomers,
  fetchPlaces,
  fetchQuotation,
  fetchQuotations,
  modifyQuotation,
  removeQuotation,
  viewQuotationFile,
} from "./quotationActions";

const initialState = {
  status: "idle",
  places: [],
  branches: [],
  customers: [],
  search: "",
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

export const getPlaces = createAsyncThunk(
  "GET_PLACES",
  async (requestObject) => {
    const { data, status } = await fetchPlaces(requestObject);
    return { data, status };
  }
);

export const createQuotation = createAsyncThunk(
  "CREATE_QUOTATION",
  async (requestObject) => {
    const { data, status } = await addQuotation(requestObject);
    return { data, status };
  }
);

export const getQuotation = createAsyncThunk(
  "GET_QUOTATION",
  async (requestObject) => {
    const { data, status } = await fetchQuotation(requestObject);
    return { data, status };
  }
);

export const updateQuotation = createAsyncThunk(
  "UPDATE_QUOTATION",
  async (requestObject) => {
    const { data, status } = await modifyQuotation(requestObject);
    return { data, status };
  }
);

// export const getQuotations = createAsyncThunk(
//   "GET_QUOTATIONS",
//   async (requestObject) => {
//     const { data, status } = await fetchQuotations(requestObject);
//     return { data, status };
//   }
// );

export const getQuotations = createAsyncThunk(
  "GET_QUOTATIONS",
  async (requestObject) => {
    const { data, status } = await fetchQuotations(requestObject);
    return { data: data?.data ?? data, status }; // unwrap the extra "data" layer
  }
);

export const deleteQuotation = createAsyncThunk(
  "DELETE_QUOTATION",
  async (requestObject) => {
    const { data, status } = await removeQuotation(requestObject);
    return { data, status };
  }
);

export const downloadQuotation = createAsyncThunk(
  "DOWNLOAD_QUOTATION",
  async (requestObject) => {
    const { data, status } = await viewQuotationFile(requestObject);
    return { data, status };
  }
);

export const quotationSlice = createSlice({
  name: "quotation",
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
      // .addCase(getBranches.fulfilled, (state, { payload }) => {
      //   state.status = "succeeded";
      //   state.branches = payload?.data;
      // })
      .addCase(getBranches.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.branches = payload?.data?.map?.((branch) => ({
          _id: branch.branch_id,
          name: branch.branch_name,
        }));
      })
      .addCase(getBranches.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(getPlaces.pending, (state) => {
        state.status = "loading";
      })
      // .addCase(getPlaces.fulfilled, (state, { payload }) => {
      //    state.status = "succeeded";
      //   state.places = payload?.data?.map?.((place) => {
      //     return { ...place, label: place.name, value: place.name };
      //   });
      // })

      .addCase(getPlaces.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.places = payload?.data?.map?.((place) => {
          return {
            ...place,
            _id: place.place_id,
            label: place.place_name,
            value: place.place_name,
          };
        });
      })

      .addCase(getPlaces.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getCustomers.pending, (state) => { })
      // .addCase(getCustomers.fulfilled, (state, { payload }) => {
      //   state.customers = payload?.data?.map?.((customer) => {
      //     return { ...customer, label: customer.name };
      //   });
      // })

      .addCase(getCustomers.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.customers = payload?.data?.map?.((customer) => {
          return { ...customer, _id: customer.customer_id, label: customer.customer_name };
        });
      })

      .addCase(getCustomers.rejected, (state) => { })

      .addCase(createQuotation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createQuotation.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createQuotation.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getQuotation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getQuotation.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getQuotation.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateQuotation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateQuotation.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateQuotation.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getQuotations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getQuotations.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getQuotations.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteQuotation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteQuotation.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteQuotation.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(downloadQuotation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(downloadQuotation.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(downloadQuotation.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = quotationSlice.actions;
export default quotationSlice.reducer;
export const selectIsLoading = (state) => state.quotation.status === "loading";
