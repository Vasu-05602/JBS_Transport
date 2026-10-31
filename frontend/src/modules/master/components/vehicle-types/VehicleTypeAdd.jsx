import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { createVehicleType, selectIsLoading } from "./slice/vehicleTypeSlice";
import { LoadingSpinner } from "../../../../ui-controls";
import { validateNumber } from "../../../../services/utils";

const initialState = {
  type: "",
  tyreQuantity: "",
};

const initialErrorState = {
  type: {
    invalid: false,
    message: "",
  },
  tyreQuantity: {
    invalid: false,
    message: "",
  },
};

const VehicleTypeAdd = () => {
  const [vehicleType, setVehicleType] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const isLoading = useSelector(selectIsLoading);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const goToVehicleTypesList = useCallback(() => {
    navigate("/master/vehicleTypes");
  }, [navigate]);

  const resetButtonHandler = () => {
    setVehicleType(initialState);
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    resetButtonHandler();
    goToVehicleTypesList();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setVehicleType((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(vehicleType)) {
      dispatch(createVehicleType(vehicleType))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Added Successfully")) {
            setHttpError("");  
            setVehicleType(initialState);   
            goToVehicleTypesList();
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
    if (!formData.type?.trim?.()) {
      errors.type = { invalid: true, message: "Vehicle type is required" };
    }
    if (
      isNaN(formData.tyreQuantity) &&
      isNaN(parseFloat(formData.tyreQuantity))
    ) {
      errors.tyreQuantity = {
        invalid: true,
        message: "Tyre quantity should be a number",
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

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <h1 className="pageHead">Add a vehicle type</h1>
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
                <FormControl fullWidth error={formErrors.type.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Vehicle type"
                    value={vehicleType.type}
                    error={formErrors.type.invalid}
                    onChange={inputChangeHandler}
                    name="type"
                    id="type"
                  />
                  {formErrors.type.invalid && (
                    <FormHelperText>{formErrors.type.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.tyreQuantity.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Tyre quantity"
                    value={vehicleType.tyreQuantity || ""}
                    error={formErrors.tyreQuantity.invalid}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="tyreQuantity"
                    id="tyreQuantity"
                  />
                  {formErrors.tyreQuantity.invalid && (
                    <FormHelperText>
                      {formErrors.tyreQuantity.message}
                    </FormHelperText>
                  )}
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
          </form>
        </Paper>
      </div>
    </>
  );
};

export default VehicleTypeAdd;
