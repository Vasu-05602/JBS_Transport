import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DataGrid, GridToolbarContainer } from "@mui/x-data-grid";
import {
  IconButton,
  Alert,
  Stack,
  FormControl,
  Button,
  TextField,
  InputAdornment,
  Autocomplete,
  Grid,
  Snackbar,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import DownloadIcon from "@mui/icons-material/Download";
import {
  SendEmail,
  LoadingSpinner,
  Dialog as CustomDialog,
} from "../../../../ui-controls";
import {
  base64ToObjectURL,
  downloadFile,
  getFormattedDate,
  getFormattedLSNumber,
  isSuperAdminOrAdmin,
} from "../../../../services/utils";
import {
  getBills,
  getBranches,
  deleteBill as removeBill,
  downloadBill,
  selectIsLoading,
  setSearch as onSearch,
  getCustomers,
  downloadBills,
} from "./slice/billSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { setBranch } from "../../../user/slice/userSlice";
import FileSaver from "file-saver";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const BillList = () => {
  const columns = [
    { field: "id", headerName: "Id" },
    {
      field: "bill_no",
      headerName: "Bill no.",
      width: 120,
    },
    {
      field: "bill_date",
      headerName: "Date",
      width: 100,
    },
    {
      field: "customer_name",
      headerName: "Customer",
      width: 500,
    },
    {
      field: "remark",
      headerName: "Remark",
      flex: 1,
    },
    {
      field: "grandTotal",
      headerName: "Bill amount",
      width: 100,
  
      renderCell: (params) => {
        const formattedGrandTotal = parseFloat(params.row.grandTotal).toFixed(2);
        return <strong>₹ {formattedGrandTotal}</strong>;
      },
    },
    {
      field: "actions",
      headerName: "Action",
      width: 180,

      sortable: false,
      renderCell: (params) => {
        const triggerView = (e) => {
          e.stopPropagation();
          setViewBill({ ...params.row, download: false });
        };

        const triggerDownload = (e) => {
          e.stopPropagation();
          setViewBill({ ...params.row, download: true });
        };

        const triggerEmail = (e) => {
          e.stopPropagation();
          setIsOpenEmail(true);
          setSelectedBill({ ...params.row });
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteBill(params.row.id);
        };

        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.id);
        };

        return (
          <>
            <IconButton size="small" onClick={triggerDownload} color="primary">
              <DownloadIcon />
            </IconButton>
            <IconButton size="small" onClick={triggerView} color="primary">
              <VisibilityIcon />
            </IconButton>
            <IconButton size="small" onClick={triggerEmail} color="primary">
              <EmailIcon />
            </IconButton>
            <IconButton size="small" onClick={triggerEdit} color="primary">
              <EditIcon />
            </IconButton>
            {isSuperAdminOrAdmin() ? (
              <IconButton size="small" onClick={triggerDelete} color="error">
                <DeleteIcon />
              </IconButton>
            ) : null}
          </>
        );
      },
    },
  ];
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const isLoading = useSelector(selectIsLoading);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [viewBill, setViewBill] = useState(null);
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [lrFilter, setFilter] = useState({ from: "", to: "" });

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });
  const [pageState, setPageState] = useState({
    isLoading: false,
    data: [],
    total: 0,
  });
  const { search: searchData } = useSelector(({ bill }) => bill);

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
            if (payload?.data?.length) {
              setSelectedBranch(filteredBranch);
            }
          }
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
    dispatch(getCustomers());
  }, []);

  const fetchData = () => {

    const requestObject = {
      branch: selectedBranch.branch_id,
      pagination: {
        limit: paginationModel.pageSize ? paginationModel.pageSize : 100,
        page: paginationModel.page + 1,
      },
      search: searchData,
      from: lrFilter.from ? dayjs(lrFilter.from).format("YYYY-MM-DD") : "", 
      to: lrFilter.to ? dayjs(lrFilter.to).format("YYYY-MM-DD") : "", 
    };
    dispatch(getBills(requestObject))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          const bills = payload?.data?.bills || [];
          const count = payload?.data?.count || 0;
          setPageState((currState) => ({
            ...currState,
            isLoading: false,
            data: bills.map((bill) => ({
              ...bill,
              billNo: getFormattedLSNumber(bill.billNo || bill.bill_no),
              date: bill.date ? getFormattedDate(new Date(bill.date)) : bill.bill_date,
              customer: bill.customer?.name
                ? bill.customer.name
                : (bill.customer_name || bill.customer),
              total: typeof bill.grandTotal === "number" ? bill.grandTotal.toFixed(2) : bill.grandTotal,
            })),
            total: count,
          }));
        }
      })
      .catch((error) => {
        setHttpError(error.message);
        setPageState((currState) => ({
          ...currState,
          isLoading: false,
          data: [],
          total: 0,
        }));
      });
  };

  useEffect(() => {
    if (selectedBranch?.branch_id) {
      fetchData();
    }
  }, [
    selectedBranch,
    paginationModel.page,
    paginationModel.pageSize,
    searchData,
    lrFilter.from,
    lrFilter.to,
  ]);

  useEffect(() => {
    if (viewBill && viewBill.id) {
      dispatch(downloadBill({ id: viewBill.id, email: "" }))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            if (payload?.data.file) {
              const fileURL = base64ToObjectURL(payload?.data.file);
              //const name = getFormattedLSNumber(viewBill.billNo) + ".pdf";
             const selectedBill = pageState.data?.find?.(
              (ls) => ls.id === viewBill.id
            );
          
              if (viewBill.download) {
                const name = selectedBill.bill_no + ".pdf";
                downloadFile(fileURL, `BILL-${name}`);
              } else {
                window.open(fileURL, "_blank");
              }
            }
          }
          setViewBill(null);
        })
        .catch((error) => {
          setHttpError(error.message);
          setViewBill(null);
        });
    }
  }, [viewBill]);

  const onSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
    setPaginationModel({
      page: 0,
      pageSize: 100,
    });
    dispatch(onSearch(sanitizedValue));
  };
  

  const branchChangeHandler = (e, value) => {
    setPaginationModel({
      page: 0,
      pageSize: 100,
    });
    setSelectedBranch(value);
    dispatch(setBranch(value?.branch_id));
  };

  const deleteBill = (id) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      dispatch(removeBill(selectedId))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setSnackbarMessage(message); 
            setSnackbarOpen(true);
          } else {
            setSnackbarMessage('Bill removed successfully!');
            setSnackbarOpen(true);
          }
          setIsDialogOpen(false);
          fetchData();
        })
        .catch((error) => {
          setHttpError(error.message);
          setSnackbarMessage(error.message); 
          setSnackbarOpen(true);
        });
    } else {
      setIsDialogOpen(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  

  const handleAddBill = () => {
    navigate("/transactions/billList/addBill", {
      state: selectedBranch,
    });
  };

  const navigateToEdit = (id) => {
    navigate("/transactions/billList/editBill", { state: { billId: id } });
  };

  useEffect(() => {
    if (sendEmail && emailAddress && selectedBill) {
      setIsOpenEmail(false);
      dispatch(downloadBill({ id: selectedBill.id, email: emailAddress }))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          }
          setSendEmail(false);
          setSelectedBill(null);
        })
        .catch((error) => {
          setHttpError(error.message);
          setSelectedBill(null);
        });
    }
  }, [sendEmail, emailAddress, selectedBill]);

  const handleSendEmail = (email) => {
    setSendEmail(true);
    setEmailAddress(email);
  };

  const dateChangeHandler = (name, date) => {
    setPaginationModel({
      page: 0,
      pageSize: 100,
    });
    setFilter((currState) => {
      return {
        ...currState,
        [name]: date ? new Date(date) : "",
      };
    });
  };

  const onExport = () => {
    const requestObject = {
      branch: selectedBranch?.branch_id,
      search: searchData,
      from: lrFilter.from ? dayjs(lrFilter.from).format("YYYY-MM-DD") : "",
      to: lrFilter.to ? dayjs(lrFilter.to).format("YYYY-MM-DD") : "",
    };
    dispatch(downloadBills(requestObject))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          const blob = new Blob([payload?.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          FileSaver.saveAs(blob, "Bill.xlsx");
          setHttpError("");
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className="inner-wrap">
        {isDialogOpen && (
          <CustomDialog
            isOpen={true}
            onClose={handleDialogClose}
            title="Are you sure?"
            content="Do you want to delete the bill"
            warning
          />
        )}
  <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      />
        <div className="page_head">
          <h1 className="pageHead">Bills</h1>
          <div className="page_actions">
            <FormControl
              size="small"
              sx={{ width: "230px", marginRight: "5px" }}
            >
              <Autocomplete
                autoSelect
                disablePortal
                size="small"
                name="branch"
                className="multi-select"
                options={branches}
                value={selectedBranch}
                onChange={branchChangeHandler}
                disabled={!isSuperAdminOrAdmin()}
                getOptionLabel={(branch) => branch.branch_name}
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
              onClick={handleAddBill}
            >
              Add a bill
            </Button>
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={onExport}
            >
              Export
            </Button>
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

        <div style={{ width: "100%" }}>
          <DataGrid
            autoHeight
            density="compact"
            rows={pageState.data}
            rowCount={pageState.total}
            loading={pageState.isLoading}
            pageSizeOptions={[100]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            columns={columns}
            getRowId={(row) => row.id}
            localeText={{ noRowsLabel: "No records found" }}
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
            disableColumnFilter
            disableColumnSelector
            disableDensitySelector
            components={{
              Toolbar: () => (
                <GridToolbarContainer
                  sx={{
                    gap: "6px",
                    mb: "10px",
                    justifyContent: "end",
                    border: "none",
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={5} />
                    <Grid item xs={2}>
                      <FormControl fullWidth>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="From"
                            inputFormat="DD/MM/YYYY"
                            value={lrFilter.from || null}
                            disableFuture={true}
                            maxDate={lrFilter.to}
                            onChange={dateChangeHandler.bind(null, "from")}
                            inputProps={{
                              readOnly: true,
                            }}
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
                            value={lrFilter.to || null}
                            disableFuture={true}
                            minDate={lrFilter.from}
                            onChange={dateChangeHandler.bind(null, "to")}
                            inputProps={{
                              readOnly: true,
                            }}
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
                          variant="standard"
                          placeholder="Search..."
                          autoFocus={!!searchData}
                          onChange={onSearchChange}
                          value={searchData}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchOutlined />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </GridToolbarContainer>
              ),
            }}
          />
        </div>
        <SendEmail
          isOpen={isOpenEmail}
          setIsOpen={setIsOpenEmail}
          handleEmailClose={() => {
            setIsOpenEmail(false);
            setSelectedBill(null);
          }}
          handleSendEmail={(email) => handleSendEmail(email)}
          contentBody=""
        />
      </div>
    </>
  );
};

export default BillList;
