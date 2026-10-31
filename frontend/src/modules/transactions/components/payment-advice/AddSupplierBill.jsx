import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Stack,
  FormControl,
  FormHelperText,
  Button,
  TextField,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LoadingSpinner } from "../../../../ui-controls";
import {
  createSupplierBill,
  selectIsLoading,
} from "./slice/paymentAdviceSlice";
import { validateNumber } from "../../../../services/utils";

const AddSupplierBill = ({
  selectedSupplier,
  selectedSupplierType,
  setTriggerFetch,
}) => {
  const initialState = useMemo(
    () => ({
      branch: "",
      supplier: selectedSupplier || "",
      supplierType: selectedSupplierType || "",
      supplyContent: "",
      date: new Date(),
      invoiceNo: "",
      invoiceDate: null,
      quantity: "",
      amount: "",
    }),
    [selectedSupplier]
  );

  const initialErrorState = {
    branch: {
      invalid: false,
      message: "",
    },
    supplyContent: {
      invalid: false,
      message: "",
    },
    date: {
      invalid: false,
      message: "",
    },
    invoiceNo: {
      invalid: false,
      message: "",
    },
    invoiceDate: {
      invalid: false,
      message: "",
    },
    quantity: {
      invalid: false,
      message: "",
    },
    amount: {
      invalid: false,
      message: "",
    },
  };
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const isLoading = useSelector(selectIsLoading);
  const [bill, setBill] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const { branches } = useSelector(({ paymentadvice }) => paymentadvice) || {};

  const cancelButtonHandler = useCallback(() => {
    const filteredBranch = branches?.find?.(
      (branch) => branch._id === user.branch
    );
    setBill(() => {
      return {
        ...initialState,
        branch: filteredBranch,
      };
    });
  }, [initialState, user.branch]);

  useEffect(() => {
    if (user && user.branch) {
      const filteredBranch = branches?.find?.(
        (branch) => branch._id === user.branch
      );
      if (filteredBranch?._id) {
        setBill((currState) => {
          return {
            ...currState,
            branch: filteredBranch,
          };
        });
      }
    }
  }, [user]);

  const inputChangeHandler = (e) => {
    if (e.target.name === "amount") {
      e.target.value = e.target.value?.replace?.(/[^0-9.-]/g, "");
    }
    const name = e.target.name;
    const value = e.target.value;
    setBill((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const autocompleteChangeListener = (option, name) => {
    setBill((currState) => {
      return {
        ...currState,
        [name]: option,
      };
    });
  };
  const dateInputChangeHandler = (name, date) => {
    setBill((currState) => {
      return {
        ...currState,
        [name]: new Date(date),
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(bill)) {
      dispatch(createSupplierBill({ ...bill, branch: bill.branch?._id }))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            cancelButtonHandler();
            setFormErrors(initialErrorState);
          }
          setTriggerFetch(true);
        })
        .catch((e) => {
          setHttpError(e.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };

    if (!formData.branch) {
      errors.branch = { invalid: true, message: "Branch is required" };
    }
    if (!formData.invoiceNo?.trim?.()) {
      errors.invoiceNo = { invalid: true, message: "Invoice no is required" };
    }
    if (!formData.invoiceDate) {
      errors.invoiceDate = {
        invalid: true,
        message: "Invoice date is required",
      };
    }
    if (!formData.quantity?.trim?.()) {
      errors.quantity = { invalid: true, message: "Quantity is required" };
    }
    if (formData.amount <= 0) {
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
      {isLoading && <LoadingSpinner />}

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

      <h2 className="mb20">Add a new bill</h2>
      <form action="" onSubmit={submitHandler}>
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
                value={bill.branch || null}
                onChange={(e, value) =>
                  autocompleteChangeListener(value, "branch")
                }
                disabled={
                  user &&
                  user.type &&
                  user.type?.toLowerCase?.() !== "superadmin" &&
                  user.type?.toLowerCase?.() !== "admin"
                }
                getOptionLabel={(branch) => branch.name || ""}
                openOnFocus
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
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date"
                  inputFormat="DD/MM/YYYY"
                  value={bill.date}
                  disableFuture={true}
                  onChange={dateInputChangeHandler.bind(null, "date")}
                  inputProps={{
                    readOnly: true,
                  }}
                  renderInput={(params) => (
                    <TextField name="date" size="small" {...params} />
                  )}
                />
              </LocalizationProvider>
              {formErrors.date.invalid && (
                <FormHelperText>{formErrors.date.message}</FormHelperText>
              )}
            </FormControl>
          </div>
          <div className="grid-item">
            <FormControl fullWidth error={formErrors.invoiceNo.invalid}>
              <TextField
                size="small"
                variant="outlined"
                label="Invoice no"
                value={bill.invoiceNo}
                onChange={inputChangeHandler}
                name="invoiceNo"
                id="invoiceNo"
                error={formErrors.invoiceNo.invalid}
              />
              {formErrors.invoiceNo.invalid && (
                <FormHelperText>{formErrors.invoiceNo.message}</FormHelperText>
              )}
            </FormControl>
          </div>
          <div className="grid-item">
            <FormControl fullWidth error={formErrors.invoiceDate.invalid}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Invoice date"
                  inputFormat="DD/MM/YYYY"
                  value={bill.invoiceDate}
                  disableFuture={true}
                  onChange={dateInputChangeHandler.bind(null, "invoiceDate")}
                  inputProps={{
                    readOnly: true,
                  }}
                  renderInput={(params) => (
                    <TextField
                      name="invoiceDate"
                      size="small"
                      {...params}
                      error={formErrors.invoiceDate.invalid}
                    />
                  )}
                />
              </LocalizationProvider>
              {formErrors.invoiceDate.invalid && (
                <FormHelperText>
                  {formErrors.invoiceDate.message}
                </FormHelperText>
              )}
            </FormControl>
          </div>
          <div className="grid-item">
            <FormControl fullWidth>
              <TextField
                size="small"
                variant="outlined"
                label="Supply content"
                value={bill.supplyContent}
                onChange={inputChangeHandler}
                name="supplyContent"
                id="supplyContent"
              />
            </FormControl>
          </div>
          <div className="grid-item">
            <FormControl fullWidth error={formErrors.quantity.invalid}>
              <TextField
                size="small"
                variant="outlined"
                label="Quantity"
                value={bill.quantity}
                onChange={inputChangeHandler}
                name="quantity"
                id="quantity"
                error={formErrors.quantity.invalid}
              />
              {formErrors.quantity.invalid && (
                <FormHelperText>{formErrors.quantity.message}</FormHelperText>
              )}
            </FormControl>
          </div>
          <div className="grid-item">
            <FormControl fullWidth error={formErrors.amount.invalid}>
              <TextField
                size="small"
                variant="outlined"
                label="Amount"
                value={bill.amount || ""}
                error={formErrors.amount.invalid}
                name="amount"
                id="amount"
                onChange={inputChangeHandler}
                onInput={validateNumber}
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
        </div>
        <div className="right">
          <Button
            variant="outlined"
            size="medium"
            onClick={cancelButtonHandler}
            className="ml6"
          >
            Cancel
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
    </>
  );
};
export default AddSupplierBill;
