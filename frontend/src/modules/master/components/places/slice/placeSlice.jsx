import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addPlace,
  fetchPlace,
  fetchPlaces,
  modifyPlace,
  removePlace,
} from "./placeActions";
const initialState = {
  status: "idle",
  search: "",
};

export const createPlace = createAsyncThunk(
  "CREATE_PLACE",
  async (requestObject) => {
    const { data, status } = await addPlace(requestObject);
    return { data, status };
  }
);
export const getPlace = createAsyncThunk("GET_PLACE", async (requestObject) => {
  const { data, status } = await fetchPlace(requestObject);
  return { data, status };
});
export const updatePlace = createAsyncThunk(
  "UPDATE_PLACE",
  async (requestObject) => {
    const { data, status } = await modifyPlace(requestObject);
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

export const deletePlace = createAsyncThunk(
  "DELETE_PLACE",
  async (requestObject) => {
    const { data, status } = await removePlace(requestObject);
    return { data, status };
  }
);

export const placeSlice = createSlice({
  name: "place",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPlace.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createPlace.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createPlace.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getPlace.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPlace.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getPlace.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updatePlace.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updatePlace.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updatePlace.rejected, (state) => {
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

      .addCase(deletePlace.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deletePlace.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deletePlace.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = placeSlice.actions;
export default placeSlice.reducer;
export const selectIsLoading = (state) => state.place.status === "loading";
