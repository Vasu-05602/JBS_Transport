import React, { useState } from "react";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  InputAdornment,
} from "@mui/material";
import { validateNumber } from "../../../../services/utils";
import { AutoComplete } from "../../../../ui-controls";

const initialState = {
  station: null,
  amount: "",
  field1: "",
  field2: "",
  field3: "",
  otherFieldValue: "",
};

const initialErrorState = {
  station: {
    invalid: false,
    message: "",
  },
  amount: {
    invalid: false,
    message: "",
  },
};
const Stations = ({ places, quotation, setQuotation }) => {
  const [station, setStation] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setStation((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const autocompleteChangeListener = (e, option, name) => {
    setStation((currState) => {
      return {
        ...currState,
        [name]: option,
      };
    });
  };

  // const submitHandler = (e) => {
  //   e.preventDefault();
  //   if (!validateForm(station)) {
  //     const prevStations = quotation.stations;
  //     const newStation = station;
  //     newStation.station = newStation.station.name;
  //     setQuotation((currState) => {
  //       return {
  //         ...currState,
  //         stations: [...prevStations, newStation],
  //       };
  //     });
  //     setStation(initialState);
  //     setFormErrors(initialErrorState);
  //   }
  // };

  // const submitHandler = (e) => {
  //   e.preventDefault();
  //   if (!validateForm(station)) {
  //     const prevStations = quotation.stations;
  //     const newStation = { ...station };
  //     newStation.stationName = newStation.station.label; // keep name for display in the table
  //     newStation.station = newStation.station._id;        // send only the place_id
  //     setQuotation((currState) => {
  //       return {
  //         ...currState,
  //         stations: [...prevStations, newStation],
  //       };
  //     });
  //     setStation(initialState);
  //     setFormErrors(initialErrorState);
  //   }
  // };
  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(station)) {
      const prevStations = quotation.stations;
      const newStation = { ...station };
      const stationVal = station.station;
      const stationName =
        typeof stationVal === "object" && stationVal !== null
          ? stationVal.place_name || stationVal.label || stationVal.name || stationVal.value || ""
          : String(stationVal || "").trim();

      newStation.station = stationName;
      newStation.stationName = stationName;
      newStation.place = stationName;

      setQuotation((currState) => {
        return {
          ...currState,
          stations: [...prevStations, newStation],
        };
      });
      setStation(initialState);
      setFormErrors(initialErrorState);
    }
  };

  const resetButtonHandler = (e) => {
    e.preventDefault();
    setStation(initialState);
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.station) {
      errors.station = { invalid: true, message: "Station is required" };
    }
    if (!formData.amount?.trim?.()) {
      errors.amount = { invalid: true, message: "Amount is required" };
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
      <h2 className="mb20">Add Stations</h2>
      <form action="" onSubmit={submitHandler} id="stationForm">
        <div className="grid grid-6-col">
          <div className="grid-item">
            <FormControl
              fullWidth
              size="small"
              error={formErrors.station.invalid}
            >
              <AutoComplete
                disablePortal
                size="small"
                name="station"
                sortKey="label"
                options={places}
                value={station.station}
                onChange={(e, value) =>
                  autocompleteChangeListener(e, value, "station")
                }
                openOnFocus
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Station"
                    error={formErrors.station.invalid}
                    fullWidth
                  />
                )}
              />
              {formErrors.station.invalid && (
                <FormHelperText>{formErrors.station.message}</FormHelperText>
              )}
            </FormControl>
          </div>
          <div className="grid-item">
            <FormControl
              fullWidth
              size="small"
              error={formErrors.amount.invalid}
            >
              <TextField
                size="small"
                variant="outlined"
                label="Amount"
                error={formErrors.amount.invalid}
                value={station.amount || ""}
                onChange={inputChangeHandler}
                onInput={validateNumber}
                name="amount"
                id="amount"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">&#8377;</InputAdornment>
                  ),
                }}
              />

              {formErrors.amount.invalid && (
                <FormHelperText>{formErrors.amount.message}</FormHelperText>
              )}
            </FormControl>
          </div>
          <div className="grid-item">
            <FormControl fullWidth size="small">
              <TextField
                size="small"
                variant="outlined"
                label="Other field value"
                value={station.otherFieldValue || ""}
                onInput={validateNumber}
                onChange={inputChangeHandler}
                name="otherFieldValue"
                id="otherFieldValue"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">&#8377;</InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </div>
          <div className="grid-item">
            <FormControl fullWidth size="small">
              <TextField
                size="small"
                variant="outlined"
                label="Field 1"
                value={station.field1 || ""}
                onInput={validateNumber}
                onChange={inputChangeHandler}
                name="field1"
                id="field1"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">&#8377;</InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </div>
          <div className="grid-item">
            <FormControl fullWidth size="small">
              <TextField
                size="small"
                variant="outlined"
                label="Field 2"
                value={station.field2 || ""}
                onInput={validateNumber}
                onChange={inputChangeHandler}
                name="field2"
                id="field2"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">&#8377;</InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </div>
          <div className="grid-item">
            <FormControl fullWidth size="small">
              <TextField
                size="small"
                variant="outlined"
                label="Field 3"
                value={station.field3 || ""}
                onInput={validateNumber}
                onChange={inputChangeHandler}
                name="field3"
                id="field3"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">&#8377;</InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </div>
          <div className="grid-item">
            <Button
              variant="contained"
              size="medium"
              type="submit"
              color="primary"
              form="stationForm"
              className="ml6"
            >
              Add
            </Button>{" "}
            <Button
              variant="outlined"
              size="medium"
              onClick={resetButtonHandler}
              className="ml6"
            >
              Reset
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};
export default Stations;
