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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import LoadingSpinner from "@ui-controls/LoadingSpinner";
import { useDispatch, useSelector } from "react-redux";
import {
  getChallanAck,
  getLorryReceipt,
  selectIsLoading,
  updateLorryReceiptAck,
} from "./slice/acknowledgeSlice";

const initialState = {
  lrNo: "",
  deliveryDate: new Date(),
  _id: "",
};

const initialErrorState = {
  deliveryDate: {
    invalid: false,
    message: "",
  },
};

const LRAcknowledgementEdit = () => {
  const isLoading = useSelector(selectIsLoading);
  const [lorryReceipt, setLorryReceipt] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [challanNo, setChallanNo] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const location = useLocation();
  const { lrId } = location.state;

  const goToLRAcknowledgement = useCallback(() => {
    navigate("/transactions/lrAcknowledgement");
  }, [navigate]);

  useEffect(() => {
    if (lrId && !lorryReceipt._id) {
      dispatch(getLorryReceipt(lrId))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setLorryReceipt((currState) => {
              return {
                ...currState,
                lrNo: payload?.data.lrNo,
                _id: payload?.data._id,
              };
            });
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
      dispatch(getChallanAck(lrId))
        .then(({ payload = {} }) => {
          setChallanNo(payload?.data?.lsNo || "");
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [lrId, lorryReceipt._id]);

  const backButtonHandler = () => {
    goToLRAcknowledgement();
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(lorryReceipt)) {
      const updatedLR = lorryReceipt;
      dispatch(updateLorryReceiptAck(updatedLR))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setFormErrors(initialErrorState);
            goToLRAcknowledgement();
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };

    if (!formData.deliveryDate) {
      errors.deliveryDate = {
        invalid: true,
        message: "Delivery date is required",
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

  const dateInputChangeHandler = (name, date) => {
    setLorryReceipt((currState) => {
      return {
        ...currState,
        [name]: new Date(date),
      };
    });
  };

  const clearDate = (name) => {
    setLorryReceipt((currState) => {
      return {
        ...currState,
        [name]: null,
      };
    });
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className="inner-wrap">
        <h1 className="pageHead">Edit a lorry receipt acknowledgement</h1>
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
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Lorry receipt no"
                    value={lorryReceipt.lrNo}
                    name="lrNo"
                    id="lrNo"
                    inputProps={{ readOnly: true }}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Challan no."
                    value={challanNo}
                    name="lsNo"
                    id="lsNo"
                    inputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <div className="bl_date">
                  <FormControl
                    fullWidth
                    error={formErrors.deliveryDate.invalid}
                  >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        error={formErrors.deliveryDate.invalid}
                        label="Delivery date"
                        inputFormat="DD/MM/YYYY"
                        value={lorryReceipt.deliveryDate}
                        onChange={dateInputChangeHandler.bind(
                          null,
                          "deliveryDate"
                        )}
                        inputProps={{
                          readOnly: true,
                        }}
                        renderInput={(params) => (
                          <TextField
                            name="deliveryDate"
                            size="small"
                            {...params}
                            error={formErrors.deliveryDate.invalid}
                          />
                        )}
                      />
                    </LocalizationProvider>
                    {formErrors.deliveryDate.invalid && (
                      <FormHelperText>
                        {formErrors.deliveryDate.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <Button
                    variant="text"
                    size="medium"
                    className="clearHandler"
                    onClick={clearDate.bind(null, "deliveryDate")}
                  >
                    Clear
                  </Button>
                </div>
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

export default LRAcknowledgementEdit;
