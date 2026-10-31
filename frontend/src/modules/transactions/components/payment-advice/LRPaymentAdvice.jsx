import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Stack,
  FormControl,
  Button,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  Autocomplete,
  FormHelperText,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LoadingSpinner } from "../../../../ui-controls";
import {
  getFormattedDate,
  getFormattedLSNumber,
  validateNumber,
} from "../../../../services/utils";
import { PAYMENT_MODES } from "../../../../services/constants";
import LRPaymentAdviceHistory from "./LRPaymentAdviceHistory";
import {
  createSupplierPayments,
  getLoadingSlipsBySupplier,
  selectIsLoading,
} from "./slice/paymentAdviceSlice";
const initialState = {
  branch: "",
  customer: "",
  paymentDate: new Date(),
  outstanding: "",
  totalPaid: "",
  paidToday: "",
  payMode: null,
  chequeNo: "",
  chequeDate: null,
  jsmBank: null,
  jsmAccountNo: null,
  transactionNo: "",
  transactionDate: null,
};

const initialErrorState = {
  paymentDate: {
    invalid: false,
    message: "",
  },
  paidToday: {
    invalid: false,
    message: "",
  },
  payMode: {
    invalid: false,
    message: "",
  },
  chequeNo: {
    invalid: false,
    message: "",
  },
  chequeDate: {
    invalid: false,
    message: "",
  },
  jsmBank: {
    invalid: false,
    message: "",
  },
  jsmAccountNo: {
    invalid: false,
    message: "",
  },
  transactionNo: {
    invalid: false,
    message: "",
  },
  transactionDate: {
    invalid: false,
    message: "",
  },
};

const LRPaymentAdvice = ({
  suppliers,
  selectedSupplier,
  selectedSupplierType,
  setSelectedSupplier,
  places,
}) => {
  const columns = [
    { field: "_id", headerName: "Id" },
    {
      field: "lsNo",
      headerName: "LS no.",
      flex: 1,
      renderCell: (params) => {
        return getFormattedLSNumber(params.row.lsNo);
      },
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        return getFormattedDate(new Date(params.row.createdAt));
      },
    },
    { field: "vehicleNo", headerName: "Vehicle no.", flex: 1 },
    {
      field: "from",
      headerName: "From",
      flex: 1,
      renderCell: (params) => {
        return params.row.from?.name;
      },
    },
    {
      field: "to",
      headerName: "To",
      flex: 1,
      renderCell: (params) => {
        return params.row.to?.name;
      },
    },
    {
      field: "totalFreight",
      headerName: "Total freight",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return <>₹ {params.row.totalFreight?.toFixed?.(2)}</>;
      },
    },
    {
      field: "rent",
      headerName: "Rent",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return <>₹ {params.row.rent?.toFixed?.(2)}</>;
      },
    },
    {
      field: "advance",
      headerName: "Advance",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return <>₹ {params.row.advance?.toFixed?.(2)}</>;
      },
    },
    {
      field: "totalPayable",
      headerName: "Total payable",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return <>₹ {params.row.totalPayable?.toFixed?.(2)}</>;
      },
    },
    {
      field: "paid",
      headerName: "Paid",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return <>₹ {params.row.paidToSupp}</>;
      },
    },
    {
      field: "suppPay",
      headerName: "Pay to supplier",
      flex: 1,
      renderCell: (params) => {
        return (
          <FormControl fullWidth className="tableTextfield">
            <TextField
              size="small"
              variant="outlined"
              value={params.row.suppPay || ""}
              onChange={inputChangeHandler.bind(null, "suppPay")}
              onInput={validateNumber}
              name={params.row._id}
              id={`${params.row._id}_suppPay`}
              disabled={
                params.row.hire + params.row.hamali - params.row.advance === 0
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">&#8377;</InputAdornment>
                ),
              }}
            />
          </FormControl>
        );
      },
    },
  ];
  const dispatch = useDispatch();

  const isLoading = useSelector(selectIsLoading);
  const user = useSelector((state) => state.user);
  const [httpError, setHttpError] = useState("");
  const [supplierLS, setSupplierLS] = useState([]);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [payments, setPayments] = useState(initialState);
  const [accountsByBank, setAccountsByBank] = useState([]);
  const { bankAccounts, banks } =
    useSelector(({ paymentadvice }) => paymentadvice) || {};

  const fetchData = () => {
    dispatch(
      getLoadingSlipsBySupplier({
        supplier: selectedSupplier,
        branch: user.branch,
      })
    )
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          if (places?.length) {
            let outstanding = 0;
            let paid = 0;
            const updatedResponse = payload?.data?.map?.((ls) => {
              const from = places?.filter?.(
                (place) => place._id === ls.from
              )[0];
              const to = places?.filter?.((place) => place._id === ls.to)[0];
              ls.from = from?.name;
              ls.to = to?.name;
              ls.suppPay = 0;
              ls.paid = false;
              ls.paidToSupp = ls.supplierPayments?.reduce?.(
                (total, payment) => {
                  return total + payment.paid;
                },
                0
              );
              outstanding =
                outstanding + ls.totalFreight + ls.advance - ls.rent;
              paid = paid + ls.paidToSupp;
              return ls;
            });
            setPayments((currState) => {
              return {
                ...currState,
                outstanding: outstanding,
                totalPaid: paid,
              };
            });
            setSupplierLS(updatedResponse);
          } else {
            setSupplierLS(payload?.data);
          }
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
  };

  useEffect(() => {
    if (selectedSupplier && selectedSupplierType) {
      fetchData();
    }
    if (!selectedSupplier || !selectedSupplierType) {
      setSupplierLS([]);
    }
  }, [selectedSupplier, selectedSupplierType, places]);

  useEffect(() => {
    if (payments.jsmBank && payments.jsmBank._id) {
      setAccountsByBank(() => {
        return bankAccounts?.filter?.((acc) => {
          return acc.bank === payments.jsmBank._id;
        });
      });
    }
  }, [payments.jsmBank]);

  useEffect(() => {
    setPayments((currState) => {
      return {
        ...currState,
        transactionNo: "",
        transactionDate: null,
        chequeDate: null,
        chequeNo: "",
        jsmBank: null,
        jsmAccountNo: null,
      };
    });
  }, [payments.payMode]);

  const inputChangeHandler = (type, e) => {
    const name = e.target.name;
    const value = e.target.value;
    setSupplierLS((currState) => {
      const updatedState = [...currState];
      updatedState?.forEach?.((ls) => {
        if (ls._id === name) {
          if (value === "0" || !value) {
            ls.suppPay = +value;
            ls.paid = false;
          } else {
            ls.suppPay = +value;
            ls.paid = true;
          }
        }
      });
      return updatedState;
    });
    const paidToday = supplierLS?.reduce?.(
      (acc, ls) => (ls.suppPay ? +acc + +ls.suppPay : +acc),
      0
    );
    setPayments((currState) => {
      return {
        ...currState,
        paidToday: paidToday,
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    const LSForPay = supplierLS?.filter?.((ls) => ls.paid);
    if (!validateForm(payments) && LSForPay?.length) {
      const updatedLS = LSForPay?.map?.((ls) => {
        return {
          ls_id: ls._id,
          payment: {
            date: new Date(),
            paid: ls.suppPay,
            payMode: payments.payMode?.value,
            chequeNo: payments.chequeNo,
            chequeDate: payments.chequeDate,
            jsmBank: payments.jsmBank?.name,
            jsmAccountNo: payments.jsmAccountNo?.accountNo,
            transactionNo: payments.transactionNo,
            transactionDate: payments.transactionDate,
            createdBy: user._id,
          },
        };
      });
      dispatch(createSupplierPayments(updatedLS))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            fetchData();
            setFormErrors(initialErrorState);
          }
          setPayments(initialState);
        })
        .catch((e) => {
          setHttpError(e.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };

    if (!formData.paymentDate) {
      errors.paymentDate = { invalid: true, message: "Date is required" };
    }
    if (+formData.paidToday === 0) {
      errors.paidToday = {
        invalid: true,
        message: "Paid should be greater than 0",
      };
    }
    if (!formData.payMode) {
      errors.payMode = { invalid: true, message: "Payment mode is required" };
    }
    if (formData.payMode?.value === "Cheque") {
      if (!formData.chequeNo?.trim?.()) {
        errors.chequeNo = { invalid: true, message: "Cheque no is required" };
      }
      if (!formData.chequeDate) {
        errors.chequeDate = {
          invalid: true,
          message: "Cheque date is required",
        };
      }
    }
    if (
      formData.payMode?.value === "NEFT/RTGS" ||
      formData.payMode?.value === "Online banking"
    ) {
      if (!formData.transactionNo?.trim?.()) {
        errors.transactionNo = {
          invalid: true,
          message: "Transaction no is required",
        };
      }
      if (!formData.transactionDate) {
        errors.transactionDate = {
          invalid: true,
          message: "Transaction date is required",
        };
      }
    }
    if (
      formData.payMode?.value === "NEFT/RTGS" ||
      formData.payMode?.value === "Online banking"
    ) {
      if (!formData.jsmBank) {
        errors.jsmBank = { invalid: true, message: "Bank is required" };
      }
      if (!formData.jsmAccountNo) {
        errors.jsmAccountNo = { invalid: true, message: "Account is required" };
      }
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
    if (name === "paymentDate") {
      setPayments((currState) => {
        return {
          ...currState,
          date: new Date(date),
        };
      });
    } else {
      setPayments((currState) => {
        return {
          ...currState,
          [name]: new Date(date),
        };
      });
    }
  };

  const payInputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setPayments((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
    if (name === "payMode") {
      setPayments((currState) => {
        return {
          ...currState,
          chequeNo: "",
          chequeDate: null,
          jsmBank: "",
          jsmAccountNo: "",
        };
      });
    }
  };

  const autocompleteChangeListener = (e, option, name) => {
    if (name === "jsmBank") {
      setPayments((currState) => {
        return {
          ...currState,
          [name]: option,
          jsmAccountNo: null,
        };
      });
    } else {
      setPayments((currState) => {
        return {
          ...currState,
          [name]: option,
        };
      });
    }
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

      <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
        <Divider sx={{ margin: "20px 0" }} />
        <form action="" onSubmit={submitHandler}>
          <DataGrid
            sx={{ backgroundColor: "primary.contrastText" }}
            autoHeight
            density="standard"
            getRowId={(row) => row._id}
            rows={supplierLS}
            columns={columns}
            initialState={{
              ...columns,
              columns: {
                columnVisibilityModel: {
                  _id: false,
                },
              },
            }}
            pageSize={10}
            rowsPerPageOptions={[10]}
            disableSelectionOnClick
          />
          <Divider sx={{ margin: "20px 0" }} />
          <div className="grid grid-6-col">
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.paymentDate.invalid}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    error={formErrors.paymentDate.invalid}
                    label="Date"
                    inputFormat="DD/MM/YYYY"
                    value={payments.paymentDate}
                    disableFuture={true}
                    onChange={dateInputChangeHandler.bind(null, "paymentDate")}
                    inputProps={{
                      readOnly: true,
                    }}
                    renderInput={(params) => (
                      <TextField
                        name="paymentDate"
                        size="small"
                        {...params}
                        error={formErrors.paymentDate.invalid}
                      />
                    )}
                  />
                </LocalizationProvider>
                {formErrors.paymentDate.invalid && (
                  <FormHelperText>
                    {formErrors.paymentDate.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth>
                <TextField
                  size="small"
                  variant="outlined"
                  label="Total outstanding"
                  value={payments.outstanding || ""}
                  name="outstanding"
                  id="outstanding"
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">&#8377;</InputAdornment>
                    ),
                  }}
                />
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth>
                <TextField
                  size="small"
                  variant="outlined"
                  label="Total paid"
                  value={payments.totalPaid || ""}
                  name="totalPaid"
                  id="totalPaid"
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">&#8377;</InputAdornment>
                    ),
                  }}
                />
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.paidToday.invalid}>
                <TextField
                  size="small"
                  variant="outlined"
                  label="Paid today"
                  value={payments.paidToday}
                  error={formErrors.paidToday.invalid}
                  name="paidToday"
                  id="paidToday"
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">&#8377;</InputAdornment>
                    ),
                  }}
                />
                {formErrors.paidToday.invalid && (
                  <FormHelperText>
                    {formErrors.paidToday.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl
                fullWidth
                size="small"
                error={formErrors.payMode.invalid}
              >
                <Autocomplete
                  autoSelect
                  disablePortal
                  size="small"
                  name="payMode"
                  options={PAYMENT_MODES}
                  value={payments.payMode}
                  onChange={(e, value) =>
                    autocompleteChangeListener(e, value, "payMode")
                  }
                  openOnFocus
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Payment mode"
                      error={formErrors.payMode.invalid}
                      fullWidth
                    />
                  )}
                />
                {formErrors.payMode.invalid && (
                  <FormHelperText>{formErrors.payMode.message}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.chequeNo.invalid}>
                <TextField
                  size="small"
                  variant="outlined"
                  label="Cheque no"
                  value={payments.chequeNo}
                  error={formErrors.chequeNo.invalid}
                  name="chequeNo"
                  id="chequeNo"
                  onChange={payInputChangeHandler}
                  disabled={payments.payMode?.value === "Cheque" ? false : true}
                />
                {formErrors.chequeDate.invalid && (
                  <FormHelperText>{formErrors.chequeNo.message}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.chequeDate.invalid}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    error={formErrors.chequeDate.invalid}
                    label="Cheque date"
                    disabled={
                      payments.payMode?.value === "Cheque" ? false : true
                    }
                    inputFormat="DD/MM/YYYY"
                    value={payments.chequeDate}
                    onChange={dateInputChangeHandler.bind(null, "chequeDate")}
                    inputProps={{
                      readOnly: true,
                    }}
                    renderInput={(params) => (
                      <TextField
                        name="chequeDate"
                        size="small"
                        {...params}
                        error={formErrors.chequeDate.invalid}
                      />
                    )}
                  />
                </LocalizationProvider>
                {formErrors.chequeDate.invalid && (
                  <FormHelperText>
                    {formErrors.chequeDate.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl
                fullWidth
                size="small"
                error={formErrors.jsmBank.invalid}
              >
                <Autocomplete
                  autoSelect
                  disablePortal
                  size="small"
                  name="jsmBank"
                  options={banks}
                  value={payments.jsmBank}
                  disabled={
                    !payments.payMode ||
                    payments.payMode?.value === "Cash" ||
                    payments.payMode?.value === "Cheque"
                      ? true
                      : false
                  }
                  onChange={(e, value) =>
                    autocompleteChangeListener(e, value, "jsmBank")
                  }
                  openOnFocus
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Bank"
                      error={formErrors.jsmBank.invalid}
                      fullWidth
                    />
                  )}
                />
                {formErrors.jsmBank.invalid && (
                  <FormHelperText>{formErrors.jsmBank.message}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl
                fullWidth
                size="small"
                error={formErrors.jsmAccountNo.invalid}
              >
                <Autocomplete
                  autoSelect
                  disablePortal
                  size="small"
                  name="jsmAccountNo"
                  options={accountsByBank}
                  value={payments.jsmAccountNo}
                  disabled={
                    !payments.payMode ||
                    payments.payMode?.value === "Cash" ||
                    payments.payMode?.value === "Cheque"
                      ? true
                      : false
                  }
                  getOptionLabel={(option) => option.accountNo}
                  onChange={(e, value) =>
                    autocompleteChangeListener(e, value, "jsmAccountNo")
                  }
                  openOnFocus
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Account no."
                      error={formErrors.jsmAccountNo.invalid}
                      fullWidth
                    />
                  )}
                />
                {formErrors.jsmAccountNo.invalid && (
                  <FormHelperText>
                    {formErrors.jsmAccountNo.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.transactionNo.invalid}>
                <TextField
                  size="small"
                  variant="outlined"
                  label="Transaction no"
                  value={payments.transactionNo}
                  error={formErrors.transactionNo.invalid}
                  name="transactionNo"
                  id="transactionNo"
                  onChange={payInputChangeHandler}
                  disabled={
                    !payments.payMode ||
                    payments.payMode?.value === "Cash" ||
                    payments.payMode?.value === "Cheque"
                      ? true
                      : false
                  }
                />
                {formErrors.transactionNo.invalid && (
                  <FormHelperText>
                    {formErrors.transactionNo.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.transactionDate.invalid}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    error={formErrors.transactionDate.invalid}
                    label="Transaction date"
                    disabled={
                      !payments.payMode ||
                      payments.payMode?.value === "Cash" ||
                      payments.payMode?.value === "Cheque"
                        ? true
                        : false
                    }
                    inputFormat="DD/MM/YYYY"
                    value={payments.transactionDate}
                    onChange={dateInputChangeHandler.bind(
                      null,
                      "transactionDate"
                    )}
                    inputProps={{
                      readOnly: true,
                    }}
                    renderInput={(params) => (
                      <TextField
                        name="transactionDate"
                        size="small"
                        {...params}
                        error={formErrors.transactionDate.invalid}
                      />
                    )}
                  />
                </LocalizationProvider>
                {formErrors.transactionDate.invalid && (
                  <FormHelperText>
                    {formErrors.transactionDate.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
          </div>

          <div className="right mt10">
            <Button
              variant="contained"
              size="medium"
              type="submit"
              color="primary"
              className="ml6 mt10"
            >
              Save
            </Button>
          </div>
        </form>
      </Paper>

      <LRPaymentAdviceHistory supplierLS={supplierLS} />
    </>
  );
};

export default LRPaymentAdvice;
