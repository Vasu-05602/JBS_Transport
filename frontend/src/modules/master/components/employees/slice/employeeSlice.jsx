import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addEmployee,
  fetchEmployee,
  fetchEmployees,
  modifyEmployee,
  removeEmployee,
  fetchLastEmployee,
} from "./employeeActions";
const initialState = {
  status: "idle",
  search: "",
};

export const createEmployee = createAsyncThunk(
  'CREATE_EMPLOYEE',
  async (requestObject) => {
    const { data, status } = await addEmployee(requestObject);
    console.log('Employee created:', { data, status }); // Add your console log here
    return { data, status };
  }
);
export const getEmployee = createAsyncThunk(
  "GET_EMPLOYEE",
  async (requestObject) => {
    const { data, status } = await fetchEmployee(requestObject);
    return { data, status };
  }
);
export const updateEmployee = createAsyncThunk(
  "UPDATE_EMPLOYEE",
  async (requestObject) => {
    const { data, status } = await modifyEmployee(requestObject);
    return { data, status };
  }
);
export const getEmployees = createAsyncThunk(
  "GET_EMPLOYEES",
  async (requestObject) => {
    const { data, status } = await fetchEmployees(requestObject);
    return { data, status };
  }
);

export const deleteEmployee = createAsyncThunk(
  "DELETE_EMPLOYEE",
  async (requestObject) => {
    const { data, status } = await removeEmployee(requestObject);
    return { data, status };
  }
);

export const getLastEmployee = createAsyncThunk(
  "GET_LAST_EMPLOYEE",
  async (requestObject) => {
    const { data, status } = await fetchLastEmployee(requestObject);
    return { data, status };
  }
);

export const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createEmployee.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createEmployee.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createEmployee.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getEmployee.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getEmployee.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getEmployee.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateEmployee.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateEmployee.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateEmployee.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getEmployees.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getEmployees.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getEmployees.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteEmployee.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteEmployee.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteEmployee.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getLastEmployee.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getLastEmployee.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getLastEmployee.rejected, (state) => {
        state.status = "failed";
      });
  },
});
export const { setSearch } = employeeSlice.actions;
export default employeeSlice.reducer;
export const selectIsLoading = (state) => state.employee.status === "loading";
