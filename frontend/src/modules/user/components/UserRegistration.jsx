import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Autocomplete,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { LoadingSpinner } from "../../../ui-controls";
import {
  getBranches,
  getEmployees,
  registerUser,
  selectIsLoading,
} from "../slice/userSlice";
import { useDispatch, useSelector } from "react-redux";

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

const UserRegistration = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [userRegistration, setUserRegistration] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const navigate = useNavigate();
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
  }, []);

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setUserRegistration((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const autocompleteChangeListener = (option, name) => {
    setUserRegistration((currState) => {
      return {
        ...currState,
        [name]: option,
      };
    });
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.branch) {
      errors.branch = { invalid: true, message: "Branch is required" };
    }
    if (!formData.type) {
      errors.type = { invalid: true, message: "User type is required" };
    }
    if (!formData.employee) {
      errors.employee = { invalid: true, message: "Employee is required" };
    }
    if (!formData.username?.trim?.()) {
      errors.username = { invalid: true, message: "Username is required" };
    }
    if (!formData.password?.trim?.()) {
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
    if (!formData.confirmPassword?.trim?.()) {
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
    if (!validateForm(userRegistration)) {
      dispatch(
        registerUser({
          ...userRegistration,
          employee: userRegistration.employee?.emp_id,
          userBranches: [userRegistration.branch?.branch_id],
        })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setUserRegistration(initialState);
            goToUsersList();
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  };

  const resetButtonHandler = () => {
    setUserRegistration(initialState);
    setFormErrors(initialErrorState);
    setHttpError("");
  };

  const cancelButtonHandler = () => {
    goToUsersList();
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <h1 className="pageHead">User Registration</h1>
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
      <div className="inner-wrap">
        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <form action="" onSubmit={submitHandler}>
            <div className="grid grid-6-col">
              <div className="grid-item">
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
                    value={userRegistration.branch || null}
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
                    <FormHelperText>{formErrors.branch.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  size="small"
                  error={formErrors.type.invalid}
                >
                  <Autocomplete
                    autoSelect
                    disablePortal
                    size="small"
                    name="type"
                    options={["Admin", "User","ClientUser"]}
                    value={userRegistration.type || null}
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
                    <FormHelperText>{formErrors.type.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  size="small"
                  error={formErrors.employee.invalid}
                >
                  <Autocomplete
                    autoSelect
                    disablePortal
                    size="small"
                    name="employee"
                    options={employees}
                    value={userRegistration.employee || null}
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
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.username.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Username"
                    error={formErrors.username.invalid}
                    value={userRegistration.username}
                    onChange={inputChangeHandler}
                    name="username"
                    id="username"
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
                    size="small"
                    variant="outlined"
                    label="Password"
                    error={formErrors.password.invalid}
                    type="password"
                    value={userRegistration.password}
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
                    size="small"
                    variant="outlined"
                    label="Confirm Password"
                    error={formErrors.confirmPassword.invalid}
                    type="password"
                    value={userRegistration.confirmPassword}
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
                onClick={resetButtonHandler}
                className="btn-style"
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                size="medium"
                onClick={cancelButtonHandler}
                className="ml6 btn-style"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="medium"
                type="submit"
                color="primary"
                className="ml6 btn-style"
              >
                Save
              </Button>
            </div>
          </form>
        </Paper>
      </div>
    </>
  );
};

export default UserRegistration;
