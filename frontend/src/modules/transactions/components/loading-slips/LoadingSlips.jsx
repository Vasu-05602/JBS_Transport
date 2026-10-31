import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
import EmailIcon from "@mui/icons-material/Email";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import {
  LoadingSpinner,
  Dialog as CustomDialog,
  SendEmail,
} from "../../../../ui-controls";
import {
  base64ToObjectURL,
  downloadFile,
  getFormattedDate,
  getFormattedLSNumber,
  isSuperAdminOrAdmin,
} from "../../../../services/utils";
import {
  deleteLoadingSlip,
  downloadLoadingSlip,
  getBranches,
  getDrivers,
  getLoadingSlips,
  getPlaces,
  getSuppliers,
  getVehicles,
  selectIsLoading,
  setSearch as onSearch,
  downloadChallans,
} from "./slice/loadingSlipSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { setBranch } from "../../../user/slice/userSlice";
import DeleteIcon from "@mui/icons-material/Delete";
import FileSaver from "file-saver";

const LoadingSlips = () => {
  const columns = [
    { field: "id", headerName: "Id", flex: 1 },
    {
      field: "dc_no",
      headerName: "LS no.",
      flex: 1,
      // renderCell: ({ value, row }) => {
      //   // return !row.unacknowledgedCount ? (
      //   //   <span style={{ fontWeight: "bolder", fontStyle: "italic" }}>
      //   //     {value}
      //   //   </span>
      //   // ) :
      //   const triggerEdit = (e) => {
      //     e.stopPropagation();
      //     return navigateToEdit(row._id);
      //   };
      //   return (
      //     <span
      //       onClick={triggerEdit}
      //       style={{ textDecoration: "underline", cursor: "pointer" }}
      //     >
      //       {value}
      //     </span>
      //   );
      // },
    },
    {
      field: "dc_date",
      headerName: "Date",
      flex: 1,
    },
    { field: "vehicle_number", headerName: "Vehicle no.", width: 120, flex: 1 },
    {
      field: "loc_from",
      headerName: "From",
      flex: 1,
    },
    {
      field: "loc_to",
      headerName: "To",
      flex: 1,
    },
    {
      field: "hire",
      headerName: "Hire amount",

      flex: 1,
    },
    {
      field: "total",
      headerName: "Balance",

      flex: 1,
    },
    {
      field: "actions",
      headerName: "Action",
      sortable: false,
      minWidth: 200,
      renderCell: (params) => {
        const triggerView = (e) => {
          e.stopPropagation();
          triggerViewLS({ ...params.row, download: false });
        };

        const triggerDownload = (e) => {
          e.stopPropagation();
          triggerViewLS({ ...params.row, download: true });
        };

        const triggerEmail = (e) => {
          e.stopPropagation();
          setIsOpenEmail(true);
          setSelectedLS({ ...params.row });
        };

        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return removeLoadingSlip(params.row.id);
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
      flex: 1,
    },
  ];
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const isLoading = useSelector(selectIsLoading);
  const user = useSelector((state) => state.user);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [deleteLSId, setDeleteLSId] = useState("");
  const [viewLS, setViewLS] = useState(null);
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [selectedLS, setSelectedLS] = useState(null);
  const [showUnAcknowledge, setShowUnAcknowledge] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { search: searchData } = useSelector(({ loadingslip }) => loadingslip);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });
  const [pageState, setPageState] = useState({
    isLoading: false,
    data: [],
    total: 0,
  });
  
  const triggerViewLS = (ls) => {
    setViewLS(ls);
  };

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
            const filteredBranch = payload?.data?.find?.(
              (branch) => branch.branch_id === Number(user.branch)
            );
            setSelectedBranch(filteredBranch);
          }
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
    dispatch(getVehicles());
    dispatch(getSuppliers());
    dispatch(getPlaces());
    dispatch(getDrivers());
  }, [user.branch]);

  const fetchData = () => {
    const requestObject = {
      branch: selectedBranch.branch_id,
      pagination: {
        limit: paginationModel.pageSize ? paginationModel.pageSize : 100,
        page: paginationModel.page + 1,
      },
      search: searchData,
      showUnAcknowledge,
    };
    dispatch(getLoadingSlips(requestObject))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (
          message ||
          Object.hasOwnProperty.call(payload?.data || {}, "message")
        ) {
          setHttpError(message);
        } else {
          const updatedLS = payload?.data?.loadingSlips?.filter?.((ls) => {
            ls.date = getFormattedDate(new Date(ls.date));
            ls.totalFreight = ls.totalFreight?.toFixed?.(2);
            ls.totalPayable = ls.totalPayable?.toFixed?.(2);
            return !ls.isLocalMemo;
          });
          setPageState((currState) => {
            return {
              ...currState,
              isLoading: false,
              data: updatedLS,
              total: payload?.data.count,
            };
          });
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });
  };

  

  useEffect(() => {
    if (selectedBranch) {
      fetchData();
    }
  }, [
    selectedBranch,
    paginationModel.page,
    paginationModel.pageSize,
    searchData,
    showUnAcknowledge,
  ]);

  useEffect(() => {
    if (viewLS && viewLS.id) {
      dispatch(downloadLoadingSlip({ id: viewLS.id, email: "" }))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
        
          if (message) {
            setHttpError(message);
          } else {
            if (payload?.data?.file) {
              const fileURL = base64ToObjectURL(payload?.data.file);
            //  const name = getFormattedLSNumber(payload?.data.lsNo) + ".pdf";
              const selectedLS = pageState.data?.find?.(
                (ls) => ls.id === viewLS.id
              );
             
              if (viewLS.download) {
                const name = selectedLS.dc_no + ".pdf";
                downloadFile(fileURL, `LS-${name}`);
              } else {
                window.open(fileURL, "_blank");
              }
            }
            setViewLS(null);
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [viewLS]);

  useEffect(() => {
    if (sendEmail && emailAddress && selectedLS) {
      setIsOpenEmail(false);
      dispatch(downloadLoadingSlip({ id: selectedLS.id, email: emailAddress }))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          }
          setSendEmail(false);
          setSelectedLS(null);
        })
        .catch((error) => {
          setHttpError(error.message);
          setSendEmail(false);
          setSelectedLS(null);
        });
    }
  }, [sendEmail, emailAddress, selectedLS]);

  const onSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
    setPaginationModel({
      page: 0,
      pageSize: 100,
    });
    dispatch(onSearch(sanitizedValue));
  };
  
  const handleSendEmail = (email) => {
    setSendEmail(true);
    setEmailAddress(email);
  };

  const branchChangeHandler = (e, value) => {
    setSelectedBranch(value);
    setPaginationModel({
      page: 0,
      pageSize: 100,
    });
    dispatch(setBranch(value.branch_id));
  };

  const selectAllChangeHandler = ({ target }) => {
    setShowUnAcknowledge(target.checked);
    setPaginationModel({
      page: 0,
      pageSize: 100,
    });
  };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      setDeleteLSId(selectedId);
      dispatch(deleteLoadingSlip(selectedId))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setSnackbarMessage(message);
            setSnackbarOpen(true);
            fetchData();
          } else {
            fetchData();
          }
        })
        .catch(() => {
          setSnackbarMessage("Something went wrong! Please try later or contact Administrator.");
          setSnackbarOpen(true);
        });
    } else {
      setDeleteLSId("");
      setSelectedId("");
    }
    setIsDialogOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };


  const handleAddLS = () => {
    navigate("/transactions/loadingSlips/addLoadingSlip", {
      state: selectedBranch,
    });
  };

  const navigateToEdit = (id) => {
    navigate("/transactions/loadingSlips/editLoadingSlip", {
      state: { lsId: id },
    });
  };
  const removeLoadingSlip = (id) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  const onExport = () => {
    const requestObject = {
      branch: selectedBranch.branch_id,
      search: searchData,
      pagination: {
        limit: paginationModel.pageSize ? paginationModel.pageSize : 100,
        page: paginationModel.page + 1,
      },
      showUnAcknowledge,
    };
    dispatch(downloadChallans(requestObject))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          const blob = new Blob([payload?.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          FileSaver.saveAs(
            blob,
            `Challans${new Date().getTime()}-${getFormattedDate(
              new Date()
            )}.xlsx`
          );
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
            content="Do you want to delete the loading slip?"
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
          <h1 className="pageHead">Lorry Freight Challan List</h1>
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
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={handleAddLS}
            >
              Add challan
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
                    <Grid item xs={7} />
                    <Grid item xs={2}>
                      {/* <FormControlLabel
                        className="groupCheckbox"
                        key="showUnAcknowledge"
                        control={
                          <Checkbox
                            name="showUnAcknowledge"
                            size="small"
                            checked={showUnAcknowledge}
                            onChange={selectAllChangeHandler}
                          />
                        }
                        label={
                          <span
                            style={{
                              fontSize: "0.9em",
                              display: "inline-block",
                              lineHeight: "1em",
                            }}
                          >
                            UnAcknowledged
                          </span>
                        }
                      /> */}
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
            setSelectedLS(null);
          }}
          handleSendEmail={(email) => handleSendEmail(email)}
          contentBody=""
        />
      </div>
    </>
  );
};

export default LoadingSlips;
