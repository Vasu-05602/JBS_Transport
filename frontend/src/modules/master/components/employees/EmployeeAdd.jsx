import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Autocomplete,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { LoadingSpinner } from "../../../../ui-controls";
import {
  emailRegEx,
  getNextEmpNo,
  mobileNoRegEx,
  validatePhoneNumber,
} from "../../../../services/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  createEmployee,
  getLastEmployee,
  selectIsLoading,
} from "./slice/employeeSlice";

const initialEmployeeState = {
  code: "",
  name: "",
  correspondenceAddress: "",
  permanentAddress: "",
  dateOfBirth: null,
  telephone: "",
  mobile: "",
  email: "",
  joiningDate: null,
  qualification: "",
  bloodGroup: "",
  designation: "",
};

const initialErrorState = {
  name: {
    invalid: false,
    message: "",
  },
  address: {
    invalid: false,
    message: "",
  },
  telephone: {
    invalid: false,
    message: "",
  },
  mobile: {
    invalid: false,
    message: "",
  },
  email: {
    invalid: false,
    message: "",
  },
};

const EmployeeAdd = () => {
  const [employee, setEmployee] = useState(initialEmployeeState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);

  const navigate = useNavigate();

  const goToEmployeeList = useCallback(() => {
    navigate("/master/employees");
  }, [navigate]);

  // useEffect(() => {
  //   dispatch(getLastEmployee())
  //     .then(({ payload = {} }) => {
  //       if (payload?.status === 200) {
  //         const { message } = payload?.data || {} || "";
  //         if (message) {
  //           setHttpError(message);
  //         } else {
  //           setHttpError("");
  //           setEmployee((currState) => {
  //             return {
  //               ...currState,
  //               code: getNextEmpNo(payload?.data),
  //             };
  //           });
  //         }
  //       }
  //     })
  //     .catch((error) => {
  //       setHttpError(error.message);
  //     });
  // }, []);

  const resetButtonHandler = () => {
    setEmployee((emp) => ({ ...initialEmployeeState, code: emp.code }));
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const cancelButtonHandler = () => {
    goToEmployeeList();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setEmployee((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const autocompleteChangeListener = (value, name) => {
    setEmployee((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const dateInputChangeHandler = (name, date) => {
    setEmployee((currState) => {
      return {
        ...currState,
        [name]: date,
        // [name]: moment(date).format("DD MM YYYY"),
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(employee)) {
      const updatedEmployee = employee;
      if (updatedEmployee.joiningDate) {
        updatedEmployee.joiningDate = new Date(updatedEmployee.joiningDate);
      }
      if (updatedEmployee.dateOfBirth) {
        updatedEmployee.dateOfBirth = new Date(updatedEmployee.dateOfBirth);
      }
      dispatch(createEmployee(employee))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Added Successfully")) {
            setHttpError("");  
            setEmployee(initialEmployeeState);  
            goToEmployeeList();
          } else {
            setHttpError(message || "An unknown error occurred"); 
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.name?.trim?.()) {
      errors.name = { invalid: true, message: "Name is required" };
    }
    if (!formData.correspondenceAddress?.trim?.()) {
      errors.address = { invalid: true, message: "Address is required" };
    }
    if (
      formData.mobile?.trim?.() !== "" &&
      !mobileNoRegEx.test(formData.mobile)
    ) {
      errors.mobile = { invalid: true, message: "Mobile number is invalid" };
    }
    if (formData.email !== "" && !emailRegEx.test(formData.email)) {
      errors.email = { invalid: true, message: "Email is invalid" };
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

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <h1 className="pageHead">Add a employee</h1>
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
              {/* <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Code"
                    value={employee.code}
                    onChange={inputChangeHandler}
                    name="code"
                    id="code"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </div> */}
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.name.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Name"
                    error={formErrors.name.invalid}
                    value={employee.name}
                    onChange={inputChangeHandler}
                    name="name"
                    id="name"
                  />
                  {formErrors.name.invalid && (
                    <FormHelperText>{formErrors.name.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.address.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Correspondence address"
                    error={formErrors.address.invalid}
                    value={employee.correspondenceAddress}
                    onChange={inputChangeHandler}
                    name="correspondenceAddress"
                    id="correspondenceAddress"
                  />
                  {formErrors.address.invalid && (
                    <FormHelperText>
                      {formErrors.address.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Permenant address"
                    value={employee.permanentAddress}
                    onChange={inputChangeHandler}
                    name="permanentAddress"
                    id="permanentAddress"
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date of birth"
                      inputFormat="DD/MM/YYYY"
                      format="DD/MM/YYYY"
                      value={employee.dateOfBirth}
                      disableFuture={true}
                      onChange={dateInputChangeHandler.bind(
                        null,
                        "dateOfBirth"
                      )}
                      renderInput={(params) => (
                        <TextField
                          name="dateOfBirth"
                          size="small"
                          {...params}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </FormControl>
              </div>
              {/* <div className="grid-item">
                <FormControl fullWidth error={formErrors.telephone.invalid}>
                  <TextField
                    variant="outlined"
                    size="small"
                    label="Telephone"
                    error={formErrors.telephone.invalid}
                    value={employee.telephone}
                    onChange={inputChangeHandler}
                    onInput={validatePhoneNumber}
                    name="telephone"
                    id="telephone"
                  />
                  {formErrors.telephone.invalid && (
                    <FormHelperText>
                      {formErrors.telephone.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div> */}
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.mobile.invalid}>
                  <TextField
                    variant="outlined"
                    size="small"
                    label="Mobile no."
                    error={formErrors.mobile.invalid}
                    value={employee.mobile}
                    onChange={inputChangeHandler}
                    onInput={validatePhoneNumber}
                    name="mobile"
                    id="mobile"
                  />
                  {formErrors.mobile.invalid && (
                    <FormHelperText>{formErrors.mobile.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.email.invalid}>
                  <TextField
                    variant="outlined"
                    size="small"
                    label="Email"
                    error={formErrors.email.invalid}
                    value={employee.email}
                    onChange={inputChangeHandler}
                    name="email"
                    id="email"
                  />
                  {formErrors.email.invalid && (
                    <FormHelperText>{formErrors.email.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Joining date"
                      inputFormat="DD/MM/YYYY"
                      format="DD/MM/YYYY"
                      value={employee.joiningDate}
                      disableFuture={true}
                      onChange={dateInputChangeHandler.bind(
                        null,
                        "joiningDate"
                      )}
                      renderInput={(params) => (
                        <TextField
                          name="joiningDate"
                          size="small"
                          {...params}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    variant="outlined"
                    size="small"
                    label="Qualification"
                    value={employee.qualification}
                    onChange={inputChangeHandler}
                    name="qualification"
                    id="qualification"
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth size="small">
                  <Autocomplete
                    autoSelect
                    disablePortal
                    size="small"
                    name="bloodGroup"
                    options={["A-", "B-", "AB-", "O-", "A+", "B+", "AB+", "O+"]}
                    value={employee.bloodGroup || null}
                    onChange={(e, value) =>
                      autocompleteChangeListener(value, "bloodGroup")
                    }
                    openOnFocus
                    renderInput={(params) => (
                      <TextField {...params} label="Blood group" fullWidth />
                    )}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    variant="outlined"
                    size="small"
                    label="Designation"
                    value={employee.designation}
                    onChange={inputChangeHandler}
                    name="designation"
                    id="designation"
                  />
                </FormControl>
              </div>
            </div>
            <div className="right">
              <Button
                variant="outlined"
                size="medium"
                onClick={cancelButtonHandler}
              >
                Back
              </Button>
              <Button
                variant="outlined"
                size="medium"
                onClick={resetButtonHandler}
                className="ml6"
              >
                Reset
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
          </form>
        </Paper>
      </div>
    </>
  );
};

export default EmployeeAdd;
