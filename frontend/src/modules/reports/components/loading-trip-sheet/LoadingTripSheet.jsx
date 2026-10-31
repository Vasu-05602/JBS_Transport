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
  getLoadingSlipForReport,
  selectIsLoading,
} from "./slice/tripSheetSlice";
import FileSaver from "file-saver";
import { setBranch } from "../../../user/slice/userSlice";
import dayjs from "dayjs";

const initialState = {
  from: null,
  to: null,
  owner: "",
  vehicle: "",
};

const LoadingTripSheet = () => {
  const columns = [
    { field: "id", headerName: "Id" },
    { field: "srNo", headerName: "Sr No" },
    {
      field: "formattedLSNo",
      headerName: "LTS no.",
      flex: 1,
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
    },
    {
      field: "vehicleOwner",
      headerName: "Owner Name",
      flex: 1,
    },
    {
      field: "vehicleNo",
      headerName: "Vehicle no",
      flex: 1,
    },
    {
      field: "totalFreight",
      headerName: "Hire Rs",
      flex: 1,
    },
    {
      field: "advance",
      headerName: "Advance Rs",
      flex: 1,
    },
    // {
    //   field: "totalHamali",
    //   headerName: "Hamali",
    //   flex: 1,
    // },
    // {
    //   field: "rent",
    //   headerName: "Commision",
    //   flex: 1,
    // },
    {
      field: "totalPayable",
      headerName: "Total",
      flex: 1,
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
              (branch) => branch.branch_id == user.branch
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
      const query = {};
      if (selectedBranch && selectedBranch.branch_id) {
        query.branch = selectedBranch.branch_id;
      }
      if (search.from) {
        query.from = search.from;
      }
      if (search.to) {
        query.to = search.to;
      }
      if (search.owner) {
        query.owner = search.owner;
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
        },
        query: query,
      };

      dispatch(getLoadingSlipForReport(requestObject))
        .then(({ payload = {} }) => {
          console.log(payload)
          const { message } = payload?.data || {};
          if (message) {
            console.log(message)
            setHttpError(message);
          } else {
            setHttpError("")
            const updatedData = payload?.data?.loadingSlips?.map((slip) => ({
              ...slip,
              id: slip.id || slip.srNo, // Use a unique property
              formattedLSNo: slip.dc_no,
              date: slip.dc_date,
              vehicleNo: slip.vehicleno,
              vehicleOwner: slip.vehical_owner_name,
              totalPayable: slip.total,
              totalFreight: slip.hire
            })) || [];

            setPageState((currState) => {
              return {
                ...currState,
                isLoading: false,
                data: updatedData,
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
    search.owner,
    search.vehicle,
    search.to,
  ]);

  const triggerDownload = (e) => {
    e.preventDefault();
    const query = { isPrint: true };
    if (selectedBranch && selectedBranch.branch_id) {
      query.branch = selectedBranch.branch_id;
    }
    if (search.from) {
      query.from = search.from;
    }
    if (search.to) {
      query.to = search.to;
    }
    if (search.owner) {
      query.owner = search.owner;
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
          FileSaver.saveAs(blob, "ChallanReport.xlsx");
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
    dispatch(setBranch(value.branch_id));
  };

  const submitHandler = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const dateInputChangeHandler = (name, date) => {
    // Format the date using Day.js (optional, but recommended for consistency)
    const formattedDate = dayjs(date).format("YYYY-MM-DD");
  
    // Update the state with the formatted date
    setSearch((currState) => ({
      ...currState,
      [name]: formattedDate, 
    }));
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
          <h1 className="pageHead">Loading Trip Sheet Register</h1>
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
                getOptionLabel={(branch) => branch.branch_name}
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
              <Grid item xs={2}>
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Owner"
                    value={search.owner}
                    onChange={inputChangeHandler}
                    name="owner"
                    id="owner"
                    inputProps={{ maxLength: 50 }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={2}>
                <FormControl fullWidth>
                  <TextField
                    size="small"
                    variant="outlined"
                    label="Vehicle"
                    value={search.vehicle}
                    onChange={inputChangeHandler}
                    name="vehicle"
                    id="vehicle"
                    inputProps={{ maxLength: 50 }}
                  />
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
            getRowId={(row) => row.id}
            sx={{ backgroundColor: "primary.contrastText" }}
            initialState={{
              ...columns,
              columns: {
                columnVisibilityModel: {
                  id: false,
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

export default LoadingTripSheet;
