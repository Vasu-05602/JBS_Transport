import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addDriver,
  fetchDriver,
  fetchDrivers,
  modifyDriver,
  removeDriver,
  fetchLastDriver,
} from "./driverActions";
const initialState = {
  status: "idle",
  search: "",
};

export const createDriver = createAsyncThunk(
  "CREATE_DRIVER",
  async (requestObject) => {
    const { data, status } = await addDriver(requestObject);
    return { data, status };
  }
);
export const getDriver = createAsyncThunk(
  "GET_DRIVER",
  async (requestObject) => {
    const { data, status } = await fetchDriver(requestObject);
    return { data, status };
  }
);
export const updateDriver = createAsyncThunk(
  "UPDATE_DRIVER",
  async (requestObject) => {
    const { data, status } = await modifyDriver(requestObject);
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

export const deleteDriver = createAsyncThunk(
  "DELETE_DRIVER",
  async (requestObject) => {
    const { data, status } = await removeDriver(requestObject);
    return { data, status };
  }
);

export const getLastDriver = createAsyncThunk(
  "GET_LAST_DRIVER",
  async (requestObject) => {
    const { data, status } = await fetchLastDriver(requestObject);
    return { data, status };
  }
);

export const driverSlice = createSlice({
  name: "driver",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDriver.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createDriver.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createDriver.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getDriver.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getDriver.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getDriver.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateDriver.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateDriver.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateDriver.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getDrivers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getDrivers.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getDrivers.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteDriver.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteDriver.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteDriver.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLastDriver.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLastDriver.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLastDriver.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = driverSlice.actions;
export default driverSlice.reducer;
export const selectIsLoading = (state) => state.driver.status === "loading";
