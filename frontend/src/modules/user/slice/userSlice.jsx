import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addClientUserConfiguration,
  addUser,
  addUserRegister,
  fetchBranches,
  fetchEmployees,
  fetchUserDetail,
  fetchUsers,
  fetchUsersByBranch,
  findUser,
  getAllConsignorConsigneeByClientUserId,
  getClientUsersByType,
  modifyUserDetail,
  modifyUserPermissions,
  removeUserById,
  verifyUser,
} from "./userActions";

const initialState = {
  status: "idle",
  branch: "",
  employee: {},
  permissions: {},
  type: "",
  username: "",
  search: "",
};

export const validateUser = createAsyncThunk(
  "VALIDATE_USER",
  async (requestObject) => {
    const { data, status } = await verifyUser(requestObject);
    return { data, status };
  }
);

export const createUser = createAsyncThunk(
  "CREATE_USER",
  async (requestObject) => {
    const { data, status } = await addUser(requestObject);
    return { data, status };
  }
);

export const getUserDetail = createAsyncThunk(
  "GET_USER_DETAIL",
  async (requestObject) => {
    const { data, status } = await fetchUserDetail(requestObject);
    return { data, status };
  }
);

export const updateUserDetail = createAsyncThunk(
  "UPDATE_USER_DETAIL",
  async (requestObject) => {
    const { data, status } = await modifyUserDetail(requestObject);
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

export const getEmployees = createAsyncThunk(
  "GET_EMPLOYEES",
  async (requestObject) => {
    const { data, status } = await fetchEmployees(requestObject);
    return { data, status };
  }
);

export const getUsersByBranch = createAsyncThunk(
  "GET_USERS_BY_BRANCH",
  async (requestObject) => {
    const { data, status } = await fetchUsersByBranch(requestObject);
    return { data, status };
  }
);

export const updateUserPermissions = createAsyncThunk(
  "UPDATE_PERMISSIONS",
  async (requestObject) => {
    const { data, status } = await modifyUserPermissions(requestObject);
    return { data, status };
  }
);

export const registerUser = createAsyncThunk(
  "REGISTER_USER",
  async (requestObject) => {
    const { data, status } = await addUserRegister(requestObject);
    return { data, status };
  }
);

export const getUsers = createAsyncThunk("GET_USERS", async (requestObject) => {
  const { data, status } = await fetchUsers(requestObject);
  return { data, status };
});

export const deleteUser = createAsyncThunk(
  "DELETE_USER",
  async (requestObject) => {
    const { data, status } = await removeUserById(requestObject);
    return { data, status };
  }
);

export const searchUser = createAsyncThunk(
  "SEARCH_USER",
  async (requestObject) => {
    const { data, status } = await findUser(requestObject);
    return { data, status };
  }
);


export const ClientUser = createAsyncThunk(
  "GET_USER_BY_TYPE",
  async (requestObject) => {
    const { data, status } = await getClientUsersByType(requestObject);
    console.log("Response Data:", data); // Log the data
    console.log("Response Status:", status); 
    return { data, status };
  }
);


export const addClientUserConfig = createAsyncThunk(
  "ADD_CLIENT_USER_CONFIG",
  async (requestObject) => {
    const { data, status } = await addClientUserConfiguration(requestObject);
    return { data, status };
  }
);


export const getClientUserConfigdata = createAsyncThunk(
  "GET_CLIENT_USER_CONFIG_DATA",
  async (requestObject) => {
    const { data, status } = await getAllConsignorConsigneeByClientUserId(requestObject.clientUserID);
    return { data, status };
  }
);



export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateUser: (state, action) => {
      return {
        ...action.payload,
      };
    },
    removeUser: () => {
      return {
        ...initialState,
      };
    },
    setSearch: (state, { payload }) => {
      state.search = payload;
    },
    setBranch: (state, { payload }) => {
      state.branch = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(validateUser.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(validateUser.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(createUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createUser.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(createUser.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getUserDetail.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getUserDetail.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getUserDetail.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateUserDetail.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateUserDetail.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateUserDetail.rejected, (state) => {
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

      .addCase(getEmployees.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getEmployees.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getEmployees.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getUsersByBranch.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getUsersByBranch.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getUsersByBranch.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(updateUserPermissions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateUserPermissions.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateUserPermissions.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(registerUser.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(deleteUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteUser.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(searchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(searchUser.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(searchUser.rejected, (state) => {
        state.status = "failed";
      })


      .addCase(ClientUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(ClientUser.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(ClientUser.rejected, (state) => {
        state.status = "failed";
      })


      .addCase(addClientUserConfig.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addClientUserConfig.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(addClientUserConfig.rejected, (state) => {
        state.status = "failed";
      })


      .addCase(getClientUserConfigdata.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getClientUserConfigdata.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getClientUserConfigdata.rejected, (state) => {
        state.status = "failed";
      })

      .addCase(getUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getUsers.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(getUsers.rejected, (state) => {
        state.status = "failed";
      });

      
  },
});

export const { updateUser, removeUser, setSearch, setBranch } =
  userSlice.actions;
export default userSlice.reducer;
export const selectIsLoading = (state) => state.user.status === "loading";
