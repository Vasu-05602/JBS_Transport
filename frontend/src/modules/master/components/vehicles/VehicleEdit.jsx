import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Autocomplete,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { Alert, Stack } from "@mui/material";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";

import TaxDetailForm from "../taxes/TaxDetailForm";
import TaxDetailList from "../taxes/TaxDetailList";
import { useDispatch, useSelector } from "react-redux";
import {
  getSuppliers,
  getVehicle,
  getVehicleTypes,
  selectIsLoading,
  updateVehicle,
} from "./slice/vehicleSlice";
import { validateAlphaNumeric } from "../../../../services/utils";

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
  const { suppliers, vehicleTypes } = useSelector(({ vehicle }) => vehicle);
  const supplierOptions = suppliers.map(supplier => ({
    id: supplier.vod_id,
    name: supplier.vehical_owner_name,
  }));
  const [vehicle, setVehicle] = useState(initialState);
  const [fetchedVehicle, setFetchedVehicle] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [editTax, setEditTax] = useState(null);
  const isLoading = useSelector(selectIsLoading);
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const location = useLocation();
  const { vehicleId } = location.state;

  const goToVehiclesList = useCallback(() => {
    navigate("/master/vehicles");
  }, [navigate]);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (vehicleId) {
        try {
          const { payload = {} } = await dispatch(getVehicle(vehicleId));
          console.log(payload);
          const { data } = payload;
  
          if (data && data.vehicle) {
            const vehicleData = data.vehicle; // Get vehicle details
            console.log(vehicleData);
            const ownerData = suppliers?.find(({ vod_id }) => vehicleData.vod_id === vod_id);
            const vehicleTypeData = vehicleTypes?.find(({ vt_id }) => vehicleData.vt_id === vt_id);
  
            // Create an updated vehicle object
            const updatedVehicle = {
              ...vehicleData,
              vehicleNo: vehicleData.vehicleno,
              chassisNo: vehicleData.chasisno,
              engineNo: vehicleData.engineno,
              description: vehicleData.vehicle_description,
              regDate: dayjs(vehicleData.reg_date),
              taxDetails: data.taxDetails.map((tax) => ({
                description: tax.tax_description || null,
                taxType: tax.tax_type || null,
                amount: tax.amount || null,
                startDate: dayjs(tax.tax_start_date) || null,
                endDate: dayjs(tax.tax_end_date) || null,
              })) || [],
              owner: ownerData ? {
                vod_id: ownerData.vod_id,
                vehical_owner_name: ownerData.vehical_owner_name,
              } : null,
              vehicleType: vehicleTypeData ? {
                vt_id: vehicleTypeData.vt_id,
                vehicle_type: vehicleTypeData.vehicle_type,
              } : null,
            };
  
            setVehicle(updatedVehicle);
            setFetchedVehicle(updatedVehicle);
          } else {
            setHttpError("No vehicle data found.");
          }
        } catch (error) {
          setHttpError(error.message);
        }
      }
    };
  
    fetchVehicle();
  }, [vehicleId, suppliers, vehicleTypes]);
  





  useEffect(() => {
    dispatch(getSuppliers());
  }, []);

  useEffect(() => {
    dispatch(getVehicleTypes());
  }, []);

  const resetButtonHandler = () => {
    setVehicle({
      ...fetchedVehicle,
      owner: suppliers?.find?.(({ _id }) => fetchedVehicle?.owner === _id),
      vehicleType: vehicleTypes?.find?.(
        ({ _id }) => fetchedVehicle?.vehicleType === _id
      ),
    });
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
    const payload = {
      vehicle_id: vehicleId,  
      vehicleno: vehicle.vehicleNo,
      make: vehicle.make,
      reg_date: vehicle.regDate?.toISOString(),
      engineno: vehicle.engineNo,
      chasisno: vehicle.chassisNo,
      capacity: vehicle.capacity,
      vehicle_description: vehicle.description,
      vehicleexpdate: vehicle.vehicleexpdate,
      pucno: vehicle.pucno,
      pucexpdate: vehicle.pucexpdate,
      body: vehicle.body,
      vod_id: vehicle.owner?.vod_id,
      vt_id: vehicle.vehicleType?.vt_id,
      taxDetails: vehicle.taxDetails.length > 0 ? vehicle.taxDetails.map(taxDetail => ({
        ...taxDetail,
        startDate: dayjs(taxDetail.startDate).format('YYYY-MM-DD'), 
        endDate: dayjs(taxDetail.endDate).format('YYYY-MM-DD')      
    })) : undefined,
};
    if (!validateForm(vehicle)) {
      dispatch(updateVehicle(payload))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Updated Successfully")) {
            setHttpError(message);
            goToVehiclesList();
          } else {
            setHttpError("");
            setVehicle(initialState); 
            goToVehiclesList();
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };


  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.owner?.vod_id) {
      errors.owner = { invalid: true, message: "Supplier is required" };
    }
    if (!formData.vehicleType?.vt_id) {
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

      <h1 className="pageHead">Edit a vehicle</h1>
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
        <div>
          <form action="" id="customerForm" onSubmit={submitHandler}>
            <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
              <div className="grid grid-6-col">
                <div className="grid-item">
                  <FormControl fullWidth size="small" error={formErrors.owner.invalid}>
                    <Autocomplete
                      id="Customer"
                      options={supplierOptions ? supplierOptions : []}
                      getOptionLabel={(option) => option.name || ''} // Display owner name
                      value={vehicle?.owner ? { id: vehicle.owner.vod_id, name: vehicle.owner.vehical_owner_name } : null}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          name="Vehicle supplier"
                          variant="outlined"
                          label="Vehicle supplier"
                          size="small"
                          fullWidth
                        />
                      )}
                      onChange={(event, value) => {
                        const selectedSupplier = value ? { vod_id: value.id, vehical_owner_name: value.name } : null;
                        autocompleteChangeListener(selectedSupplier, "owner"); // Call the handler with the selected supplier
                      }}
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
                      id="VehicleType"
                      options={vehicleTypes || []}
                      getOptionLabel={(option) => option.vehicle_type || ''}
                      value={vehicle.vehicleType ? { vt_id: vehicle.vehicleType.vt_id, vehicle_type: vehicle.vehicleType.vehicle_type } : null}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          name="VehicleType"
                          variant="outlined"
                          label="Vehicle type"
                          size="small"
                          fullWidth
                        />
                      )}
                      onChange={(e, value) => {
                        const selectedVehicleType = vehicleTypes.find(option => option.vehicle_type === value?.vehicle_type);
                        autocompleteChangeListener(selectedVehicleType, "vehicleType");
                      }}
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
              form="customerForm"
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
