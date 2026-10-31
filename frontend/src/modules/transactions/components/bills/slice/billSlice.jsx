import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { hasSuperAdmin } from "../../../../../services/utils";
import {
  addBill,
  exportToExcelBill,
  exportToExcelBills,
  fetchBill,
  fetchBills,
  fetchBranches,
  fetchCustomers,
  fetchLorryReceiptsByConsignor,
  fetchLorryReceiptsByConsignorforupdate,
  modifyBill,
  printBill,
  removeBill,
  fetchPaymentCollectionHistory,
  modifyPaymentCollection,
  recordPaymentCollectionForBill,
} from "./billActions";

const initialState = {
  status: "idle",
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

export const createBill = createAsyncThunk(
  "CREATE_BILL",
  async (requestObject) => {
    const { data, status } = await addBill(requestObject);
    return { data, status };
  }
);

export const getLorryReceiptsByConsignor = createAsyncThunk(
  "GET_LR_RECEIPT_BY_CONSIGNOR",
  async (requestObject) => {
    const { data, status } = await fetchLorryReceiptsByConsignor(requestObject);
    return { data, status };
  }
);


export const getLorryReceiptsByConsignorforUpdate = createAsyncThunk(
  "GET_LR_RECEIPT_BY_CONSIGNOR",
  async (requestObject) => {
    const { data, status } = await fetchLorryReceiptsByConsignorforupdate(requestObject);
    return { data, status };
  }
);

export const downloadBill = createAsyncThunk(
  "DOWNLOAD_BILL",
  async (requestObject) => {
    const { data, status } = await printBill(requestObject);
    return { data, status };
  }
);

export const downloadExcelBill = createAsyncThunk(
  "DOWNLOAD_EXCEL_BILL",
  async (requestObject) => {
    const { data, status } = await exportToExcelBill(requestObject);
    return { data, status };
  }
);

export const downloadBills = createAsyncThunk(
  "DOWNLOAD_BILLS",
  async (requestObject) => {
    const { data, status } = await exportToExcelBills(requestObject);
    return { data, status };
  }
);

export const getBills = createAsyncThunk("GE_BILLS", async (requestObject) => {
  const { data, status } = await fetchBills(requestObject);
  return { data, status };
});

export const deleteBill = createAsyncThunk(
  "DELETE_BILL",
  async (requestObject) => {
    const { data, status } = await removeBill(requestObject);
    return { data, status };
  }
);

export const getBill = createAsyncThunk("GE_BILL", async (requestObject) => {
  const { data, status } = await fetchBill(requestObject);
  return { data, status };
});

export const updateBill = createAsyncThunk(
  "UPDATE_BILL",
  async (requestObject) => {
    const { data, status } = await modifyBill(requestObject);
    return { data, status };
  }
);

export const getPaymentCollectionHistory = createAsyncThunk(
  "GET_PAYMENT_COLLECTION_HISTORY",
  async (billId) => {
    const { data, status } = await fetchPaymentCollectionHistory(billId);
    return { data, status };
  }
);

export const updatePaymentCollection = createAsyncThunk(
  "UPDATE_PAYMENT_COLLECTION",
  async (requestObject, { rejectWithValue }) => {
    try {
      const { data, status } = await modifyPaymentCollection(requestObject);
      return { data, status };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const createPaymentCollectionForBill = createAsyncThunk(
  "CREATE_PAYMENT_COLLECTION_FOR_BILL",
  async (requestObject, { rejectWithValue }) => {
    try {
      const { data, status } = await recordPaymentCollectionForBill(requestObject);
      return { data, status };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

export const billSlice = createSlice({
  name: "bill",
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
        if (hasSuperAdmin()) {
          state.status = "succeeded";
        }
        state.branches = payload?.data?.map?.((branch) => ({
          ...branch,
          label: branch.name,
          value: branch?._id,
        }));
      })
      .addCase(getBranches.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getCustomers.pending, (state) => {})
      .addCase(getCustomers.fulfilled, (state, { payload }) => {
        state.customers = payload?.data;
      })
      .addCase(getCustomers.rejected, (state) => {})

      .addCase(createBill.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createBill.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createBill.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLorryReceiptsByConsignor.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLorryReceiptsByConsignor.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLorryReceiptsByConsignor.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(downloadBill.pending, (state) => {
        state.status = "loading";
      })
      .addCase(downloadBill.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(downloadBill.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBill.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBill.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBill.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteBill.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBill.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteBill.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateBill.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateBill.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateBill.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getBills.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getBills.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getBills.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = billSlice.actions;
export default billSlice.reducer;
export const selectIsLoading = (state) => state.bill.status === "loading";
