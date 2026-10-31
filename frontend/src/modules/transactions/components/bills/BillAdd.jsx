import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Divider,
  InputAdornment,
  Autocomplete,
  MenuItem,
  Select,
  InputLabel,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import LorryReceipts from "./LorryReceipts";
import PaymentCollectionHistoryCard from "./PaymentCollectionHistoryCard";
import { AutoComplete, Dialog, LoadingSpinner } from "../../../../ui-controls";
import { base64ToObjectURL, validateNumber } from "../../../../services/utils";
import {
  createBill,
  downloadBill,
  downloadExcelBill,
  getCustomers,
  getLorryReceiptsByConsignor,
  selectIsLoading,
} from "./slice/billSlice";
import FileSaver from "file-saver";

const initialState = {
  branch: "",
  date: new Date(),
  from: "",
  to: "",
  customer: "",
  lrList: [],
  totalFreight: "",
  freight: "",
  localFreight: "",
  cgst: "",
  cgstPercent: "",
  sgst: "",
  sgstPercent: "",
  total: "",
  grandTotal: "",
  remark: "",
};

const initialErrorState = {
  branch: {
    invalid: false,
    message: "",
  },
  date: {
    invalid: false,
    message: "",
  },
  customer: {
    invalid: false,
    message: "",
  },
  lrList: {
    invalid: false,
    message: "",
  },
  totalFreight: {
    invalid: false,
    message: "",
  },
  freight: {
    invalid: false,
    message: "",
  },
  localFreight: {
    invalid: false,
    message: "",
  },
  cgstPercent: {
    invalid: false,
    message: "",
  },
  sgstPercent: {
    invalid: false,
    message: "",
  },
};

const BillAdd = () => {
  const isLoading = useSelector(selectIsLoading);
  const { branches, customers } = useSelector(({ bill }) => bill) || {};
  const user = useSelector((state) => state.user);
  const [billType, setBillType] = useState("TBB");
  const { state } = useLocation();
  const [lorryReceipts, setLorryReceipts] = useState([]);
  const [open, setOpen] = useState(false);
  const [bill, setBill] = useState({
    ...initialState,
    branch: state,
  });
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const dispatch = useDispatch();
  const [billNo, setBillNo] = useState("");
  const [savedBillId, setSavedBillId] = useState(null);
  const navigate = useNavigate();

  const goToBillList = useCallback(() => {
    navigate("/transactions/billList");
  }, [navigate]);

  useEffect(() => {
    const err = Object.keys(formErrors);
    if (err?.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);

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

  useEffect(() => {
    if (bill.branch && bill.customer) {
      dispatch(
        getLorryReceiptsByConsignor({
          branch: bill.branch?._id,
          consignor: bill.customer?.customer_id,
          from: bill.from,
          to: bill.to,
          billType,
        })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            const updatedLR = payload?.data?.filter?.(
              (lr) => !lr.billGenerated
            );
            updatedLR?.forEach?.((lr) => {
              lr.checked = false;
              lr.consignor =
                customers?.filter?.(
                  (customer) => customer.customer_id === lr.consignor
                )[0] || "";
              lr.consignee =
                customers?.filter?.(
                  (customer) => customer.customer_id === lr.consignee
                )[0] || "";
            });
            setLorryReceipts(updatedLR);
            setBill((currState) => {
              return {
                ...currState,
                lrList: [],
              };
            });
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  }, [bill.branch, bill.customer, bill.from, bill.to]);

  useEffect(() => {
    let totalFreight = 0;
    bill.lrList?.forEach?.((lr) => {
      totalFreight += +lr.total;
    });

    setBill((currState) => {
      return {
        ...currState,
        totalFreight: totalFreight,
      };
    });
  }, [bill.lrList]);

  useEffect(() => {
    const total = +bill.totalFreight + +bill.freight + +bill.localFreight;
    const grandTotal = total + +bill.sgst + +bill.cgst;
    setBill((currState) => {
      return {
        ...currState,
        total: total,
        grandTotal: grandTotal,
      };
    });
  }, [
    bill.totalFreight,
    bill.freight,
    bill.localFreight,
    bill.sgst,
    bill.cgst,
  ]);

  useEffect(() => {
    const total = +bill.totalFreight + +bill.freight + +bill.localFreight;
    const cgst = (total * +bill.cgstPercent) / 100;
    const sgst = (total * +bill.sgstPercent) / 100;
    setBill((currState) => {
      return {
        ...currState,
        cgst: cgst,
        sgst: sgst,
      };
    });
  }, [
    bill.cgstPercent,
    bill.sgstPercent,
    bill.totalFreight,
    bill.freight,
    bill.localFreight,
  ]);

  useEffect(() => {
    const totalFreight =
      bill.lrList?.reduce((acc, item) => {
        const totalValue = Number(item.total); // Convert to number
        return acc + (isNaN(totalValue) ? 0 : totalValue); // Handle NaN case
      }, 0) || 0; // Fallback to 0 if lrList is undefined or empty

    setBill((currState) => {
      return {
        ...currState,
        totalFreight: totalFreight,
      };
    });
  }, [bill.lrList]);

  const [checkboxes, setCheckboxes] = useState({
    emailConsigner: false,
  });

  const resetButtonHandler = () => {
    setBill(initialState);
    setSavedBillId(null);
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    goToBillList();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setBill((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const autocompleteChangeListener = (value, name) => {
    setBill((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const submitHandler = (e, isSaveAndPrint, isExport) => {
    let consignor;
    e.preventDefault();
    if (!validateForm(bill)) {
      localStorage.setItem("Email", bill.customer?.emailid);
      dispatch(
        createBill({
          ...bill,
          branch: bill.branch?.branch_id,
          customer: bill.customer?.customer_id,
          billType: billType,
        })
      )
        .then(({ payload = {} }) => {
          const { inserted_id, message } = payload?.data || {};
          if (inserted_id) {
            setSavedBillId(inserted_id);
            setBill((curr) => ({ ...curr, id: inserted_id, billNo: message || curr.billNo }));
          }
          if (checkboxes.emailConsigner) {
            consignor = localStorage.getItem("Email");

            sendmail(inserted_id, consignor);
          }
          if (isSaveAndPrint) {
            dispatch(downloadBill({ id: inserted_id, email: "" }))
              .then(({ payload = {} }) => {
                if (message) {
                  setBillNo(message);
                  handleClickOpen();
                }

                if (payload?.data?.file) {
                  const fileURL = base64ToObjectURL(payload?.data?.file);
                  if (fileURL) {
                    const winPrint = window.open(fileURL, "_blank");
                    winPrint.focus();
                    winPrint.print();
                    setHttpError("");
                    setFormErrors(initialErrorState);
                    setBill(initialState);
                    goToBillList();
                  }
                }
              })
              .catch((error) => {
                setHttpError(error.message);
                // setSelectedBill(null);
              });
          } else if (isExport) {
            dispatch(downloadExcelBill({ id: inserted_id, email: "" }))
              .then(({ payload = {} }) => {
                const { message } = payload?.data || {};
                if (message) {
                  setHttpError(message);
                } else {
                  const blob = new Blob([payload?.data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  });
                  FileSaver.saveAs(blob, "Bill.xlsx");
                  setHttpError("");
                  setFormErrors(initialErrorState);
                  setBill(initialState);
                  goToBillList();
                }
              })
              .catch((error) => {
                setHttpError(error.message);
              });
          } else {
            setHttpError("");
            setFormErrors(initialErrorState);
            setBill(initialState);
            goToBillList();
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };
  const sendmail = (id, emailAddress) => {
    dispatch(downloadBill({ id: id, email: emailAddress }))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};

        if (message) {
          setHttpError(message);
        }
      })

      .catch((error) => {
        setHttpError(error.message);
      });
  };
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const saveAndPrint = (e) => {
    e.preventDefault();
    submitHandler(e, true);
  };
  const saveAndExport = (e) => {
    e.preventDefault();
    submitHandler(e, false, true);
  };
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setCheckboxes({
      ...checkboxes,
      [name]: checked,
    });
  };
  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.branch) {
      errors.branch = { invalid: true, message: "Branch is required" };
    }
    if (!formData.date) {
      errors.date = { invalid: true, message: "Date is required" };
    }
    if (!formData.customer) {
      errors.customer = { invalid: true, message: "Customer is required" };
    }
    if (
      !formData.lrList?.length ||
      !(formData.lrList || []).some?.((lr) => lr)
    ) {
      errors.lrList = {
        invalid: true,
        message: "At least one lorry receipt is required",
      };
    }
    if (+formData.totalFreight <= 0) {
      errors.totalFreight = {
        invalid: true,
        message: "Total freight should be greater than 0",
      };
    }
    if (+formData.freight < 0) {
      errors.freight = {
        invalid: true,
        message: "Freight should be 0 or more",
      };
    }
    if (+formData.localFreight < 0) {
      errors.localFreight = {
        invalid: true,
        message: "Local freight should be 0 or more",
      };
    }
    if (+formData.cgstPercent < 0) {
      errors.cgstPercent = {
        invalid: true,
        message: "CGST % should be 0 or more",
      };
    }
    if (+formData.sgstPercent < 0) {
      errors.sgstPercent = {
        invalid: true,
        message: "SGST % should be 0 or more",
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
    console.log(name, date);
    setBill((currState) => {
      return {
        ...currState,
        [name]: new Date(date),
      };
    });
  };

  const fetchCustomers = (str) => {
    const search = str.trim?.();
    if (search?.length > 2 || !search) {
      dispatch(getCustomers(search));
    }
  };

  const consignorChange = ({ target }) => {
    fetchCustomers(target.value);
  };

  const setLRForBill = () => {
    const selectedLR = lorryReceipts?.filter?.((lr) => lr.checked);
    setBill((currState) => {
      return {
        ...currState,
        lrList: selectedLR,
      };
    });
  };
  const handleBillTypeChange = (event) => {
    setBillType(event.target.value);
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      {open && (
        <Dialog
          isOpen={true}
          onClose={handleClose}
          title="Success"
          content={`Bill ${lrNo} generated successfully.`}
          success
        />
      )}
      <h1 className="pageHead">Add a bill</h1>
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
        <form action="" onSubmit={submitHandler} id="billForm">
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
                    value={bill.branch}
                    onChange={(e, value) =>
                      autocompleteChangeListener(value, "branch")
                    }
                    getOptionLabel={(branch) => branch.branch_name}
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
                        name="branch"
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
                {/* <FormControl
                  fullWidth
                  size="small"
                  error={formErrors.customer.invalid}
                >
                  <AutoComplete
                    disablePortal
                    size="small"
                    name="customer"
                    options={customers}
                    value={bill.customer || null}
                    onChange={(e, value) =>
                      autocompleteChangeListener(value, "customer")
                    }
                    getOptionLabel={(customer) => customer.name}
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Customer"
                        error={formErrors.customer.invalid}
                        fullWidth
                        onChange={consignorChange}
                      />
                    )}
                  />
                  {formErrors.customer.invalid && (
                    <FormHelperText>
                      {formErrors.customer.message}
                    </FormHelperText>
                  )}
                </FormControl> */}

                <FormControl fullWidth error={formErrors.customer.invalid}>
                  <Autocomplete
                    id="Customer"
                    options={customers || []}
                    getOptionLabel={(option) => option.customer_name}
                    value={bill.customer || null}
                    onChange={(e, value) =>
                      autocompleteChangeListener(value, "customer")
                    }
                    isOptionEqualToValue={(option, value) =>
                      option._id === value._id
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="Customer"
                        variant="outlined"
                        label="Customer"
                        size="small"
                        onChange={consignorChange}
                        fullWidth
                      />
                    )}
                  />
                  {formErrors.customer.invalid && (
                    <FormHelperText>
                      {formErrors.customer.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth size="small">
                  <InputLabel htmlFor="bill-type-selector">
                    Bill Type
                  </InputLabel>
                  <Select
                    id="bill-type-selector"
                    value={billType}
                    label="Bill Type"
                    onChange={handleBillTypeChange}
                    displayEmpty
                    disabled
                  >
                    <MenuItem value="" disabled>
                      <em>Select Type</em>
                    </MenuItem>
                    <MenuItem value="TBB">TBB</MenuItem>
                    <MenuItem value="To Pay">To Pay</MenuItem>
                    <MenuItem value="Material Inward">Material Inward</MenuItem>
                    <MenuItem value="Third Party">Third Party</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.date.invalid}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      error={formErrors.date.invalid}
                      label="Date"
                      inputFormat="DD/MM/YYYY"
                      value={bill.date}
                      disableFuture={true}
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
            </div>
          </Paper>
        </form>
        {formErrors.lrList.invalid && (
          <p className="error">{formErrors.lrList.message}</p>
        )}
        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <LorryReceipts
            lorryReceipts={lorryReceipts}
            setLRForBill={setLRForBill}
            bill={bill}
            setBill={setBill}
            dateInputChangeHandler={dateInputChangeHandler}
          />

          <Divider sx={{ margin: "20px 0" }} />
          <form action="" onSubmit={submitHandler} id="billForm">
            <div className="grid grid-6-col">
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    type="number"
                    variant="outlined"
                    label="Total freight"
                    value={bill.totalFreight || ""}
                    onChange={inputChangeHandler}
                    name="totalFreight"
                    id="totalFreight"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          &#8377;
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.freight.invalid}>
                  <TextField
                    size="small"
                    type="text"
                    variant="outlined"
                    label="Freight"
                    value={bill.freight || ""}
                    error={formErrors.freight.invalid}
                    onInput={validateNumber}
                    onChange={inputChangeHandler}
                    name="freight"
                    id="freight"
                    InputProps={{
                      maxLength: 12,
                      startAdornment: (
                        <InputAdornment position="start">
                          &#8377;
                        </InputAdornment>
                      ),
                    }}
                  />
                  {formErrors.freight.invalid && (
                    <FormHelperText>
                      {formErrors.freight.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.localFreight.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Local freight"
                    value={bill.localFreight || ""}
                    error={formErrors.localFreight.invalid}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="localFreight"
                    id="localFreight"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          &#8377;
                        </InputAdornment>
                      ),
                      maxLength: 15,
                    }}
                  />
                  {formErrors.localFreight.invalid && (
                    <FormHelperText>
                      {formErrors.localFreight.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.cgstPercent.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="CGST %"
                    value={bill.cgstPercent || ""}
                    error={formErrors.cgstPercent.invalid}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="cgstPercent"
                    id="cgstPercent"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                      maxLength: 15,
                    }}
                  />
                  {formErrors.cgstPercent.invalid && (
                    <FormHelperText>
                      {formErrors.cgstPercent.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="CGST"
                    value={bill.cgst || ""}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="cgst"
                    id="cgst"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          &#8377;
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </div>

              <div className="grid-item">
                <FormControl fullWidth error={formErrors.sgstPercent.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="SGST %"
                    value={bill.sgstPercent || ""}
                    error={formErrors.sgstPercent.invalid}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="sgstPercent"
                    id="sgstPercent"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                      maxLength: 15,
                    }}
                  />
                  {formErrors.sgstPercent.invalid && (
                    <FormHelperText>
                      {formErrors.sgstPercent.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="SGST"
                    value={bill.sgst || ""}
                    onChange={inputChangeHandler}
                    name="sgst"
                    id="sgst"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          &#8377;
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Total"
                    value={bill.total || ""}
                    onChange={inputChangeHandler}
                    name="total"
                    id="total"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          &#8377;
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    type="number"
                    variant="outlined"
                    label="Grand total"
                    value={bill.grandTotal || ""}
                    onChange={inputChangeHandler}
                    name="grandTotal"
                    id="grandTotal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          &#8377;
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </div>
              <div className="grid-item"  style={{ gridColumn: "span 3" }}>
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Remark"
                    value={bill.remark}
                    onChange={inputChangeHandler}
                    name="remark"
                    id="remark"
                    inputProps={{ maxLength: 200 }}
                  />
                </FormControl>
              </div>
            </div>
          </form>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="left">
              <FormControlLabel
                control={
                  <Checkbox
                    name="emailConsigner"
                    checked={checkboxes.emailConsigner}
                    onChange={handleCheckboxChange}
                    size="small"
                  />
                }
                label="Customer Mail"
              />
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
                form="billForm"
                className="ml6"
              >
                Save
              </Button>
              <Button
                variant="contained"
                size="medium"
                type="button"
                color="primary"
                form="billForm"
                className="ml6"
                onClick={saveAndPrint}
              >
                Save &amp; Print
              </Button>
            </div>
          </div>
        </Paper>

        <PaymentCollectionHistoryCard billId={savedBillId || bill.id} bill={bill} />
      </div>
    </>
  );
};

export default BillAdd;
