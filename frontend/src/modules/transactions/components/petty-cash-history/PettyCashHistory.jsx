import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import {
  IconButton,
  Alert,
  Stack,
  FormControl,
  Button,
  Paper,
  FormHelperText,
  TextField,
  Autocomplete,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LoadingSpinner } from "../../../../ui-controls";
import {
  getFormattedDate,
  getFormattedTime,
  getFormattedTransactionNo,
  getFormattedLSNumber,
} from "../../../../services/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  getBanks,
  getBranches,
  getPettyTransactions,
  getPettyTransactionsByDate,
  selectIsLoading,
} from "./slice/pettyCashSlice";
import { setBranch } from "../../../user/slice/userSlice";

const initialState = {
  startDate: null,
  endDate: null,
};

const initialErrorState = {
  startDate: {
    invalid: false,
    message: "",
  },
  endDate: {
    invalid: false,
    message: "",
  },
};

const PettyCashHistory = () => {
  const columns = [
    { field: "_id", headerName: "Id" },
    {
      field: "transactionNo",
      headerName: "Transaction no.",
      flex: 1,
      renderCell: (params) => {
        return getFormattedTransactionNo(params.row.transactionNo);
      },
    },
    {
      field: "date",
      headerName: "Date & time",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        return `${getFormattedDate(
          new Date(params.row.date)
        )} ${getFormattedTime(params.row.date)}`;
      },
    },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "credit",
      type: "number",
      headerName: "Credit",
      flex: 1,
      renderCell: (params) => {
        if (params.row.credit !== "-") {
          return `₹ ${params.row.credit?.toFixed?.(2)}`;
        } else {
          return params.row.credit;
        }
      },
    },
    {
      field: "debit",
      type: "number",
      headerName: "Debit",
      flex: 1,
      renderCell: (params) => {
        if (params.row.debit !== "-") {
          return `₹ ${params.row.debit?.toFixed?.(2)}`;
        } else {
          return params.row.debit;
        }
      },
    },
    {
      field: "bank",
      headerName: "Bank & account no",
      flex: 1,
      minWidth: 300,
      renderCell: (params) => {
        const selectedBank = banks?.filter?.(
          (bank) => bank._id === params.row.bank
        );
        return `${
          selectedBank?.length ? selectedBank[0].name : params.row.bank
        } - ${params.row.bankAccountNumber}`;
      },
    },
    {
      field: "lsNo",
      headerName: "Challan no",
      flex: 1,
      renderCell: (params) => {
        return params.row.lsNo ? getFormattedLSNumber(params.row.lsNo) : "";
      },
    },
    {
      field: "availableBal",
      type: "number",
      headerName: "Balance",
      flex: 1,
      renderCell: (params) => {
        return params.row.availableBal
          ? `₹ ${params.row.availableBal?.toFixed?.(2)}`
          : `₹ 0.00`;
      },
    },
  ];
  const isLoading = useSelector(selectIsLoading);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [pettyTransactions, setPettyTransactions] = useState([]);
  const [updatedPettyTransactions, setUpdatedPettyTransactions] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [formErrors, setFormErrors] = useState(initialErrorState);
  const [search, setSearch] = useState(initialState);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setBranches(payload?.data);
          if (payload?.data?.length) {
            const filteredBranch = payload?.data?.filter?.((branch) => {
              return branch._id === user.branch;
            });
            if (filteredBranch?.length) {
              setSelectedBranch(filteredBranch[0]);
            }
          }
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });

    dispatch(getBanks())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setBanks(payload?.data);
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
  }, []);

  useEffect(() => {
    if (selectedBranch?._id) {
      dispatch(getPettyTransactions(selectedBranch._id))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setPettyTransactions(payload?.data);
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (pettyTransactions?.length) {
      const updatedTransactions = pettyTransactions?.map?.((pt) => {
        return {
          ...pt,
          credit: pt.type === "credit" ? pt.amount : "-",
          debit: pt.type === "debit" ? pt.amount : "-",
        };
      });
      setUpdatedPettyTransactions(updatedTransactions);
    } else {
      setUpdatedPettyTransactions([]);
    }
  }, [pettyTransactions]);

  const resetSearchForm = useCallback(() => {
    setFormErrors(initialErrorState);
    setSearch(initialState);
  }, []);

  const branchChangeHandler = (e) => {
    const filteredBranch = branches?.filter?.(
      (branch) => branch._id === e.target.value
    );
    setSelectedBranch(filteredBranch[0]);
    dispatch(setBranch(e.target.value));
  };

  const handleAddPettyTransaction = () => {
    navigate("/transactions/pettyCashHistory/addPettyCashTransaction");
  };

  const inputChangeHandler = (name, date) => {
    setSearch((currState) => {
      return {
        ...currState,
        [name]: new Date(date),
      };
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!validateForm(search)) {
      dispatch(getPettyTransactionsByDate(search))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setPettyTransactions(payload?.data);
            //resetSearchForm();
            setFormErrors(initialErrorState);
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  };

  const validateForm = (formData) => {
    const errors = { ...initialErrorState };
    if (!formData.startDate) {
      errors.startDate = { invalid: true, message: "Start date is required" };
    }
    if (!formData.endDate) {
      errors.endDate = { invalid: true, message: "End date is required" };
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

  return (
    <>
      {isLoading && <LoadingSpinner />}

      <div className="page_head">
        <h1 className="pageHead">Petty cash transactions</h1>
        <div className="page_actions">
          <FormControl size="small" sx={{ width: "230px", marginRight: "5px" }}>
            <Autocomplete
              autoSelect
              disablePortal
              size="small"
              name="branch"
              options={branches}
              value={selectedBranch || null}
              onChange={branchChangeHandler}
              disabled={
                user &&
                user.type &&
                user.type?.toLowerCase?.() !== "superadmin" &&
                user.type?.toLowerCase?.() !== "admin"
              }
              getOptionLabel={(branch) => branch.name || ""}
              openOnFocus
              renderInput={(params) => (
                <TextField {...params} label="Select branch" fullWidth />
              )}
            />
          </FormControl>

          <Button
            variant="contained"
            size="small"
            type="button"
            color="primary"
            className="ml6"
            onClick={handleAddPettyTransaction}
          >
            Add a petty cash transaction
          </Button>
        </div>
      </div>

      <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
        <h2 style={{ marginBottom: "10px" }}>Search</h2>
        <form action="" onSubmit={submitHandler}>
          <div className="grid grid-6-col">
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.startDate.invalid}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Start date"
                    inputFormat="DD/MM/YYYY"
                    value={search.startDate}
                    disableFuture={true}
                    disableMaskedInput={true}
                    onChange={inputChangeHandler.bind(null, "startDate")}
                    inputProps={{
                      readOnly: true,
                    }}
                    renderInput={(params) => (
                      <TextField
                        name="date"
                        size="small"
                        {...params}
                        error={formErrors.startDate.invalid}
                      />
                    )}
                  />
                </LocalizationProvider>
                {formErrors.startDate.invalid && (
                  <FormHelperText>
                    {formErrors.startDate.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <FormControl fullWidth error={formErrors.endDate.invalid}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="End date"
                    inputFormat="DD/MM/YYYY"
                    value={search.endDate}
                    disableMaskedInput={true}
                    onChange={inputChangeHandler.bind(null, "endDate")}
                    inputProps={{
                      readOnly: true,
                    }}
                    renderInput={(params) => (
                      <TextField
                        name="date"
                        size="small"
                        {...params}
                        error={formErrors.endDate.invalid}
                      />
                    )}
                  />
                </LocalizationProvider>
                {formErrors.endDate.invalid && (
                  <FormHelperText>{formErrors.endDate.message}</FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="grid-item">
              <IconButton
                size="small"
                variant="contained"
                color="primary"
                type="submit"
                style={{ backgroundColor: "#274d62", marginLeft: "5px" }}
              >
                <SearchIcon
                  style={{ color: "#ffffff", verticalAlign: "middle" }}
                />
              </IconButton>
              <IconButton
                size="small"
                variant="contained"
                color="primary"
                type="button"
                onClick={resetSearchForm}
                style={{ backgroundColor: "#274d62", marginLeft: "5px" }}
              >
                <RestartAltIcon
                  style={{ color: "#ffffff", verticalAlign: "middle" }}
                />
              </IconButton>
            </div>
          </div>
        </form>
      </Paper>

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

      <DataGrid
        sx={{ backgroundColor: "primary.contrastText" }}
        autoHeight
        density="compact"
        getRowId={(row) => row._id}
        rows={updatedPettyTransactions}
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
    </>
  );
};

export default PettyCashHistory;
