import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Alert, Stack } from "@mui/material";

import { mobileNoRegEx, validatePhoneNumber } from "../../../../services/utils";
import { LoadingSpinner } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import { getDriver, selectIsLoading, updateDriver } from "./slice/driverSlice";

const initialState = {
  code: "",
  name: "",
  correspondenceAddress: "",
  permanentAddress: "",
  dateOfBirth: null,
  telephone: "",
  mobile: "",
  fatherName: "",
  referencedBy: "",
  eyeSight: "",
  licenseNo: "",
  licenseType: "",
  qualification: "",
  joiningDate: null,
  bloodGroup: "",
  renewDate: null,
  expiryDate: null,
  remark: "",
};

const initialErrorState = {
  name: {
    invalid: false,
    message: "",
  },
  correspondenceAddress: {
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
  licenseNo: {
    invalid: false,
    message: "",
  },
};

const DriverEdit = () => {
  const [driver, setDriver] = useState(initialState);
  const [fetchedDriver, setFetchedDriver] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { driverId } = location.state;
  const isLoading = useSelector(selectIsLoading);

  const goToDriversList = useCallback(() => {
    navigate("/master/drivers");
  }, [navigate]);

  useEffect(() => {
    if (driverId !== "") {
      dispatch(getDriver(driverId))
        .then(({ payload = {} }) => {
          const driverData = payload.data[0]; 
          const { message } = driverData || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
  
            const transformedData = {
              name: driverData.driver_name || "",
              correspondenceAddress: driverData.corresp_address || "",
              permanentAddress: driverData.permanat_address || "",
              dateOfBirth: driverData.date_of_birth ? dayjs(driverData.date_of_birth) : null,
              telephone: driverData.telephoneno || "",
              mobile: driverData.mobileno || "",
              fatherName: driverData.father_name || "",
              referencedBy: driverData.referenceby || "",
              eyeSight: driverData.eyesight || "",
              licenseNo: driverData.licenseno || "",
              licenseType: driverData.license_type || "",
              qualification: driverData.qualification || "",
              joiningDate: driverData.joining_date ? dayjs(driverData.joining_date) : null,
              bloodGroup: driverData.blood_group || "",
              renewDate: driverData.renewdate ? dayjs(driverData.renewdate) : null,
              expiryDate: driverData.expiry ? dayjs(driverData.expiry) : null,
              remark: driverData.remarks || "",
            };
            setDriver(transformedData);
            setFetchedDriver(transformedData);
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [driverId]);
  
  

  

  const resetButtonHandler = () => {
    setDriver(fetchedDriver);
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    goToDriversList();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setDriver((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const inputNameHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value?.toUpperCase();
    setDriver((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const autocompleteChangeListener = (value, name) => {
    setDriver((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(driver)) {
      const updatedDriver = {
        ...driver,
        id:driverId, // Include driverId in the updated driver object
      };
  
      
      if (updatedDriver.dateOfBirth) {
        updatedDriver.dateOfBirth = new Date(updatedDriver.dateOfBirth);
      }
      if (updatedDriver.joiningDate) {
        updatedDriver.joiningDate = new Date(updatedDriver.joiningDate);
      }
      if (updatedDriver.renewDate) {
        updatedDriver.renewDate = new Date(updatedDriver.renewDate);
      }
      if (updatedDriver.expiryDate) {
        updatedDriver.expiryDate = new Date(updatedDriver.expiryDate);
      }
  
      dispatch(updateDriver(updatedDriver))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Updated Successfully")) {
            setHttpError(message);
            goToDriversList();
          } else {
            setHttpError("");
            setDriver(initialState);
            goToDriversList();
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };
  

  const dateInputChangeHandler = (name, date) => {
    setDriver((currState) => {
      return {
        ...currState,
        [name]: date,
      };
    });
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.name?.trim?.()) {
      errors.name = { invalid: true, message: "Name is required" };
    }
    if (!formData.correspondenceAddress?.trim?.()) {
      errors.correspondenceAddress = {
        invalid: true,
        message: "Address is required",
      };
    }
    if (!formData.telephone?.trim?.()) {
      errors.telephone = { invalid: true, message: "Telephone is required" };
    }
    if (
      formData.telephone &&
      formData.telephone?.trim?.() !== "" &&
      !mobileNoRegEx.test(formData.telephone)
    ) {
      errors.telephone = {
        invalid: true,
        message: "Telephone number should be 10 digits number",
      };
    }
    if (
      formData.mobile &&
      formData.mobile?.trim?.() !== "" &&
      !mobileNoRegEx.test(formData.mobile)
    ) {
      errors.mobile = {
        invalid: true,
        message: "Mobile number should be 10 digits number",
      };
    }
    // if (!formData.licenseNo?.trim?.()) {
    //   errors.licenseNo = { invalid: true, message: "License no is required" };
    // }
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
        <h1 className="pageHead">Edit a driver</h1>
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

        <form action="" onSubmit={submitHandler}>
          <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
            <div className="grid grid-6-col">
              {/* <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Code"
                    value={driver.code}
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
                    label="Driver name"
                    value={driver.name}
                    error={formErrors.name.invalid}
                    onChange={inputNameHandler}
                    name="name"
                    id="name"
                  />
                  {formErrors.name.invalid && (
                    <FormHelperText>{formErrors.name.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  error={formErrors.correspondenceAddress.invalid}
                >
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Correspondence address"
                    value={driver.correspondenceAddress}
                    error={formErrors.correspondenceAddress.invalid}
                    onChange={inputChangeHandler}
                    name="correspondenceAddress"
                    id="correspondenceAddress"
                  />
                  {formErrors.correspondenceAddress.invalid && (
                    <FormHelperText>
                      {formErrors.correspondenceAddress.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Permanent address"
                    value={driver.permanentAddress}
                    onChange={inputChangeHandler}
                    name="permanentAddress"
                    id="permanentAddress"
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date of birth"
                      inputFormat="DD/MM/YYYY"
                      format="DD/MM/YYYY"
                      value={driver.dateOfBirth}
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
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.telephone.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Telephone"
                    value={driver.telephone}
                    error={formErrors.telephone.invalid}
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
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.mobile.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Mobile"
                    value={driver.mobile}
                    error={formErrors.mobile.invalid}
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
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Father name"
                    value={driver.fatherName}
                    onChange={inputChangeHandler}
                    name="fatherName"
                    id="fatherName"
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Referenced by"
                    value={driver.referencedBy}
                    onChange={inputChangeHandler}
                    name="referencedBy"
                    id="referencedBy"
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth size="small">
                  <Autocomplete
                    autoSelect
                    disablePortal
                    size="small"
                    name="eyeSight"
                    getOptionLabel={(option) => option}
                    options={["Normal", "Good"]}
                    value={driver.eyeSight}
                    onChange={(e, value) =>
                      autocompleteChangeListener(value, "eyeSight")
                    }
                    openOnFocus
                    renderInput={(params) => (
                      <TextField {...params} label="Eyesight" fullWidth />
                    )}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.licenseNo.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="License no"
                    value={driver.licenseNo}
                    error={formErrors.licenseNo.invalid}
                    onChange={inputChangeHandler}
                    name="licenseNo"
                    id="licenseNo"
                  />
                  {formErrors.licenseNo.invalid && (
                    <FormHelperText>
                      {formErrors.licenseNo.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth size="small">
                  <Autocomplete
                    autoSelect
                    disablePortal
                    size="small"
                    name="licenseType"
                    options={["Higher heavy", "Heavy", "Non-heavy", "Normal"]}
                    value={driver.licenseType}
                    onChange={(e, value) =>
                      autocompleteChangeListener(value, "licenseType")
                    }
                    getOptionLabel={(option) => option}
                    openOnFocus
                    renderInput={(params) => (
                      <TextField {...params} label="License type" fullWidth />
                    )}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Renew date"
                      inputFormat="DD/MM/YYYY"
                      format="DD/MM/YYYY"
                      value={driver.renewDate}
                      onChange={dateInputChangeHandler.bind(null, "renewDate")}
                      renderInput={(params) => (
                        <TextField name="renewDate" size="small" {...params} />
                      )}
                    />
                  </LocalizationProvider>
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Expiry date"
                      inputFormat="DD/MM/YYYY"
                      format="DD/MM/YYYY"
                      value={driver.expiryDate}
                      onChange={dateInputChangeHandler.bind(null, "expiryDate")}
                      renderInput={(params) => (
                        <TextField name="expiryDate" size="small" {...params} />
                      )}
                    />
                  </LocalizationProvider>
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Qualification"
                    value={driver.qualification}
                    onChange={inputChangeHandler}
                    name="qualification"
                    id="qualification"
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Joining date"
                      inputFormat="DD/MM/YYYY"
                      format="DD/MM/YYYY"
                      value={driver.joiningDate}
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
                <FormControl fullWidth size="small">
                  <Autocomplete
                    autoSelect
                    disablePortal
                    size="small"
                    name="bloodGroup"
                    options={["A-", "B-", "AB-", "O-", "A+", "B+", "AB+", "O+"]}
                    value={driver.bloodGroup}
                    getOptionLabel={(option) => option}
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
                    size="small"
                    variant="outlined"
                    label="Remark"
                    value={driver.remark}
                    onChange={inputChangeHandler}
                    name="remark"
                    id="remark"
                  />
                </FormControl>
              </div>
            </div>
            <div className="right">
              <Button
                variant="outlined"
                size="medium"
                onClick={backButtonHandler}
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
          </Paper>
        </form>
      </div>
    </>
  );
};

export default DriverEdit;
