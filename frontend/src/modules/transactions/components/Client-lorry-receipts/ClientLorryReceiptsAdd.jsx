import React, { useCallback, useEffect, useState } from "react";
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
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Stack } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { AutoComplete, Dialog, LoadingSpinner } from "../../../../ui-controls";

import {
  base64ToObjectURL,
  // emailRegEx,
  validateNumber,
  validatePhoneNumber,
} from "../../../../services/utils";

import {
  DELIVERY_TYPES,
  PAY_TYPES,
  TO_BILLED,
  SERVICE_TAX_BY,
  PAY_MODE,
} from "../../../../services/constants";
import {
  createLorryReceipt,
  downloadLorryReceipt,
  getCustomers,
  selectIsLoading,
} from "./slice/ClientlorryReceiptSlice";
import TransactionDetails from "../lorry-receipts/TransactionDetails";
import { getRateMasterForLR } from "../lorry-receipts/slice/lorryReceiptSlice";

const initialState = {
  branch: null,
  lrNo: "",
  date: new Date(),
  invoiceNo: "",
  eWayBillNo: "",
  foNum: "",
  consignor: null,
  consignorAddress: "",
  consignorPhone: "",
  consignorEmail: "",
  consignee: null,
  consigneeAddress: "",
  consigneePhone: "",
  consigneeEmail: "",
  from: "",
  to: "",
  totalFreight: "",
  hamali: "",
  deliveryCharges: "",
  lrCharges: 10,
  total: "",
  materialCost: "",
  deliveryType: null,
  serviceTaxBy: null,
  payType: "TBB",
  toBilled: null,
  collectAt: null,
  payMode: null,
  bankName: "",
  chequeNo: "",
  chequeDate: null,
  remark: "",
  fromId: "",
  toId: "",
  transactions: [],
  rateType:'',
  selectedArticle:'',
  rate:'', 
  showHamali:'',
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
  consignor: {
    invalid: false,
    message: "",
  },
  consignorAddress: {
    invalid: false,
    message: "",
  },
  consignorPhone: {
    invalid: false,
    message: "",
  },
  consignorEmail: {
    invalid: false,
    message: "",
  },
  from: {
    invalid: false,
    message: "",
  },
  consignee: {
    invalid: false,
    message: "",
  },
  consigneeAddress: {
    invalid: false,
    message: "",
  },
  consigneePhone: {
    invalid: false,
    message: "",
  },
  consigneeEmail: {
    invalid: false,
    message: "",
  },
  to: {
    invalid: false,
    message: "",
  },
  totalFreight: {
    invalid: false,
    message: "",
  },
  lrCharges: {
    invalid: false,
    message: "",
  },
  payType: {
    invalid: false,
    message: "",
  },
  toBilled: {
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
  transactionDetails: {
    invalid: false,
    message: "",
  },
};

const ClientLorryReceiptsAdd = () => {
  const isLoading = useSelector(selectIsLoading);
 
  const user = useSelector((state) => state.user);
  const reduxState = useSelector((state) => state.Clientlorryreceipt);
  console.log(reduxState)
  const { articles, customers, branches, places,consignees,consignors} = useSelector(
    ({ Clientlorryreceipt }) => Clientlorryreceipt
  );
  console.log("consignees",consignees)
  const filteredPlaces = places.map(place => ({
    place_id: place.place_id,
    place_name: place.place_name.trim(),
  }));



  const { state } = useLocation();
  const [lorryReceipt, setLorryReceipt] = useState({
    ...initialState,
    branch: state,
    collectAt: state,
    deliveryType: DELIVERY_TYPES[0] || null,
    toBilled: TO_BILLED[0] || null,
  });
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [open, setOpen] = useState(false);
  const [lrNo, setLrNo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const goToLorryReceipts = useCallback(() => {
    navigate("/transactions/lorryReceipts");
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
    let totalFreight = 0;
    let totalHamali = 0;
  let sum=0
    if (lorryReceipt.transactions?.length) {
      lorryReceipt.transactions?.forEach((transaction) => {
        totalFreight += +transaction.freight || 0;
        const hamaliRate = +transaction.hamalirate || 0;
        const chargeWeight = +transaction.chargeWeight || 0;
        const articleNo = +transaction.articleNo || 0;
        let hamali = 0;
        if (transaction.rateType?.value === "Kg") {
          hamali = hamaliRate * chargeWeight;
        } else if (transaction.rateType?.value === "Case") {
          hamali = hamaliRate * articleNo;
        }
        totalHamali += hamali;
        sum = Math.abs(totalFreight - totalHamali);

      });
    }
    setLorryReceipt((currentState) => ({
      ...currentState,
      totalFreight: sum,
      hamali: totalHamali,
    }));
  }, [lorryReceipt.transactions]); 
  
  useEffect(() => {
    const total =
      +lorryReceipt.totalFreight +
      +lorryReceipt.deliveryCharges +
      +lorryReceipt.lrCharges +
      +lorryReceipt.hamali;
    setLorryReceipt((currentState) => {
      return {
        ...currentState,
        total: total,
      };
    });
  }, [
    lorryReceipt.totalFreight,
    lorryReceipt.deliveryCharges,
    lorryReceipt.lrCharges,
    lorryReceipt.hamali,
  ]);

  const resetButtonHandler = () => {
    setLorryReceipt((prevState) => ({
      ...initialState,
      branch: prevState.branch,
      toBilled: prevState.toBilled,
      collectAt: prevState.collectAt,
      deliveryType: prevState.deliveryType,
    }));
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    goToLorryReceipts();
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setLorryReceipt((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const submitHandler = (e, isSaveAndPrint, isWithoutAmount) => {
    e.preventDefault();

    if (!validateForm(lorryReceipt)) {
      setLoading(true);
      const updatedLR = lorryReceipt;
      updatedLR.fromId = lorryReceipt.fromId || null;
      updatedLR.toId = lorryReceipt.toId || null;
      updatedLR.consignor = updatedLR.consignor?.customer_id || null;
      updatedLR.consignee = updatedLR.consignee?.customer_id || null;
      if (updatedLR.deliveryType) {
        updatedLR.deliveryType = updatedLR.deliveryType.value;
      }
      if (updatedLR.payType) {
        updatedLR.payType = updatedLR.payType.value || updatedLR.payType;
      }
      if (updatedLR.toBilled) {
        updatedLR.toBilled = updatedLR.toBilled.value || updatedLR.toBilled;
      }
      if (updatedLR.collectAt) {
        updatedLR.collectAt = updatedLR.collectAt._id;
      }
      if (updatedLR.serviceTaxBy?.value) {
        updatedLR.serviceTaxBy = updatedLR.serviceTaxBy?.value;
      }
      updatedLR.transactions?.forEach?.((transaction) => {
        transaction.article = transaction.article.articles_name;
        transaction.rateType = transaction.rateType.label;
      });
      if (updatedLR.payMode) {
        updatedLR.payMode = updatedLR.payMode.value;
      }
      if (updatedLR.branch) {
        updatedLR.branchCode = updatedLR.branch?.abbreviation || "BRN";
      }

      const userId = user?.id || null;
      console.log("updatedLR",updatedLR)
      dispatch(
        createLorryReceipt({
          ...updatedLR,
          branch: updatedLR?.branch?.branch_id,
          user_id: userId,
          user: user?.employee?.name || "",
          isSaveAndPrint,
          isWithoutAmount,
        })
      )
        .then(
          ({ payload = {} }) => {
            const {message, file ,inserted_id} = payload?.data || {};
              if (isSaveAndPrint) {
                if (inserted_id) {
                  dispatch(
                    downloadLorryReceipt({
                      id: inserted_id,
                      email: "",
                      isWithoutAmount,
                      user: user?.employee?.name || "",
                    })
                  )
                    .then(({ payload = {} }) => {
                      const fileURL = base64ToObjectURL(payload?.data?.file);
                      if (fileURL) {
                        const winPrint = window.open(fileURL, "_blank");
                        winPrint.focus();
                        winPrint.print();
                        setHttpError("");
                        setFormErrors(initialErrorState);
                        setLorryReceipt(initialState);
                      }
                    })
                    .catch((e) => {
                      setHttpError(e.message);
                    });
                }
              } else {
              setHttpError("");
              setFormErrors(initialErrorState);
              setLorryReceipt((prevState) => ({
                ...initialState,
                branch: prevState.branch,
                toBilled: prevState.toBilled,
                collectAt: prevState.collectAt,
                deliveryType: prevState.deliveryType,
              }));
              }
              if (message) {
                setLrNo(message);
                handleClickOpen();
              }
              if (file) {
                const fileURL = base64ToObjectURL(file);
                if (fileURL) {
                  const winPrint = window.open(fileURL, "_blank");
                  winPrint.focus();
                  winPrint.print();
                }
              }
      
            setLoading(false);
          },
          () => {
            setLoading(false);
          }
        )
        .catch((error) => {
          setHttpError(error.message);
          setLoading(false);
        });
    }
  };

  const saveAndPrint = (e, type) => {
    e.preventDefault();
    submitHandler(e, true, type);
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.branch) {
      errors.branch = { invalid: true, message: "Branch is required" };
    }
    if (!formData.consignor && !formData.consignorName?.trim?.()) {
      errors.consignor = { invalid: true, message: "Consignor is required" };
    }
    // if (!formData.consignorAddress) {
    //   errors.consignorAddress = {
    //     invalid: true,
    //     message: "Consignor address is required",
    //   };
    // }
    if (!formData.from?.trim?.()) {
      errors.from = { invalid: true, message: "From is required" };
    }
    if (!formData.consignee && !formData.consigneeName?.trim?.()) {
      errors.consignee = { invalid: true, message: "Consignee is required" };
    }
    // if (!formData.consigneeAddress) {
    //   errors.consigneeAddress = {
    //     invalid: true,
    //     message: "Consignee address is required",
    //   };
    // }
    if (!formData.to?.trim?.()) {
      errors.to = { invalid: true, message: "To is required" };
    }
    if (!formData.transactions?.length) {
      errors.transactionDetails = {
        invalid: true,
        message: "At lease 1 transaction is required",
      };
    } else if (formData.transactions?.length > 5) {
      errors.transactionDetails = {
        invalid: true,
        message: "More than 5 articles are not allowed.",
      };
    }
    // if (!formData.lrCharges) {
    //   errors.lrCharges = {
    //     invalid: true,
    //     message: "LR charges are required",
    //   };
    // }
    if (!formData.payType) {
      errors.payType = {
        invalid: true,
        message: "Payment type is required",
      };
    }
    if (!formData.toBilled) {
      errors.toBilled = {
        invalid: true,
        message: "To Billed is required",
      };
    }
    // if (
    //   formData.consigneeEmail?.trim?.() &&
    //   !emailRegEx.test(formData.consigneeEmail)
    // ) {
    //   errors.consigneeEmail = { invalid: true, message: "Email is invalid" };
    // }

    // if (
    //   formData.consignorEmail?.trim?.() &&
    //   !emailRegEx.test(formData.consignorEmail)
    // ) {
    //   errors.consignorEmail = { invalid: true, message: "Email is invalid" };
    // }
    if (!formData.payMode && formData.payType === "Paid") {
      errors.payMode = {
        invalid: true,
        message: "Payment mode is required",
      };
    }
    if (
      formData.payType &&
      formData.payType.value &&
      formData.payType.value === "Paid" &&
      formData.payMode &&
      formData.payMode.value === "By Cheque"
    ) {
      if (!formData.bankName) {
        errors.bankName = {
          invalid: true,
          message: "Bank name is required",
        };
      }
      if (!formData.chequeNo) {
        errors.chequeNo = {
          invalid: true,
          message: "Cheque no is required",
        };
      }
      if (!formData.chequeDate) {
        errors.chequeDate = {
          invalid: true,
          message: "Cheque date is required",
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

  const dateInputChangeHandler = (name, date) => {
    setLorryReceipt((currState) => {
      return {
        ...currState,
        [name]: new Date(date),
      };
    });
  };

  const consignorChangeHandler = (e, value) => {
    if (value) {
      if (typeof value === "object") {
        // Find the place_id for the city
        const selectedCityPlace = filteredPlaces.find(place => place.place_name == value.city);

        setLorryReceipt((currState) => {
          const newState = {
            ...currState,
            consignor: value,
            consignorName: value.label,
            consignorAddress: value.address,
            consignorPhone: value.telephoneno,
            consignorEmail: value.email,
            from: value.city, // Set the city
            fromId: selectedCityPlace ? selectedCityPlace.place_id : null, // Set place_id if found
          };
          return newState;
        });
      }
    } else {
      setLorryReceipt((currState) => {
        const newState = {
          ...currState,
          consignor: null,
          consignorName: "",
          consignorAddress: "",
          consignorPhone: "",
          consignorEmail: "",
          from: "",
          fromId: null, // Reset fromId when no consignor is selected
        };
        return newState;
      });
    }
  };


  const fetchCustomers = (str) => {
    const search = str.trim?.();
    if (search?.length > 2) {
      dispatch(getCustomers(search));
    } else if (!search) {
      dispatch(getCustomers());
    }
  };

  const consignorChange = ({ target }) => {
    const newValue = target.value;

    setLorryReceipt((currState) => {
      const updatedState = {
        ...currState,
        consignorName: newValue,
        consignor: null,
      };

      return updatedState;
    });

    fetchCustomers(newValue);
  };


 useEffect(() => {
    const { consignor, selectedArticle, toId } = lorryReceipt;
    
    if (consignor?.customer_id && selectedArticle?.articles_id && toId) {
      const requestObject = {
        customer_id: consignor.customer_id,
        article_id: selectedArticle.articles_id,
        to_id: toId,
      };
      
      dispatch(getRateMasterForLR(requestObject))
        .then((response) => {
          const { rate, HamaliRate } = response.payload?.data || {};
       
          setLorryReceipt((prevState) => ({
            ...prevState,
            rate:'', 
             HamaliRate: '',
          }));
          if (rate !== undefined && HamaliRate !== undefined) {
            console.log(rate,HamaliRate)
            setLorryReceipt((prevState) => ({
              ...prevState,
              rate, 
              HamaliRate: lorryReceipt.showHamali == 0 ? HamaliRate : '',
            }));
           
          } else {
            console.error("Rate or HamaliRate is missing in the response");
          }
        })
        .catch((error) => {
          console.error("Error fetching rate master:", error);
        });
    }
  }, [
    lorryReceipt.consignor?.customer_id, 
    lorryReceipt.selectedArticle?.articles_id, 
    lorryReceipt.toId,
    lorryReceipt.rateType,
    lorryReceipt.showHamali,
  ]);
  const consigneeChangeHandler = (e, value) => {
    if (value) {
      console.log(value)
      if (typeof value === "object") {
        const selectedCityPlace = filteredPlaces.find(place => place.place_name == value.city);
        setLorryReceipt((currState) => {
          const updatedState = {
            ...currState,
            consignee: value,
            consigneeName: value.label,
            consigneeAddress: value.address,
            to: value.city, // Set the city
            toId: selectedCityPlace ? selectedCityPlace.place_id : null, // Set place_id if found
            consigneePhone: value.telephoneno,
            consigneeEmail: value.email,
            showHamali:value.showHamali,
          };
          return updatedState;
        });
      }
    } else {
      setLorryReceipt((currState) => {
        const updatedState = {
          ...currState,
          consignee: null,
          consigneeName: "",
          consigneeAddress: "",
          consigneePhone: "",
          consigneeEmail: "",
          to: "",
          toId: "",
          showHamali:""
        };
        return updatedState;
      });
    }
  };


  const consigneeChange = ({ target }) => {
    setLorryReceipt((currState) => {
      return {
        ...currState,
        consigneeName: target.value,
        consignee: null,
      };
    });
    fetchCustomers(target.value);
  };
  const autocompleteChangeListener = (e, option, name) => {


    setLorryReceipt((currState) => {
      return {
        ...currState,
        [name]: name === "to" || name === "from" ? option?.place_id : option,
        ...(name === "branch"
          ? {
            collectAt: option,
          }
          : {}),
        ...(name === "toBilled" && option
          ? {
            serviceTaxBy:
              SERVICE_TAX_BY.find(({ value }) => option.value === value) ||
              null,
          }
          : {}),
      };
    });
  };


  useEffect(() => {
    setLorryReceipt((currState) => {
      return {
        ...currState,
        payMode: null,
        bankName: "",
        chequeNo: "",
        chequeDate: null,
      };
    });
  }, [lorryReceipt.payType]);

  const isConsigneeDisable =
    lorryReceipt.consignee && typeof lorryReceipt.consignee === "object";

  const isConsignorDisable =
    lorryReceipt.consignor && typeof lorryReceipt.consignor === "object";
  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className="inner-wrap">
        <h1 className="pageHead">Add a Client lorry receipt</h1>
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
        <form action="" onSubmit={submitHandler} id="lorryReceiptForm">
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
                    value={lorryReceipt.branch}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "branch")
                    }
                    getOptionLabel={(branch) => branch.branch_name || ""}
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
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="LR no."
                    value={lorryReceipt.lrNo}
                    onChange={inputChangeHandler}
                    name="lrNo"
                    id="lrNo"
                    inputProps={{
                      readOnly: true,
                    }}
                    disabled
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date"
                      inputFormat="DD/MM/YYYY"
                      value={lorryReceipt.date}
                      onChange={dateInputChangeHandler.bind(null, "date")}
                      renderInput={(params) => (
                        <TextField name="date" size="small" {...params} />
                      )}
                    />
                  </LocalizationProvider>
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Invoice no"
                    value={lorryReceipt.invoiceNo}
                    onChange={inputChangeHandler}
                    name="invoiceNo"
                    id="invoiceNo"
                    inputProps={{ maxLength: 200 }}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="E-Way bill no"
                    value={lorryReceipt.eWayBillNo}
                    onChange={inputChangeHandler}
                    name="eWayBillNo"
                    id="eWayBillNo"
                    inputProps={{ maxLength: 50 }}
                  />
                </FormControl>
              </div>
              {/* <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="FO no."
                    value={lorryReceipt.foNum}
                    onChange={inputChangeHandler}
                    name="foNum"
                    disabled
                    id="foNum"
                  />
                </FormControl>
              </div> */}
              <div className="grid-item">
                <FormControl fullWidth size="small" error={formErrors.consignor.invalid}>
                  <Autocomplete
                    id="consignor"
                    size="small"
                    name="consignor"
                    options={consignors.map(customer => ({
                      label: customer.label,
                      address: customer.address,
                      city: customer.city,
                      telephoneno: customer.telephoneno,
                      customer_id: customer.customer_id,
                    }))}
                    getOptionLabel={(option) => option.label}
                    value={lorryReceipt.consignor || null}
                    onChange={(e, value) => consignorChangeHandler(e, value)}
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Consignor"
                        onChange={(e) => consignorChange(e)}
                        error={formErrors.consignor.invalid}
                        fullWidth
                      />
                    )}
                  />
                  {formErrors.consignor.invalid && (
                    <FormHelperText>
                      {formErrors.consignor.message}
                    </FormHelperText>
                  )}
                </FormControl>


              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  error={formErrors.consignorAddress.invalid}
                >
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Consignor address"
                    value={lorryReceipt.consignorAddress}
                    error={formErrors.consignorAddress.invalid}
                    onChange={inputChangeHandler}
                    name="consignorAddress"
                    id="consignorAddress"
                    disabled={isConsignorDisable}
                  />
                  {formErrors.consignorAddress.invalid && (
                    <FormHelperText>
                      {formErrors.consignorAddress.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  error={formErrors.consignorPhone.invalid}
                >
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Consignor phone"
                    value={lorryReceipt.consignorPhone}
                    error={formErrors.consignorPhone.invalid}
                    onChange={inputChangeHandler}
                    onInput={validatePhoneNumber}
                    name="consignorPhone"
                    id="consignorPhone"
                    disabled={isConsignorDisable}
                  />
                  {formErrors.consignorPhone.invalid && (
                    <FormHelperText>
                      {formErrors.consignorPhone.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              {/* <div className="grid-item">
                <FormControl
                  fullWidth
                  error={formErrors.consignorEmail.invalid}
                >
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Consignor email"
                    value={lorryReceipt.consignorEmail}
                    error={formErrors.consignorEmail.invalid}
                    onChange={inputChangeHandler}
                    name="consignorEmail"
                    id="consignorEmail"
                    disabled={isConsignorDisable}
                  />
                  {formErrors.consignorEmail.invalid && (
                    <FormHelperText>
                      {formErrors.consignorEmail.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div> */}
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.from.invalid}>
                  <Autocomplete
                    disablePortal
                    disabled
                    size="small"
                    name="From"
                    options={filteredPlaces}
                    openOnFocus
                    getOptionLabel={(option) => option.place_name || ''}
                    value={lorryReceipt.from ? { place_name: lorryReceipt.from } : null}
                    getOptionSelected={(option, value) => option.place_id == value.place_id}
                    onChange={(event, newValue) => {
                      // Handle the change event
                      if (newValue) {
                        // Assuming lorryReceipt is managed with a state management solution (e.g., useState, Redux)
                        setLorryReceipt((prev) => ({
                          ...prev,
                          from: newValue.place_name, // Update the displayed name
                          fromId: newValue.place_id,  // Store the corresponding place_id
                        }));
                      } else {
                        // Handle case where no selection is made
                        setLorryReceipt((prev) => ({
                          ...prev,
                          from: '',
                          fromId: null,
                        }));
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="From"
                        fullWidth
                      />
                    )}
                  />
                  {formErrors.from.invalid && (
                    <FormHelperText>{formErrors.from.message}</FormHelperText>
                  )}
                </FormControl>

              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  size="small"
                  error={formErrors.consignee.invalid}
                >
                  <Autocomplete
                    id="consignee"
                    freeSolo={!!lorryReceipt.consigneeName}
                    size="small"
                    name="consignee"
                    options={consignees.map(customer => ({
                      label: customer.label,
                      address: customer.address,
                      city: customer.city,
                      telephoneno: customer.telephoneno,
                      customer_id: customer.customer_id,
                      showHamali:customer.showHamali,
                    }))}
                    value={lorryReceipt.consignee || null}

                    onChange={(e, value) => consigneeChangeHandler(e, value)}
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Consignee"
                        name="consignee"
                        onChange={(e) => consigneeChange(e)}
                        error={formErrors.consignee.invalid}
                        fullWidth
                      />
                    )}
                  />
                  {formErrors.consignee.invalid && (
                    <FormHelperText>
                      {formErrors.consignee.message}
                    </FormHelperText>
                  )}
                </FormControl>

              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  error={formErrors.consigneeAddress.invalid}
                >
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Consignee address"
                    value={lorryReceipt.consigneeAddress}
                    error={formErrors.consigneeAddress.invalid}
                    onChange={inputChangeHandler}
                    name="consigneeAddress"
                    id="consigneeAddress"
                    disabled={isConsigneeDisable}
                  />
                  {formErrors.consigneeAddress.invalid && (
                    <FormHelperText>
                      {formErrors.consigneeAddress.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  error={formErrors.consigneePhone.invalid}
                >
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Consignee phone"
                    value={lorryReceipt.consigneePhone}
                    error={formErrors.consigneePhone.invalid}
                    onChange={inputChangeHandler}
                    onInput={validatePhoneNumber}
                    name="consigneePhone"
                    id="consigneePhone"
                    disabled={isConsigneeDisable}
                  />
                  {formErrors.consigneePhone.invalid && (
                    <FormHelperText>
                      {formErrors.consigneePhone.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              {/* <div className="grid-item">
                <FormControl
                  fullWidth
                  error={formErrors.consigneeEmail.invalid}
                >
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Consignee email"
                    value={lorryReceipt.consigneeEmail}
                    error={formErrors.consigneeEmail.invalid}
                    onChange={inputChangeHandler}
                    name="consigneeEmail"
                    id="consigneeEmail"
                    disabled={isConsigneeDisable}
                  />
                  {formErrors.consigneeEmail.invalid && (
                    <FormHelperText>
                      {formErrors.consigneeEmail.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div> */}
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.to.invalid}>
                  <Autocomplete
                    disablePortal
                    disabled
                    size="small"
                    name="To"
                    options={filteredPlaces}
                    openOnFocus
                    getOptionLabel={(option) => option.place_name || ''}
                    value={lorryReceipt.to ? { place_name: lorryReceipt.to } : null}
                    getOptionSelected={(option, value) => option.place_id == value.place_id}
                    onChange={(event, newValue) => {
                      // Handle the change event
                      if (newValue) {
                        // Assuming lorryReceipt is managed with a state management solution (e.g., useState, Redux)
                        setLorryReceipt((prev) => ({
                          ...prev,
                          to: newValue.place_name, // Update the displayed name
                          toId: newValue.place_id,  // Store the corresponding place_id
                        }));
                      } else {
                        // Handle case where no selection is made
                        setLorryReceipt((prev) => ({
                          ...prev,
                          to: '',
                          toId: null,
                        }));
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="To"
                        fullWidth
                      />
                    )}
                  />
                  {formErrors.to.invalid && (
                    <FormHelperText>{formErrors.to.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item"></div>
              <div className="grid-item"></div>
            </div>
          </Paper>
        </form>
        <h2 className="mb20">Transactions details</h2>
        {formErrors.transactionDetails.invalid && (
          <p className="error">{formErrors.transactionDetails.message}</p>
        )}
        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <TransactionDetails
            articles={articles}
            lorryReceipt={lorryReceipt}
            setLorryReceipt={setLorryReceipt}
          />
           {user.usertype?.toLowerCase() !== "clientuser" && (
          <Divider sx={{ margin: "20px 0" }} />)}
          {user.usertype?.toLowerCase() !== "clientuser" && (
          <form action="" onSubmit={submitHandler} id="lorryReceiptForm">
            <div className="grid grid-7-col">
              <div tabIndex="1" className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    tabIndex={1}
                    size="small"
                    variant="outlined"
                    label="Total freight"
                    value={lorryReceipt.totalFreight || ""}
                    name="totalFreight"
                    id="totalFreight"
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
                    label="Delivery charges"
                    value={lorryReceipt.deliveryCharges || ""}
                    name="deliveryCharges"
                    id="deliveryCharges"
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    InputProps={{
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
                <FormControl fullWidth error={formErrors.lrCharges.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="LR charges"
                    value={lorryReceipt.lrCharges || ""}
                    error={formErrors.lrCharges.invalid}
                    name="lrCharges"
                    id="lrCharges"
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          &#8377;
                        </InputAdornment>
                      ),
                    }}
                  />
                  {formErrors.lrCharges.invalid && (
                    <FormHelperText>
                      {formErrors.lrCharges.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Hamali"
                    value={lorryReceipt.hamali || ""}
                    name="hamali"
                    id="hamali"
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    InputProps={{
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
                    type="number"
                    variant="outlined"
                    label="Total"
                    value={lorryReceipt.total || ""}
                    name="total"
                    id="total"
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
            </div>
          </form>
          )}
        </Paper>
        <form action="" onSubmit={submitHandler} id="lorryReceiptForm">
          <h2 className="mb20">Billing details</h2>
          <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
            <div className="grid grid-6-col">
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Material cost"
                    value={lorryReceipt.materialCost || ""}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="materialCost"
                    id="materialCost"
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth size="small">
                  <Autocomplete
                    autoSelect
                    id="deliveryType"
                    disablePortal
                    autoHighlight={true}
                    size="small"
                    name="deliveryType"
                    options={DELIVERY_TYPES}
                    value={lorryReceipt.deliveryType || null}
                    disabled
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "deliveryType")
                    }
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="deliveryType"
                        label="Delivery type"
                        fullWidth
                      />
                    )}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  size="small"
                  error={formErrors.payType.invalid}
                >
                  <Autocomplete
                    autoSelect
                    id="payType"
                    disablePortal
                    autoHighlight={true}
                    size="small"
                    name="payType"
                    options={PAY_TYPES}
                    value={lorryReceipt.payType}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "payType")
                    }
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Pay type"
                        name="payType"
                        error={formErrors.payType.invalid}
                        fullWidth
                      />
                    )}
                  />
                  {formErrors.payType.invalid && (
                    <FormHelperText>
                      {formErrors.payType.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  size="small"
                  error={formErrors.toBilled.invalid}
                >
                  <Autocomplete
                    autoSelect
                    id="toBilled"
                    disablePortal
                    autoHighlight={true}
                    size="small"
                    name="toBilled"
                    options={TO_BILLED}
                    value={lorryReceipt.toBilled}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "toBilled")
                    }
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="To billed"
                        fullWidth
                        error={formErrors.toBilled.invalid}
                      />
                    )}
                  />
                  {formErrors.toBilled.invalid && (
                    <FormHelperText>
                      {formErrors.toBilled.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth size="small">
                  <Autocomplete
                    autoSelect
                    id="collectAt"
                    size="small"
                    name="collectAt"
                    options={branches}
                    value={lorryReceipt.collectAt}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "collectAt")
                    }
                    disabled
                    getOptionLabel={(branch) => branch.branch_name || ""}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="collectAt"
                        label="Collect at"
                        fullWidth
                      />
                    )}
                  />
                </FormControl>
              </div>
              {/* <div className="grid-item">
                <FormControl fullWidth size="small">
                  <Autocomplete
                    autoSelect
                    id="serviceTaxBy"
                    disablePortal
                    autoHighlight={true}
                    size="small"
                    name="serviceTaxBy"
                    options={SERVICE_TAX_BY}
                    value={lorryReceipt.serviceTaxBy}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "serviceTaxBy")
                    }
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="serviceTaxBy"
                        label="Service tax by"
                        fullWidth
                      />
                    )}
                  />
                </FormControl>
              </div> */}
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.payMode.invalid}>
                  <Autocomplete
                    autoSelect
                    id="payMode"
                    disablePortal
                    autoHighlight={true}
                    size="small"
                    name="payMode"
                    options={PAY_MODE}
                    value={lorryReceipt.payMode}
                    disabled={lorryReceipt.payType?.value !== "Paid"}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "payMode")
                    }
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Pay mode"
                        name="payMode"
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
                <FormControl fullWidth error={formErrors.bankName.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Bank name / UPI ID"
                    value={lorryReceipt.bankName}
                    onChange={inputChangeHandler}
                    error={formErrors.bankName.invalid}
                    disabled={lorryReceipt.payMode?.value !== "By Cheque"}
                    name="bankName"
                    id="bankName"
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
                    label="Cheque no / UPI TransactionID"
                    value={lorryReceipt.chequeNo}
                    onChange={inputChangeHandler}
                    error={formErrors.chequeNo.invalid}
                    disabled={lorryReceipt.payMode?.value !== "By Cheque"}
                    name="chequeNo"
                    id="chequeNo"
                  />
                  {formErrors.chequeNo.invalid && (
                    <FormHelperText>
                      {formErrors.chequeNo.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.chequeDate.invalid}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date"
                      inputFormat="DD/MM/YYYY"
                      value={lorryReceipt.chequeDate}
                      onChange={dateInputChangeHandler.bind(null, "chequeDate")}
                      error={formErrors.chequeDate.invalid}
                      disabled={lorryReceipt.payMode?.value !== "By Cheque"}
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
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Remark"
                    value={lorryReceipt.remark}
                    onChange={inputChangeHandler}
                    name="remark"
                    id="remark"
                  />
                </FormControl>
              </div>
            </div>
          </Paper>
        </form>

        {open && (
          <Dialog
            isOpen={true}
            onClose={handleClose}
            title="Success"
            content={`LR ${lrNo} generated successfully.`}
            success
          />
        )}
        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <div className="right">
            {/* <Button
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
            </Button> */}
            <Button
              variant="contained"
              size="medium"
              type="submit"
              color="primary"
              form="lorryReceiptForm"
              className="ml6"
              // disabled={isLoading || loading}
            >
              Save
            </Button>
            <Button
              variant="contained"
              size="medium"
              type="button"
              color="primary"
              form="lorryReceiptForm"
              className="ml6"
              onClick={saveAndPrint}
              // disabled={isLoading || loading}
            >
              Save &amp; Print
            </Button>

            {/* <Button
              variant="contained"
              size="medium"
              type="button"
              color="primary"
              form="lorryReceiptForm"
              className="ml6"
              onClick={(e) => saveAndPrint(e, true)}
              // disabled={isLoading || loading}
            >
              Save &amp; Print w/o Amount
            </Button> */}
          </div>
        </Paper>
      </div>
    </>
  );
};

export default ClientLorryReceiptsAdd;
