import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addVehicle,
  fetchSuppliers,
  fetchVehicle,
  fetchVehicles,
  fetchVehicleTypes,
  modifyVehicle,
  removeVehicle,
} from "./vehicleActions";
const initialState = {
  status: "idle",
  search: "",
  vehicleTypes: [],
  suppliers: [],
};

export const createVehicle = createAsyncThunk(
  "CREATE_VEHICLE",
  async (requestObject) => {
    const { data, status } = await addVehicle(requestObject);
    return { data, status };
  }
);
export const getVehicle = createAsyncThunk(
  "GET_VEHICLE",
  async (requestObject) => {
    const { data, status } = await fetchVehicle(requestObject);
    return { data, status };
  }
);
export const updateVehicle = createAsyncThunk(
  "UPDATE_VEHICLE",
  async (requestObject) => {
    const { data, status } = await modifyVehicle(requestObject);
    return { data, status };
  }
);
export const getVehicles = createAsyncThunk(
  "GET_VEHICLES",
  async (requestObject) => {
    const { data, status } = await fetchVehicles(requestObject);
    return { data, status };
  }
);

export const deleteVehicle = createAsyncThunk(
  "DELETE_VEHICLE",
  async (requestObject) => {
    const { data, status } = await removeVehicle(requestObject);
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

export const getSuppliers = createAsyncThunk(
  "GET_SUPPLIERS",
  async (requestObject) => {
    const { data, status } = await fetchSuppliers(requestObject);
    return { data, status };
  }
);

export const vehicleSlice = createSlice({
  name: "vehicle",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createVehicle.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createVehicle.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createVehicle.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getVehicle.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getVehicle.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getVehicle.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getVehicles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getVehicles.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getVehicles.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateVehicle.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateVehicle.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateVehicle.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getVehicleTypes.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getVehicleTypes.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.vehicleTypes = payload.data?.map?.((type) => ({
          ...type,
          label: type.type,
          value: type._id,
        }));
      })
      .addCase(getVehicleTypes.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteVehicle.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteVehicle.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteVehicle.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getSuppliers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getSuppliers.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.suppliers = payload.data?.map?.((supplier) => ({
          ...supplier,
          label: supplier.name,
          value: supplier._id,
        }));
      })
      .addCase(getSuppliers.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = vehicleSlice.actions;
export default vehicleSlice.reducer;
export const selectIsLoading = (state) => state.vehicle.status === "loading";
