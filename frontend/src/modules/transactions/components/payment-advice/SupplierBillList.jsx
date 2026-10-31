import React, { useState, useEffect } from "react";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Divider,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DataGrid } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";

import { getFormattedDate, validateNumber } from "../../../../services/utils";
import { PAYMENT_MODES } from "../../../../services/constants";
import BillPaymentAdviceHistory from "./BillPaymentAdviceHistory";
import {
  getBankAccounts,
  getSupplierBills,
  selectIsLoading,
  updateSupplierBills,
} from "./slice/paymentAdviceSlice";
import { LoadingSpinner } from "../../../../ui-controls";

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

const SupplierBillList = ({
  selectedSupplier,
  selectedSupplierType,
  triggerFetch,
  setTriggerFetch,
}) => {
  const user = useSelector((state) => state.user);
  const isLoading = useSelector(selectIsLoading);

  const [supplierBills, setSupplierBills] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [payments, setPayments] = useState(initialState);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [accountsByBank, setAccountsByBank] = useState([]);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const dispatch = useDispatch();
  const { banks } = useSelector(({ paymentadvice }) => paymentadvice) || {};

  const columns = [
    { field: "_id", headerName: "Id" },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        return getFormattedDate(new Date(params.row.createdAt));
      },
    },
    {
      field: "invoiceDate",
      headerName: "Invoice date",
      flex: 1,
      renderCell: (params) => {
        return getFormattedDate(new Date(params.row.createdAt));
      },
    },
    { field: "invoiceNo", headerName: "Invoice no", flex: 1 },
    { field: "supplyContent", headerName: "Supply content", flex: 1 },
    { field: "quantity", headerName: "Quantity", flex: 1 },
    {
      field: "amount",
      headerName: "Bill amount",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return <strong>₹ {params.row.amount?.toFixed?.(2)}</strong>;
      },
    },
    {
      field: "totalPaid",
      headerName: "Paid",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return <strong>₹ {params.row.totalPaid?.toFixed?.(2)}</strong>;
      },
    },
    {
      field: "balance",
      headerName: "Balance",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return <strong>₹ {params.row.balance?.toFixed?.(2)}</strong>;
      },
    },
    {
      field: "",
      headerName: "Action",
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

  useEffect(() => {
    dispatch(getBankAccounts())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          const updatedAccounts = payload?.data?.map?.((account) => {
            return {
              ...account,
              label: account.accountNo,
              value: account.accountNo,
            };
          });
          setBankAccounts(updatedAccounts);
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
  }, []);

  useEffect(() => {
    if (selectedSupplier && triggerFetch && selectedSupplierType) {
      dispatch(
        getSupplierBills({ supplier: selectedSupplier, branch: user.branch })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            let outstanding = 0;
            let paid = 0;
            const updatedResponse = payload?.data?.map?.((bill) => {
              const totalPaid = bill.payments?.reduce?.((total, payment) => {
                return total + payment.paid;
              }, 0);
              bill.paid = false;
              bill.totalPaid = totalPaid;
              bill.suppPay = 0;
              bill.balance = bill.amount - totalPaid;
              outstanding = outstanding + bill.amount;
              bill.paidToSupp = bill.payments?.reduce?.((total, payment) => {
                return total + payment.paid;
              }, 0);
              paid = paid + bill.paidToSupp;
              return bill;
            });
            setPayments((currState) => {
              return {
                ...currState,
                outstanding: outstanding,
                totalPaid: paid,
              };
            });
            setSupplierBills(updatedResponse);
            setTriggerFetch(false);
          }
        })
        .catch((e) => {
          setHttpError(e.message);
        });
    }
    if (!selectedSupplier || !selectedSupplierType) {
      setSupplierBills([]);
    }
  }, [selectedSupplier, setTriggerFetch, triggerFetch, selectedSupplierType]);

  const submitHandler = (e) => {
    e.preventDefault();
    const billsForPay = supplierBills?.filter?.((ls) => ls.paid);
    if (!validateForm(payments)) {
      const filteredBills = billsForPay?.map?.((bill) => {
        return {
          _id: bill._id,
          payment: {
            date: new Date(),
            paid: bill.suppPay,
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
      if (filteredBills?.length) {
        dispatch(updateSupplierBills(filteredBills))
          .then(({ payload = {} }) => {
            const { message } = payload?.data || {};
            if (message) {
              setHttpError(message);
            } else {
              setHttpError("");
              const updatedResponse = payload?.data?.map?.((bill) => {
                const totalPaid = bill.payments?.reduce?.((total, payment) => {
                  return total + payment.paid;
                }, 0);
                bill.totalPaid = totalPaid;
                bill.pay = 0;
                bill.balance = bill.amount - totalPaid;
                return bill;
              });
              setSupplierBills(updatedResponse);
              setPayments(initialState);
              setFormErrors(initialErrorState);
            }
            setTriggerFetch(true);
          })
          .catch((e) => {
            setHttpError(e.message);
          });
      }
    }
  };

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
    setSupplierBills((currState) => {
      const updatedState = [...currState];
      updatedState?.forEach?.((bill) => {
        if (bill._id === name) {
          if (value === "0" || !value) {
            bill.suppPay = +value;
            bill.paid = false;
          } else {
            bill.suppPay = +value;
            bill.paid = true;
          }
        }
      });
      return updatedState;
    });
    const paidToday = supplierBills?.reduce?.(
      (acc, bill) => (bill.suppPay ? +acc + +bill.suppPay : acc),
      0
    );
    setPayments((currState) => {
      return {
        ...currState,
        paidToday: paidToday,
      };
    });
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

      <form action="" onSubmit={submitHandler}>
        <DataGrid
          sx={{ backgroundColor: "primary.contrastText" }}
          autoHeight
          density="standard"
          getRowId={(row) => row._id}
          rows={supplierBills}
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
                <FormHelperText>{formErrors.paidToday.message}</FormHelperText>
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
                  disabled={payments.payMode?.value === "Cheque" ? false : true}
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
                <FormHelperText>{formErrors.chequeDate.message}</FormHelperText>
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

        <div className="right">
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

      {/* <LRPaymentAdviceHistory supplierLS={supplierLS} /> */}
      <BillPaymentAdviceHistory supplierBills={supplierBills} />
    </>
  );
};

export default SupplierBillList;
