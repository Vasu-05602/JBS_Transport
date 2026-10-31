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
import { LoadingSpinner } from "../../../../ui-controls";
import {
  downloadChallanReport,
  getBranches,
  getUnacknowledgedReport,
  selectIsLoading,
} from "./slice/unacknowledgedSlice";
import FileSaver from "file-saver";
import { setBranch } from "../../../user/slice/userSlice";

const initialState = {
  from: null,
  to: null,
  vehicle: "",
};

const Unacknowledged = () => {
  const columns = [
    { field: "_id", headerName: "Id" },
    {
      field: "lrNo",
      headerName: "LR no.",
      width: 100,
    },
    {
      field: "date",
      headerName: "Date",
      width: 100,
    },
    {
      field: "loadingSlipDetails",
      headerName: "Vehicle No",
      minWidth: 120,
      renderCell: ({ value }) => {
        return value?.vehicleNo;
      },
    },
    {
      field: "consignorName",
      headerName: "Consignor",
      flex: 1,
    },
    { field: "from", headerName: "From", width: 100 },
    {
      field: "consigneeName",
      headerName: "Consignee",
      flex: 1,
    },
    { field: "to", headerName: "To", width: 100 },
    {
      field: "transactions",
      headerName: "No. of Article",
      width: 90,
      renderCell: (params) => {
        const totalArticles = params.row.transactions?.reduce(
          (sum, { articleNo }) => sum + parseFloat(articleNo || 0),
          0
        );
        return <strong>{totalArticles}</strong>;
      },
    },
    { field: "payType", headerName: "Pay type", width: 80 },
    {
      field: "total",
      headerName: "Grand total",
      type: "number",
      width: 90,
      renderCell: (params) => {
        return <strong>₹ {params.row.total}</strong>;
      },
    },
  ];
  const isLoading = useSelector(selectIsLoading);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [branches, setBranches] = useState([]);
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
  }, []);

  useEffect(() => {
    if (isSubmitted && ((user.branch && selectedBranch) || !user.branch)) {
      const query = {
        showUnAcknowledge: true,
      };
      if (selectedBranch && selectedBranch._id) {
        query.branch = selectedBranch._id;
      }
      if (search.from) {
        query.startDate = search.from;
      }
      if (search.to) {
        query.endDate = search.to;
      }

      if (search.vehicle) {
        query.vehicle = search.vehicle;
      }
      if (search.searchText) {
        query.searchText = search.searchText;
      }
      const requestObject = {
        pagination: {
          limit: paginationModel.pageSize ? paginationModel.pageSize : 100,
          page: paginationModel.page + 1,
          search: search.searchText,
        },
        branch: selectedBranch._id,
        query: query,
      };

      dispatch(getUnacknowledgedReport(requestObject))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setPageState((currState) => {
              return {
                ...currState,
                isLoading: false,
                data: payload?.data.lorryReceipts || [],
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
    search.vehicle,
    search.to,
  ]);

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

    if (search.vehicle) {
      query.vehicle = search.vehicle;
    }
    const requestObject = {
      pagination: {
        limit: paginationModel.pageSize ? paginationModel.pageSize : 100,
        page: paginationModel.page + 1,
        search: search.searchText,
      },
      branch: selectedBranch._id,
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
          FileSaver.saveAs(blob, "Unacknowledged.xlsx");
        }
      })
      .catch((error) => {
        setHttpError(error.message);
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
          <h1 className="pageHead">Unacknowledged LR</h1>
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
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Search in List By"
                    value={search.searchText}
                    onChange={inputChangeHandler}
                    name="searchText"
                    id="searchText"
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
          />
        </Paper>
      </div>
    </>
  );
};

export default Unacknowledged;
