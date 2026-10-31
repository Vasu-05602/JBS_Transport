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
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import { createBranch, getPlaces, selectIsLoading } from "./slice/branchSlice";

const initialBranchState = {
  branchCode: "",
  abbreviation: "",
  name: "",
  description: "",
  place: "",
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

const BranchAdd = () => {
  const [branch, setBranch] = useState(initialBranchState);
  const [places, setPlaces] = useState(initialBranchState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector(selectIsLoading);

  const goToBranchList = useCallback(() => {
    navigate("/master/branches");
  }, [navigate]);
  useEffect(() => {
    dispatch(getPlaces())
      .then(({ payload = {} }) => {
        const { data = [], message } = payload;
        
        if (message) {
          setHttpError(message);
        } else {
          const formattedPlaces = data.map(place => ({
            place_id: place.place_id,
            place_name: place.place_name,
          }));
          setPlaces(formattedPlaces);
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });
  }, []);

  const resetButtonHandler = () => {
    setBranch(initialBranchState);
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    goToBranchList();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setBranch((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const autocompleteChangeListener = (e, value) => {
    setBranch((currState) => {
      return {
        ...currState,
        place: value,
      };
    });
  };

  const autocompleteType = (e, value) => {
    setBranch((currState) => {
      return {
        ...currState,
        printer: value,
      };
    });
  };
  const submitHandler = (e) => {
    e.preventDefault();
  
    if (!validateForm(branch)) {
      dispatch(createBranch({ ...branch, place: branch.place?.place_id }))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Added Successfully")) {
            setHttpError("");  
            setBranch(initialBranchState);  
            goToBranchList();
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
    // if (!formData.printer) {
    //   errors.printer = { invalid: true, message: "Printer is required" };
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
      <h1 className="pageHead">Add a branch</h1>
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
                <FormControl fullWidth error={formErrors.branchCode.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Branch code"
                    value={branch.branchCode}
                    onChange={inputChangeHandler}
                    name="branchCode"
                    id="branchCode"
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
                    size="small"
                    variant="outlined"
                    label="Abbreviation"
                    error={formErrors.abbreviation.invalid}
                    value={branch.abbreviation}
                    onChange={inputChangeHandler}
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
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.name.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Name"
                    error={formErrors.name.invalid}
                    value={branch.name}
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
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Description"
                    value={branch.description}
                    onChange={inputChangeHandler}
                    name="description"
                    id="description"
                  />
                </FormControl>
              </div>
              <div className="grid-item">
  <FormControl
    fullWidth
    size="small"
    error={formErrors.place.invalid}
  >
    <Autocomplete
      disablePortal
      size="small"
      name="place"
      options={places}
      value={branch.place || null}
      onChange={(e, value) =>
        autocompleteChangeListener(e, value)
      }
      openOnFocus
      getOptionLabel={(option) => option.place_name || ''}
      getOptionSelected={(option, value) => option.place_id === value.place_id}
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
                    size="small"
                    name="accountType"
                    options={[
                      "Epson LQ-300+",
                      "Epson LX-300+",
                      "Epson LX-300+II",
                      "TVS MPS 250 Champion",
                    ]}
                    value={branch.printer || null}
                    onChange={(e, value) => autocompleteType(e, value)}
                    openOnFocus
                    getOptionLabel={(option) => option}
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
                    <FormHelperText>
                      {formErrors.printer.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div> */}
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

export default BranchAdd;
