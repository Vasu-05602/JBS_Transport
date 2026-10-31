import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
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
  mobileNoRegEx,
  validatePhoneNumber,
} from "../../../../services/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  getEmployee,
  selectIsLoading,
  updateEmployee,
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

const EmployeeEdit = () => {
  const [employee, setEmployee] = useState(initialEmployeeState);
  const [fetchedEmployee, setFetchedEmployee] = useState(initialEmployeeState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const isLoading = useSelector(selectIsLoading);

  const location = useLocation();
  const { employeeId } = location.state;
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const goToEmployeeList = useCallback(() => {
    navigate("/master/employees");
  }, [navigate]);

  useEffect(() => {
    if (employeeId && employeeId !== "") {
      dispatch(getEmployee(employeeId))
        .then(({ payload = {} }) => {
          console.log("Payload Data:", payload);
          const { message, data } = payload || {};
  
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            if (data && data.length > 0) {
              const employeeData = data[0]; 
              if (employeeData.date_of_birth) {
                employeeData.dateOfBirth = dayjs(employeeData.date_of_birth);
              }
              if (employeeData.joining_date) {
                employeeData.joiningDate = dayjs(employeeData.joining_date);
              }
              const mappedEmployee = {
                name: employeeData.employee_name || "",
                correspondenceAddress: employeeData.corresp_address || "",
                permanentAddress: employeeData.permanat_address || "",
                dateOfBirth: employeeData.dateOfBirth || null,
                telephone: "", 
                mobile: employeeData.mobileno || "",
                email: employeeData.emailid || "",
                joiningDate: employeeData.joiningDate || null,
                qualification: employeeData.qualification || "",
                bloodGroup: employeeData.blood_group || "",
                designation: employeeData.designation || "",
              };
  
              setEmployee(mappedEmployee);
              setFetchedEmployee(mappedEmployee); 
            }
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [employeeId]);
  

  const resetButtonHandler = () => {
    setEmployee(fetchedEmployee);
    setHttpError("");
    setFormErrors(initialErrorState);
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
      };
    });
  };
  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(employee)) {
      const employeeDataToUpdate = {
        ...employee,
        id: employeeId, 
      };
  
      dispatch(updateEmployee(employeeDataToUpdate))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Updated Successfully")) {
            setHttpError(message);
            goToEmployeeList();
          } else {
            setHttpError("");
            setEmployee(payload?.data);
            goToEmployeeList();
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };
  

  const cancelButtonHandler = () => {
    goToEmployeeList();
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
      <div className="inner-wrap">
        <h1 className="pageHead">Edit an employee</h1>
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
                    value={employee.bloodGroup}
                    onChange={(e, value) =>
                      autocompleteChangeListener(value, "bloodGroup")
                    }
                    getOptionLabel={(option) => option}
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

export default EmployeeEdit;
