import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Stack,
  FormControl,
  Button,
  Paper,
  TextField,
  Autocomplete,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import Grid from "@material-ui/core/Grid";
import { DataGrid } from "@mui/x-data-grid";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { isSuperAdminOrAdmin } from "../../../../services/utils";
import { AutoComplete, LoadingSpinner } from "../../../../ui-controls";
import {
  downloadChallanReport,
  getBranches,
  getCustomers,
  getLoadingSlipForReport,
  selectIsLoading,
} from "./slice/challanRegisterSlice";
import FileSaver from "file-saver";
import { setBranch } from "../../../user/slice/userSlice";

const initialState = {
  from: null,
  to: null,
  lrNo: "",
  consignor: null,
};

const ChallanNoteRegister = () => {
  const columns = [
    { field: "_id", headerName: "Id" },
    { field: "srNo", headerName: "Sr No.", minWidth: 80, flex: 1 },
    {
      field: "formattedLSNo",
      headerName: "Challan No",
      flex: 1,
      minWidth: 80,
    },
    {
      field: "generatedFrom",
      headerName: "Challan Generated From",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "date",
      headerName: "Date",
      minWidth: 100,
      flex: 1,
    },
    {
      field: "vehicleNo",
      headerName: "Vehicle no",
      minWidth: 100,
      flex: 1,
    },
    {
      field: "from",
      headerName: "From",
      minWidth: 120,
      flex: 1,
    },
    {
      field: "to",
      headerName: "To",
      minWidth: 120,
      flex: 1,
    },
    {
      field: "total",
      headerName: "Total Amount",
      minWidth: 100,
      flex: 1,
    },
    {
      field: "lrNo",
      headerName: "LR No",
      minWidth: 100,
      flex: 1,
    },
    {
      field: "consignorName",
      headerName: "Consignor",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "consigneeName",
      headerName: "Consignee",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "noOfArticle",
      headerName: "No. of Article",
      minWidth: 90,
      flex: 1,
    },
    {
      field: "totalWeight",
      headerName: "Weight",
      minWidth: 90,
      flex: 1,
    },
    {
      field: "payType",
      headerName: "Status",
      minWidth: 90,
      flex: 1,
    },
  ];
  const isLoading = useSelector(selectIsLoading);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [search, setSearch] = useState(initialState);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });
  const [pageState, setPageState] = useState({
    isLoading: false,
    data: [],
    total: 0,
  });

  useEffect(() => {
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setBranches(payload?.data);
          if (user && user.branch) {
            const filteredBranch = payload?.data?.find?.(
              (branch) => branch._id === user.branch
            );
            setSelectedBranch(filteredBranch);
          }
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });
    fetchCustomers("");
  }, []);

  useEffect(() => {
    if (isSubmitted && ((user.branch && selectedBranch) || !user.branch)) {
      const query = {};
      if (selectedBranch && selectedBranch._id) {
        query.branch = selectedBranch._id;
      }
      if (search.from) {
        query.from = search.from;
      }
      if (search.to) {
        query.to = search.to;
      }
      if (search.lrNo) {
        query.lrNo = search.lrNo;
      }
      if (search.consignor) {
        query.consignor = search.consignor._id;
      }
      const requestObject = {
        pagination: {
          limit: paginationModel.pageSize ? paginationModel.pageSize : 100,
          page: paginationModel.page + 1,
        },
        query: query,
      };

      dispatch(getLoadingSlipForReport(requestObject))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setPageState((currState) => {
              return {
                ...currState,
                isLoading: false,
                data: payload?.data.loadingSlips || [],
                total: payload?.data.count,
              };
            });
          }
          setIsSubmitted(false);
        })
        .catch((error) => {
          setIsSubmitted(false);
          setHttpError(error.message);
        });
    }
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    selectedBranch,
    isSubmitted,
    dispatch,
    search.from,
    search.lrNo,
    search.to,
  ]);

  const fetchCustomers = (str) => {
    const search = str.trim?.();
    if (search?.length > 2 || !search) {
      dispatch(getCustomers(search))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setCustomers(payload?.data);
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  };

  const consignorChange = ({ target }) => {
    fetchCustomers(target.value);
  };

  const triggerDownload = (e) => {
    e.preventDefault();
    const query = { isPrint: true };
    if (selectedBranch && selectedBranch._id) {
      query.branch = selectedBranch._id;
    }
    if (search.from) {
      query.from = search.from;
    }
    if (search.to) {
      query.to = search.to;
    }
    if (search.lrNo) {
      query.lrNo = search.lrNo;
    }
    if (search.consignor) {
      query.consignor = search.consignor._id;
    }
    const requestObject = {
      pagination: {
        limit: paginationModel.pageSize ? paginationModel.pageSize : 100,
        page: paginationModel.page + 1,
      },
      query: query,
    };
    dispatch(downloadChallanReport(requestObject))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          const blob = new Blob([payload?.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          FileSaver.saveAs(blob, "ChallanStatus.xlsx");
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });
  };

  const autocompleteChangeListener = (e, option, name) => {
    setSearch((currState) => {
      return {
        ...currState,
        [name]: option,
      };
    });
  };

  const branchChangeHandler = (e, value) => {
    setSelectedBranch(value);
    setIsSubmitted(false);
    setSearch(initialState);
    dispatch(setBranch(value._id));
  };

  const submitHandler = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const dateInputChangeHandler = (name, date) => {
    setSearch((currState) => {
      return {
        ...currState,
        [name]: new Date(date),
      };
    });
  };

  const resetHandler = (e) => {
    e.preventDefault();
    setSearch(initialState);
    setIsSubmitted(true);
  };

  const inputChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setSearch((currState) => {
      return {
        ...currState,
        [name]: value,
      };
    });
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className="inner-wrap">
        <div
          className="page_head-1"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <h1 className="pageHead">Challan Note Register</h1>
          <div className="">
            <FormControl
              size="small"
              sx={{ width: "230px", marginRight: "5px", marginBottom: "20px" }}
            >
              <Autocomplete
                autoSelect
                disablePortal
                size="small"
                name="branch"
                options={branches}
                value={selectedBranch || null}
                onChange={branchChangeHandler}
                disabled={!isSuperAdminOrAdmin()}
                getOptionLabel={(branch) => branch.name}
                openOnFocus
                renderInput={(params) => (
                  <TextField {...params} label="Select branch" fullWidth />
                )}
              />
            </FormControl>
          </div>
        </div>

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

        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
          <h2 className="mb20">Search</h2>
          <form action="" onSubmit={submitHandler}>
            <Grid container spacing={3}>
              <Grid item xs={2}>
                <FormControl fullWidth>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="From"
                      inputFormat="DD/MM/YYYY"
                      value={search.from}
                      onChange={dateInputChangeHandler.bind(null, "from")}
                      renderInput={(params) => (
                        <TextField name="from" size="small" {...params} />
                      )}
                    />
                  </LocalizationProvider>
                </FormControl>
              </Grid>
              <Grid item xs={2}>
                <FormControl fullWidth>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="To"
                      inputFormat="DD/MM/YYYY"
                      value={search.to}
                      onChange={dateInputChangeHandler.bind(null, "to")}
                      renderInput={(params) => (
                        <TextField name="to" size="small" {...params} />
                      )}
                    />
                  </LocalizationProvider>
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <FormControl fullWidth size="small">
                  <AutoComplete
                    disablePortal
                    autoHighlight={true}
                    size="small"
                    name="consignor"
                    options={customers}
                    value={search.consignor}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value, "consignor")
                    }
                    openOnFocus
                    getOptionLabel={(customer) => customer.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Customer"
                        fullWidth
                        onChange={(e) => consignorChange(e)}
                      />
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={2}>
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Lorry receipt no."
                    value={search.lrNo}
                    onChange={inputChangeHandler}
                    name="lrNo"
                    id="lrNo"
                    inputProps={{ maxLength: 50 }}
                  />
                </FormControl>
              </Grid>
              <Grid style={{ display: "flex" }} item xs={2}>
                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  color="primary"
                >
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  size="medium"
                  className="ml6"
                  onClick={(e) => resetHandler(e)}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        <Paper sx={{ width: "100%" }}>
          {pageState.data?.length > 0 ? (
            <div className="tbl_header">
              <Button
                variant="contained"
                endIcon={<DownloadIcon />}
                onClick={triggerDownload}
              >
                Export To Excel
              </Button>
            </div>
          ) : null}
          <DataGrid
            autoHeight
            density="compact"
            rows={pageState.data}
            rowCount={pageState.total}
            loading={pageState.isLoading}
            pageSizeOptions={[100]}
            paginationModel={paginationModel}
            onPaginationModelChange={(page) => {
              setPaginationModel(page);
              setIsSubmitted(true);
            }}
            paginationMode="server"
            columns={columns}
            getRowId={(row) => row._id}
            sx={{ backgroundColor: "primary.contrastText" }}
            initialState={{
              ...columns,
              columns: {
                columnVisibilityModel: {
                  _id: false,
                },
              },
            }}
            disableSelectionOnClick
            // disableColumnFilter
            // disableColumnSelector
            // disableDensitySelector
            // components={{ Toolbar: GridToolbar }}
            // componentsProps={{
            //   toolbar: {
            //     csvOptions: { disableToolbarButton: false },
            //     printOptions: { disableToolbarButton: true },
            //     showQuickFilter: true,
            //     quickFilterProps: { debounceMs: 300 },
            //   },
            // }}
          />
        </Paper>
      </div>
    </>
  );
};

export default ChallanNoteRegister;
