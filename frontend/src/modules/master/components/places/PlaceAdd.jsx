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
import { createPlace, selectIsLoading } from "./slice/placeSlice";
import { useDispatch, useSelector } from "react-redux";
import { LoadingSpinner } from "../../../../ui-controls";

const initialPlaceState = {
  name: "",
  abbreviation: "",
};

const initialErrorState = {
  name: {
    invalid: false,
    message: "",
  },
  abbreviation: {
    invalid: false,
    message: "",
  },
};

const PlaceAdd = () => {
  const [place, setPlace] = useState(initialPlaceState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const isLoading = useSelector(selectIsLoading);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const goToPlacesList = useCallback(() => {
    navigate("/master/places");
  }, [navigate]);

  const resetButtonHandler = () => {
    setPlace(initialPlaceState);
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    goToPlacesList();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setPlace((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(place)) {
      dispatch(createPlace(place))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Added Successfully")){
            setHttpError(message);
            goToPlacesList()
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
      errors.name = { invalid: true, message: "Place name is required" };
    }
    if (!formData.abbreviation?.trim?.()) {
      errors.abbreviation = {
        invalid: true,
        message: "Abbreviation is required",
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
      <h1 className="pageHead">Add a place</h1>
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
        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <form action="" onSubmit={submitHandler}>
            <div className="grid grid-6-col">
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.name.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Place name"
                    value={place.name}
                    error={formErrors.name.invalid}
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
                <FormControl fullWidth error={formErrors.abbreviation.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Place abbreviation"
                    value={place.abbreviation}
                    onChange={inputChangeHandler}
                    error={formErrors.abbreviation.invalid}
                    name="abbreviation"
                    id="abbreviation"
                  />
                  {formErrors.abbreviation.invalid && (
                    <FormHelperText>
                      {formErrors.abbreviation.message}
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

export default PlaceAdd;
