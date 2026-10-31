// JBS
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import TransactionDetails from "./TransactionDetails";

import {
  DELIVERY_TYPES,
  PAY_TYPES,
  TO_BILLED,
  SERVICE_TAX_BY,
  PAY_MODE,
} from "../../../../services/constants";
import {
  base64ToObjectURL,
  validateNumber,
  validatePhoneNumber,
} from "../../../../services/utils";
import {
  downloadLorryReceipt,
  getCustomers,
  getLorryReceipt,
  getRateMasterForLR,
  selectIsLoading,
  updateLorryReceipt,
} from "./slice/lorryReceiptSlice";

const initialState = {
  branch: null,
  lr_no: "",
  date: new Date(),
  InvoiceNo: "",
  EwayNo: "",
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
  delivery: "",
  lrCharges: 10,
  total: "",
  material_cost: "",
  deliveryType: null,
  serviceTaxBy: null,
  payType: null,
  toBilled: null,
  collectAt: null,
  payMode: null,
  bank_name: "",
  chqno: "",
  chqdate: null,
  remarks: "",
  fromId: "",
  toId: "",
  transactions: [],
  showHamali:''
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
  toBilled: {
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
  payMode: {
    invalid: false,
    message: "",
  },
  bank_name: {
    invalid: false,
    message: "",
  },
  chqno: {
    invalid: false,
    message: "",
  },
  chqdate: {
    invalid: false,
    message: "",
  },
  transactionDetails: {
    invalid: false,
    message: "",
  },
};

const LorryReceiptEdit = () => {
  const isLoading = useSelector(selectIsLoading);
  const { articles, customers, branches, places } = useSelector(
    ({ lorryreceipt }) => lorryreceipt
  );
  const filteredPlaces = places.map(place => ({
    place_id: place.place_id,
    place_name: place.place_name.trim(),
  }));


  const [lorryReceipt, setLorryReceipt] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [checkboxes, setCheckboxes] = useState({
    emailConsigner: false,
    emailConsignee: false
  });
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { lrId } = location.state;


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
    if (lrId && lrId !== "" && customers?.length) {
      dispatch(getLorryReceipt(lrId))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            const updatedResponse = { ...payload?.data };
            updatedResponse.lr_no = payload?.data.lr_no;
            updatedResponse.lr_date = payload?.data.lr_date; 
            updatedResponse.InvoiceNo=payload?.data.InvoiceNo; 
            updatedResponse.EwayNo=payload?.data.EwayNo; 
            updatedResponse.material_cost=payload?.data.material_cost; 
            updatedResponse.bank_name=payload?.data.bank_name;
            updatedResponse.chqno=payload?.data.chqno;
            updatedResponse.chqdate = payload?.data.chqdate; 
            updatedResponse.remarks = payload?.data.remarks; 
            updatedResponse.lrCharges = payload?.data.statatical; 
            updatedResponse.delivery = payload?.data.delivery; 
            
            if (payload?.data.consigner) {
              const consignor = customers.find(
                (customer) => customer.customer_id == payload.data.consigner
              );
              updatedResponse.consignor = consignor || null; 
            }
            if (payload?.data.consignee) {
              const consignee = customers.find(
                (customer) => customer.customer_id === payload.data.consignee.customer_id
              );
              updatedResponse.consignee = consignee || null; 
            }
            if (payload?.data.delivery_type) {
              const deliveryTypeIndex = DELIVERY_TYPES?.map?.(
                (type) => type.label
              )?.indexOf?.(payload?.data.delivery_type);
              const deliveryType = DELIVERY_TYPES[deliveryTypeIndex];
              updatedResponse.deliveryType = deliveryType;
            }
            if (payload?.data.pay_type) {
              const payTypeIndex = PAY_TYPES?.map?.(
                (type) => type.label
              )?.indexOf?.(payload?.data.pay_type);
              const payType = PAY_TYPES[payTypeIndex];
              updatedResponse.payType = payType;
            }

            if (payload?.data.to_billed) {
              const toBilledType = TO_BILLED?.map?.(
                (type) => type.value
              )?.indexOf?.(payload?.data.to_billed);
              const toBilled = TO_BILLED[toBilledType];
              updatedResponse.toBilled = toBilled;
            }

            if (payload?.data.serviceTaxBy) {
              const serviceTaxByIndex = SERVICE_TAX_BY?.map?.(
                (client) => client.label
              )?.indexOf?.(payload?.data.serviceTaxBy);
              const serviceTaxBy = SERVICE_TAX_BY[serviceTaxByIndex];
              updatedResponse.serviceTaxBy = serviceTaxBy;
            }

            if (updatedResponse.pay_mode) {
              const payModeIndex = PAY_MODE?.map?.(
                (mode) => mode.value
              )?.indexOf?.(payload?.data.pay_mode);
              updatedResponse.payMode = PAY_MODE[payModeIndex];
            }
            
            updatedResponse.branch = branches?.find?.(
              ({ branch_id }) => branch_id == updatedResponse.branch
            );
            updatedResponse.collectAt = updatedResponse.branch;

            
            setLorryReceipt(updatedResponse);
            if (updatedResponse.consignor) {
              consignorChangeHandler(null, updatedResponse.consignor);
            }
            if (updatedResponse.consignee) {
              consigneeChangeHandler(null, updatedResponse.consignee);
            }
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [lrId, places]);

  const goToLorryReceipts = useCallback(() => {
    navigate("/transactions/lorryReceipts");
  }, [navigate]);

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
        if (transaction.rateType === "Kg" || transaction.rateType?.value === "Kg") {
          hamali = hamaliRate * chargeWeight;
        } else if (transaction.rateType === "Case" || transaction.rateType?.value === "Case") {
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
      +lorryReceipt.delivery +
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
    lorryReceipt.delivery,
    lorryReceipt.lrCharges,
    lorryReceipt.hamali,
  ]);

  const backButtonHandler = () => {
    goToLorryReceipts();
  };
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setCheckboxes({
      ...checkboxes,
      [name]: checked,
    });
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


  const submitHandler = (e, isSaveAndPrint, isWithoutAmount = false) => {
    e.preventDefault();
    let consignor
    let consignee
    if (!validateForm(lorryReceipt)) {
      const updatedLR = {
        ...lorryReceipt,
        branch: lorryReceipt?.branch?.branch_id,
        user: user?.employee?.name || "",
      };
      if (updatedLR.consignor) {
        updatedLR.consignor = updatedLR.consignor?.customer_id || null;
      updatedLR.consignee = updatedLR.consignee?.customer_id || null;
      }
      if (updatedLR.deliveryType) {
        updatedLR.deliveryType = updatedLR.deliveryType.value;
      }
      if (updatedLR.payType) {
        updatedLR.payType = updatedLR.payType.value;
      }
      if (updatedLR.toBilled) {
        updatedLR.toBilled = updatedLR.toBilled.value;
      }
      if (updatedLR.collectAt) {
        updatedLR.collectAt = updatedLR.collectAt._id;
      }
      if (updatedLR.serviceTaxBy?.value) {
        updatedLR.serviceTaxBy = updatedLR.serviceTaxBy?.value;
      }
      updatedLR.transactions?.forEach?.((transaction) => {
        if (transaction.articles_name) {
          transaction.article = transaction.articles_name;
      } else if (transaction.article && transaction.article.articles_name) {
          transaction.article = transaction.article.articles_name;
      } else {
          transaction.article = null; 
      }
        transaction.rateType = transaction.rateType.label
          ? transaction.rateType.label
          : transaction.rateType;
      });
      if (updatedLR.payMode) {
        updatedLR.payMode = updatedLR.payMode.value;
      }
      updatedLR.isSaveAndPrint = isSaveAndPrint;
      updatedLR.isWithoutAmount = isWithoutAmount;
      localStorage.setItem("consigneeEmail",lorryReceipt.consigneeEmail)
localStorage.setItem("consignorEmail",lorryReceipt.consignorEmail)
      dispatch(updateLorryReceipt(updatedLR))
        .then(({ payload = {} }) => {
          const { message, file,updated_id } = payload?.data || {};
          if(checkboxes.emailConsigner){
            consignor = localStorage.getItem("consignorEmail")
            
            sendmail(inserted_id,consignor)
          }else if(checkboxes.emailConsignee){
            consignee = localStorage.getItem("consigneeEmail")
            sendmail(inserted_id,consignee)
          }  
          else if (isSaveAndPrint) {
              if (updated_id) {
                dispatch(
                  downloadLorryReceipt({
                    id: updated_id,
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
                      goToLorryReceipts();
                    }
                  })
                  .catch((e) => {
                    setHttpError(e.message);
                  });
              }
            } else {
            if (file) {
              const fileURL = base64ToObjectURL(file);
              if (fileURL) {
                const winPrint = window.open(fileURL, "_blank");
                winPrint.focus();
                winPrint.print();
              }
            }
            setHttpError("");
            setFormErrors(initialErrorState);
            setLorryReceipt(initialState);
            goToLorryReceipts();
            }
          
        })
        .catch((error) => {
          console.error('API call error:', error);
          setHttpError(error.message);
        });
    }
  };
  const sendmail=(id,emailAddress)=>{
    
    dispatch(
      downloadLorryReceipt({
        id: id,
        email: emailAddress,
        user: user?.employee?.name || "",
      })
    )
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        }
       
      })
      .catch((error) => {
        setHttpError(error.message);
       
      }); 
  }
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
    if (!formData.consignorAddress) {
      errors.consignorAddress = {
        invalid: true,
        message: "Consignor address is required",
      };
    }
    if (!formData.from?.trim?.()) {
      errors.from = { invalid: true, message: "From is required" };
    }
    if (!formData.consignee && !formData.consigneeName?.trim?.()) {
      errors.consignee = { invalid: true, message: "Consignee is required" };
    }
    if (!formData.consigneeAddress) {
      errors.consigneeAddress = {
        invalid: true,
        message: "Consignee address is required",
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
    if (!formData.toBilled) {
      errors.toBilled = {
        invalid: true,
        message: "To Billed is required",
      };
    }
    if (!formData.payType) {
      errors.payType = {
        invalid: true,
        message: "Payment type is required",
      };
    }
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
      if (!formData.bank_name) {
        errors.bank_name = {
          invalid: true,
          message: "Bank name is required",
        };
      }
      if (!formData.chqno) {
        errors.chqno = {
          invalid: true,
          message: "Cheque no is required",
        };
      }
      if (!formData.chqdate) {
        errors.chqdate = {
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
  const fetchCustomers = (str) => {
    const search = str.trim?.();
    if (search?.length > 2) {
      dispatch(getCustomers(search));
    } else if (!search) {
      dispatch(getCustomers());
    }
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
            consignorEmail: value.emailid,
            from: value.city, 
            fromId: selectedCityPlace ? selectedCityPlace.place_id : null, 
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

          if (rate !== undefined && HamaliRate !== undefined) {
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
    lorryReceipt.showHamali
  ]);
  const consignorChange = ({ target }) => {
    setLorryReceipt((currState) => {
      return {
        ...currState,
        consignorName: target.value,
      };
    });
    fetchCustomers(target.value);
  };

  const consigneeChangeHandler = (e, value) => {
    if (value) {
      if (typeof value === "object") {
        const selectedCityPlace = filteredPlaces.find(place => place.place_name == value.city);
        setLorryReceipt((currState) => {
          const updatedState = {
            ...currState,
            consignee: value,
            consigneeName: value.label,
            consigneeAddress: value.address,
            to: value.city, 
            toId: selectedCityPlace ? selectedCityPlace.place_id : null, 
            consigneePhone: value.telephoneno,
            consigneeEmail: value.emailid,
            showHamali:value.showHamali
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
          toId: ""
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
      const updatedState = {
        ...currState,
        [name]: name === "to" || name === "from" ? option?.name : option,
        ...(name === "branch" ? { collectAt: option } : {}),
      };
  
     
      if (name === "payMode" && option?.value === "By Cash") {
        updatedState.bank_name = ''; // Clear bank_name
        updatedState.chqno = ''; // Clear chqno
        updatedState.chqdate = null; // Clear chqdate
      }

      if (name === "payType" && (option?.value === "TBB" || option?.value === "ToPay" || option?.value === "FOC")) {
        updatedState.payMode = null; 
        updatedState.bank_name = ''; // Clear bank_name
        updatedState.chqno = ''; // Clear chqno
        updatedState.chqdate = null; // Clear chqdate
      }
  
      return updatedState;
    });
  };
  
  const isConsigneeDisable =
    lorryReceipt.consignee && typeof lorryReceipt.consignee === "object";

  const isConsignorDisable =
    lorryReceipt.consignor && typeof lorryReceipt.consignor === "object";
  return (
    <>
      {isLoading && <LoadingSpinner />}
      <h1 className="pageHead">Edit a lorry receipt</h1>
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
                    value={lorryReceipt.branch || null}
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
                    value={lorryReceipt.lr_no}
                    onChange={inputChangeHandler}
                    name="lr_no"
                    id="lr_no"
                    inputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date"
                      inputFormat="DD/MM/YYYY"
                      value={lorryReceipt.lr_date}
                      onChange={dateInputChangeHandler.bind(null, "lr_date")}
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
                    label="Invoice no."
                    value={lorryReceipt.InvoiceNo}
                    onChange={inputChangeHandler}
                    name="InvoiceNo"
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
                    value={lorryReceipt.EwayNo}
                    onChange={inputChangeHandler}
                    name="EwayNo"
                    id="EwayNo"
                    inputProps={{ maxLength: 50 }}
                  />
                </FormControl>
              </div>
              {/* <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    disabled
                    variant="outlined"
                    label="FO no"
                    value={lorryReceipt.foNum}
                    onChange={inputChangeHandler}
                    name="foNum"
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
                    options={customers.map(customer => ({
                      label: customer.label,
                      address: customer.address,
                      city: customer.city,
                      telephoneno: customer.telephoneno,
                      customer_id: customer.customer_id,
                      emailid:customer.emailid
                    }))}
                    getOptionLabel={(option) => option.label}
                    value={lorryReceipt.consignor || null}
                    onChange={(e, value) => consignorChangeHandler(e, value)}
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Consignor"
                        id="consignor-input" 
                        name="consignor" 
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
              </div>{" "}
              {/* <div className="grid-item">
                <FormControl
                  fullWidth
                  error={formErrors.consignorEmail.invalid}
                >
                  <TextField
                    type="text"
                    size="small"
                    variant="outlined"
                    label="Consignor email"
                    value={lorryReceipt.consignorEmail || ""}
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
                        id="From"
                    options={filteredPlaces}
                    openOnFocus
                    getOptionLabel={(option) => option.place_name || ''}
                    value={lorryReceipt.from ? { place_name: lorryReceipt.from } : null}
                    getOptionSelected={(option, value) => option.place_id == value.place_id}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        setLorryReceipt((prev) => ({
                          ...prev,
                          from: newValue.place_name,
                          fromId: newValue.place_id,  
                        }));
                      } else {
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
                    options={customers.map(customer => ({
                      label: customer.label,
                      address: customer.address,
                      city: customer.city,
                      telephoneno: customer.telephoneno,
                      customer_id: customer.customer_id,
                      showHamali:customer.showHamali,
                      emailid:customer.emailid
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
                    type="text"
                    size="small"
                    variant="outlined"
                    label="Consignee email"
                    value={lorryReceipt.consigneeEmail || ""}
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
                    id="To"
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
          <Divider sx={{ margin: "20px 0" }} />
          <form action="" onSubmit={submitHandler} id="lorryReceiptForm">
            <div className="grid grid-7-col">
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    tabIndex={1}
                    size="small"
                    type="number"
                    variant="outlined"
                    label="Total freight"
                    value={lorryReceipt.totalFreight}
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
                    value={lorryReceipt.delivery || ""}
                    name="delivery"
                    id="delivery"
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
                    value={lorryReceipt.total}
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
                    value={lorryReceipt.material_cost || ""}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="material_cost"
                    id="material_cost"
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth size="small">
                  <Autocomplete
                    autoSelect
                    disablePortal
                    autoHighlight={true}
                    size="small"
                    name="deliveryType"
                    options={DELIVERY_TYPES}
                    value={lorryReceipt.deliveryType}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "deliveryType")
                    }
                    disabled
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
                        name="toBilled"
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
                    disablePortal
                    autoHighlight={true}
                    size="small"
                    name="collectAt"
                    options={branches}
                    value={lorryReceipt.collectAt}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "collectAt")
                    }
                    disabled
                    getOptionLabel={(branch) => branch.branch_name || ""}
                    openOnFocus
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
                    disablePortal
                    autoHighlight={true}
                    size="small"
                    name="payMode"
                    options={PAY_MODE}
                    value={lorryReceipt.payType?.value === "Paid" ? lorryReceipt.payMode : null}
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
                <FormControl fullWidth error={formErrors.bank_name.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Bank name"
                    value={lorryReceipt.bank_name}
                    onChange={inputChangeHandler}
                    error={formErrors.bank_name.invalid}
                    disabled={lorryReceipt.payMode?.value !== "By Cheque"}
                    name="bank_name"
                    id="bank_name"
                  />
                  {formErrors.bank_name.invalid && (
                    <FormHelperText>
                      {formErrors.bank_name.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.chqno.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Cheque no"
                    value={lorryReceipt.chqno}
                    onChange={inputChangeHandler}
                    error={formErrors.chqno.invalid}
                    disabled={lorryReceipt.payMode?.value !== "By Cheque"}
                    name="chqno"
                    id="chqno"
                  />
                  {formErrors.chqno.invalid && (
                    <FormHelperText>
                      {formErrors.chqno.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.chqdate.invalid}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date"
                      inputFormat="DD/MM/YYYY"
                      value={lorryReceipt.chqdate}
                      onChange={dateInputChangeHandler.bind(null, "chqdate")}
                      error={formErrors.chqdate.invalid}
                      disabled={lorryReceipt.payMode?.value !== "By Cheque"}
                      renderInput={(params) => (
                        <TextField
                          name="date"
                          size="small"
                          {...params}
                          error={formErrors.chqdate.invalid}
                        />
                      )}
                    />
                  </LocalizationProvider>
                  {formErrors.chqdate.invalid && (
                    <FormHelperText>
                      {formErrors.chqdate.message}
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
                    value={lorryReceipt.remarks}
                    onChange={inputChangeHandler}
                    name="remarks"
                    id="remarks"
                  />
                </FormControl>
              </div>
            </div>
          </Paper>
        </form>

        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                    label="Consignor Mail"
                    />
                    <FormControlLabel
                     control={
                      <Checkbox
                        name="emailConsignee"
                         checked={checkboxes.emailConsignee}
                         onChange={handleCheckboxChange}
                      size="small"
                      />
                    }
                    label="Consignee Mail"
                    />
              </div>
          
              <div className="right">
              <Button
              variant="contained"
              size="medium"
              type="submit"
              color="primary"
              form="lorryReceiptForm"
              className="ml6"
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
            >
              Save &amp; Print
            </Button>

            <Button
              variant="contained"
              size="medium"
              type="button"
              color="primary"
              form="lorryReceiptForm"
              className="ml6"
              onClick={(e) => saveAndPrint(e, true)}
            >
              Save &amp; Print w/o Amount
            </Button>
              </div>
            </div>
          
        </Paper>
      </div>
    </>
  );
};

export default LorryReceiptEdit;
