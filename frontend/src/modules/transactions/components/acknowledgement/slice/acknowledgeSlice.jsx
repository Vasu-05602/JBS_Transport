import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getEmpId, hasSuperAdmin } from "../../../../../services/utils";
import {
  fetchAllLRAck,
  fetchBranches,
  fetchChallanAck,
  fetchLoadingSlipsById,
  fetchLorryReceipt,
  fetchLRAck,
  fetchLRAckWithCount,
  modifyLorryReceiptAck,
  modifyMultiLorryReceiptAck,
} from "./acknowledgeActions";

const initialState = {
  status: "idle",
  search: "",
};
export const getBranches = createAsyncThunk(
  "GET_BRANCHES",
  async (requestObject) => {
    const { data, status } = await fetchBranches(requestObject);
    return { data, status };
  }
);

export const getLRAckWithCount = createAsyncThunk(
  "GET_LR_ACK_WITH_COUNT",
  async (requestObject) => {
    const { data, status } = await fetchLRAckWithCount(requestObject);
    return { data, status };
  }
);

export const getLoadingSlipsById = createAsyncThunk(
  "GET_LOADING_SLIP_BY_ID",
  async (requestObject) => {
    const { data, status } = await fetchLoadingSlipsById(requestObject);
    return { data, status };
  }
);

export const getAllLRAck = createAsyncThunk(
  "GET_ALL_LR_ACK",
  async (requestObject) => {
    const { data, status } = await fetchAllLRAck(requestObject);
    return { data, status };
  }
);
export const getChallanAck = createAsyncThunk(
  "GET_CHALLAN_ACK",
  async (requestObject) => {
    const { data, status } = await fetchChallanAck(requestObject);
    return { data, status };
  }
);

export const updateLorryReceiptAck = createAsyncThunk(
  "UPDATE_LR_ACK",
  async (requestObject) => {
    const { data, status } = await modifyLorryReceiptAck(requestObject);
    return { data, status };
  }
);

export const updateMultiLorryReceiptAck = createAsyncThunk(
  "UPDATE_LR_MULTI_ACK",
  async (requestObject) => {
    const { data, status } = await modifyMultiLorryReceiptAck({
      list: requestObject,
      updatedBy: getEmpId(),
    });
    return { data, status };
  }
);

export const getLorryReceipt = createAsyncThunk(
  "GET_LR_RECEIPT",
  async (requestObject) => {
    const { data, status } = await fetchLorryReceipt(requestObject);
    return { data, status };
  }
);

export const getLRAck = createAsyncThunk(
  "GET_LR_ACK",
  async (requestObject) => {
    const { data, status } = await fetchLRAck(requestObject);
    return { data, status };
  }
);

export const acknowledgeSlice = createSlice({
  name: "acknowledge",
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
      .addCase(getBranches.fulfilled, (state) => {
        if (hasSuperAdmin()) {
          state.status = "succeeded";
        }
      })
      .addCase(getBranches.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLRAckWithCount.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLRAckWithCount.fulfilled, (state, { payload }) => {
        if (!payload?.data.lorryReceipts?.length) {
          state.status = "succeeded";
        }
      })
      .addCase(getLRAckWithCount.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLoadingSlipsById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLoadingSlipsById.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLoadingSlipsById.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getAllLRAck.pending, (state) => {
        // state.status = "loading";
      })
      .addCase(getAllLRAck.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getAllLRAck.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getChallanAck.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getChallanAck.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getChallanAck.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLRAck.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLRAck.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLRAck.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLorryReceipt.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLorryReceipt.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLorryReceipt.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateMultiLorryReceiptAck.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateMultiLorryReceiptAck.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateMultiLorryReceiptAck.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateLorryReceiptAck.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateLorryReceiptAck.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateLorryReceiptAck.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = acknowledgeSlice.actions;
export default acknowledgeSlice.reducer;
export const selectIsLoading = (state) =>
  state.acknowledge.status === "loading";
