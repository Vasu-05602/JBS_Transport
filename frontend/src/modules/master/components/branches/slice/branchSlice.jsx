import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addBranch,
  fetchBranch,
  fetchBranches,
  fetchPlaces,
  modifyBranch,
  removeBranch,
} from "./branchActions";
const initialState = {
  status: "idle",
  search: "",
  places: [],
};

export const createBranch = createAsyncThunk(
  "CREATE_BRANCH",
  async (requestObject) => {
    const { data, status } = await addBranch(requestObject);
    return { data, status };
  }
);
export const getBranch = createAsyncThunk(
  "GET_BRANCH",
  async (requestObject) => {
    const { data, status } = await fetchBranch(requestObject);
    return { data, status };
  }
);
export const updateBranch = createAsyncThunk(
  "UPDATE_BRANCH",
  async (requestObject) => {
    // Log the requestObject before sending the request
    console.log('Request Object in updateBranch:', requestObject);

    // Call the modifyBranch function and wait for the result
    const { data, status } = await modifyBranch(requestObject);

    // Log the response data and status
    console.log('Response Data:', data);
    console.log('Response Status:', status);

    // Return the data and status as the payload
    return { data, status };
  }
);
export const getBranches = createAsyncThunk(
  "GET_BRANCHES",
  async (requestObject) => {
    const { data, status } = await fetchBranches(requestObject);
    return { data, status };
  }
);

export const deleteBranch = createAsyncThunk(
  "DELETE_BRANCH",
  async (requestObject) => {
    const { data, status } = await removeBranch(requestObject);
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

export const branchSlice = createSlice({
  name: "branch",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBranch.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createBranch.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createBranch.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBranch.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBranch.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBranch.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateBranch.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateBranch.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateBranch.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBranches.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBranches.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBranches.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteBranch.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBranch.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteBranch.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getPlaces.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPlaces.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.places = payload.data?.map?.((place) => ({
          ...place,
          label: place.name,
          value: place._id,
        }));
      })
      .addCase(getPlaces.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = branchSlice.actions;
export default branchSlice.reducer;
export const selectIsLoading = (state) => state.branch.status === "loading";
