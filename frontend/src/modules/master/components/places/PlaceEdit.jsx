import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { getPlace, selectIsLoading, updatePlace } from "./slice/placeSlice";
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

const PlaceEdit = () => {
  const [place, setPlace] = useState(initialPlaceState);
  const [fetchedPlace, setFetchedPlace] = useState(initialPlaceState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const isLoading = useSelector(selectIsLoading);

  const location = useLocation();
  const { placeId } = location.state;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const goToPlaceList = useCallback(() => {
    navigate("/master/places");
  }, [navigate]);

  useEffect(() => {
    if (placeId && placeId !== "") {
      dispatch(getPlace(placeId))
        .then(({ payload = {} }) => {
          const { data } = payload || {};
          if (data?.message) {
            setHttpError(data.message);
          } else {
            setHttpError("");
            const placeData = data?.[0] || {}; 
            setPlace({
              name: placeData.place_name || "",
              abbreviation: placeData.place_abbreviation || "",
            });
            setFetchedPlace({
              name: placeData.place_name || "",
              abbreviation: placeData.place_abbreviation || "",
            });
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [placeId]);

  const resetButtonHandler = () => {
    setPlace(fetchedPlace);
    setHttpError("");
    setFormErrors(initialErrorState);
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
  const goToPlacesList = useCallback(() => {
    navigate("/master/places");
  }, [navigate]);
  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(place)) {
      dispatch(updatePlace({...place,placeId }))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Updated Successfully")){
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

  const backButtonHandler = () => {
    goToPlaceList();
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <h1 className="pageHead">Edit a place</h1>
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
                    variant="outlined"
                    label="Name"
                    size="small"
                    error={formErrors.name.invalid}
                    value={place.name}
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
                    variant="outlined"
                    size="small"
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

export default PlaceEdit;
