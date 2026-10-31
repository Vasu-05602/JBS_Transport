import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addVehicleType,
  fetchVehicleType,
  fetchVehicleTypes,
  modifyVehicleType,
  removeVehicleType,
} from "./vehicleTypeActions";
const initialState = {
  status: "idle",
  search: "",
};

export const createVehicleType = createAsyncThunk(
  "CREATE_VEHICLE_TYPE",
  async (requestObject) => {
    const { data, status } = await addVehicleType(requestObject);
    return { data, status };
  }
);
export const getVehicleType = createAsyncThunk(
  "GET_VEHICLE_TYPE",
  async (requestObject) => {
    const { data, status } = await fetchVehicleType(requestObject);
    return { data, status };
  }
);
export const updateVehicleType = createAsyncThunk(
  "UPDATE_VEHICLE_TYPE",
  async (requestObject) => {
    const { data, status } = await modifyVehicleType(requestObject);
    return { data, status };
  }
);
export const getVehicleTypes = createAsyncThunk(
  "GET_VEHICLE_TYPES",
  async (requestObject) => {
    const { data, status } = await fetchVehicleTypes(requestObject);
    return { data, status };
  }
);

export const deleteVehicleType = createAsyncThunk(
  "DELETE_VEHICLE_TYPE",
  async (requestObject) => {
    const { data, status } = await removeVehicleType(requestObject);
    return { data, status };
  }
);

export const vehicleTypeSlice = createSlice({
  name: "vehicleType",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createVehicleType.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createVehicleType.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createVehicleType.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getVehicleType.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getVehicleType.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getVehicleType.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateVehicleType.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateVehicleType.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateVehicleType.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getVehicleTypes.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getVehicleTypes.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getVehicleTypes.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteVehicleType.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteVehicleType.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteVehicleType.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = vehicleTypeSlice.actions;
export default vehicleTypeSlice.reducer;
export const selectIsLoading = (state) =>
  state.vehicletype.status === "loading";
