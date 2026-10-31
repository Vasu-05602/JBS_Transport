import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addRateMaster,
  fetchArticles,
  fetchCustomersForAddRateMaster,
  fetchCustomersForRateMaster,
  fetchPlaces,
  fetchRateMaster,
  fetchRateMasters,
  modifyRateMaster,
  removeRateMaster,
} from "./rateMasterActions";
const initialState = {
  status: "idle",
  search: "",
};

export const createRateMaster = createAsyncThunk(
  "CREATE_RATE_MASTER",
  async (requestObject) => {
    const { data, status } = await addRateMaster(requestObject);
    return { data, status };
  }
);
export const getRateMaster = createAsyncThunk(
  "GET_RATE_MASTER",
  async (requestObject) => {
    const { data, status } = await fetchRateMaster(requestObject);
    return { data, status };
  }
);
export const updateRateMaster = createAsyncThunk(
  "UPDATE_RATE_MASTER",
  async (requestObject) => {
    const { data, status } = await modifyRateMaster(requestObject);
    return { data, status };
  }
);
export const getRateMasters = createAsyncThunk(
  "GET_RATE_MASTERS",
  async (requestObject) => {
    const { data, status } = await fetchRateMasters(requestObject);
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

export const getArticles = createAsyncThunk(
  "GET_ARTICLES",
  async (requestObject) => {
    const { data, status } = await fetchArticles(requestObject);
    return { data, status };
  }
);

export const getCustomersForRateMaster = createAsyncThunk(
  "GET_CUSTOMERS_FOR_RATE_MASTER",
  async (requestObject) => {
    const { data, status } = await fetchCustomersForRateMaster(requestObject);
    return { data, status };
  }
);


export const getCustomersForAddRateMaster = createAsyncThunk(
  "GET_CUSTOMERS_FOR_ADD_RATE_MASTER",
  async (requestObject) => {
    const { data, status } = await fetchCustomersForAddRateMaster(requestObject);
    return { data, status };
  }
);

export const deleteRateMaster = createAsyncThunk(
  "DELETE_RATE_MASTER",
  async (requestObject) => {
    const { data, status } = await removeRateMaster(requestObject);
    return { data, status };
  }
);

export const rateMasterSlice = createSlice({
  name: "rateMaster",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRateMaster.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createRateMaster.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createRateMaster.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getRateMaster.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getRateMaster.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getRateMaster.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateRateMaster.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateRateMaster.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateRateMaster.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteRateMaster.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRateMaster.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteRateMaster.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getPlaces.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPlaces.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getPlaces.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getRateMasters.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getRateMasters.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getRateMasters.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getArticles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getArticles.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getArticles.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = rateMasterSlice.actions;
export default rateMasterSlice.reducer;
export const selectIsLoading = (state) => state.ratemaster.status === "loading";
