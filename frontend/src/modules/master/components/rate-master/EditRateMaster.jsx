import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Divider,
  Autocomplete,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { Alert, Stack } from "@mui/material";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import {
  getArticles,
  getCustomersForRateMaster,
  getPlaces,
  getRateMaster,
  selectIsLoading,
  updateRateMaster,
} from "./slice/rateMasterSlice";
import { validateNumber } from "../../../../services/utils";

const initialState = {
  customer: null,
  customerName: "",
  customerCity:"",
  rates: [],
  article: "",
  station: null,
  articleId: null,
  stationId: null,
  rate: "",
  hamaliRate:'',
  ddCharges: "",
  LRCharges:""
};

const initialErrorState = {
  customer: {
    invalid: false,
    message: "",
  },
  rates: {
    invalid: false,
    message: "",
  },
  rate: {
    invalid: false,
    message: "",
  },
  hamaliRate: {
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

const EditRateMaster = () => {
  const columns = [
    { field: "id", headerName: "Id" },
    { field: "articles_name", headerName: "Article", flex: 1 },
    { field: "from_place_name", headerName: "Station", flex: 1 },
    { field: "rate", headerName: "Rate", flex: 1 },
    { field: "hamaliRate", headerName: "Hamali Rate", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      sortable: false,
      flex: 1,
      renderCell: (params) => {
        const triggerEdit = (e) => {
          console.log('hiiiii',params.row.id)
          e.stopPropagation();
          setEditId(params.row.id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteRate(params.row.id);
        };
        return (
          <>
            <IconButton size="small" onClick={triggerEdit} color="primary">
              <EditIcon />
            </IconButton>

            <IconButton size="small" onClick={triggerDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </>
        );
      },
    },
  ];
  const dispatch = useDispatch();

  const location = useLocation();
  const { rateMasterId } = location.state;
  const [rateList, setRateList] = useState(initialState);
  const [places, setPlaces] = useState([]);
  const [articles, setArticles] = useState([]);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [editId, setEditId] = useState("");
  const isLoading = useSelector(selectIsLoading);
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  const goToRateMasterList = useCallback(() => {
    navigate("/master/rateMasterList");
  }, [navigate]);

  const deleteRate = (id) => {
    const updatedRates = rateList.rates?.filter?.((rate) => rate.id !== id);
    setRateList((currState) => {
      return {
        ...currState,
        rates: updatedRates,
      };
    });
  };

  useEffect(() => {
    if (rateMasterId && places?.length) {
      dispatch(getRateMaster(rateMasterId))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          console.log('payload?.data',payload?.data);
  
          if (message) {
            setHttpError(message);
          } else {
            const rates = payload?.data?.map((rate) => {
              const station = places?.find(
                (place) =>
                  place._id === rate?.station || place.name === rate?.stationName
              );
  
              return {
                ...rate,
                station: station || rate?.station,
                stationName: station?.name || rate?.stationName,
              };
            });
            const lrCharges = payload?.data?.[0]?.LRCharges || null;
            const customerIds = payload.data.map(rate => rate.customerid);
            const customersFound = customers.filter(c => customerIds.includes(c.value.toString()));
            const customer = customersFound.length > 0 ? customersFound[0] : null;
            const customerId = customer ? customer._id : null;
  
            setRateList((currState) => ({
              ...currState,
              ...payload.data,
              rates: rates,
              customer: customer || null, 
              customerId: customerId, 
               LRCharges: lrCharges, 
            }));
            if (customer) {
              handleCustomerChange(null, customer); 
            }
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [rateMasterId, places, customers]);
  
  

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const { payload = {} } = await dispatch(getPlaces());
        const { message, data } = payload;


        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          const updatedPlaces = data.map((place) => ({
            ...place,
            label: place.place_name,
            value: place.place_id,
          }));
          setPlaces(updatedPlaces);
   
        }
      } catch (error) {
        setHttpError(error.message);
      }
    };

    const fetchArticles = async () => {
      try {
        const { payload = {} } = await dispatch(getArticles());
        const { message, data } = payload;


        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          const updatedArticles = data.map((article) => ({
            ...article,
            label: article.articles_name,
            value: article.articles_id,
          }));
          setArticles(updatedArticles);
   
        }
      } catch (error) {
        setHttpError(error.message);
      }
    };

    const fetchCustomers = (str = "") => {
      const search = str.trim(); // Safe to call trim now
      if (search.length > 2 || !search) {
        dispatch(getCustomersForRateMaster(search))
          .then(({ payload = {} }) => {
            const { message } = payload?.data || {};

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

    fetchCustomers("");
    fetchPlaces();
    fetchArticles();
  }, []);



  useEffect(() => {
    console.log('id',editId)
    if (editId) {
 
      const filterEdited = rateList.rates?.filter((rate) => {
        return rate.id === editId || rate._id === editId; 
      });
      if (filterEdited?.length) {
        const editedItem = filterEdited[0]; 
        console.log('editedItem',editedItem)
        const station = places?.find((place) => place.place_id == editedItem.from_id || place.place_id == editedItem.stationId);
        
        const article = articles?.find((article) => 
          article.articles_id == editedItem.article_id || article.articles_id == editedItem.articleId
        );
        
        setRateList((currState) => ({
          ...currState,
       id:editedItem.id,
          article: article?.articles_name || "",
          articleId: article?.articles_id || null,
          station: station?.place_name || "",
          stationId: station?.place_id || null,
          stationName: station?.place_name || "Unknown Station",
          rate: editedItem.rate || currState.rate,
          hamaliRate: editedItem.hamaliRate,
        
        }));
      }
    }
  }, [editId, places, articles]);
  console.log(rateList.rates)
  





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
      console.log(rateList)
      const updatedRateList = {
        id: rateMasterId,
        rates: rateList.rates.map(rate => ({
          ...rate,
          customerId: rate.customer_id, 
 
        })),
        LRCharges: rate.LRCharges || rateList.LRCharges,
      };
      dispatch(updateRateMaster(updatedRateList))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message && message.includes("Updated Successfully")){
            setHttpError("");  
            setRateList(initialState);
            goToRateMasterList();
          } else {
            setHttpError(message || "An unknown error occurred"); 
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

  const handleCustomerChange = (event, newValue) => {
    setRateList((prev) => ({
      ...prev,
      customer: newValue ? { ...newValue, id: newValue.id } : null,
       customerCity: newValue ? newValue.city : ""
    }));
  };

  const articleChangeListener = (e, selectedArticle) => {
    setRateList((currState) => {
      const newState = {
        ...currState,
        article: selectedArticle ? selectedArticle.label : "", 
        articleId: selectedArticle ? selectedArticle.articles_id : null, 
      };
      return newState;
    });
  };
  

  const autocompleteChangeListener = (e, selectedStation, type) => {
    setRateList((currState) => {
      const newState = {
        ...currState,
        station: selectedStation ? selectedStation.label : "", 
        stationId: selectedStation ? selectedStation.place_id : null, 

      };
      return newState;
    });
  };
  

  const addUpdateButtonHandler = (e) => {
    e.preventDefault();
    const errors = { ...initialErrorState };
    errors.article = { 
      invalid: !rateList.article, 
      message: !rateList.article ? "Article is required" : "" 
    };
    errors.rate = { 
      invalid: !rateList.rate || rateList.rate < 0, 
      message: (!rateList.rate || rateList.rate < 0) ? "Rate should be greater than 0" : "" 
    };
  
    const validationErrors = Object.values(errors).some(error => error.invalid);
  
    if (validationErrors) {
      setFormErrors(errors);
      return; 
    }
    const newItemId = editId || `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const rateListItem = {
      articles_name: rateList.article || "",
      articleId: rateList.articleId || null,
      from_place_name: rateList.station,
      stationName: rateList.station || "",
      stationId: rateList.stationId || null,
      rate: rateList.rate,
      hamaliRate: rateList.hamaliRate,
      customerId: rateList.customer || null, 
      id: newItemId,
    };
    if (!editId) {
      const exists = rateList.rates?.some(({ station, article }) => 
        station === rateListItem.from_place_name && article === rateListItem.articles_name
      );
  
      if (exists) {
        setHttpError("Item already exists.");
      } else {
        setRateList(currState => ({
          ...currState,
          rates: [...currState.rates, rateListItem],
          article: "",
          station: null,
          rate: "",
          hamaliRate: "",
        }));
        setHttpError("");
      }
    } else {
    
      const filteredList = rateList.rates?.filter(item => !(item.id === editId || item._id === editId));
      console.log(filteredList)
      const exists = filteredList?.some(({ station, article }) => 
        station === rateListItem.from_place_name && article === rateListItem.articles_name
      );
  
      if (exists) {
        setHttpError("Updated item already exists.");
      } else {
        setRateList(currState => ({
          ...currState,
   
          rates: [...filteredList, rateListItem],
          article: "",
          station: null,
          rate: "",
          hamaliRate: "",
        }));
    
        setHttpError("");
        setEditId(null);
      }
    }
  };
  

  
  

  const cancelResetButtonHandler = (e) => {
    e.preventDefault();
    setRateList((currState) => {
      return {
        ...currState,
        article: "",
        station: null,
        rate: "",
        hamaliRate: "",
      };
    });
    setEditId("");
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
        <h1 className="pageHead">Edit rates</h1>
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
                        disabled
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
                  <div className="grid-item">
                    <FormControl fullWidth error={formErrors.article.invalid}>
                      <Autocomplete
                        id="Customer"
                        
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
                  </div>
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
                      onClick={addUpdateButtonHandler}
                    >
                      {editId ? "Update" : "Add"}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      size="medium"
                      className="ml6"
                      onClick={cancelResetButtonHandler}
                    >
                      {editId ? "Cancel" : "Reset"}
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
                  getRowId={(row) => row?.id || Math.random()}
                  rows={rateList.rates}
                  columns={columns}
                  initialState={{
                    ...columns,
                    columns: {
                      columnVisibilityModel: {
                        id: false,
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

export default EditRateMaster;
