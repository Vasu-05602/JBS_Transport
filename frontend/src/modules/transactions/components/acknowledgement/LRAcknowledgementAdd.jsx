import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Divider,
  IconButton,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllLRAck,
  getChallanAck,
  getLRAck,
  selectIsLoading,
  updateLorryReceiptAck,
  updateMultiLorryReceiptAck,
} from "./slice/acknowledgeSlice";
import BarcodeReader from "react-barcode-reader/lib/index";
import { DataGrid } from "@mui/x-data-grid";
import { getFormattedDate } from "../../../../services/utils";
import DeleteIcon from "@mui/icons-material/Delete";

const initialState = {
  lrNo: null,
  deliveryDate: new Date(),
};

const initialErrorState = {
  lrNo: {
    invalid: false,
    message: "",
  },
  deliveryDate: {
    invalid: false,
    message: "",
  },
  lrList: {
    invalid: false,
    message: "",
  },
};

const LRAcknowledgementAdd = () => {
  const isLoading = useSelector(selectIsLoading);
  const { state } = useLocation();
  const [lorryReceipt, setLorryReceipt] = useState(initialState);
  const [lorryReceipts, setLorryReceipts] = useState([]);
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [getUpdatedLR, setGetUpdatedLR] = useState(true);
  const [lrNo, setLrNo] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [scanList, setScanList] = useState([]);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  let inputRef = null;
  const goToLRAcknowledgement = useCallback(() => {
    navigate("/transactions/lrAcknowledgement");
  }, [navigate]);

  useEffect(() => {
    // inputRef.focus?.();
    if (getUpdatedLR || lrNo) {
      let query = {};
      if (state) {
        query = { branch: state, search: lrNo };
      }

      dispatch(getAllLRAck(query))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setLorryReceipts(payload?.data);
            setGetUpdatedLR(false);
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [getUpdatedLR, lrNo]);

  const backButtonHandler = () => {
    goToLRAcknowledgement();
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(scanList)) {
      const list = scanList.map((lorryReceipt) => ({
        _id: lorryReceipt._id,
        deliveryDate: lorryReceipt.deliveryDate,
      }));
      dispatch(updateMultiLorryReceiptAck(list))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setFormErrors(initialErrorState);
            setLorryReceipt(initialState);
            setScanList([]);
            setChallanNo("");
            setLrNo("");
            setGetUpdatedLR(true);
            // inputRef?.focus?.();
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  // const onSelect = (e, value) => {
  //   const option = lorryReceipts?.find?.(
  //     ({ label }) =>
  //       value?.toLowerCase?.()?.trim?.() === label?.toLowerCase?.()?.trim?.()
  //   );
  //   if (option) {
  //     if (!lorryReceipt.isPrevented) {
  //       e.preventDefault();
  //       e.stopPropagation();
  //     }
  //     setLorryReceipt((currState) => {
  //       return {
  //         ...currState,
  //         lrNo: option,
  //         isPrevented: true,
  //       };
  //     });
  //     if (option._id && !challanNo) {
  //       dispatch(getChallanAck(option._id))
  //         .then(({ payload = {} }) => {
  //           setChallanNo(payload?.data?.lsNo || "");
  //         })
  //         .catch((error) => {
  //           setHttpError(error.message);
  //         });
  //     }
  //   }
  // };

  const handleError = (err) => {
    console?.err(err);
  };

  const handleScan = (result) => {
    if (result) {
      dispatch(getLRAck(result))
        .then(({ payload = {} }) => {
          setChallanNo(payload?.data || "");
          if (payload?.data) {
            setLorryReceipt((currState) => {
              onAdd(
                {
                  ...currState,
                  lrNo: payload?.data,
                },
                payload?.data
              );
              return {
                ...currState,
                lrNo: payload?.data,
              };
            });
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };

    // if (!formData.deliveryDate) {
    //   errors.deliveryDate = {
    //     invalid: true,
    //     message: "Delivery date is required",
    //   };
    // }
    // if (!formData.lrNo) {
    //   errors.lrNo = {
    //     invalid: true,
    //     message: "LR no is required",
    //   };
    // }

    // let validationErrors = false;
    // for (const key in errors) {
    //   if (errors[key].invalid === true) {
    //     validationErrors = true;
    //   }
    // }
    if (!formData?.length) {
      errors.lrList = {
        invalid: true,
        message: "Please select at least 1 LR.",
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
    setLorryReceipt((currState) => {
      return {
        ...currState,
        [name]: new Date(date),
      };
    });
  };

  const clearDate = (name) => {
    setLorryReceipt((currState) => {
      return {
        ...currState,
        [name]: null,
      };
    });
  };

  const onAdd = (_lorryReceipt = lorryReceipt, _challanNo = challanNo) => {
    if (_lorryReceipt?.lrNo && lorryReceipt.deliveryDate) {
      setScanList((prevState) => {
        if (!prevState.some(({ lrNo }) => lrNo === _lorryReceipt?.lrNo.lrNo)) {
          return [
            ...prevState,
            {
              ..._lorryReceipt.lrNo,
              deliveryDate: _lorryReceipt.deliveryDate,
              lsNo: _challanNo?.lsNo,
              vehicleNo: _challanNo?.vehicleNo,
            },
          ];
        }
        return prevState;
      });
      setLorryReceipt(initialState);
      setChallanNo("");
    }
  };

  const autocompleteChangeListener = (e, option, name) => {
    e.preventDefault();
    setLorryReceipt((currState) => {
      return {
        ...currState,
        [name]: option,
      };
    });
    if (option._id) {
      dispatch(getChallanAck(option._id))
        .then(({ payload = {} }) => {
          setChallanNo(payload?.data || "");
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const onRemove = (id) => {
    setScanList((prevState) => prevState.filter((lr) => lr._id !== id));
  };

  const columns = [
    { field: "_id", headerName: "Id" },
    {
      field: "lrNo",
      headerName: "LR no.",
      flex: 1,
    },

    {
      field: "lsNo",
      headerName: "Challan No",
      flex: 1,
    },
    {
      field: "vehicleNo",
      headerName: "Vehicle No",
      flex: 1,
    },
    {
      field: "deliveryDate",
      headerName: "Delivery Date",
      flex: 1,
      renderCell: ({ value }) => getFormattedDate(value),
    },
    {
      field: "",
      headerName: "Action",
      flex: 1,
      renderCell: (params) => {
        const triggerDelete = (e) => {
          e.stopPropagation();
          onRemove(params.row._id);
        };

        return (
          <IconButton size="small" onClick={triggerDelete} color="error">
            <DeleteIcon />
          </IconButton>
        );
      },
    },
  ];

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className="inner-wrap">
        <h1 className="pageHead">Update a lorry receipt acknowledgement</h1>
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
        <form action="" onSubmit={submitHandler}>
          <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
            <div className="grid grid-6-col">
              <div className="grid-item">
                <FormControl
                  fullWidth
                  size="small"
                  error={formErrors.lrNo.invalid}
                >
                  <AutoComplete
                    disablePortal
                    size="small"
                    name="lrNo"
                    sortKey="lrNo"
                    options={lorryReceipts}
                    value={lorryReceipt.lrNo}
                    getOptionLabel={(branch) => branch.lrNo || ""}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "lrNo")
                    }
                    renderOption={(props, option) => (
                      <li {...props} key={option._id}>
                        {option.lrNo}
                      </li>
                    )}
                    openOnFocus
                    disableClearable
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        inputProps={{
                          ...params.inputProps,
                          // onKeyDown: (e) => {
                          //   if (e.key === "Enter") {
                          //     onSelect(e, e.target.value);
                          //     e.stopPropagation();
                          //   }
                          // },
                        }}
                        onChange={(e) => setLrNo(e.target.value)}
                        label="Lorry receipt no"
                        error={formErrors.lrNo.invalid}
                        fullWidth
                        inputRef={(input) => {
                          inputRef = input;
                        }}
                      />
                    )}
                  />
                  {formErrors.lrNo.invalid && (
                    <FormHelperText>{formErrors.lrNo.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Challan no."
                    value={challanNo?.lsNo || ""}
                    name="lsNo"
                    id="lsNo"
                    inputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <div className="bl_date">
                  <FormControl
                    fullWidth
                    error={formErrors.deliveryDate.invalid}
                  >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        error={formErrors.deliveryDate.invalid}
                        label="Delivery date"
                        inputFormat="DD/MM/YYYY"
                        value={lorryReceipt.deliveryDate}
                        onChange={dateInputChangeHandler.bind(
                          null,
                          "deliveryDate"
                        )}
                        inputProps={{
                          readOnly: true,
                        }}
                        renderInput={(params) => (
                          <TextField
                            name="deliveryDate"
                            size="small"
                            {...params}
                            error={formErrors.deliveryDate.invalid}
                          />
                        )}
                      />
                    </LocalizationProvider>
                    {formErrors.deliveryDate.invalid && (
                      <FormHelperText>
                        {formErrors.deliveryDate.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </div>
              </div>
              <div className="grid-item">
                <Button
                  variant="text"
                  size="medium"
                  className="clearHandler"
                  onClick={clearDate.bind(null, "deliveryDate")}
                >
                  Clear
                </Button>
                <Button
                  variant="text"
                  size="medium"
                  className="clearHandler"
                  onClick={() => onAdd()}
                >
                  Add
                </Button>
              </div>
            </div>
            <Divider sx={{ margin: "20px 0" }} />
            {formErrors.lrList.invalid && (
              <p className="error">{formErrors.lrList.message}</p>
            )}
            <DataGrid
              sx={{ backgroundColor: "primary.contrastText" }}
              autoHeight
              density="compact"
              getRowId={(row) => row._id || Math.random()}
              rows={scanList}
              columns={columns}
              initialState={{
                ...columns,
                columns: {
                  columnVisibilityModel: {
                    _id: false,
                  },
                },
              }}
              pageSize={100}
              rowsPerPageOptions={[100]}
              disableSelectionOnClick
            />
            <div className="right">
              <Button
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
            <BarcodeReader onError={handleError} onScan={handleScan} />
          </Paper>
        </form>
      </div>
    </>
  );
};

export default LRAcknowledgementAdd;
