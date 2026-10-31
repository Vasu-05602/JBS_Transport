import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Autocomplete,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { Alert, Stack } from "@mui/material";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import {
  createRateMaster,
  getArticles,
  getCustomersForAddRateMaster,
  getPlaces,
  selectIsLoading,
} from "./slice/rateMasterSlice";
import { validateNumber } from "../../../../services/utils";

const initialErrorState = {
  customer: {
    invalid: false,
    message: "",
  },
  rates: {
    invalid: false,
    message: "",
  },
  hamaliRate: {
    invalid: false,
    message: "",
  },
  rate: {
    invalid: false,
    message: "",
  },
  article: {
    invalid: false,
    message: "",
  },
  station: {
    invalid: false,
    message: "",
  },
};

const AddRateMaster = () => {
  const initialState = {
    customer: null,
    customerName: "",
    customerCity:'',
    rates: [],
    article: "",
    station: null,
    articleId: null,
    stationId: null,
    rate: "",
    hamaliRate:"",
    ddCharges: "",
    LRCharges:""
  };
  const columns = [
    { field: "_id", headerName: "Id" },
    { field: "article", headerName: "Article", flex: 1 },
    { field: "stationName", headerName: "Station", flex: 1 },
    { field: "rate", headerName: "Rate", flex: 1 },
    { field: "hamaliRate", headerName: "Hamali Rate", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      sortable: false,
      flex: 1,
      renderCell: (params) => {
        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteRate(params.row._id);
        };

        return (
          <>
            <IconButton size="small" onClick={triggerDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </>
        );
      },
    },
  ];
  console.log(columns)
  const [rateList, setRateList] = useState(initialState);
  const [customers, setCustomers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [articles, setArticles] = useState([]);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const isLoading = useSelector(selectIsLoading);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const goToRateMasterList = useCallback(() => {
    navigate("/master/rateMasterList");
  }, [navigate]);

  const deleteRate = (id) => {
    const updatedRates = rateList.rates?.filter?.((rate) => rate._id !== id);
    setRateList((currState) => {
      return {
        ...currState,
        rates: updatedRates,
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const placesResponse = await dispatch(getPlaces());
        const placesPayload = placesResponse.payload || {};
        const placesMessage = placesPayload.data?.message;

        if (placesMessage) {
          setHttpError(placesMessage);
        } else {
          setHttpError("");
          const updatedPlaces = placesPayload.data?.map?.((place) => ({
            ...place,
            label: place.place_name,
            value: place.place_id,
          })) || [];

          setPlaces(updatedPlaces);

        }
      } catch (error) {
        setHttpError(error.message);
      }

      try {
        const articlesResponse = await dispatch(getArticles());
        const articlesPayload = articlesResponse.payload || {};
        const articlesMessage = articlesPayload.data?.message;

        if (articlesMessage) {
          setHttpError(articlesMessage);
        } else {
          setHttpError("");
          const updatedArticles = articlesPayload.data?.map?.((article) => ({
            ...article,
            label: article.articles_name,
            value: article.articles_id,
          })) || [];

          setArticles(updatedArticles);

        }
      } catch (error) {
        setHttpError(error.message);
      }

      fetchCustomers("");
    };

    fetchData();
  }, []);


  const fetchCustomers = (str) => {
    const search = str.trim?.();
    if (search?.length > 2 || !search) {
      dispatch(getCustomersForAddRateMaster(search))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
console.log('payload',payload)
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            const updatedResponse = payload?.data?.map?.((customer) => {
              return {
                ...customer,
                label: customer.customer_name,
                value: customer.customer_id,
                city: customer.city, 
              };
            });

            setCustomers(updatedResponse);
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const consignorChange = (event, newValue) => {

    fetchCustomers(newValue);
  };



  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setRateList((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(rateList)) {
      const updatedRateList = {
        ...rateList,
        customer: {
          id: rateList.customer.customer_id,
          name: rateList.customer.customer_name,
        },
      };

     
      

      updatedRateList.rates?.forEach((rate) => {
        rate.station = rate.station.id;
        delete rate._id;
      });

      dispatch(createRateMaster(updatedRateList))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Added Successfully")) {
            setHttpError(message);
            goToRateMasterList();
          } else {
            setHttpError("");
            setRateList(initialState);
            goToRateMasterList();
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };


  const backButtonHandler = () => {
    goToRateMasterList();
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.customer) {
      errors.customer = { invalid: true, message: "Customer is required" };
    }
  
    if (!formData.rates?.length) {
      errors.rates = {
        invalid: true,
        message: "At least one entry is required",
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

  console.log("Articles:", articles);

  const articleChangeListener = (e, selectedArticle) => {
    setRateList((currState) => {
      const newState = {
        ...currState,
        article: selectedArticle ? selectedArticle.label : null,
        articleId: selectedArticle ? selectedArticle.articles_id : null, 
      };
      return newState;
    });
  };




  const autocompleteChangeListener = (e, selectedStation, type) => {
    setRateList((currState) => {
      const newState = {
        ...currState,
        [type]: selectedStation ? selectedStation.label : null, 
        [`${type}Id`]: selectedStation ? selectedStation.place_id : null, 
      };
      console.log("Previous State:", currState);
      console.log("New State:", newState);
      return newState;
    });
  };

  const handleCustomerChange = (event, newValue) => {
    console.log("Selected customer:", newValue);
    setRateList((prev) => ({
      ...prev,
      customer: newValue ? { ...newValue, id: newValue.id } : null,
         customerCity: newValue ? newValue.city : ""
    }));
  };
  const addButtonHandler = (e) => {
    e.preventDefault();
    const errors = { ...initialErrorState };

    console.log("Initial rateList:", rateList);

    // Validate required fields
    if (!rateList.customer) {
      errors.customer = { invalid: true, message: "Customer is required" };
    } else {
      errors.customer = { invalid: false, message: "" };
    }
    if (!rateList.station) {
      errors.station = { invalid: true, message: "Station is required" };
    }else {
      errors.article = { invalid: false, message: "" };
    }

    if (!rateList.article) {
      errors.article = { invalid: true, message: "Article is required" };
    } else {
      errors.article = { invalid: false, message: "" };
    }

    if (!rateList.station) {
      errors.station = { invalid: true, message: "Station is required" };
    } else {
      errors.station = { invalid: false, message: "" };
    }

    if (!rateList.rate || rateList.rate < 0) {
      errors.rate = { invalid: true, message: "Rate should be greater than 0" };
    } else {
      errors.rate = { invalid: false, message: "" };
    }

    console.log("Validation errors:", errors);

    let validationErrors = false;
    for (const key in errors) {
      if (errors[key].invalid === true) {
        validationErrors = true;
      }
    }

    if (validationErrors) {
      setFormErrors(errors);
      console.log("Form errors set:", errors);
    } else {
      const rateListItem = {
        _id: Math.random(), // Generate a unique ID
        article: rateList.article || "", // Article name
        articleId: rateList.articleId || null, // Article ID
        station: rateList.station,
        stationName: rateList.station || "", // Station name
        stationId: rateList.stationId || null, // Use the new stationId
        rate: rateList.rate,
        hamaliRate: rateList.hamaliRate,
      };


      console.log("RateList item to add:", rateListItem);

      if (
        rateList.rates?.some?.(
          ({ stationId, articleId }) =>
            stationId === rateListItem.stationId && articleId === rateListItem.articleId
        )
      ) {
        setHttpError("Already item exists.");
        console.log("HTTP error set: Already item exists.");
      } else {
        setRateList((currState) => {
          console.log("Updating rate list...");
          return {
            ...currState,
            rates: [...currState.rates, rateListItem],
            article: "",
            articleId: null,
            station: null,
            rate: "",
            hamaliRate: "",
          };
        });
        setHttpError("");
        console.log("Rate list updated successfully.");
      }
    }
  };


  const handleChange = (event) => {
    const { name, value } = event.target;
    setRateList((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className="inner-wrap">
        <h1 className="pageHead">Add rate master</h1>
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
        {!isLoading && (
          <div>
            <form action="" onSubmit={submitHandler}>
              <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
                <div className="grid grid-6-col">
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.customer.invalid}>
                      <Autocomplete
                        id="Customer"
                        options={customers || []}
                        getOptionLabel={(option) => option.label}
                        value={rateList.customer || null}
                        onChange={handleCustomerChange}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            name="Customer"
                            variant="outlined"
                            label="Customer"
                            size="small"
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
                  <FormControl fullWidth>
                    <TextField
                      variant="outlined"
                      label="From"
                      value={rateList.customerCity || ""}
                      size="small"
                      disabled  
                    />
                  </FormControl>
                </div>
                <div className="grid-item">
                  <FormControl fullWidth>
                    <TextField
                      variant="outlined"
                      label="LR Charges"
                      name="LRCharges"
                      value={rateList.LRCharges || ""}
                      onChange={handleChange} 
                      size="small"
               
                    />
                  </FormControl>
                </div>
                </div>
                <Divider className="mb10" />
                <div className="grid grid-6-col">
                <FormControl fullWidth error={formErrors.article.invalid}>
                  <Autocomplete
                    id="Article"
                    options={articles || []}
                    getOptionLabel={(option) => option.label}
                    value={articles.find(article => article.label === rateList.article) || null}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="Article"
                        variant="outlined"
                        label="Article"
                        size="small"
                        fullWidth
                      />
                    )}
                    onChange={(e, selectedArticle) => {
                      articleChangeListener(e, selectedArticle);
                    }}
                  />
                      {formErrors.article.invalid && (
                        <FormHelperText>
                          {formErrors.article.message}
                        </FormHelperText>
                      )}
                    </FormControl>

                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.station.invalid}>
                      <Autocomplete
                        id="Station"
                        options={places || []}
                        getOptionLabel={(option) => option.label}
                        value={places.find(place => place.label === rateList.station) || null}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            name="Station"
                            variant="outlined"
                            label="Station"
                            size="small"
                            fullWidth
                          />
                        )}
                        onChange={(e, selectedStation) => {
                          console.log("Selected Station:", selectedStation);
                          autocompleteChangeListener(e, selectedStation, "station");
                        }}
                      />
                      {formErrors.station.invalid && (
                        <FormHelperText>
                          {formErrors.station.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.rate.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Rate"
                        value={rateList.rate || ""}
                        onChange={inputChangeHandler}
                        onInput={validateNumber}
                        name="rate"
                        id="rate"
                        error={formErrors.rate.invalid}
                      />
                      {formErrors.rate.invalid && (
                        <FormHelperText>
                          {formErrors.rate.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.hamaliRate.invalid}>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="Hamali Rate"
                        value={rateList.hamaliRate || ""}
                        onChange={inputChangeHandler}
                        onInput={validateNumber}
                        name="hamaliRate"
                        id="rate"
                        error={formErrors.hamaliRate.invalid}
                      />
                      {formErrors.hamaliRate.invalid && (
                        <FormHelperText>
                          {formErrors.hamaliRate.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </div>
                  {/* <div className="grid-item">
                    <FormControl fullWidth>
                      <TextField
                        size="small"
                        variant="outlined"
                        label="DD charges"
                        value={rateList.ddCharges || ""}
                        onChange={inputChangeHandler}
                        onInput={validateNumber}
                        name="ddCharges"
                        id="ddCharges"
                      />
                    </FormControl>
                  </div> */}
                  <div className="grid-item">
                    <Button
                      type="button"
                      variant="outlined"
                      size="medium"
                      onClick={addButtonHandler}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </Paper>
              <div style={{ width: "100%", marginBottom: "20px" }}>
                {formErrors.rates.invalid && (
                  <div>
                    <FormHelperText className="error">
                      {formErrors.rates.message}
                    </FormHelperText>
                  </div>
                )}
                <DataGrid
                  sx={{ backgroundColor: "primary.contrastText" }}
                  autoHeight
                  density="compact"
                  getRowId={(row) => row?._id || Math.random()}
                  rows={rateList.rates}
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
              </div>
              <div className="right">
                <Button
                  type="button"
                  variant="outlined"
                  size="medium"
                  onClick={backButtonHandler}
                >
                  Back
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
          </div>
        )}
      </div>
    </>
  );
};

export default AddRateMaster;
