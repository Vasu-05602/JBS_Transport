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
import { useDispatch, useSelector } from "react-redux";
import {
  getBankAccount,
  getBanks,
  updateBankAccount,
  selectIsLoading,
} from "./slice/bankAccountSlice";
import { LoadingSpinner } from "../../../../ui-controls";
import { validateNumber } from "../../../../services/utils";

const initialState = {
  bank: "",
  ifsc: "",
  accountType: "",
  accountHolder: "",
  customerId: "",
  accountNo: "",
  openingBalance: "",
};

const initialErrorState = {
  bank: {
    invalid: false,
    message: "",
  },
  ifsc: {
    invalid: false,
    message: "",
  },
  accountType: {
    invalid: false,
    message: "",
  },
  accountHolder: {
    invalid: false,
    message: "",
  },
  customerId: {
    invalid: false,
    message: "",
  },
  accountNo: {
    invalid: false,
    message: "",
  },
  openingBalance: {
    invalid: false,
    message: "",
  },
};

const accountTypes = [
  "Current account",
  "Saving account",
  "Recurring account",
  "Fixed Deposit / Account",
];

const BankAccountEdit = () => {
  const isLoading = useSelector(selectIsLoading);
  const { banks } = useSelector(({ bankaccount }) => bankaccount);
  const [bankAccount, setBankAccount] = useState(initialState);
  const [fetchedBankAccount, setFetchedBankAccount] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const location = useLocation();
  const { bankAccountId } = location.state;

  const goToBankAccountList = useCallback(() => {
    navigate("/master/bankAccounts");
  }, [navigate]);

  useEffect(() => {
    setBankAccount({
      ...fetchedBankAccount,
      bank: banks?.find?.(({ _id }) => fetchedBankAccount?.bank === _id),
      accountType: {
        label: fetchedBankAccount.accountType,
        value: fetchedBankAccount.accountType,
      },
    });
  }, [fetchedBankAccount, banks]);

  useEffect(() => {
    dispatch(getBanks());
  }, []);

  useEffect(() => {
    if (bankAccountId) {
      dispatch(getBankAccount(bankAccountId))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setBankAccount(payload?.data);
            setFetchedBankAccount(payload?.data);
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [bankAccountId]);

  const resetButtonHandler = () => {
    setBankAccount({
      ...fetchedBankAccount,
      bank: banks?.find?.(({ _id }) => fetchedBankAccount?.bank === _id),
    });
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    goToBankAccountList();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setBankAccount((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const autocompleteChangeListener = (e, value) => {
    setBankAccount((currState) => {
      return {
        ...currState,
        bank: value,
        ifsc: value?.ifsc || "",
      };
    });
  };

  const autocompleteType = (e, value) => {
    setBankAccount((currState) => {
      return {
        ...currState,
        accountType: value,
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(bankAccount)) {
      dispatch(
        updateBankAccount({
          ...bankAccount,
          bank: bankAccount.bank?._id,
          accountType: bankAccount.accountType?.value,
        })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setBankAccount(initialState);
            goToBankAccountList();
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };

    if (!formData.bank?._id) {
      errors.bank = { invalid: true, message: "Bank is required" };
    }
    if (!formData.ifsc?.trim?.()) {
      errors.ifsc = { invalid: true, message: "IFSC code is required" };
    }
    if (!formData.accountHolder?.trim?.()) {
      errors.accountHolder = {
        invalid: true,
        message: "Account holder name is required",
      };
    }
    if (!formData.accountType) {
      errors.accountType = {
        invalid: true,
        message: "Account type is required",
      };
    }
    // if (!formData.customerId?.trim?.()) {
    //   errors.customerId = {
    //     invalid: true,
    //     message: "Customer ID is required",
    //   };
    // }
    if (!formData.accountNo?.trim?.()) {
      errors.accountNo = {
        invalid: true,
        message: "Account number is required",
      };
    }
    // if (!formData.openingBalance.toString?.()?.trim?.()) {
    //   errors.openingBalance = {
    //     invalid: true,
    //     message: "Opening balance is required",
    //   };
    // }
    // if (
    //   formData.openingBalance.toString?.()?.trim?.() !== "" &&
    //   isNaN(formData.openingBalance) &&
    //   isNaN(parseFloat(formData.openingBalance))
    // ) {
    //   errors.openingBalance = {
    //     invalid: true,
    //     message: "Opening balance should be a number",
    //   };
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
      <h1 className="pageHead">Edit a bank account</h1>
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
              <FormControl
                fullWidth
                size="small"
                error={formErrors.bank.invalid}
              >
                <Autocomplete
                  autoSelect
                  disablePortal
                  size="small"
                  name="bank"
                  options={banks}
                  value={bankAccount.bank}
                  onChange={(e, value) => autocompleteChangeListener(e, value)}
                  openOnFocus
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Bank"
                      error={formErrors.bank.invalid}
                      fullWidth
                    />
                  )}
                />
                {formErrors.bank.invalid && (
                  <FormHelperText>{formErrors.bank.message}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.ifsc.invalid}>
                <TextField
                  size="small"
                  variant="outlined"
                  label="IFSC"
                  value={bankAccount.ifsc}
                  error={formErrors.ifsc.invalid}
                  onChange={inputChangeHandler}
                  name="ifsc"
                  id="ifsc"
                  InputProps={{
                    readOnly: true,
                  }}
                />
                {formErrors.ifsc.invalid && (
                  <FormHelperText>{formErrors.ifsc.message}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl
                fullWidth
                size="small"
                error={formErrors.accountType.invalid}
              >
                <Autocomplete
                  autoSelect
                  disablePortal
                  size="small"
                  name="accountType"
                  options={accountTypes}
                  value={bankAccount.accountType}
                  onChange={(e, value) => autocompleteType(e, value)}
                  openOnFocus
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Account type"
                      error={formErrors.accountType.invalid}
                      fullWidth
                    />
                  )}
                />
                {formErrors.accountType.invalid && (
                  <FormHelperText>
                    {formErrors.accountType.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.accountHolder.invalid}>
                <TextField
                  size="small"
                  variant="outlined"
                  label="Account holder"
                  value={bankAccount.accountHolder}
                  error={formErrors.accountHolder.invalid}
                  onChange={inputChangeHandler}
                  name="accountHolder"
                  id="accountHolder"
                />
                {formErrors.accountHolder.invalid && (
                  <FormHelperText>
                    {formErrors.accountHolder.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.customerId.invalid}>
                <TextField
                  size="small"
                  variant="outlined"
                  label="Customer Id"
                  error={formErrors.customerId.invalid}
                  value={bankAccount.customerId}
                  onChange={inputChangeHandler}
                  name="customerId"
                  id="customerId"
                />
                {formErrors.customerId.invalid && (
                  <FormHelperText>
                    {formErrors.customerId.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.accountNo.invalid}>
                <TextField
                  size="small"
                  variant="outlined"
                  label="Account number"
                  value={bankAccount.accountNo}
                  error={formErrors.accountNo.invalid}
                  onChange={inputChangeHandler}
                  name="accountNo"
                  id="accountNo"
                />
                {formErrors.accountNo.invalid && (
                  <FormHelperText>
                    {formErrors.accountNo.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.openingBalance.invalid}>
                <TextField
                  size="small"
                  variant="outlined"
                  label="Opening balance"
                  value={bankAccount.openingBalance || ""}
                  error={formErrors.openingBalance.invalid}
                  onChange={inputChangeHandler}
                  onInput={validateNumber}
                  name="openingBalance"
                  id="openingBalance"
                />
                {formErrors.openingBalance.invalid && (
                  <FormHelperText>
                    {formErrors.openingBalance.message}
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
    </>
  );
};

export default BankAccountEdit;
