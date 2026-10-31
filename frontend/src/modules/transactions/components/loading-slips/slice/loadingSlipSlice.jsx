import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { hasSuperAdmin } from "../../../../../services/utils";
import {
  fetchDrivers,
  fetchPlaces,
  fetchSuppliers,
  fetchVehicles,
  fetchBranches,
  fetchCustomers,
  addLoadingSlip,
  fetchLorryReceiptsForLS,
  printLoadingSlip,
  fetchLorryReceipts,
  modifyLoadingSlip,
  fetchLoadingSlip,
  removeLoadingSlip,
  fetchLoadingSlips,
  exportToExcelChallans,
  fetchLorryReceiptsForLSdetails,
} from "./loadingSlipActions";

const initialState = {
  status: "idle",
  branches: [],
  customers: [],
  vehicles: [],
  suppliers: [],
  places: [],
  drivers: [],
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
  "GET_CUSTOMERS",
  async (requestObject) => {
    const { data, status } = await fetchCustomers(requestObject);
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

export const getSuppliers = createAsyncThunk(
  "GET_SUPPLIERS",
  async (requestObject) => {
    const { data, status } = await fetchSuppliers(requestObject);
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

export const getDrivers = createAsyncThunk(
  "GET_DRIVERS",
  async (requestObject) => {
    const { data, status } = await fetchDrivers(requestObject);
    return { data, status };
  }
);

export const createLoadingSlip = createAsyncThunk(
  "CREATE_LOADING_SLIP",
  async (requestObject) => {
    const { data, status } = await addLoadingSlip(requestObject);
    return { data, status };
  }
);

export const getLorryReceiptsForLS = createAsyncThunk(
  "GET_LR_RECEIPT_FOR_LS",
  async (requestObject) => {
    const { data, status } = await fetchLorryReceiptsForLS(requestObject);
    return { data, status };
  }
);

export const downloadLoadingSlip = createAsyncThunk(
  "DOWNLOAD_LOADING_SLIP",
  async (requestObject) => {
    const { data, status } = await printLoadingSlip(requestObject);
    return { data, status };
  }
);

export const getLorryReceipts = createAsyncThunk(
  "GE_LORRY_RECEIPTS",
  async (requestObject) => {
    const { data, status } = await fetchLorryReceipts(requestObject);
    return { data, status };
  }
);

export const getLoadingSlips = createAsyncThunk(
  "GE_LOADING_SLIPS",
  async (requestObject) => {
    const { data, status } = await fetchLoadingSlips(requestObject);
    return { data, status };
  }
);

export const deleteLoadingSlip = createAsyncThunk(
  "DELETE_LOADING_BILL",
  async (requestObject) => {
    const { data, status } = await removeLoadingSlip(requestObject);
    return { data, status };
  }
);
export const getLoadingSlip = createAsyncThunk(
  "GE_LOADING_SLIP",
  async (requestObject) => {
    const { data, status } = await fetchLoadingSlip(requestObject);
    return { data, status };
  }
);

export const updateLoadingSlip = createAsyncThunk(
  "UPDATE_LOADING_SLIP",
  async (requestObject) => {
    const { data, status } = await modifyLoadingSlip(requestObject);
    return { data, status };
  }
);

export const downloadChallans = createAsyncThunk(
  "DOWNLOAD_CHALLANS",
  async (requestObject) => {
    const { data, status } = await exportToExcelChallans(requestObject);
    return { data, status };
  }
);

export const getLorryReceiptsForLSdetials = createAsyncThunk(
  "GET_LR_RECEIPT_FOR_LS_2",
  async (requestObject) => {
    const { data, status } = await fetchLorryReceiptsForLSdetails(requestObject);
    return { data, status };
  }
);


export const loadingSlipSlice = createSlice({
  name: "loadingslip",
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
      .addCase(getBranches.fulfilled, (state, { payload }) => {
        // state.status = "succeeded";
        state.branches = payload?.data?.map?.((branch) => {
          return { ...branch, label: branch.name, value: branch._id };
        });
      })
      .addCase(getBranches.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getVehicles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getVehicles.fulfilled, (state, { payload }) => {
        console.log("payload",payload)
        // state.status = "succeeded";
        state.vehicles = payload?.data?.map?.((vehicle) => {
          return {
            ...vehicle,
            label: vehicle.vehicleno,
            value: vehicle.vehicle_id,
          };
        });
      })
      .addCase(getVehicles.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getSuppliers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getSuppliers.fulfilled, (state, { payload }) => {
        if (hasSuperAdmin()) {
          state.status = "succeeded";
        }
        state.suppliers = payload?.data;
      })
      .addCase(getSuppliers.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getPlaces.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPlaces.fulfilled, (state, { payload }) => {
        // state.status = "succeeded";
        state.places = payload?.data?.map?.((place) => {
          return { ...place, label: place.name, value: place.name };
        });
      })
      .addCase(getPlaces.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getDrivers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getDrivers.fulfilled, (state, { payload }) => {
        // state.status = "succeeded";
        state.drivers = payload?.data?.map?.((driver) => {
          return { ...driver, label: driver.driver_name, value: driver.driver_id };
        });
      })
      .addCase(getDrivers.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(createLoadingSlip.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createLoadingSlip.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createLoadingSlip.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLorryReceiptsForLS.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLorryReceiptsForLS.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLorryReceiptsForLS.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(downloadLoadingSlip.pending, (state) => {
        state.status = "loading";
      })
      .addCase(downloadLoadingSlip.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(downloadLoadingSlip.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLoadingSlips.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLoadingSlips.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLoadingSlips.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteLoadingSlip.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteLoadingSlip.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteLoadingSlip.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLorryReceipts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLorryReceipts.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLorryReceipts.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLoadingSlip.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLoadingSlip.fulfilled, (state) => {
        // state.status = "succeeded";
      })
      .addCase(getLoadingSlip.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(downloadChallans.pending, (state) => {
        state.status = "loading";
      })
      .addCase(downloadChallans.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(downloadChallans.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateLoadingSlip.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateLoadingSlip.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateLoadingSlip.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLorryReceiptsForLSdetials.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLorryReceiptsForLSdetials.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLorryReceiptsForLSdetials.rejected, (state) => {
        state.status = "failed";
      })
  },
});
export const { setSearch } = loadingSlipSlice.actions;
export default loadingSlipSlice.reducer;
export const selectIsLoading = (state) =>
  state.loadingslip.status === "loading";
