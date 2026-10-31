import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Autocomplete,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LoadingSpinner } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import {
  createMoneyTransfer,
  getBranches,
  selectIsLoading,
} from "./slice/moneyTransferSlice";
import { validateNumber } from "../../../../services/utils";

const initialState = {
  branch: "",
  transferToBranch: "",
  date: null,
  amount: "",
  remark: "",
};

const initialErrorState = {
  branch: {
    invalid: false,
    message: "",
  },
  transferToBranch: {
    invalid: false,
    message: "",
  },
  date: {
    invalid: false,
    message: "",
  },
  amount: {
    invalid: false,
    message: "",
  },
  remark: {
    invalid: false,
    message: "",
  },
};

const MoneyTransferAdd = () => {
  const isLoading = useSelector(selectIsLoading);
  const user = useSelector((state) => state.user);
  const { state } = useLocation();
  const [branches, setBranches] = useState([]);
  const [moneyTransfer, setMoneyTransfer] = useState({
    ...initialState,
    branch: state,
  });
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const goToMoneyTransfers = useCallback(() => {
    navigate("/transactions/moneyTransfers");
  }, [navigate]);

  useEffect(() => {
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        } else {
          setBranches(payload?.data);
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
  }, []);

  const resetButtonHandler = () => {
    setMoneyTransfer(initialState);
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    goToMoneyTransfers();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setMoneyTransfer((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const autocompleteChangeListener = (option, name) => {
    setMoneyTransfer((currState) => {
      return {
        ...currState,
        [name]: option,
      };
    });
  };

  const dateInputChangeHandler = (name, date) => {
    setMoneyTransfer((currState) => {
      return {
        ...currState,
        [name]: new Date(date),
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(moneyTransfer)) {
      dispatch(
        createMoneyTransfer({
          ...moneyTransfer,
          branch: moneyTransfer.branch?._id,
          transferToBranch: moneyTransfer.transferToBranch?._id,
        })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setFormErrors(initialErrorState);
            setMoneyTransfer(initialState);
            goToMoneyTransfers();
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.branch) {
      errors.branch = { invalid: true, message: "Branch is required" };
    }
    if (!formData.transferToBranch) {
      errors.transferToBranch = {
        invalid: true,
        message: "Branch is required",
      };
    }
    if (!formData.date) {
      errors.date = { invalid: true, message: "Date is required" };
    }
    if (!formData.amount || formData.amount === "0") {
      errors.amount = {
        invalid: true,
        message: "Amount is required and should be greater than 0",
      };
    }
    if (formData.amount && isNaN(formData.amount)) {
      errors.amount = { invalid: true, message: "Amount should be a number" };
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
      <div className="inner-wrap">
        <h1 className="pageHead">Add a money transfer</h1>
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
                <FormControl
                  fullWidth
                  size="small"
                  error={formErrors.branch.invalid}
                >
                  <Autocomplete
                    autoSelect
                    disablePortal
                    size="small"
                    name="branch"
                    options={branches}
                    value={moneyTransfer.branch || null}
                    onChange={(e, value) =>
                      autocompleteChangeListener(value, "branch")
                    }
                    getOptionLabel={(branch) => branch.name || ""}
                    openOnFocus
                    disabled={
                      user &&
                      user.type &&
                      user.type?.toLowerCase?.() !== "superadmin" &&
                      user.type?.toLowerCase?.() !== "admin"
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Branch"
                        error={formErrors.branch.invalid}
                        fullWidth
                      />
                    )}
                  />
                  {formErrors.branch.invalid && (
                    <FormHelperText>{formErrors.branch.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  size="small"
                  error={formErrors.transferToBranch.invalid}
                >
                  <Autocomplete
                    autoSelect
                    disablePortal
                    size="small"
                    name="transferToBranch"
                    options={branches}
                    value={moneyTransfer.transferToBranch || null}
                    onChange={(e, value) =>
                      autocompleteChangeListener(value, "transferToBranch")
                    }
                    getOptionLabel={(branch) => branch.name || ""}
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Transfer to branch"
                        error={formErrors.transferToBranch.invalid}
                        fullWidth
                      />
                    )}
                  />
                  {formErrors.transferToBranch.invalid && (
                    <FormHelperText>
                      {formErrors.transferToBranch.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.date.invalid}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date"
                      inputFormat="DD/MM/YYYY"
                      value={moneyTransfer.date}
                      disableFuture={true}
                      disableMaskedInput={true}
                      onChange={dateInputChangeHandler.bind(null, "date")}
                      inputProps={{
                        readOnly: true,
                      }}
                      renderInput={(params) => (
                        <TextField
                          name="date"
                          size="small"
                          {...params}
                          error={formErrors.date.invalid}
                        />
                      )}
                    />
                  </LocalizationProvider>
                  {formErrors.date.invalid && (
                    <FormHelperText>{formErrors.date.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.amount.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Amount"
                    value={moneyTransfer.amount || ""}
                    error={formErrors.amount.invalid}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="amount"
                    id="amount"
                  />
                  {formErrors.amount.invalid && (
                    <FormHelperText>{formErrors.amount.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Remark"
                    value={moneyTransfer.remark}
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

export default MoneyTransferAdd;
