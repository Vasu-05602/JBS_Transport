import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Autocomplete,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { Alert, Stack } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import TaxDetailForm from "../taxes/TaxDetailForm";
import TaxDetailList from "../taxes/TaxDetailList";
import { useDispatch, useSelector } from "react-redux";
import {
  createVehicle,
  getSuppliers,
  getVehicleTypes,
  selectIsLoading,
} from "./slice/vehicleSlice";
import { validateAlphaNumeric } from "../../../../services/utils";

const initialErrorState = {
  owner: {
    invalid: false,
    message: "",
  },
  vehicleType: {
    invalid: false,
    message: "",
  },
  vehicleNo: {
    invalid: false,
    message: "",
  },
  taxDetails: {
    invalid: false,
    message: "",
  },
};

const VehicleAdd = () => {
  const initialState = {
    owner: "",
    vehicleType: "",
    vehicleNo: "",
    make: "",
    capacity: "",
    regDate: null,
    chassisNo: "",
    engineNo: "",
    description: "",
    taxDetails: [],
  };
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [vehicle, setVehicle] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [editTax, setEditTax] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector(selectIsLoading);

  const goToVehiclesList = useCallback(() => {
    navigate("/master/vehicles");
  }, [navigate]);

  useEffect(() => {
    dispatch(getSuppliers())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          const simplifiedSuppliers = payload.data.map(({ vod_id, vehical_owner_name }) => ({
            vod_id,
            name: vehical_owner_name, // Adding name for autocomplete display
          }));
          setSuppliers(simplifiedSuppliers);
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });
  }, []);


  useEffect(() => {
    dispatch(getVehicleTypes())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setVehicleTypes(payload?.data);
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });
  }, []);

  const resetButtonHandler = () => {
    setVehicle(initialState);
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    goToVehiclesList();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setVehicle((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const inputVehicleNoHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value?.toUpperCase();
    setVehicle((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const autocompleteChangeListener = (value, name) => {
    setVehicle((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const dateInputChangeHandler = (name, date) => {
    setVehicle((currState) => {
      return {
        ...currState,
        [name]: date,
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(vehicle)) {
      dispatch(
        createVehicle({
          ...vehicle,
          owner: vehicle.owner?.vod_id,
          vehicleType: vehicle.vehicleType?.vt_id,
        })
      )
        .then(({ payload = {} }) => {
          console.log("API Response:", payload);
          const { message } = payload?.data || {};
          if (message && message.includes("Added Successfully")) {
            setHttpError("");  
            setVehicle(initialState);
            goToVehiclesList();
          } else {
            setHttpError(message); 
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.owner) {
      errors.owner = { invalid: true, message: "Supplier is required" };
    }
    if (!formData.vehicleType) {
      errors.vehicleType = {
        invalid: true,
        message: "Vehicle type is required",
      };
    }
    if (!formData.vehicleNo?.trim?.()) {
      errors.vehicleNo = {
        invalid: true,
        message: "Vehicle number is required",
      };
    }
  //   if (!formData.taxDetails?.length) {
  //     errors.taxDetails = {
  //         invalid: true,
  //         message: "At least one tax detail is required",
  //     };
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

  const handleOnTaxDetailAdd = (receivedTaxDetail) => {
    if (!editTax) {
      setVehicle((currentState) => {
        const currentVehicle = { ...currentState };
        currentVehicle.taxDetails?.push?.(receivedTaxDetail);
        return currentVehicle;
      });
    } else {
      const editedTaxDetail = { ...editTax };
      const updatedReceivedTaxDetail = { ...receivedTaxDetail };
      delete updatedReceivedTaxDetail.index;
      setVehicle((currentState) => {
        const currentVehicle = { ...currentState };
        const currentVehicleTaxDetails = [...currentState.taxDetails];
        currentVehicleTaxDetails[editedTaxDetail.index] = {
          ...updatedReceivedTaxDetail,
        };
        currentVehicle.taxDetails = [...currentVehicleTaxDetails];
        return currentVehicle;
      });
      setEditTax(null);
    }
  };

  const handleTriggerEdit = (index) => {
    setEditTax({ ...vehicle.taxDetails[index], index: index });
  };

  const handleTriggerDelete = (contactIndex) => {
    setVehicle((currentState) => {
      const currentVehicle = { ...currentState };
      currentVehicle.taxDetails = currentVehicle.taxDetails?.filter?.(
        (contact, index) => index !== contactIndex
      );
      return currentVehicle;
    });
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}

      <h1 className="pageHead">Add a vehicle</h1>
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

      {!isLoading && (
        <div className="inner-wrap">
          <form action="" id="vehicleForm" onSubmit={submitHandler}>
            <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
              <div className="grid grid-6-col">
                <div className="grid-item">
                  <FormControl
                    fullWidth
                    size="small"
                    error={formErrors.owner.invalid}
                  >
                    <Autocomplete
                      size="small"
                      name="owner"
                      options={suppliers}
                      value={vehicle.owner || null}
                      onChange={(e, value) =>
                        autocompleteChangeListener(value, "owner")
                      }
                      getOptionLabel={(option) => option.name || ''} // Display name
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Vehicle supplier"
                          error={formErrors.owner.invalid}
                          fullWidth
                        />
                      )}
                    />
                    {formErrors.owner.invalid && (
                      <FormHelperText>
                        {formErrors.owner.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </div>

                <div className="grid-item">
                  <FormControl fullWidth error={formErrors.vehicleNo.invalid}>
                    <TextField
                      size="small"
                      variant="outlined"
                      label="Vehicle number"
                      value={vehicle.vehicleNo}
                      error={formErrors.vehicleNo.invalid}
                      onChange={inputVehicleNoHandler}
                      onInput={validateAlphaNumeric}
                      name="vehicleNo"
                      id="vehicleNo"
                    />
                    {formErrors.vehicleNo.invalid && (
                      <FormHelperText>
                        {formErrors.vehicleNo.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </div>
                <div className="grid-item">
                  <FormControl
                    fullWidth
                    size="small"
                    error={formErrors.vehicleType.invalid}
                  >
                    <Autocomplete
                      autoSelect
                      size="small"
                      name="vehicleType"
                      options={vehicleTypes}
                      value={vehicle.vehicleType || null}
                      onChange={(e, value) =>
                        autocompleteChangeListener(value, "vehicleType")
                      }
                      openOnFocus
                      getOptionLabel={(option) => option.vehicle_type}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Vehicle type"
                          error={formErrors.vehicleType.invalid}
                          fullWidth
                        />
                      )}
                    />
                    {formErrors.vehicleType.invalid && (
                      <FormHelperText>
                        {formErrors.vehicleType.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </div>
                <div className="grid-item">
                  <FormControl fullWidth>
                    <TextField
                      size="small"
                      variant="outlined"
                      label="Make"
                      value={vehicle.make}
                      onChange={inputChangeHandler}
                      name="make"
                      id="make"
                    />
                  </FormControl>
                </div>
                <div className="grid-item">
                  <FormControl fullWidth>
                    <TextField
                      size="small"
                      variant="outlined"
                      label="Capacity"
                      value={vehicle.capacity}
                      onChange={inputChangeHandler}
                      name="capacity"
                      id="capacity"
                    />
                  </FormControl>
                </div>
                <div className="grid-item">
                  <FormControl fullWidth error>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Registration date"
                        inputFormat="DD/MM/YYYY"
                        format="DD/MM/YYYY"
                        value={vehicle.regDate}
                        disableFuture={true}
                        onChange={dateInputChangeHandler.bind(null, "regDate")}
                        renderInput={(params) => (
                          <TextField name="regDate" size="small" {...params} />
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
                      label="Chassis number"
                      value={vehicle.chassisNo}
                      onChange={inputChangeHandler}
                      name="chassisNo"
                      id="chassisNo"
                    />
                  </FormControl>
                </div>
                <div className="grid-item">
                  <FormControl fullWidth>
                    <TextField
                      size="small"
                      variant="outlined"
                      label="Engine number"
                      value={vehicle.engineNo}
                      onChange={inputChangeHandler}
                      name="engineNo"
                      id="engineNo"
                    />
                  </FormControl>
                </div>
                <div className="grid-item">
                  <FormControl fullWidth>
                    <TextField
                      size="small"
                      variant="outlined"
                      label="Description"
                      value={vehicle.description}
                      onChange={inputChangeHandler}
                      name="description"
                      id="description"
                    />
                  </FormControl>
                </div>
              </div>
            </Paper>
          </form>

          <div className="bl_contact_person">
            <div className="bl_form">
              <TaxDetailForm
                onTaxDetailAdd={handleOnTaxDetailAdd}
                editTaxDetail={editTax}
              />
            </div>
            <div className="bl_content">
            {formErrors.taxDetails.invalid && (
                <Stack
                  sx={{
                    width: "100%",
                    margin: "0 0 30px 0",
                    border: "1px solid red",
                    borderRadius: "4px",
                  }}
                  spacing={2}
                >
                  <Alert severity="error">
                    {formErrors.taxDetails.message}
                  </Alert>
                </Stack>
              )}
              <TaxDetailList
                taxDetails={vehicle.taxDetails}
                handleTriggerEdit={handleTriggerEdit}
                handleTriggerDelete={handleTriggerDelete}
              />
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
              form="vehicleForm"
              className="ml6"
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default VehicleAdd;
