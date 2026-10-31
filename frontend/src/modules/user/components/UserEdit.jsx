import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Autocomplete,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import {
  getBranches,
  getEmployees,
  getUserDetail,
  selectIsLoading,
  updateUserDetail,
} from "../slice/userSlice";
import LoadingSpinner from "@ui-controls/LoadingSpinner";

const initialState = {
  branch: "",
  type: "",
  employee: "",
  username: "",
  password: "",
  confirmPassword: "",
};

const initialErrorState = {
  branch: {
    invalid: false,
    message: "",
  },
  type: {
    invalid: false,
    message: "",
  },
  employee: {
    invalid: false,
    message: "",
  },
  username: {
    invalid: false,
    message: "",
  },
  password: {
    invalid: false,
    message: "",
  },
  confirmPassword: {
    invalid: false,
    message: "",
  },
};

const UserEdit = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const location = useLocation();
  const { userId } = location.state ? location.state : { userId: "" };
  const isLoading = useSelector(selectIsLoading);

  const [branches, setBranches] = useState([]);
  const [fetchedUser, setFetchedUser] = useState({});
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [employees, setEmployees] = useState([]);

  const navigate = useNavigate();


  useEffect(() => {
    if (fetchedUser.branch_id || fetchedUser.employee_id) {
      const filteredBranch = branches?.find(
        (branch) => branch.branch_id === fetchedUser.branch_id
      );
      const employee = employees?.find(({ emp_id }) => emp_id === fetchedUser.employee_id);
  
      if (filteredBranch?.branch_id && (fetchedUser.branch?.branch_id !== filteredBranch.branch_id || fetchedUser.employee?.id !== employee?.id)) {
        setFetchedUser((currState) => ({
          ...currState,
          branch: filteredBranch,
          employee: employee,
        }));
      }
    }
  }, [branches, fetchedUser, employees]);
  

  useEffect(() => {
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setBranches(payload?.data);
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });

    dispatch(getEmployees())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setEmployees(payload?.data);
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (userId) {
      dispatch(getUserDetail(userId))  
        .then(({ payload = {} }) => {
          setFetchedUser({
            ...(payload?.data || {}), 
            password: "", 
            confirmPassword: "", 
          });
          if (payload?.data?.usertype) {
            setFetchedUser((prevState) => ({
              ...prevState,
              type: payload?.data?.usertype, 
            }));
          }
        })
        .catch(() => {
          setHttpError("Something went wrong! Please try later or contact Administrator.");
        });
    }
  }, [userId]);
  

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFetchedUser((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const autocompleteChangeListener = (option, name) => {
    setFetchedUser((currState) => {
      return {
        ...currState,
        [name]: option,
      };
    });
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!isSuperAdmin()) {
      if (!formData.branch) {
        errors.branch = { invalid: true, message: "Branch is required" };
      }
      if (!formData.type) {
        errors.type = { invalid: true, message: "User type is required" };
      }
      if (!formData.employee) {
        errors.employee = { invalid: true, message: "Employee is required" };
      }
    }
    if (!formData.username || !formData.username?.trim?.()) {
      errors.username = { invalid: true, message: "Username is required" };
    }
    if (!formData.password || !formData.password?.trim?.()) {
      errors.password = { invalid: true, message: "Password is required" };
    } else if (formData.password?.trim?.()?.length < 5) {
      errors.password = {
        invalid: true,
        message: "Password length should be 5 or more characters",
      };
    } else if (
      formData.password?.trim?.() !== formData.confirmPassword?.trim?.()
    ) {
      errors.password = {
        invalid: true,
        message: "Password and Confirm password does not match",
      };
    }
    if (!formData.confirmPassword || !formData.confirmPassword?.trim?.()) {
      errors.confirmPassword = {
        invalid: true,
        message: "Confirm password is required",
      };
    } else if (formData.password?.trim?.()?.length < 5) {
      errors.confirmPassword = {
        invalid: true,
        message: "Confirm password length should be 5 or more characters",
      };
    } else if (
      formData.password?.trim?.() !== formData.confirmPassword?.trim?.()
    ) {
      errors.confirmPassword = {
        invalid: true,
        message: "Password and Confirm password does not match",
      };
    }
    let validationErrors = false;
    for (const key in errors) {
      if (errors[key].invalid === true) {
        validationErrors = true;
      }
    }
    if (validationErrors) {
      setFormErrors(errors);
    }
    return validationErrors;
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(fetchedUser)) {
      dispatch(
        updateUserDetail({
          id:fetchedUser.id,
          branch: fetchedUser.branch?.branch_id,
          employee: fetchedUser.employee?.emp_id,
          type: fetchedUser.type, 
          username:fetchedUser.username, 
          password:fetchedUser.confirmPassword
        })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setFetchedUser(initialState);
            cancelButtonHandler();
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  };

  const cancelButtonHandler = useCallback(() => {
    setFetchedUser(initialState);
    setFormErrors(initialErrorState);
    setHttpError("");
    navigate("/users/usersList");
  }, [navigate]);

  const isSuperAdmin = () => {
    return user && user.usertype && user.usertype?.toLowerCase?.() == "Superadmin";
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}

      <h1 className="pageHead">Edit a user</h1>
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

        {fetchedUser && fetchedUser.id && (
          <form action="" onSubmit={submitHandler}>
            <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
              <div className="grid grid-6-col">
                {!isSuperAdmin() ? (
                  <>
                    <div className="grid-item">
                      <FormControl
                        fullWidth
                        error={formErrors.branch.invalid}
                        size="small"
                      >
                        <Autocomplete
                          autoSelect
                          disablePortal
                          size="small"
                          name="branch"
                          options={branches}
                          value={fetchedUser.branch || null}
                          onChange={(e, value) =>
                            autocompleteChangeListener(value, "branch")
                          }
                          getOptionLabel={(branch) => branch.branch_name || ""}
                          openOnFocus
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Branch"
                              error={formErrors.branch.invalid}
                              fullWidth
                            />
                          )}
                        />
                        {formErrors.branch.invalid && (
                          <FormHelperText>
                            {formErrors.branch.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </div>
                    <div className="grid-item">
                      <FormControl
                        fullWidth
                        error={formErrors.type.invalid}
                        size="small"
                      >
                        <Autocomplete
                          autoSelect
                          disablePortal
                          size="small"
                          name="type"
                          options={["Admin", "User"]}
                          value={fetchedUser.type || null}
                          onChange={(e, value) =>
                            autocompleteChangeListener(value, "type")
                          }
                          getOptionLabel={(type) => type || ""}
                          openOnFocus
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="User Type"
                              error={formErrors.type.invalid}
                              fullWidth
                            />
                          )}
                        />
                        {formErrors.type.invalid && (
                          <FormHelperText>
                            {formErrors.type.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </div>
                    <div className="grid-item">
                      <FormControl
                        fullWidth
                        error={formErrors.employee.invalid}
                        size="small"
                      >
                        <Autocomplete
                          autoSelect
                          disablePortal
                          size="small"
                          name="employee"
                          options={employees}
                          value={fetchedUser.employee || null}
                          onChange={(e, value) =>
                            autocompleteChangeListener(value, "employee")
                          }
                          getOptionLabel={(employee) => employee.employee_name || ""}
                          openOnFocus
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Employee"
                              error={formErrors.employee.invalid}
                              fullWidth
                            />
                          )}
                        />
                        {formErrors.employee.invalid && (
                          <FormHelperText>
                            {formErrors.employee.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </div>
                  </>
                ) : null}

                <div className="grid-item">
                  <FormControl fullWidth error={formErrors.username.invalid}>
                    <TextField
                      variant="outlined"
                      size="small"
                      label="Username"
                      error={formErrors.username.invalid}
                      value={fetchedUser.username}
                      onChange={inputChangeHandler}
                      name="username"
                      id="username"
                      disabled={true}
                      inputProps={{ maxLength: 50 }}
                    />
                    {formErrors.username.invalid && (
                      <FormHelperText>
                        {formErrors.username.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </div>
                <div className="grid-item">
                  <FormControl fullWidth error={formErrors.password.invalid}>
                    <TextField
                      variant="outlined"
                      size="small"
                      label="Password"
                      error={formErrors.password.invalid}
                      type="password"
                      value={fetchedUser.password}
                      onChange={inputChangeHandler}
                      name="password"
                      id="password"
                      inputProps={{ maxLength: 20 }}
                    />
                    {formErrors.password.invalid && (
                      <FormHelperText>
                        {formErrors.password.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </div>
                <div className="grid-item">
                  <FormControl
                    fullWidth
                    error={formErrors.confirmPassword.invalid}
                  >
                    <TextField
                      variant="outlined"
                      size="small"
                      label="Confirm Password"
                      error={formErrors.confirmPassword.invalid}
                      type="password"
                      value={fetchedUser.confirmPassword}
                      onChange={inputChangeHandler}
                      name="confirmPassword"
                      id="confirmPassword"
                      inputProps={{ maxLength: 20 }}
                    />
                    {formErrors.confirmPassword.invalid && (
                      <FormHelperText>
                        {formErrors.confirmPassword.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </div>
              </div>
              <div className="right">
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
          </form>
        )}
      </div>
    </>
  );
};

export default UserEdit;
