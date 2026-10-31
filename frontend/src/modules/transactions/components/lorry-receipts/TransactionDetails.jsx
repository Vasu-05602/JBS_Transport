// JBS

import React, { useEffect, useState } from "react";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  InputAdornment,
  Autocomplete,
  Grid,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import {
  getRateMasterByCustomer,
  getRateMasterForLR,
  selectIsLoading,
} from "./slice/lorryReceiptSlice";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import { sortArray, validateNumber } from "../../../../services/utils";

const RATE_TYPES = [
  { label: "Fixed", value: "Fixed" },
  { label: "Kg", value: "Kg" },
  { label: "Case", value: "Case" },
];

const initialState = {
  article: null,
  articleNo: "",
  description: "",
  // weight: "",
  chargeWeight: "",
  rateType: RATE_TYPES[0] || null,
  rate: "",
  hamalirate: "",
  freight: "",
  ddCharges: 0,
};

const initialErrorState = {
  article: {
    invalid: false,
    message: "",
  },
  articleNo: {
    invalid: false,
    message: "",
  },
  // weight: {
  //   invalid: false,
  //   message: "",
  // },
  chargeWeight: {
    invalid: false,
    message: "",
  },
  rateType: {
    invalid: false,
    message: "",
  },
  rate: {
    invalid: false,
    message: "",
  },
  hamalirate: {
    invalid: false,
    message: "",
  },
  freight: {
    invalid: false,
    message: "",
  },
};

const TransactionDetails = ({ articles, lorryReceipt, setLorryReceipt }) => {
  
  const columns = [
    {
      field: "article",
      headerName: "Article",
      flex: 1,
      renderCell: (params) => {
        if (typeof params.row.articles_name === "string") {
          return params.row.articles_name;
        }
        if (params.row.article?.articles_name) {
          return params.row.article?.articles_name;
        }
        return null;
      },
    },
    { field: "articleNo", headerName: "No. of articles", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    // { field: "weight", headerName: "Weight", flex: 1 },
    { field: "chargeWeight", headerName: "Weight", flex: 1 },
    {
      field: "rateType",
      headerName: "Rate type",
      flex: 1,
      renderCell: (params) => {
        if (typeof params.row?.rateType === "string") {
          return params.row.rateType;
        }
        if (params.row.rateType?.value) {
          return params.row.rateType.value;
        }
        return null;
      },
    },
    { field: "rate", headerName: "Rate", flex: 1 },
    { field: "hamalirate", headerName: "Hamali Rate", flex: 1 },
    { field: "freight", headerName: "Freight", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(
            params.row.id || params.row._id,
            params.row._id ? true : false
          );
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteTransactionDetail(
            params.row.id || params.row._id,
            params.row._id ? true : false
          );
        };

        return (
          <>
            <IconButton size="small" onClick={triggerEdit} color="primary">
              <EditIcon />
            </IconButton>
            &nbsp;&nbsp;
            <IconButton size="small" onClick={triggerDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </>
        );
      },
    },
  ];
  
  const dispatch = useDispatch();
  // const isLoading = useSelector(selectIsLoading);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [transactionDetail, setTransactionDetail] = useState(initialState);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [rateMaster, setRateMaster] = useState(false);
  const [httpError, setHttpError] = useState("");
const user = useSelector((state) => state.user);
const filteredColumns =
user.usertype?.toLowerCase() === "clientuser"
  ? columns.filter(
      (col) => !["rate", "hamalirate", "freight"].includes(col.field)
    )
  : columns;
  useEffect(() => {
    if (isSubmitted && !hasErrors) {
      
      setLorryReceipt((currentState) => {
        let updatedState = {
          ...currentState,
          transactions: [...currentState.transactions],
        };
        if (!isEditMode) {
          const updatedTransactionDetail = {
            ...transactionDetail,
            id: Math.random(),
          };
          const selectedArticle = articles?.filter?.(
            (article) => article.articles_id === updatedTransactionDetail.article
          );

          if (selectedArticle?.length) {
            updatedTransactionDetail.article = selectedArticle[0].name;
          }
          updatedState.transactions = [
            ...currentState.transactions,
            { ...updatedTransactionDetail },
          ];
        } else {
          let filteredDetails;
          if (!updatedState.transactions[0]._id) {
            filteredDetails = updatedState.transactions?.filter?.(
              (detail) => detail.id !== transactionDetail.id
            );
          } else {
            filteredDetails = updatedState.transactions?.filter?.(
              (detail) => detail._id !== transactionDetail._id
            );
          }
          const selectedArticle = articles?.filter?.(
            (article) =>
              article.articles_id === transactionDetail.article.articles_id ||
              article.articles_name === transactionDetail.article.articles_name
          );
          const updatedDetail = { ...transactionDetail };
          if (selectedArticle?.length) {
            updatedDetail.articles_name = selectedArticle[0].articles_name;
          }
          updatedState.transactions = [
            ...filteredDetails,
            { ...updatedDetail },
          ];
        }
        const sortedByDDCharges = sortArray(
          updatedState.transactions,
          "ddCharges"
        );
        updatedState.deliveryCharges =
          sortedByDDCharges[sortedByDDCharges?.length - 1]?.ddCharges || 0;

        return updatedState;
      });
      setTransactionDetail(initialState);

      setIsSubmitted(false);
      setIsEditMode(false);
      // inputRef.focus();
    }
  }, [
    isSubmitted,
    hasErrors,
    transactionDetail,
    articles,
    isEditMode,
    setLorryReceipt,
  ]);



  
  
  
  useEffect(() => {
    if (transactionDetail?.weight) {
   
      setTransactionDetail((currState) => {
        return {
          ...currState,
          chargeWeight: currState.weight,
        };
      });
    }
  }, [transactionDetail?.weight]);

  useEffect(() => {
    let freight;
    let hamali
    if (
      transactionDetail.rateType &&
      (transactionDetail.rateType?.value === "Kg" || transactionDetail.rateType === "Kg") &&
      transactionDetail.chargeWeight &&
      transactionDetail.rate
    ) {
      const totalRate = (+transactionDetail.rate || 0);
      const hamalirate = (+transactionDetail.hamalirate || 0);
hamali= hamalirate * +transactionDetail.chargeWeight;
      freight = totalRate * +transactionDetail.chargeWeight;
      freight = freight+ hamali
    }
    if (
      transactionDetail.rateType &&
      transactionDetail.rateType.value === "Case" &&
      transactionDetail.rate &&
      transactionDetail.articleNo
    ) {
      const totalRate = (+transactionDetail.rate || 0);
      const hamalirate = (+transactionDetail.hamalirate || 0);
      hamali= hamalirate * +transactionDetail.articleNo;
      freight = totalRate * +transactionDetail.articleNo;
      freight = freight+ hamali
    }
    if (freight) {
      setTransactionDetail((currentState) => {
        return {
          ...currentState,
          freight: freight,
        };
      });
    }
  }, [
    transactionDetail.rate,
    transactionDetail.chargeWeight,
    transactionDetail.rateType,
    transactionDetail.articleNo,
    transactionDetail.hamalirate, 
  ]);


  useEffect(() => {
    if (lorryReceipt.consignor && lorryReceipt.consignor._id) {
      setLoading(true);
      dispatch(getRateMasterByCustomer(lorryReceipt.consignor._id))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setRateMaster(payload?.data.rateMaster);
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        }).finally(() => {
          setLoading(false);  
        });

    }
  }, [lorryReceipt.consignor]);

  useEffect(() => {
    console.log(rateMaster)
    if (
      rateMaster &&
      transactionDetail.article &&
      transactionDetail.article.name
    ) {
      const selectedRate = rateMaster.rates?.find?.(
        (rate) =>
          rate.article?.toLowerCase?.() ===
          transactionDetail.article.name?.toLowerCase?.() &&
          (rate.station === lorryReceipt?.consignee?.cityId ||
            rate.station === lorryReceipt?.consignee?.city)
      );
      if (selectedRate) {
        setTransactionDetail((currState) => {
          return {
            ...currState,
            rate: selectedRate.rate,
            ddCharges: selectedRate.ddCharges,
          };
        });
      }
    } else {
      setTransactionDetail((currState) => {
        return {
          ...currState,
          // rate: "",
          ddCharges: 0,
        };
      });
    }
  }, [rateMaster, transactionDetail.article]);

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setTransactionDetail((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const resetButtonHandler = () => {
    setTransactionDetail(initialState);
    setFormErrors(initialErrorState);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    setFormErrors((currState) => validateForm(transactionDetail));
    setIsSubmitted(true);
  };

  const navigateToEdit = (id, has_Id) => {
    let editedTransactionDetail;
    if (!has_Id) {
      editedTransactionDetail = {
        ...(lorryReceipt.transactions?.filter?.(
          (detail) => detail.id === id
        )[0] || {}),
      };
    } else {
      editedTransactionDetail = {
        ...(lorryReceipt.transactions?.filter?.(
          (detail) => detail._id === id
        )[0] || {}),
      };
    }

    const editedArticle = articles?.findIndex?.((article) => {
      return article.articles_name === editedTransactionDetail.articles_name;
    });
    
    if (editedArticle >= 0) {
      editedTransactionDetail.article = articles[editedArticle];
    }
    console.log("editedArticle",editedArticle)
    const editedRateType = RATE_TYPES?.findIndex?.(
      (rateType) => rateType.label === editedTransactionDetail.rateType
    );
    if (editedRateType >= 0) {
      editedTransactionDetail.rateType = RATE_TYPES[editedRateType];
    }
   
    setTransactionDetail(editedTransactionDetail);
    setIsEditMode(true);
  };

  const deleteTransactionDetail = (selectedId, has_Id) => {
    let updatedTransactions;
    if (!has_Id) {
      updatedTransactions = lorryReceipt.transactions?.filter?.(
        (detail) => detail.id !== selectedId
      );
    } else {
      updatedTransactions = lorryReceipt.transactions?.filter?.(
        (detail) => detail._id !== selectedId
      );
    }
    const sortedByDDCharges = sortArray(updatedTransactions, "ddCharges");
    setLorryReceipt((currentState) => {
      return {
        ...currentState,
        transactions: updatedTransactions,
        deliveryCharges:
          sortedByDDCharges[sortedByDDCharges?.length - 1]?.ddCharges || 0,
      };
    });
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.article) {
      errors.article = { invalid: true, message: "Article is required" };
    }
    if (
      (typeof formData.articleNo === "string" &&
        !formData.articleNo?.trim?.()) ||
      (typeof formData.articleNo === "number" && formData.articleNo <= 0)
    ) {
      errors.articleNo = {
        invalid: true,
        message: "Number of articles is required",
      };
    }
    if (formData.articleNo && isNaN(formData.articleNo)) {
      errors.materialCost = {
        invalid: true,
        message: "Number of articles should be a number",
      };
    }
    // if (
    //   (!formData.weight || formData.weight <= 0) &&
    //   formData.rateType === RATE_TYPES[1]
    // ) {
    //   errors.weight = {
    //     invalid: true,
    //     message: "Weight is required",
    //   };
    // }
    // if (
    //   (!formData.chargeWeight || formData.chargeWeight <= 0) &&
    //   formData.rateType === RATE_TYPES[1]
    // ) {
    //   errors.chargeWeight = {
    //     invalid: true,
    //     message: "Charge weight is required",
    //   };
    // }
    // if (formData.weight && isNaN(formData.weight)) {
    //   errors.weight = {
    //     invalid: true,
    //     message: "Weight should be in a number",
    //   };
    // }
    // if (!formData.rateType) {
    //   errors.rateType = { invalid: true, message: "Rate type is required" };
    // }
    // if (formData.rate) {
    //   errors.rate = { invalid: true, message: "Rate  is required" };
    // }
    // if (!formData.freight) {
    //   errors.freight = { invalid: true, message: "Freight is required" };
    // }
    // if (
    //   (formData.rateType.value == "Kg" || formData.rateType.value == "Case") &&
    //   (!formData.rate || formData.rate <= 0)
    // ) {
    //   errors.rate = {
    //     invalid: true,
    //     message: "Rate is required ",
    //   };
    // }
  
    let validationErrors = false;
    for (const key in errors) {
      if (errors[key].invalid === true) {
        validationErrors = true;
      }
    }
    if (validationErrors) {
      setHasErrors(true);
    } else {
      setHasErrors(false);
    }
    return errors;
  };

  const autocompleteChangeListener = (e, option, name) => {
    
    setTransactionDetail((currState) => {
      return {
        ...currState,
        [name]: option,
        description: option?.articles_name || currState.description,
      };
    });
    if (option) {
      setLorryReceipt((prevLorryReceipt) => {
        return {
          ...prevLorryReceipt,
          selectedArticle: option,
        };
      });
    }
  };


  useEffect(() => {
    const rateType = transactionDetail.rateType?.value;
  console.log("lorryReceipt",lorryReceipt)
    // Check if in edit mode
    if (isEditMode) {
      // If rateType is "Kg" or "Case", update the rate and hamali rate from lorryReceipt
      if (rateType === "Kg" || rateType === "Case") {
        setTransactionDetail((prevState) => ({
          ...prevState,
          rate: transactionDetail.rate,
          hamalirate: transactionDetail.hamalirate,
        }));
      }
      // Also handle the case when rateType is "Fixed" in edit mode
      else if (rateType === "Fixed") {
        setTransactionDetail((prevState) => ({
          ...prevState,
          rate: "",
          hamalirate: "",
        }));
      }
    } else {
      // Non-edit mode
      if (rateType === "Kg" || rateType === "Case") {
        setTransactionDetail((prevState) => ({
          ...prevState,
          rate: lorryReceipt.rate,
          hamalirate: lorryReceipt.HamaliRate,
        }));
      }
      // Handle "Fixed" in non-edit mode
      else if (rateType === "Fixed") {
        setTransactionDetail((prevState) => ({
          ...prevState,
          rate: "",
          hamalirate: "",
        }));
      }
    }
  }, [lorryReceipt.rate, lorryReceipt.HamaliRate, transactionDetail.rateType, isEditMode]);
  
  

  return (
    <div>
      {loading && <LoadingSpinner />}
      <form
        id="transactionDetailsForm"
        onSubmit={submitHandler}
        className="mb20"
      >
        <Grid container spacing={2}>
          <Grid item xs={2}>
            <FormControl
              fullWidth
              size="small"
              error={formErrors.article.invalid}
            >
              <Autocomplete
                id="Article"
                name="Article"
                autoHighlight
                size="small"
                options={articles}
                getOptionLabel={(option) => option.articles_name} 
                value={transactionDetail.article}
                onChange={(e, value) => autocompleteChangeListener(e, value, "article")}
                filterOptions={(options, { inputValue }) =>
                  options.filter((option) =>
                    option.articles_name.toLowerCase().includes(inputValue.toLowerCase())
                  )
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Article"
                    error={formErrors.article.invalid}
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.articles_id}>
                    {option.articles_name}
                  </li>
                )}
              />

              {formErrors.article.invalid && (
                <FormHelperText>{formErrors.article.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={1.4}>
            <FormControl fullWidth error={formErrors.articleNo.invalid}>
              <TextField
                size="small"
                variant="outlined"
                label="No of articles"
                value={transactionDetail.articleNo || ""}
                error={formErrors.articleNo.invalid}
                onChange={inputChangeHandler}
                onInput={validateNumber}
                name="articleNo"
                id="articleNo"
              />
              {formErrors.articleNo.invalid && (
                <FormHelperText>{formErrors.articleNo.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={1.4}>
            <FormControl fullWidth>
              <TextField
                size="small"
                variant="outlined"
                label="Description"
                value={transactionDetail.description}
                onChange={inputChangeHandler}
                name="description"
                id="description"
              />
            </FormControl>
          </Grid>
          {/* <Grid item xs={1.4}>
            <FormControl fullWidth error={formErrors.weight.invalid}>
              <TextField
                size="small"
                variant="outlined"
                label="Weight"
                value={transactionDetail.weight || ""}
                error={formErrors.weight.invalid}
                onChange={inputChangeHandler}
                onInput={validateNumber}
                name="weight"
                id="weight"
              />
              {formErrors.weight.invalid && (
                <FormHelperText>{formErrors.weight.message}</FormHelperText>
              )}
            </FormControl>
          </Grid> */}
          <Grid item xs={1.4}>
            <FormControl fullWidth error={formErrors.chargeWeight.invalid}>
              <TextField
                size="small"
                variant="outlined"
                label="Weight"
                value={transactionDetail.chargeWeight || ""}
                error={formErrors.chargeWeight.invalid}
                onChange={inputChangeHandler}
                onInput={validateNumber}
                name="chargeWeight"
                id="chargeWeight"
              />
              {formErrors.chargeWeight.invalid && (
                <FormHelperText>
                  {formErrors.chargeWeight.message}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={1.4}>
            <FormControl
              fullWidth
              size="small"
              error={formErrors.rateType.invalid}
            >
              <Autocomplete
                autoSelect
                size="small"
                name="rateType"
                id="rateType"
                options={RATE_TYPES}
                value={transactionDetail.rateType}
                onChange={(e, value) =>
                  autocompleteChangeListener(e, value, "rateType")
                }
                openOnFocus
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Rate type"
                    error={formErrors.rateType.invalid}
                    fullWidth
                  />
                )}
              />
              {formErrors.rateType.invalid && (
                <FormHelperText>{formErrors.rateType.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          {user.usertype?.toLowerCase() !== "clientuser" && (
          <Grid item xs={1.4}>
            <FormControl fullWidth error={formErrors.rate.invalid}>
              <TextField
                size="small"
                variant="outlined"
                label="Rate"
                value={transactionDetail.rate || ""}
                error={formErrors.rate.invalid}
                onChange={inputChangeHandler}
                onInput={validateNumber}
                name="rate"
                id="rate"
                disabled={transactionDetail.rateType?.value === "Fixed"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">&#8377;</InputAdornment>
                  ),
                }}
              />
              {formErrors.rate.invalid && (
                <FormHelperText>{formErrors.rate.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          )}
          {user.usertype?.toLowerCase() !== "clientuser" && (
          <Grid item xs={1.4}>
            <FormControl fullWidth error={formErrors.hamalirate.invalid}>
              <TextField
                size="small"
                variant="outlined"
                label="Hamali Rate"
                value={transactionDetail.hamalirate || ""}
                error={formErrors.hamalirate.invalid}
                onChange={inputChangeHandler}
                onInput={validateNumber}
                name="hamalirate"
                id="hamalirate"
                disabled={transactionDetail.rateType?.value === "Fixed"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">&#8377;</InputAdornment>
                  ),
                }}
              />
              {formErrors.rate.invalid && (
                <FormHelperText>{formErrors.hamalirate.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          )}
          {user.usertype?.toLowerCase() !== "clientuser" && (
          <Grid item xs={1.4}>
            <FormControl fullWidth error={formErrors.freight.invalid}>
              <TextField
                size="small"
                variant="outlined"
                label="Freight"
                value={transactionDetail.freight || ""}
                error={formErrors.freight.invalid}
                name="freight"
                id="freight"
                InputProps={{
                  // readOnly: transactionDetail.rateType?.value !== "Fixed",
                  startAdornment: (
                    <InputAdornment position="start">&#8377;</InputAdornment>
                  ),
                }}
                
                onChange={inputChangeHandler}
                onInput={validateNumber}
              />
              {formErrors.freight.invalid && (
                <FormHelperText>{formErrors.freight.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          )}
        </Grid>
        <div className="right" style={{ paddingTop: "10px" }}>
          <Button
            variant="contained"
            size="medium"
            type="submit"
            color="primary"
            form="transactionDetailsForm"
            className="ml6"
          >
            {isEditMode ? "Update" : "Add"}
          </Button>
          {/* <Button
            variant="outlined"
            size="medium"
            onClick={resetButtonHandler}
            className="ml6"
          >
            Reset
          </Button> */}
        </div>
      </form>
      <DataGrid
        sx={{ backgroundColor: "primary.contrastText" }}
        autoHeight
        density="compact"
        getRowId={(row) => row.id || row._id}
        rows={lorryReceipt.transactions}
        columns={filteredColumns}
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
    </div>
  );
};

export default TransactionDetails;
