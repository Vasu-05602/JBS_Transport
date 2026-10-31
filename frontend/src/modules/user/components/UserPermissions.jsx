import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FormControl,
  Button,
  Divider,
  Switch,
  Paper,
  Autocomplete,
  TextField,
  FormHelperText,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Alert, Stack } from "@mui/material";
import classes from "./UserPermissions.module.css";
import { LoadingSpinner } from "../../../ui-controls";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  getUserDetail,
  getBranches,
  getUsersByBranch,
  updateUserPermissions,
  selectIsLoading,
} from "../slice/userSlice";
const initialErrorState = {
  branch: {
    invalid: false,
    message: "",
  },
};
const UserPermissions = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const isLoading = useSelector(selectIsLoading);
  const [branchUsers, setBranchUsers] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [branches, setBranches] = useState([]);
  const [userBranches, setUserBranches] = useState([]);
  const [userBranch, setUserBranch] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [fetchedUser, setFetchedUser] = useState({});
  const [permissions, setPermissions] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [formErrors, setFormErrors] = useState(initialErrorState);

  const navigate = useNavigate();

  useEffect(() => {
    if (branches?.length) {
      const filteredBranch = branches?.find?.(
        (branch) => branch._id === user.branch
      );
      if (filteredBranch?._id) {
        setSelectedBranch(filteredBranch);
      }
    }
  }, [branches]);

  useEffect(() => {
    if (permissions) {
      let selectAllTrue = true;
      for (const key in permissions) {
        for (const key1 in permissions[key]) {
          if (permissions[key][key1].write === false) {
            selectAllTrue = false;
            break;
          }
        }
      }
      setSelectAll(selectAllTrue);
    }
  }, [permissions]);

  const goToUsersList = useCallback(() => {
    navigate("/users/usersList");
  }, [navigate]);

  useEffect(() => {
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setBranches(payload?.data);
          setHttpError("");
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      dispatch(getUsersByBranch(selectedBranch?.branch_id))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            if (user.usertype?.toLowerCase?.() === "Superadmin") {
              setBranchUsers(payload?.data);
            } else {
              setBranchUsers(
                payload?.data?.filter?.(({ id }) => user.id !== id)
              );
            }
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  }, [selectedBranch]);
 
  useEffect(() => {
    if (selectedUser) {
    
      dispatch(getUserDetail(selectedUser?.user_id))
        .then(({ payload = {} }) => {
          setFetchedUser({
            ...(payload?.data || {}),
          });
          setPermissions(payload?.data?.permissions);
          if (payload?.data?.userBranches) {
            setUserBranches(payload.data?.userBranches || []);
          } else {
            setUserBranches([]);
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    } else {
      setFetchedUser({});
    }
  }, [selectedUser]);
  const branchChangeHandler = (e, value) => {
    setSelectedBranch(value);
    setBranchUsers([]);
  };

  const userChangeHandler = (e, value) => {
    setSelectedUser(value);
  };

  const handleUserBranchHandler = (e, value) => {
    setUserBranch(value);
    setFormErrors(initialErrorState);
  };

  const triggerDelete = (index) => {
    userBranches.splice(index, 1);
    setUserBranches([...userBranches]);
  };

  const onAddBranch = () => {
    if (!userBranch) {
      let errors = {};
      errors.branch = { invalid: true, message: "Branch is required." };
      setFormErrors(errors);
    } else if (userBranches.some(({ _id }) => _id === userBranch._id)) {
      let errors = {};
      errors.branch = { invalid: true, message: "Branch is already selected." };
      setFormErrors(errors);
    } else {
      setUserBranches((prevState) => [...prevState, userBranch]);
      setUserBranch(null);
      setFormErrors(initialErrorState);
    }
  };

  const handleSwitchChange = (e, checked) => {
    if (e.target.name === "Sales/Purchase_Add_FO_No_write") {
      const mainSection = "Sales/Purchase";
      const subSection = "Add_FO_No";
      const type = "write";
      setPermissions((currPermissions) => {
        const updatedPermissions = { ...currPermissions };
        updatedPermissions[mainSection][subSection][type] = checked;

        return updatedPermissions;
      });
    } else {
      const name = e.target.name;
      const mainSection = name.split?.("_")[0];
      const subSection = name.split?.("_")[1];
      const type = name.split?.("_")[2];
      setPermissions((currPermissions) => {
        const updatedPermissions = { ...currPermissions };
        updatedPermissions[mainSection][subSection][type] = checked;
        if (type === "write" && !checked) {
          updatedPermissions[mainSection][subSection]["read"] = false;
        }
        return updatedPermissions;
      });
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    const requestObject = {
      id: selectedUser?.user_id,
      permissions: permissions,
    };

    dispatch(updateUserPermissions(requestObject))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          goToUsersList();
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
  };
  const cancelButtonHandler = () => {
    goToUsersList();
  };

  const handleSelectAll = (e, checked) => {
    setSelectAll(checked);
    if (!checked) {
      setPermissions((currPermissions) => {
        for (const key in currPermissions) {
          for (const key1 in currPermissions[key]) {
            currPermissions[key][key1].read = false;
            currPermissions[key][key1].write = false;
          }
        }
        return currPermissions;
      });
    } else {
      setPermissions((currPermissions) => {
        for (const key in currPermissions) {
          for (const key1 in currPermissions[key]) {
            currPermissions[key][key1].read = true;
            currPermissions[key][key1].write = true;
          }
        }
        return currPermissions;
      });
    }
  };
  const isUserType = selectedUser?.usertype === "User";

  return (
    <>
      {isLoading && <LoadingSpinner />}

      <h1 className="pageHead">User permissions</h1>
      <div className="inner-wrap">
        {httpError !== "" && (
          <Stack
            sx={{
              width: "100%",
              margin: "0 0 30px 0",
              border: "1px solid red",
              borderRadius: "4px",
            }}
            spacing={2}
          >
            <Alert severity="error">{httpError}</Alert>
          </Stack>
        )}

        <form className="frm-bottom-spc" action="" onSubmit={submitHandler}>
          <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
            <div className="grid grid-6-col">
              <div className="grid-item">
                {branches && branches?.length > 0 && (
                  <FormControl fullWidth size="small">
                    <Autocomplete
                      autoSelect
                      disablePortal
                      size="small"
                      name="branch"
                      options={branches}
                      value={selectedBranch || null}
                      onChange={branchChangeHandler}
                      getOptionLabel={(branch) => branch.branch_name || ""}
                      openOnFocus
                      renderInput={(params) => (
                        <TextField {...params} label="Branch" fullWidth />
                      )}
                    />
                  </FormControl>
                )}
              </div>
              <div className="grid-item">
                {branches && branches?.length > 0 && (
                  <FormControl fullWidth size="small">
                    <Autocomplete
                      autoSelect
                      disablePortal
                      size="small"
                      name="users"
                      options={branchUsers}
                      value={selectedUser || null}
                      onChange={userChangeHandler}
                      getOptionLabel={(user) => user.username || ""}
                      openOnFocus
                      renderInput={(params) => (
                        <TextField {...params} label="Users" fullWidth />
                      )}
                    />
                  </FormControl>
                )}
              </div>
              {/* <div className="grid-item">
                {branches && branches?.length > 0 && (
                  <FormControl
                    fullWidth
                    size="small"
                    error={formErrors.branch.invalid}
                  >
                    <Autocomplete
                      autoSelect
                      disablePortal
                      size="small"
                      name="branch"
                      options={branches}
                      value={userBranch || null}
                      onChange={handleUserBranchHandler}
                      getOptionLabel={(branch) => branch.branch_name || ""}
                      openOnFocus
                      disabled={!selectedUser}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Assign Branch"
                          fullWidth
                          error={formErrors.branch.invalid}
                        />
                      )}
                    />
                    {formErrors.branch.invalid && (
                      <FormHelperText>
                        {formErrors.branch.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              </div> */}
              {/* <div className="grid-item">
                {branches && branches?.length > 0 && (
                  <FormControl fullWidth size="small">
                    <Button
                      variant="contained"
                      size="medium"
                      color="primary"
                      className="ml6"
                      style={{ width: "max-content" }}
                      onClick={onAddBranch}
                    >
                      Add
                    </Button>
                  </FormControl>
                )}
              </div> */}
            </div>
            <div style={{ paddingBottom: "10px" }}>
              {userBranches.length ? "User assigned Branches" : ""}{" "}
            </div>
            <div>
              <table className={classes.tbl_permissions}>
                <tbody>
                  {userBranches.map((branch) => {
                    return (
                      <tr key={branch._id}>
                        <td>{branch.name}</td>
                        <td>
                          <IconButton
                            size="small"
                            onClick={triggerDelete}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Paper>
          {fetchedUser.employee_id && (
            <>
              <Divider sx={{ marginBottom: "20px" }} />

              <Paper
                sx={{ padding: "20px", marginBottom: "20px", overflow: "auto" }}
              >
                <div style={{ textAlign: 'left' }}>
                  Select All{" "}
                  <Switch
                    name="selectAll"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </div>

                <table className={classes.tbl_permissions}>
                  <tbody>
                    <tr>
                      <td colSpan={10} className={classes.head} style={{ textAlign: 'left' }}>
                        Master
                      </td>
                    </tr>
                    <tr>
                      <td width="10%">Branch</td>
                      <td width="10%">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Branch_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Branch.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Branch_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Branch_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Branch.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Branch_write">Write</label>
                          </div>
                        </div>
                      </td>

                      <td width="10%">Place</td>
                      <td width="10%">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Place_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Place.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Place_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Place_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Place.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Place_write">Write</label>
                          </div>
                        </div>

                      </td>
                      <td width="10%">Article</td>
                      <td width="10%">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Article_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Article.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Article_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Article_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Article.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Article_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>Employee</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Employee_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Employee.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Employee_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Employee_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Employee.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Employee_write">Write</label>
                          </div>
                        </div>
                      </td>
                      {/* <td>Driver</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Driver_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Driver.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Driver_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Driver_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Driver.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Driver_write">Write</label>
                          </div>
                        </div>
                      </td> */}
                    </tr>
                    <tr>
                      <td>Customers</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Customers_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Customers.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Customers_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Customers_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Customers.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Customers_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>Supplier</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Supplier_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Supplier.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Supplier_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Supplier_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Supplier.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Supplier_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>VehicleType</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_VehicleType_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.VehicleType.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_VehicleType_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_VehicleType_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.VehicleType.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_VehicleType_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>Vehicle</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Vehicle_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Vehicle.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Vehicle_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Vehicle_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Vehicle.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Vehicle_write">Write</label>
                          </div>
                        </div>
                      </td>
                      {/* <td>BankMaster</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_BankMaster_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions["Sales/Purchase"].BankMaster.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_BankMaster_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_BankMaster_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions["Sales/Purchase"].BankMaster.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_BankMaster_write">Write</label>
                          </div>
                        </div>
                      </td> */}
                    </tr>
                    <tr></tr>
                    <tr>
                      <td>BankAccountMaster</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_BankAccountMaster_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions["Sales/Purchase"].BankAccountMaster.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_BankAccountMaster_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_BankAccountMaster_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions["Sales/Purchase"].BankAccountMaster.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_BankAccountMaster_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>Rate Master</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_RateMaster_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions["Admin"].RateMaster.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_RateMaster_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_RateMaster_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions["Admin"].RateMaster.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_RateMaster_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>Driver</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Driver_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Driver.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Driver_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_Driver_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions.Admin.Driver.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_Driver_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>BankMaster</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_BankMaster_read"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions["Sales/Purchase"].BankMaster.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_BankMaster_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_BankMaster_write"
                              disabled={isUserType}
                              checked={isUserType ? false : permissions["Sales/Purchase"].BankMaster.write}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_BankMaster_write">Write</label>
                          </div>
                        </div>
                      </td>
                      {/* <td></td>
                      <td>

                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td> */}
                    </tr>
                    <tr>
                      <td colSpan={10} className={classes.head} style={{ textAlign: 'left' }}>
                        Transactions
                      </td>
                    </tr>
                    <tr>
                      <td>LorryReceipt</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_LorryReceipt_read"
                              checked={permissions.Accounts.LorryReceipt.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_LorryReceipt_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_LorryReceipt_write"
                              checked={
                                permissions.Accounts.LorryReceipt.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_LorryReceipt_write">Write</label>
                          </div>
                        </div>

                      </td>
                      {/* <td>LorryReceiptReg</td>
                      <td>
                        <Switch
                          name="Sales/Purchase_LorryReceiptReg_write"
                          checked={
                            permissions["Sales/Purchase"].LorryReceiptReg.write
                          }
                          onChange={handleSwitchChange}
                        />
                      </td> */}
                      <td>LocalMemo</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_LocalMemo_read"
                              checked={permissions["Sales/Purchase"].LocalMemo.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_LocalMemo_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_LocalMemo_write"
                              checked={
                                permissions["Sales/Purchase"].LocalMemo.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_LocalMemo_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td >LoadingSlip</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_LoadingSlip_read"
                              checked={permissions["Sales/Purchase"].LoadingSlip.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_LoadingSlip_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_LoadingSlip_write"
                              checked={
                                permissions["Sales/Purchase"].LoadingSlip.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_LoadingSlip_write">Write</label>
                          </div>
                        </div>


                      </td>
                      <td width="10%">MoneyTransfer</td>
                      <td width="10%">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_MoneyTransfer_read"
                              checked={permissions.Admin.MoneyTransfer.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_MoneyTransfer_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Admin_MoneyTransfer_write"
                              checked={
                                permissions.Admin.MoneyTransfer.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Admin_MoneyTransfer_write">Write</label>
                          </div>
                        </div>

                      </td>
                      {/* <td></td> */}
                    </tr>
                    <tr>
                      <td>LRAcknowledge</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_LRAcknowledge_read"
                              checked={permissions["Sales/Purchase"].LRAcknowledge.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_LRAcknowledge_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_LRAcknowledge_write"
                              checked={
                                permissions["Sales/Purchase"].LRAcknowledge.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_LRAcknowledge_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>BillList</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_RouteBill_read"
                              checked={permissions.Accounts.RouteBill.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_RouteBill_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_RouteBill_write"
                              checked={
                                permissions.Accounts.RouteBill.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_RouteBill_write">Write</label>
                          </div>
                        </div>
                      </td>

                      <td>PaymentCollection</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_PaymentCollection_read"
                              checked={permissions.Accounts.PaymentCollection.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_PaymentCollection_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_PaymentCollection_write"
                              checked={
                                permissions.Accounts.PaymentCollection.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_PaymentCollection_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>PaymentAdvice</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_PaymentAdvice_read"
                              checked={permissions["Sales/Purchase"].PaymentAdvice.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_PaymentAdvice_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Sales/Purchase_PaymentAdvice_write"
                              checked={
                                permissions["Sales/Purchase"].PaymentAdvice.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Sales/Purchase_PaymentAdvice_write">Write</label>
                          </div>
                        </div>
                      </td>
                      {/* <td></td>
                      <td></td> */}
                    </tr>
                    <tr>
                      <td colSpan={10} className={classes.head} style={{ textAlign: 'left' }}>
                        Reports
                      </td>
                    </tr>
                    <tr>
                      <td>BillRegister</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_BillRegister_read"
                              checked={permissions.Accounts.BillRegister.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_BillRegister_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_BillRegister_write"
                              checked={
                                permissions.Accounts.BillRegister.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_BillRegister_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>LrRegister</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_LRSRegister_read"
                              checked={permissions.Accounts.LRSRegister.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_LRSRegister_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_LRSRegister_write"
                              checked={
                                permissions.Accounts.LRSRegister.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_LRSRegister_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>BilledLRStatus</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_BilledLRStatus_read"
                              checked={permissions.Accounts.BilledLRStatus.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_BilledLRStatus_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_BilledLRStatus_write"
                              checked={
                                permissions.Accounts.BilledLRStatus.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_BilledLRStatus_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>LoadingTripsheet</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_LoadingTripsheet_read"
                              checked={permissions.Accounts.LoadingTripsheet.read}
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_LoadingTripsheet_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="Accounts_LoadingTripsheet_write"
                              checked={
                                permissions.Accounts.LoadingTripsheet.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="Accounts_LoadingTripsheet_write">Write</label>
                          </div>
                        </div>

                      </td>

                      {/* <td></td>
                      <td></td> */}
                    </tr>
                    <tr>
                      <td colSpan={10} className={classes.head} style={{ textAlign: 'left' }}>
                        User
                      </td>
                    </tr>
                    <tr>
                      <td>UserList</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="User_UserActivation_read"
                              disabled={isUserType}
                              checked={
                                isUserType
                                  ? false
                                  : permissions.User.UserActivation.read
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="User_UserActivation_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="User_UserActivation_write"
                              disabled={isUserType}
                              checked={
                                isUserType
                                  ? false
                                  : permissions.User.UserActivation.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="User_UserActivation_write">Write</label>
                          </div>
                        </div>

                      </td>
                      <td>RoleMaster</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="User_RoleMaster_read"
                              disabled={isUserType}
                              checked={
                                isUserType
                                  ? false
                                  : permissions.User.RoleMaster.read
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="User_RoleMaster_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="User_RoleMaster_write"
                              disabled={isUserType}
                              checked={
                                isUserType
                                  ? false
                                  : permissions.User.RoleMaster.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="User_RoleMaster_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>ChangePassword</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="User_ChangePassword_read"
                              disabled={isUserType}
                              checked={
                                isUserType
                                  ? false
                                  : permissions.User.ChangePassword.read
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="User_ChangePassword_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="User_ChangePassword_write"
                              disabled={isUserType}
                              checked={
                                isUserType
                                  ? false
                                  : permissions.User.ChangePassword.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="User_ChangePassword_write">Write</label>
                          </div>
                        </div>
                      </td>
                      <td>UserRegister</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="User_UserRegister_read"
                              disabled={isUserType}
                              checked={
                                isUserType
                                  ? false
                                  : permissions.User.UserRegister.read
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="User_UserRegister_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="User_UserRegister_write"
                              disabled={isUserType}
                              checked={
                                isUserType
                                  ? false
                                  : permissions.User.UserRegister.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="User_UserRegister_write">Write</label>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                    <td>Client User Configuration</td>
                    <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="User_clientuserConfiguration_read"
                              disabled={isUserType}
                              checked={
                                isUserType
                                  ? false
                                  : permissions.User.clientuserConfiguration.read
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="User_clientuserConfiguration_read">Read</label>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Switch
                              name="User_clientuserConfiguration_write"
                              disabled={isUserType}
                              checked={
                                isUserType
                                  ? false
                                  : permissions.User.clientuserConfiguration.write
                              }
                              onChange={handleSwitchChange}
                            />
                            <label htmlFor="User_clientuserConfiguration_write">Write</label>
                          </div>
                        </div>
                    </td>
                    </tr>
                  </tbody>
                </table>

                <div className="right" >
                  <Button
                    variant="outlined"
                    size="medium"
                    onClick={cancelButtonHandler}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    size="medium"
                    type="submit"
                    color="primary"
                    className="ml6"
                  >
                    Save
                  </Button>
                </div>
              </Paper>
            </>
          )}
        </form>
      </div>
    </>
  );
};

export default UserPermissions;
