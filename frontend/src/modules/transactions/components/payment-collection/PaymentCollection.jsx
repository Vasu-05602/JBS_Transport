import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Divider,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Alert, Stack } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import {
  getFormattedDate,
  getFormattedLSNumber,
  isSuperAdminOrAdmin,
  validateNumber,
} from "../../../../services/utils";
import PaymentCollectionHistory from "./PaymentCollectionHistory";
import { PAYMENT_MODES } from "../../../../services/constants";
import {
  getBankAccounts,
  getBanks,
  getBillsByCustomer,
  getBranches,
  getCustomersByBranch,
  selectIsLoading,
  updateBills,
} from "./slice/paymentCollectionSlice";
import { setBranch } from "../../../user/slice/userSlice";

const initialState = {
  branch: "",
  customer: "",
  receivingDate: new Date(),
  totalReceivable: "",
  totalReceived: "",
  receivedToday: "",
  payMode: null,
  bankName: "",
  chequeNo: "",
  chequeDate: null,
  jsmBank: null,
  jsmAccountNo: null,
  transactionNo: "",
  remark: "",
};

const initialErrorState = {
  receivingDate: {
    invalid: false,
    message: "",
  },
  receivedToday: {
    invalid: false,
    message: "",
  },
  payMode: {
    invalid: false,
    message: "",
  },
  bankName: {
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
  remark: {
    invalid: false,
    message: "",
  },
};

const paymentModes = [...PAYMENT_MODES, { label: "UPI", value: "UPI" }];

const getUpdatedBills = (bills, paymentCollection) => {
  const filteredBills = bills?.filter?.((bill) => {
    return bill.receive && parseFloat(bill.receive) > 0;
  });
  const udpatedBills = filteredBills?.map?.((bill) => {
    const billId = bill.id || bill._id;
    return {
      ...bill,
      id: billId,
      _id: billId,
      payment: {
        bankName: paymentCollection.bankName,
        chequeDate: paymentCollection.chequeDate,
        chequeNo: paymentCollection.chequeNo,
        payMode: paymentCollection.payMode?.value || paymentCollection.payMode,
        transactionNo: paymentCollection.transactionNo,
        remark: paymentCollection.remark,
        jsmBank: paymentCollection.jsmBank
          ? paymentCollection.jsmBank.value || paymentCollection.jsmBank
          : "",
        jsmAccountNo: paymentCollection.jsmAccountNo
          ? paymentCollection.jsmAccountNo.value || paymentCollection.jsmAccountNo
          : "",
        receive: parseFloat(bill.receive),
        receivingDate: paymentCollection.receivingDate,
        customer_id: bill.customer_id || paymentCollection.customer,
        branch: bill.branch || paymentCollection.branch,
      },
    };
  });
  return udpatedBills;
};

const PaymentCollection = () => {
  const columns = [
    { field: "_id", headerName: "Id" },
    {
      field: "billNo",
      headerName: "Bill no.",
      flex: 1,
      renderCell: (params) => {
        return getFormattedLSNumber(params.row.billNo);
      },
    },
    {
      field: "date",
      headerName: "Bill date",
      flex: 1,
      renderCell: (params) => {
        return getFormattedDate(new Date(params.row.date));
      },
    },
    {
      field: "total",
      headerName: "Total bill amount",
      type: "number",
      flex: 1,
      renderCell: (params) => {
        return <strong>₹ {params.row.total?.toFixed?.(2)}</strong>;
      },
    },
    {
      field: "received",
      headerName: "Received",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return <strong>₹ {(+params.row.received)?.toFixed?.(2)}</strong>;
      },
    },
    {
      field: "balance",
      headerName: "Balance",
      flex: 1,
      type: "number",
      renderCell: (params) => {
        return <strong>₹ {(+params.row.balance)?.toFixed?.(2)}</strong>;
      },
    },
    {
      field: "receive",
      headerName: "Receive",
      flex: 1,
      renderCell: (params) => {
        return (
          <FormControl fullWidth className="tableTextfield">
            <TextField
              size="small"
              variant="outlined"
              value={params.row.receive || ""}
              onChange={inputChangeHandler.bind(null, "amount")}
              onInput={validateNumber}
              name={params.row._id}
              id={`${params.row._id}_amount`}
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
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState({ _id: "" });
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [bills, setBills] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [paymentCollection, setPaymentCollection] = useState(initialState);
  const [banks, setBanks] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [accountsByBank, setAccountsByBank] = useState([]);

  useEffect(() => {
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setBranches(payload?.data || []);
          const filteredBranch = payload?.data?.find?.(
            (branch) => branch.branch_id == user.branch || branch._id === user.branch
          ) || payload?.data?.[0];
          setSelectedBranch(filteredBranch);
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
    fetchCustomers("");
    dispatch(getBanks())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          const updatedBanks = payload?.data?.map?.((bank) => {
            return {
              ...bank,
              label: bank.name,
              value: bank.name,
            };
          });
          setBanks(updatedBanks);
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });

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
    const err = Object.keys(formErrors);
    if (err?.length) {
      const input = document.querySelector(`input[name=${err[1]}]`);

      input?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "start",
      });
    }
  }, [formErrors]);

  useEffect(() => {
    if (httpError) {
      const input = document.getElementById(`alertError`);
      input?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "start",
      });
    }
  }, [httpError]);

  const fetchData = () => {
    const customerId = selectedCustomer?.customer_id || selectedCustomer?._id;
    const branchId = selectedBranch?.branch_id || selectedBranch?._id;
    if (!customerId) {
      setBills([]);
      return;
    }
    dispatch(
      getBillsByCustomer({
        customer: customerId,
        branch: branchId,
      })
    )
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message && !Array.isArray(payload?.data)) {
          setHttpError(message);
        } else {
          setHttpError("");
          const dataList = Array.isArray(payload?.data) ? payload.data : [];
          const bills = dataList.map((bill) => {
            const received = typeof bill.received === "number" ? bill.received : (parseFloat(bill.received) || 0);
            const total = typeof bill.total === "number" ? bill.total : (parseFloat(bill.total) || 0);
            const balance = typeof bill.balance === "number" ? bill.balance : (total - received);
            const billId = bill.id || bill._id;
            return {
              ...bill,
              id: billId,
              _id: billId,
              total,
              receive: "",
              received,
              balance,
              field: <TextField />,
            };
          });
          setBills(bills);

          let totalReceivable = 0;
          let totalReceived = 0;

          bills.forEach((bill) => {
            totalReceivable += +bill.total;
            totalReceived += +bill.received;
          });

          setPaymentCollection((currState) => {
            return {
              ...currState,
              totalReceivable: totalReceivable,
              totalReceived: totalReceived,
            };
          });
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
  };

  useEffect(() => {
    if (selectedCustomer && selectedBranch) {
      fetchData();
    }
  }, [selectedCustomer, selectedBranch]);

  useEffect(() => {
    let receivedToday = 0;
    bills?.forEach?.((bill) => {
      receivedToday += +bill.receive;
    });
    setPaymentCollection((currState) => {
      return {
        ...currState,
        receivedToday: receivedToday,
      };
    });
  }, [bills]);

  useEffect(() => {
    if (paymentCollection.jsmBank && paymentCollection.jsmBank._id) {
      setAccountsByBank(() => {
        return bankAccounts?.filter?.((acc) => {
          return acc.bank === paymentCollection.jsmBank._id;
        });
      });
    }
  }, [paymentCollection.jsmBank]);

  const branchChangeHandler = (e, value) => {
    setSelectedBranch(value);
    dispatch(setBranch(value?.branch_id || value?._id));
  };

  const customerChangeHandler = (e, value) => {
    setSelectedCustomer(value);
  };

  const inputChangeHandler = (type, e) => {
    const name = e.target.name;
    const value = e.target.value;
    setBills((currState) => {
      const updatedState = [...currState];
      updatedState?.forEach?.((bill) => {
        if (String(bill._id) === String(name) || String(bill.id) === String(name)) {
          if (type === "amount") {
            bill.receive = value;
          }
        }
      });
      return updatedState;
    });
  };

  const fetchCustomers = (str) => {
    const search = str.trim?.();
    if (search?.length > 2 || !search) {
      dispatch(getCustomersByBranch(search))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setCustomers(payload?.data);
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  };

  const consignorChange = ({ target }) => {
    fetchCustomers(target.value);
  };

  const payInputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setPaymentCollection((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
    if (name === "payMode") {
      setPaymentCollection((currState) => {
        return {
          ...currState,
          bankName: "",
          chequeNo: "",
          chequeDate: null,
          jsmBank: "",
          jsmAccountNo: "",
        };
      });
    }
  };

  const dateInputChangeHandler = (name, date) => {
    if (name === "receivingDate") {
      setPaymentCollection((currState) => {
        return {
          ...currState,
          date: new Date(date),
        };
      });
    } else {
      setPaymentCollection((currState) => {
        return {
          ...currState,
          chequeDate: new Date(date),
        };
      });
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(paymentCollection)) {
      const updatedBills = getUpdatedBills(bills, paymentCollection);
      dispatch(updateBills(updatedBills))
        .then(({ payload = {} }) => {
          const { message, success } = payload?.data || {};
          if (message && !success && payload?.status !== 200) {
            setHttpError(message);
          } else {
            setHttpError("");
            setFormErrors(initialErrorState);
            fetchData();
            setPaymentCollection(initialState);
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };

    if (!formData.receivingDate) {
      errors.receivingDate = { invalid: true, message: "Date is required" };
    }
    if (+formData.receivedToday === 0) {
      errors.receivedToday = {
        invalid: true,
        message: "Received should be greater than 0",
      };
    }
    if (!formData.payMode) {
      errors.payMode = { invalid: true, message: "Payment mode is required" };
    }
    if (formData.payMode?.value === "Cheque" && !formData.bankName?.trim?.()) {
      errors.bankName = { invalid: true, message: "Bank name is required" };
    }
    if (formData.payMode?.value === "Cheque" && !formData.chequeNo?.trim?.()) {
      errors.chequeNo = { invalid: true, message: "Cheque number is required" };
    }
    if (formData.payMode?.value === "Cheque" && !formData.chequeDate) {
      errors.chequeDate = { invalid: true, message: "Cheque date is required" };
    }
    if (formData.payMode?.value === "Cheque") {
      if (!formData.jsmBank) {
        errors.jsmBank = { invalid: true, message: "Bank is required" };
      }
      if (!formData.jsmAccountNo) {
        errors.jsmAccountNo = { invalid: true, message: "Account is required" };
      }
    }

    if (
      formData.payMode?.value === "Cheque" ||
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

    if (formData.payMode?.value === "UPI") {
      if (!formData.remark) {
        errors.remark = { invalid: true, message: "Remark is required" };
      }
      if (!formData.transactionNo) {
        errors.transactionNo = {
          invalid: true,
          message: "Transaction No is required",
        };
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

  const autocompleteChangeListener = (e, option, name) => {
    if (name === "jsmBank") {
      setPaymentCollection((currState) => {
        return {
          ...currState,
          [name]: option,
          jsmAccountNo: null,
        };
      });
    } else {
      setPaymentCollection((currState) => {
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

      <div className="page_head">
        <h1 className="pageHead">Payment collection</h1>
      </div>
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
            <Alert id="alertError" severity="error">
              {httpError}
            </Alert>
          </Stack>
        )}

        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <div className="grid grid-6-col">
            <div className="grid-item">
              <FormControl fullWidth size="small">
                <Autocomplete
                  autoSelect
                  disablePortal
                  size="small"
                  name="branch"
                  options={branches}
                  value={selectedBranch || null}
                  disabled={!isSuperAdminOrAdmin()}
                  onChange={branchChangeHandler}
                  getOptionLabel={(branch) => branch.branch_name || branch.name || ""}
                  openOnFocus
                  renderInput={(params) => (
                    <TextField {...params} label="Select branch" fullWidth />
                  )}
                />
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth size="small">
                <Autocomplete
                  autoSelect
                  disablePortal
                  size="small"
                  name="customer"
                  options={customers || []}
                  value={selectedCustomer || null}
                  onChange={customerChangeHandler}
                  getOptionLabel={(customer) => customer.customer_name || customer.name || ""}
                  isOptionEqualToValue={(option, value) =>
                    (option.customer_id || option._id) === (value.customer_id || value._id)
                  }
                  openOnFocus
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select customer"
                      fullWidth
                      onChange={consignorChange}
                    />
                  )}
                />
              </FormControl>
            </div>
          </div>

          <Divider sx={{ margin: "20px 0" }} />

          <form action="" onSubmit={submitHandler}>
            <DataGrid
              sx={{ backgroundColor: "primary.contrastText" }}
              autoHeight
              density="standard"
              getRowId={(row) => row._id}
              rows={bills}
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

            {bills?.length > 0 && <Divider sx={{ margin: "20px 0" }} /> && (
              <>
                <div className="grid grid-6-col">
                  <div className="grid-item">
                    <FormControl
                      fullWidth
                      error={formErrors.receivingDate.invalid}
                    >
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          error={formErrors.receivingDate.invalid}
                          label="Date"
                          inputFormat="DD/MM/YYYY"
                          value={paymentCollection.receivingDate}
                          disableFuture={true}
                          onChange={dateInputChangeHandler.bind(
                            null,
                            "receivingDate"
                          )}
                          inputProps={{
                            readOnly: true,
                          }}
                          renderInput={(params) => (
                            <TextField
                              name="receivingDate"
                              size="small"
                              {...params}
                              error={formErrors.receivingDate.invalid}
                            />
                          )}
                        />
                      </LocalizationProvider>
                      {formErrors.receivingDate.invalid && (
                        <FormHelperText>
                          {formErrors.receivingDate.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Total receivable"
                        value={paymentCollection.totalReceivable}
                        name="totalReceivable"
                        id="totalReceivable"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              &#8377;
                            </InputAdornment>
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
                        label="Total received"
                        value={paymentCollection.totalReceived}
                        name="totalReceived"
                        id="totalReceived"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              &#8377;
                            </InputAdornment>
                          ),
                        }}
                      />
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl
                      fullWidth
                      error={formErrors.receivedToday.invalid}
                    >
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Received today"
                        value={paymentCollection.receivedToday}
                        error={formErrors.receivedToday.invalid}
                        name="receivedToday"
                        id="receivedToday"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              &#8377;
                            </InputAdornment>
                          ),
                        }}
                      />
                      {formErrors.receivedToday.invalid && (
                        <FormHelperText>
                          {formErrors.receivedToday.message}
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
                        options={paymentModes}
                        value={paymentCollection.payMode}
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
                        <FormHelperText>
                          {formErrors.payMode.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl
                      fullWidth
                      error={formErrors.transactionNo.invalid}
                    >
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Transaction no"
                        value={paymentCollection.transactionNo}
                        error={formErrors.transactionNo.invalid}
                        name="transactionNo"
                        id="transactionNo"
                        onChange={payInputChangeHandler}
                        disabled={
                          paymentCollection.payMode?.value === "UPI"
                            ? false
                            : true
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
                    <FormControl fullWidth error={formErrors.bankName.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Bank name"
                        value={paymentCollection.bankName}
                        error={formErrors.bankName.invalid}
                        name="bankName"
                        id="bankName"
                        onChange={payInputChangeHandler}
                        disabled={
                          paymentCollection.payMode?.value === "Cheque"
                            ? false
                            : true
                        }
                      />
                      {formErrors.bankName.invalid && (
                        <FormHelperText>
                          {formErrors.bankName.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.chequeNo.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Cheque no"
                        value={paymentCollection.chequeNo}
                        error={formErrors.chequeNo.invalid}
                        name="chequeNo"
                        id="chequeNo"
                        onChange={payInputChangeHandler}
                        disabled={
                          paymentCollection.payMode?.value === "Cheque"
                            ? false
                            : true
                        }
                      />
                      {formErrors.chequeDate.invalid && (
                        <FormHelperText>
                          {formErrors.chequeNo.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl
                      fullWidth
                      error={formErrors.chequeDate.invalid}
                    >
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          error={formErrors.chequeDate.invalid}
                          label="Cheque date"
                          disabled={
                            paymentCollection.payMode?.value === "Cheque"
                              ? false
                              : true
                          }
                          inputFormat="DD/MM/YYYY"
                          value={paymentCollection.chequeDate}
                          disableFuture={true}
                          onChange={dateInputChangeHandler.bind(
                            null,
                            "chequeDate"
                          )}
                          inputProps={{
                            readOnly: true,
                          }}
                          renderInput={(params) => (
                            <TextField
                              name="date"
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
                        value={paymentCollection.jsmBank}
                        disabled={
                          !paymentCollection.payMode ||
                          paymentCollection.payMode?.value === "Cash"
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
                        <FormHelperText>
                          {formErrors.jsmBank.message}
                        </FormHelperText>
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
                        value={paymentCollection.jsmAccountNo}
                        disabled={
                          !paymentCollection.payMode ||
                          paymentCollection.payMode?.value === "Cash"
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
                    <FormControl fullWidth error={formErrors.remark.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Remark"
                        value={paymentCollection.remark}
                        error={formErrors.remark.invalid}
                        name="remark"
                        id="remark"
                        onChange={payInputChangeHandler}
                        disabled={
                          paymentCollection.payMode?.value === "UPI"
                            ? false
                            : true
                        }
                      />
                      {formErrors.remark.invalid && (
                        <FormHelperText>
                          {formErrors.remark.message}
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
              </>
            )}
          </form>
        </Paper>
        <PaymentCollectionHistory bills={bills} />
      </div>
    </>
  );
};

export default PaymentCollection;
