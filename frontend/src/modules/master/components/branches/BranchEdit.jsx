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
import { Alert, Stack } from "@mui/material";
import { LoadingSpinner } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import {
  getBranch,
  getPlaces,
  selectIsLoading,
  updateBranch,
} from "./slice/branchSlice";

const initialBranchState = {
  branchCode: "",
  abbreviation: "",
  name: "",
  description: "",
  place: "", // Place should store the place_id as a string
  printer: "",
};

const initialErrorState = {
  branchCode: {
    invalid: false,
    message: "",
  },
  abbreviation: {
    invalid: false,
    message: "",
  },
  name: {
    invalid: false,
    message: "",
  },
  place: {
    invalid: false,
    message: "",
  },
  printer: {
    invalid: false,
    message: "",
  },
};

const printers = [
  "Epson LQ-300+",
  "Epson LX-300+",
  "Epson LX-300+II",
  "TVS MPS 250 Champion",
];

const BranchEdit = () => {
  const [branch, setBranch] = useState(initialBranchState);
  const { places } = useSelector(({ branch }) => branch);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [fetchedBranch, setFetchedBranch] = useState(initialBranchState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const isLoading = useSelector(selectIsLoading);

  const location = useLocation();
  const { branchId } = location.state;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const goToBranchList = useCallback(() => {
    navigate("/master/branches");
  }, [navigate]);

  const transformedPlaces = places.map(place => ({
    place_id: place.place_id,
    place_name: place.place_name,
  }));

  useEffect(() => {
    if (branchId) {
      dispatch(getBranch(branchId))
        .then(({ payload = {} }) => {
          const { data = [], message } = payload || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            if (data.length > 0) {
              const branchData = data[0];
              setBranch({
                branchCode: branchData.branch_code || "",
                abbreviation: branchData.branch_abbreviation || "",
                name: branchData.branch_name || "",
                description: branchData.description || "",
                place: branchData.place_id || "",
                printer: branchData.printer_name || "",
              });
              const place = places.find(p => p.place_id === branchData.place_id);
              setSelectedPlace(place || null);
            } else {
              setBranch(initialBranchState);
            }
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [branchId, dispatch, places]);

  useEffect(() => {
    dispatch(getPlaces());
  }, [dispatch]);

  useEffect(() => {
    if (selectedPlace) {
      setBranch(currState => ({
        ...currState,
        place: selectedPlace.place_id, // Update with place_id
      }));
    }
  }, [selectedPlace]);

  const resetButtonHandler = () => {
    const place = places?.find?.(({ place_id }) => branch.place === place_id);
    setBranch({ ...fetchedBranch, place: fetchedBranch.place });
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setBranch((currState) => ({
      ...currState,
      [name]: value,
    }));
  };

  const autocompleteChangeListener = (e, value) => {
    setSelectedPlace(value);
  };

  const autocompleteType = (e, value) => {
    setBranch((currState) => ({
      ...currState,
      printer: value,
    }));
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(branch)) {
      dispatch(
        updateBranch({
          ...branch,
          place: branch.place, 
          branchId, 
        })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Updated Successfully")){
            setHttpError(message);
            goToBranchList();
          } else {
            setHttpError("");
            setBranch(initialBranchState);
            goToBranchList();
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.branchCode?.trim?.()) {
      errors.branchCode = { invalid: true, message: "Branch code is required" };
    }
    if (!formData.abbreviation?.trim?.()) {
      errors.abbreviation = {
        invalid: true,
        message: "Abbreviation is required",
      };
    }
    if (!formData.name?.trim?.()) {
      errors.name = { invalid: true, message: "Branch name is required" };
    }
    if (!formData.place) {
      errors.place = { invalid: true, message: "Place is required" };
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

  const cancelButtonHandler = () => {
    goToBranchList();
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}

      <h1 className="pageHead">Edit a branch</h1>
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
              <FormControl fullWidth error={formErrors.branchCode.invalid}>
                <TextField
                  variant="outlined"
                  label="Branch code"
                  value={branch.branchCode}
                  onChange={inputChangeHandler}
                  name="branchCode"
                  id="branchCode"
                  size="small"
                  error={formErrors.branchCode.invalid}
                />
                {formErrors.branchCode.invalid && (
                  <FormHelperText>
                    {formErrors.branchCode.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.abbreviation.invalid}>
                <TextField
                  variant="outlined"
                  label="Abbreviation"
                  error={formErrors.abbreviation.invalid}
                  value={branch.abbreviation}
                  onChange={inputChangeHandler}
                  name="abbreviation"
                  id="abbreviation"
                  size="small"
                />
                {formErrors.abbreviation.invalid && (
                  <FormHelperText>
                    {formErrors.abbreviation.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.name.invalid}>
                <TextField
                  variant="outlined"
                  label="Name"
                  error={formErrors.name.invalid}
                  value={branch.name}
                  onChange={inputChangeHandler}
                  name="name"
                  id="name"
                  size="small"
                />
                {formErrors.name.invalid && (
                  <FormHelperText>{formErrors.name.message}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth>
                <TextField
                  variant="outlined"
                  label="Description"
                  value={branch.description}
                  onChange={inputChangeHandler}
                  name="description"
                  id="description"
                  size="small"
                />
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth size="small" error={formErrors.place.invalid}>
                <Autocomplete
                  disablePortal
                  size="small"
                  name="place"
                  options={transformedPlaces}
                  getOptionLabel={(option) => option.place_name || ""}
                  openOnFocus
                  value={selectedPlace}
                  onChange={(e, value) => {
                    setSelectedPlace(value);
                    autocompleteChangeListener(e, value);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Place"
                      error={formErrors.place.invalid}
                      fullWidth
                    />
                  )}
                />
                {formErrors.place.invalid && (
                  <FormHelperText>{formErrors.place.message}</FormHelperText>
                )}
              </FormControl>
            </div>
            {/* <div className="grid-item">
              <FormControl
                fullWidth
                size="small"
                error={formErrors.printer.invalid}
              >
                <Autocomplete
                  autoSelect
                  disablePortal
                  size="small"
                  name="printer"
                  options={printers}
                  value={branch.printer}
                  onChange={(e, value) => autocompleteType(e, value)}
                  getOptionLabel={(option) => option}
                  openOnFocus
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Printer"
                      error={formErrors.printer.invalid}
                      fullWidth
                    />
                  )}
                />
                {formErrors.printer.invalid && (
                  <FormHelperText>{formErrors.printer.message}</FormHelperText>
                )}
              </FormControl>
            </div> */}
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
    </>
  );
};

export default BranchEdit;
