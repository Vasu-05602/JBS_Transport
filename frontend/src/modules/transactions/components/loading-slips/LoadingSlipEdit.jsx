import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Divider,
  Autocomplete,
} from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AutoComplete,Dialog, LoadingSpinner } from "../../../../ui-controls";
import { createFilterOptions } from '@mui/material/Autocomplete';
import {
  base64ToObjectURL,
  isSuperAdminOrAdmin,
  validateNumber,
  validatePhoneNumber,
} from "../../../../services/utils";
import FreightDetailsEdit from "./FreightDetailsEdit";
import { useDispatch, useSelector } from "react-redux";
import {
  downloadLoadingSlip,
  getLoadingSlip,
  getLorryReceipts,
  selectIsLoading,
  updateLoadingSlip,
} from "./slice/loadingSlipSlice";
import dayjs from "dayjs";

const initialState = {
  branch: "",
  date: new Date(),
  vehicle: null,
  vehicleNo: "",
  vehicleOwner: "",
  vehicleOwnerAddress: "",
  vehicleOwnerPhone: "",
  driver: null,
  driverName: "",
  licenseNo: "",
  phone: "",
  from: null,
  fromName: "",
  to: null,
  toName: "",
  lrList: [],
  totalFreight: "",
  rent: "",
  advance: "",
  totalPayable: "",
  totalWeight: "",
  currentTime: null,
  reachTime: null,
  paybleAt: null,
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
  vehicle: {
    invalid: false,
    message: "",
  },
  vehicleOwner: {
    invalid: false,
    message: "",
  },
  vehicleOwnerAddress: {
    invalid: false,
    message: "",
  },
  vehicleOwnerPhone: {
    invalid: false,
    message: "",
  },
  driver: {
    invalid: false,
    message: "",
  },
  licenseNo: {
    invalid: false,
    message: "",
  },
  phone: {
    invalid: false,
    message: "",
  },
  from: {
    invalid: false,
    message: "",
  },
  to: {
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
  rent: {
    invalid: false,
    message: "",
  },
  advance: {
    invalid: false,
    message: "",
  },
};

const LoadingSlipEdit = () => {
  const isLoading = useSelector(selectIsLoading);
  const user = useSelector((state) => state.user);
  const { branches, vehicles, suppliers, places, drivers } =
    useSelector(({ loadingslip }) => loadingslip) || {};
  const [inputValue, setInputValue] = useState('');
  const filteredOptions = vehicles.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  const [lsNo, setLsNo] = useState("");
  const [lorryReceipts, setLorryReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlip, setLoadingSlip] = useState({
    ...initialState,
  });
  const [fetchedLoadingSlip, setFetchedLoadingSlip] = useState({
    ...initialState,
  });
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [httpError, setHttpError] = useState("");
  const [lsLrList, setLsLrList] = useState([]);
  const [, setUpdatedLRList] = useState([]);
  const [isLocalMemo, setIsLocalMemo] = useState(false);
  const [selectedLR, setSelectedLR] = useState([]);
  const [searchLr, setSearchLr] = useState("");
  const [lrFilter, setFilter] = useState({ from: "", to: "" });
  const [updatedLR, setUpdatedLR] = useState([]);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const location = useLocation();
  const { lsId } = location.state;

  const goToLoadingSlips = useCallback(() => {
    navigate("/transactions/loadingSlips");
  }, [navigate]);

  const goToLocalMemo = useCallback(() => {
    navigate("/transactions/localMemoList");
  }, [navigate]);

  useEffect(() => {
    if (location.pathname) {
      location.pathname?.endsWith("editLocalMemoLS")
        ? setIsLocalMemo(true)
        : setIsLocalMemo(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (lsId) {
      const branches = !isSuperAdminOrAdmin() ? user.branch || [] : "";
      dispatch(
        getLorryReceipts({
          branches:user.branch,
          search: searchLr,
          lsId,
          ...(lrFilter || {}),
        })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
   
          if (message) {
            setHttpError(message);
          } else {
            const prevCheckedList = updatedLR.filter(({ checked }) => checked);

            const latestList = [
              ...prevCheckedList,
              ...(payload?.data?.filter(
                ({ id }) => !prevCheckedList?.some((lr) => id === lr.id)
              ) || []),
            ];
            setLorryReceipts(latestList);
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  }, [lsId, searchLr, lrFilter]);

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
    if (lsId && vehicles?.length && drivers?.length) {
      dispatch(getLoadingSlip(lsId))
        .then(({ payload = {} }) => {
          const { message,dc_date } = payload?.data || {};

          if (message) {
            setHttpError(message);
          } else {
            setHttpError(""); 
            setFormErrors(initialErrorState); 
            let response = { ...(payload?.data || {}) };
            const vehicleIndex = filteredOptions.find(({ vehicle_id }) => vehicle_id == response.vehicle_id);
            response.vehicle = vehicleIndex;    
            const mappedDrivers = drivers.map((driver) => ({
              id: driver.driver_id,
              name: driver.driver_name,
              licenseno: driver.licenseno,
              mobileno: driver.mobileno,
            }));
            const driverIndex = mappedDrivers.find(({ id }) => id == response.driver_id);
            response.driver = driverIndex;
            const foundPlace = places.find(({ place_id }) => place_id == response.from_loc);
            response.from = foundPlace ? { id: foundPlace.place_id, name: foundPlace.place_name } : null;
            const foundToPlace = places.find(({ place_id }) => place_id == response.to_loc);
            response.to = foundToPlace ? { id: foundToPlace.place_id, name: foundToPlace.place_name } : null;
            response.paybleAt = branches.find(({ branch_id }) => branch_id == response.payble_at);
            response.branch = branches.find(({ branch_id }) => branch_id === response.branch);
            response.remark=response.remarks
            response.totalFreight = response.totalFreight || 0;
            response.rent = response.hire || 0;
            response.advance = response.adv_amt || 0;
            response.totalPayable = response.total || 0;
            response.date = dc_date ? dayjs(dc_date) : null;

            if (response.transectEntries) {
              const lrList = response.transectEntries.map((entry, index) => ({
                  id: entry.lr_id,
                  lrNo: entry.lr_no,
                  date: entry.lr_date,
                  consignorName: entry.consigner_name,
                  from: entry.loc_from_name,
                  to: entry.loc_to_name,
                  weight: entry.total_actual_wt,
                  article: entry.total_no_of_articles,
                  consigneeName: entry.consignee_name,
                  total: entry.total,
                  payType: entry.pay_type,
                  checked: true,
                  index: index + 1,  
              }));
              response.lrList = lrList; 
          }
          
  
            setLoadingSlip(response);
            setFetchedLoadingSlip(response);
            if (response.vehicle) {
              autocompleteChangeListener(null, response.vehicle, "vehicle");
            }
            if (response.driver) {
              autocompleteChangeListener(null, response.driver, "driver");
            }
          }
        })
        .catch((error) => {
          setHttpError(error.message); 
        });
    }
  }, [lsId, vehicles, drivers, places, branches]); 

  useEffect(() => {
    if (loadingSlip.branch && !loadingSlip.paybleAt) {
      setLoadingSlip((currState) => ({
        ...currState,
        paybleAt: currState.branch, 
      }));
    }
  }, [loadingSlip.branch, loadingSlip.paybleAt, setLoadingSlip]);


  useEffect(() => {
    if (lorryReceipts?.length && loadingSlip.lrList?.length) {
      const selectedLRList = lorryReceipts?.map?.((lorryReceipt, index) => {     
        return {
          ...lorryReceipt,
          checked:
            lorryReceipt?.checked ||
            loadingSlip.lrList?.some?.((lr) => {
              return lr.id === lorryReceipt.id;
            }),
          index: index + 1,
        };
      });
      setLsLrList(selectedLRList);
    }
  }, [lorryReceipts, loadingSlip.lrList]);

  const resetButtonHandler = () => {
    setLoadingSlip(fetchedLoadingSlip);
    setHttpError("");
    setFormErrors(initialErrorState);
  };

  const backButtonHandler = () => {
    if (isLocalMemo) {
      goToLocalMemo();
    } else {
      goToLoadingSlips();
    }
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setLoadingSlip((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  const dateChangeHandler = (name, date) => {
    setFilter((currState) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      return {
        ...currState,
        [name]: new Date(date),
        ...(name === "from" ? { to: nextDay } : {}),
      };
    });
  };
  const submitHandler = (e, isSaveAndPrint) => {
  
    e.preventDefault();
    if (!validateForm(loadingSlip)) {
      console.log('loadingSlip',loadingSlip)
      const updatedLoadingSlip = { ...loadingSlip };
      console.log('updatedLoadingSlip',updatedLoadingSlip)
      updatedLoadingSlip.driver = updatedLoadingSlip.driver?.id;
      dispatch(updateLoadingSlip(updatedLoadingSlip))
      .then(
        ({ payload = {} }) => {
          const {message, file ,insertedId} = payload?.data || {};
    
            if (isSaveAndPrint) {
       
              if (insertedId) {
          
                dispatch(
                  downloadLoadingSlip({
                    id: insertedId,
                    email: "",
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
                      setLoadingSlip(initialState);
                    }
                  })
                  .catch((e) => {
                    setHttpError(e.message);
                  });
              }
            } else {
            setHttpError("");
            setFormErrors(initialErrorState);
            setLoadingSlip((prevState) => ({
              ...initialState,
            }));
            }
            if (message) {
          
              setLsNo(message);
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
        });
    }
  };

  const saveAndPrint = (e) => {
    e.preventDefault();
    submitHandler(e, true);
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.branch) {
      errors.branch = { invalid: true, message: "Branch is required" };
    }
    if (!formData.date) {
      errors.date = { invalid: true, message: "Date is required" };
    }
    if (!formData.vehicle) {
      errors.vehicle = { invalid: true, message: "Vehicle is required" };
    }
    // if (!formData.vehicleOwner?.trim?.()) {
    //   errors.vehicleOwner = {
    //     invalid: true,
    //     message: "Vehicle owner is required",
    //   };
    // }
    // if (!formData.vehicleOwnerAddress?.trim?.()) {
    //   errors.vehicleOwnerAddress = {
    //     invalid: true,
    //     message: "Vehicle owner address is required",
    //   };
    // }
    // if (!formData.vehicleOwnerPhone?.trim?.()) {
    //   errors.vehicleOwnerPhone = {
    //     invalid: true,
    //     message: "Owner phone no is required",
    //   };
    // }
    if (!formData.driver) {
      errors.driver = { invalid: true, message: "Driver name is required" };
    }
    // if (!formData.licenseNo?.trim?.()) {
    //   errors.licenseNo = { invalid: true, message: "License no is required" };
    // }
    // if (!formData.phone?.trim?.()) {
    //   errors.phone = {
    //     invalid: true,
    //     message: "Driver's phone no is required",
    //   };
    // }
    // if (
    //   formData.phone &&
    //   formData.phone?.trim?.() &&
    //   !mobileNoRegEx.test(formData.phone)
    // ) {
    //   errors.phone = {
    //     invalid: true,
    //     message: "Phone no should be 10 digits number",
    //   };
    // }
    if (!formData.from) {
      errors.from = { invalid: true, message: "From is required" };
    }
    if (!formData.to) {
      errors.to = { invalid: true, message: "To is required" };
    }
    if (!formData.lrList?.length) {
      errors.lrList = {
        invalid: true,
        message: "At least one lorry receipt is required",
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
      console.log("Selected date:", date); 
      setLoadingSlip((currState) => {
        return {
          ...currState,
          [name]: new Date(date),
        };
      });
    };
  console.log("Final loadingSlip sent to backend:", loadingSlip);

  const timeInputChangeHandler = (name, date) => {
    setLoadingSlip((currState) => {
      return {
        ...currState,
        [name]: new Date(date).getTime(),
      };
    });
  };

  const handleSelectedLr = (lr) => {
    setUpdatedLRList(lr);
  };

  const autocompleteChangeListener = (e, option, name) => {
    setLoadingSlip((currState) => {
      return {
        ...currState,
        [name]: option,
      };
    });
  
    if (name === "vehicle") {
      if (option && option.vo_id) {
        const selectedSupplier = suppliers?.find?.(
          (supplier) =>
            supplier.vod_id === option.vo_id || supplier.vehical_owner_name === option.vehical_owner_name
        );  
        setLoadingSlip((currState) => {
          return {
            ...currState,
            vehicleNo: option?.vehicleNo,
            vehicleOwner: selectedSupplier?.vehical_owner_name,
            vehicleOwnerAddress: `${selectedSupplier?.address || ""}, ${selectedSupplier?.city || ""}`,
            vehicleOwnerPhone: selectedSupplier?.telephoneno,
          };
        });
      } else {
        setLoadingSlip((currState) => {
          return {
            ...currState,
            vehicleNo: "",
            vehicleOwner: "",
            vehicleOwnerAddress: "",
            vehicleOwnerPhone: "",
          };
        });
      }
    }
  
    if (name === "driver") {
      if (option && option.id) {  
        setLoadingSlip((currState) => {
          return {
            ...currState,
            driverName: option.name,
            licenseNo: option.licenseno,
            phone: option.mobileno,
          };
        });
      } else {
        setLoadingSlip((currState) => {
          return {
            ...currState,
            driverName: "",
            licenseNo: "",
            phone: "",
          };
        });
      }
    }
  
    if (name === "from") {
      if (option && option.id) {
        const from = places?.find?.((place) => place.place_id === option.id);  
        setLoadingSlip((currState) => {
          return {
            ...currState,
            fromName: from.name,
          };
        });
      } else {
        setLoadingSlip((currState) => {
          return {
            ...currState,
            fromName: "",
          };
        });
      }
    }
  
    if (name === "to") {
      if (option && option._id) {
        const to = places?.find?.((place) => place.place_id === option.id);
        setLoadingSlip((currState) => {
          return {
            ...currState,
            toName: to.name,
          };
        });
      } else {
        setLoadingSlip((currState) => {
          return {
            ...currState,
            toName: "",
          };
        });
      }
    }
  };

  useEffect(() => {
    const payable =
      +loadingSlip.totalFreight + +loadingSlip.advance - +loadingSlip.rent;
    setLoadingSlip((currState) => {
      return {
        ...currState,
        totalPayable: payable,
      };
    });
  }, [loadingSlip.totalFreight, loadingSlip.rent, loadingSlip.advance]);
  const handleClickOpen = () => {

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    goToLoadingSlips();
  };
  return (
    <>
      {isLoading && <LoadingSpinner />}
      {open && (
          <Dialog
            isOpen={true}
            onClose={handleClose}
            title="Success"
            content={`Challan ${lsNo} generated successfully.`}
            success
          />
        )}
      <div className="inner-wrap">
        <h1 className="pageHead">
          {isLocalMemo ? "Edit a local challan" : "Edit a challan"}
        </h1>
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
        <form action="" onSubmit={submitHandler} id="loadingSlipForm">
          <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
            <div className="grid grid-6-col">
              <div className="grid-item">
              <FormControl fullWidth size="small" error={formErrors.branch.invalid}>
        <Autocomplete
          autoSelect
          disablePortal
          size="small"
          name="branch"
          options={branches}
          value={loadingSlip.branch || null}
          onChange={(e, value) => {
            autocompleteChangeListener(e, value, "branch");
            setLoadingSlip((currState) => ({
              ...currState,
              paybleAt: value, // Explicitly set paybleAt when branch changes
            }));
          }}
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
                <FormControl fullWidth error={formErrors.date.invalid}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      error={formErrors.date.invalid}
                      label="Date"
                      inputFormat="DD/MM/YYYY"
                      value={loadingSlip.date || ""}
                      onChange={dateInputChangeHandler.bind(null, "date")}
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
              <div className="grid-item">
                <FormControl fullWidth size="small" error={formErrors.vehicle.invalid}>
                  <Autocomplete
                    disablePortal
                    options={filteredOptions}
                    getOptionLabel={(option) => option.label}
                    value={loadingSlip.vehicle}
                    onInputChange={(event, newInputValue) => {
                      setInputValue(newInputValue); // Update input value state
                    }}
                    onChange={(e, value) => {
                      autocompleteChangeListener(e, value, "vehicle");
                    }}
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Vehicle"
                        size="small"
                        error={formErrors.vehicle.invalid}
                        fullWidth
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.vehicle_id}>
                        {option.label}
                      </li>
                    )}
                  />
                  {formErrors.vehicle.invalid && (
                    <FormHelperText>{formErrors.vehicle.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.vehicleOwner.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Vehicle owner"
                    error={formErrors.vehicleOwner.invalid}
                    value={loadingSlip.vehicleOwner || ""}
                    onChange={inputChangeHandler}
                    name="vehicleOwner"
                    id="vehicleOwner"
                  // inputProps={{ readOnly: true }}
                  />
                  {formErrors.vehicleOwner.invalid && (
                    <FormHelperText>
                      {formErrors.vehicleOwner.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  error={formErrors.vehicleOwnerAddress.invalid}
                >
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Vehicle owner address"
                    error={formErrors.vehicleOwnerAddress.invalid}
                    value={loadingSlip.vehicleOwnerAddress || ""}
                    onChange={inputChangeHandler}
                    name="vehicleOwnerAddress"
                    id="vehicleOwnerAddress"
                  // inputProps={{ readOnly: true }}
                  />
                  {formErrors.vehicleOwnerAddress.invalid && (
                    <FormHelperText>
                      {formErrors.vehicleOwnerAddress.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  error={formErrors.vehicleOwnerPhone.invalid}
                >
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Vehicle owner phone"
                    error={formErrors.vehicleOwnerPhone.invalid}
                    value={loadingSlip.vehicleOwnerPhone || ""}
                    onChange={inputChangeHandler}
                    onInput={validatePhoneNumber}
                    name="vehicleOwnerPhone"
                    id="vehicleOwnerPhone"
                  // inputProps={{ readOnly: true }}
                  />
                  {formErrors.vehicleOwnerPhone.invalid && (
                    <FormHelperText>
                      {formErrors.vehicleOwnerPhone.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
  <FormControl fullWidth size="small" error={formErrors.driver.invalid}>
    <AutoComplete
      size="small"
      name="driver"
      id="driver"
      options={
        drivers // Assuming 'drivers' is the array you provided
          ? drivers.map((driver) => ({
              id: driver.driver_id,
              name: driver.driver_name,
              licenseno:driver.licenseno,
              mobileno:driver.mobileno
            }))
          : []
      }
      getOptionLabel={(option) => option.name} // Use 'name' for display
      value={loadingSlip.driver || null}
      onChange={(e, value) => {
        autocompleteChangeListener(e, value, "driver");
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Driver"
          error={formErrors.driver.invalid}
          fullWidth
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          {option.name} 
        </li>
      )}
    />
    {formErrors.driver.invalid && (
      <FormHelperText>{formErrors.driver.message}</FormHelperText>
    )}
  </FormControl>
</div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.licenseNo.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="License no"
                    value={loadingSlip.licenseNo}
                    error={formErrors.licenseNo.invalid}
                    onChange={inputChangeHandler}
                    name="licenseNo"
                    id="licenseNo"
                  />
                  {formErrors.licenseNo.invalid && (
                    <FormHelperText>
                      {formErrors.licenseNo.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.phone.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Telephone"
                    value={loadingSlip.phone}
                    error={formErrors.phone.invalid}
                    onChange={inputChangeHandler}
                    onInput={validatePhoneNumber}
                    name="phone"
                    id="phone"
                  />
                  {formErrors.phone.invalid && (
                    <FormHelperText>{formErrors.phone.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl
                  fullWidth
                  size="small"
                  error={formErrors.from.invalid}
                >
                  <AutoComplete
                    disablePortal
                    size="small"
                    name="from"
                    options={
                      places // Assuming 'drivers' is the array you provided
                        ? places.map((driver) => ({
                          id: driver.place_id,
                          name: driver.place_name,
                        }))
                        : []
                    }
                    getOptionLabel={(option) => option.name}
                    value={loadingSlip.from}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "from")
                    }
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="From"
                        error={formErrors.from.invalid}
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
                  error={formErrors.to.invalid}
                >
                  <AutoComplete
                    disablePortal
                    size="small"
                    name="to"
                    options={
                      places // Assuming 'drivers' is the array you provided
                        ? places.map((driver) => ({
                          id: driver.place_id,
                          name: driver.place_name,
                        }))
                        : []
                    }
                    getOptionLabel={(option) => option.name}
                    value={loadingSlip.to}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "to")
                    }
                    openOnFocus
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="To"
                        error={formErrors.to.invalid}
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
        <h2 className="mb20">Freight details</h2>
        {formErrors.lrList.invalid && (
          <p className="error">{formErrors.lrList.message}</p>
        )}
        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <FreightDetailsEdit
            loadingSlip={loadingSlip}
            setLoadingSlip={setLoadingSlip}
            lorryReceipts={lsLrList}
            setLorryReceipts={setLsLrList}
            handleSelectedLr={handleSelectedLr}
            selectedLR={selectedLR}
            setSelectedLR={setSelectedLR}
            setSearchLr={setSearchLr}
            updatedLR={updatedLR}
            setUpdatedLR={setUpdatedLR}
            dateChangeHandler={dateChangeHandler}
            lrFilter={lrFilter}
          />
          <Divider sx={{ margin: "20px 0" }} />
          <form action="" onSubmit={submitHandler} id="loadingSlipForm">
            <h3 className="mb20">Charges</h3>
            <div className="grid grid-8-col">
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.totalFreight.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Total freight"
                    value={loadingSlip.totalFreight}
                    error={formErrors.totalFreight.invalid}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="totalFreight"
                    id="totalFreight"
                    InputProps={{
                      readOnly: true, 
                    }}
                  />
                  {formErrors.totalFreight.invalid && (
                    <FormHelperText>
                      {formErrors.totalFreight.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.rent.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Rent"
                    value={loadingSlip.rent}
                    error={formErrors.rent.invalid}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="rent"
                    id="rent"
                  />
                  {formErrors.rent.invalid && (
                    <FormHelperText>{formErrors.rent.message}</FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth error={formErrors.advance.invalid}>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Advance"
                    value={loadingSlip.advance}
                    onChange={inputChangeHandler}
                    onInput={validateNumber}
                    name="advance"
                    id="advance"
                    error={formErrors.advance.invalid}
                  />
                  {formErrors.advance.invalid && (
                    <FormHelperText>
                      {formErrors.advance.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    type="number"
                    variant="outlined"
                    label="Total payable"
                    value={loadingSlip.totalPayable}
                    onChange={inputChangeHandler}
                    name="totalPayable"
                    id="totalPayable"
                    inputProps={{ readOnly: true }}
                  />
                </FormControl>
              </div>
            </div>
          </form>
        </Paper>

        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <form action="" onSubmit={submitHandler} id="loadingSlipForm">
            <div className="grid grid-6-col">
              <div className="grid-item">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    ampmInClock
                    inputFormat="hh:mm a"
                    label="Current time"
                    value={loadingSlip.currentTime}
                    onChange={timeInputChangeHandler.bind(null, "currentTime")}
                    renderInput={(params) => (
                      <TextField name="currentTime" size="small" {...params} />
                    )}
                  />
                </LocalizationProvider>
              </div>
              <div className="grid-item">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    ampmInClock
                    inputFormat="hh:mm a"
                    label="Reach time"
                    value={loadingSlip.reachTime}
                    onChange={timeInputChangeHandler.bind(null, "reachTime")}
                    renderInput={(params) => (
                      <TextField name="reachTime" size="small" {...params} />
                    )}
                  />
                </LocalizationProvider>
              </div>
              <div className="grid-item">
              <FormControl fullWidth size="small">
                  <Autocomplete
                    autoSelect
 disabled
                    disablePortal
                    size="small"
                    name="paybleAt"
                    options={branches}
                    getOptionLabel={(branch) => branch.branch_name}
                    value={loadingSlip.paybleAt}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "paybleAt")
                    }
                    openOnFocus
                    renderInput={(params) => (
                      <TextField {...params} label="Payable at" fullWidth />
                    )}
                  />
                </FormControl>
              </div>
              <div className="grid-item">
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Remark"
                    value={loadingSlip.remark}
                    onChange={inputChangeHandler}
                    name="remark"
                    id="remark"
                  />
                </FormControl>
              </div>
            </div>
          </form>
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
              form="loadingSlipForm"
              className="ml6"
            >
              Save
            </Button>
            <Button
              variant="contained"
              size="medium"
              type="button"
              color="primary"
              form="loadingSlipForm"
              className="ml6"
              onClick={saveAndPrint}
              disabled={isLoading || loading}
            >
              Save &amp; Print
            </Button>
          </div>
        </Paper>
      </div>
    </>
  );
};

export default LoadingSlipEdit;
