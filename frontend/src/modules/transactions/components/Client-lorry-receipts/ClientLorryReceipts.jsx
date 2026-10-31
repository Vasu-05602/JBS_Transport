import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  DataGrid,
  GridToolbarContainer,
  useGridApiRef,
} from "@mui/x-data-grid";
import {
  IconButton,
  Alert,
  Stack,
  FormControl,
  Button,
  TextField,
  InputAdornment,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Grid,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EmailIcon from "@mui/icons-material/Email";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  LoadingSpinner,
  Dialog as CustomDialog,
  SendEmail,
} from "../../../../ui-controls";
import {
  base64ToObjectURL,
  downloadFile,
  getFormattedDate,
  isSuperAdminOrAdmin,
} from "../../../../services/utils";
import { checkAuth } from "../../../../router/RequireAuth";
import {
  deleteLorryReceipt,
  downloadLorryReceipt,
  getArticles,
  getBranches,
  getCustomers,
  getLorryReceiptsWithCount,
  getPlaces,
  selectIsLoading,
  setSearch as onSearch,
  downloadLorryReceipts,
  getClientLorryReceiptsWithCount,
  getClientConsignee,
  getClientConsignors,
} from "./slice/ClientlorryReceiptSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { setBranch } from "../../../user/slice/userSlice";
import FileSaver from "file-saver";

const ClientLorryReceipts = () => {
  const columns = [
    { field: "id", headerName: "Id" },
    {
      field: "lr_no",
      headerName: "LR no.",
      flex: 1,
      renderCell: ({ value, row }) => {
        return row.deliveryDate ? (
          <span style={{ fontWeight: "bolder", fontStyle: "italic" }}>
            {" "}
            {value}
          </span>
        ) : (
          value
        );
      },
    },
    {
      field: "lr_date",
      headerName: "Date",
      flex: 1,
    },
    {
      field: "invoiceNo",
      headerName: "Invoice No",
      flex: 1,
    },
    {
      field: "consigner",
      headerName: "Consignor",
      flex: 1,
    },
    { field: "loc_from", headerName: "From",     flex: 1, },
    {
      field: "consignee",
      headerName: "Consignee",
      flex: 1,
    },
    { field: "loc_to", headerName: "To",     flex: 1, },
    {
      field: "no_of_articles",
      headerName: "No. of Article",
      flex: 1,
      renderCell: (params) => {
        // const totalArticles = params.row.transactions?.reduce(
        //   (sum, { articleNo }) => sum + parseFloat(articleNo || 0),
        //   0
        // );
        // return <strong>{totalArticles}</strong>;
      },
    },
    { field: "pay_type", headerName: "Pay type",    flex: 1, },
    {
      field: "total",
      headerName: "Grand total",
      flex: 1,
      renderCell: (params) => {
        const totalValue = parseFloat(params.row.total) || 0;
        return <strong>₹ {totalValue.toFixed(2)}</strong>; 
      },
    },
    { field: "status", headerName: "status", width: 80 },
    
    {
      field: "actions",
      headerName: "Action",
      sortable: false,
      flex: 1,
      renderCell: (params) => {
        const triggerView = (e) => {
          e.stopPropagation();
          setViewLRId({ ...params.row, download: false });
        };

        const triggerDownload = (e) => {
          e.stopPropagation();
          setViewLRId({ ...params.row, download: true });
        };

        const triggerEmail = (e) => {
          e.stopPropagation();
          setIsOpenEmail(true);
          setSelectedLR({ ...params.row });
        };

        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.id);
        };
        const triggerDelete = (e) => {
          e.stopPropagation();
          return removeLorryReceipt(params.row.id);
        };
        return (
          <>
            {/* <IconButton size="small" onClick={triggerDownload} color="primary">
              <DownloadIcon />
            </IconButton> */}
            <IconButton size="small" onClick={triggerView} color="primary">
              <VisibilityIcon />
            </IconButton>
            {/* <IconButton size="small" onClick={triggerEmail} color="primary">
              <EmailIcon />
            </IconButton> */}
            {/* <IconButton size="small" onClick={triggerEdit} color="primary">
              <EditIcon />
            </IconButton> */}
            {/* {isSuperAdminOrAdmin() ? (
              <IconButton size="small" onClick={triggerDelete} color="error">
                <DeleteIcon />
              </IconButton>
            ) : null} */}
          </>
        );
      },
    },
  ];

  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  // const isLoading = useSelector(selectIsLoading);
  const [isLoading,SetIsLoading]=useState(false)

  const [branches, setbranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [viewLRId, setViewLRId] = useState("");
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [selectedLR, setSelectedLR] = useState(null);
  const [showUnAcknowledge, setShowUnAcknowledge] = useState(false);
  const [searchDataa, setSearchDataa] = useState(null);

  // const { search: searchData } = useSelector(
  //   ({ lorryreceipt }) => lorryreceipt
  // );
  // console.log('searchData',searchData);


  const apiRef = useGridApiRef();
  const dispatch = useDispatch();

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
    // Fetch branches
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setbranches(payload?.data);
  
          if (payload?.data?.length) {
            // Convert user.branch to a number for comparison
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

    dispatch(getArticles());
    dispatch(getPlaces());
    if (user.id) {
      dispatch(getClientConsignee(user.id));
      dispatch(getClientConsignors(user.id));
    }
  }, [user.id, dispatch]); 

  
  
  

  const fetchData = () => {
    console.log("Before API call, isLoading:", pageState.isLoading);
    SetIsLoading(true)
    const requestObject = {
      user_id: user.id,
      pagination: {
        limit: paginationModel.pageSize ? paginationModel.pageSize : 100,
        page: paginationModel.page + 1,
      },
      search: searchDataa,
      showUnAcknowledge,
    };
    dispatch(getClientLorryReceiptsWithCount(requestObject))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          console.log("Before state update, isLoading:", pageState.isLoading);
          setPageState((currState) => {
            return {
              ...currState,
              isLoading: false,
              data: payload?.data.lorryReceipts?.map?.((lr) => ({
                ...lr || [],
                date: getFormattedDate(new Date(lr.date)),
                total: parseFloat(lr.total)?.toFixed(2),
              })),
              total: payload?.data.count,
            };
          });
          SetIsLoading(false)
          setHttpError("");
        }
      })
      .catch((error) => {
        console.log("Error occurred:", error.message); 
        SetIsLoading(false)
        setHttpError(error.message);
      });
   
  };

  useEffect(() => {
    if (user.id) {
      fetchData();
    }
  }, [
    user.id,
    paginationModel.page,
    paginationModel.pageSize,
    searchDataa,
    showUnAcknowledge,
  ]);

  useEffect(() => {
    if (viewLRId) {
      SetIsLoading(true)
      dispatch(
        downloadLorryReceipt({
          id: viewLRId.id,
          email: "",
          user: user?.employee?.name || "",
        })
      )
        .then(({ payload = {} }) => {
          SetIsLoading(false)
          const { message } = payload?.data || {};
          console.log(payload?.data)
          if (message) {
            setHttpError(message);
          } else {
            const fileURL = base64ToObjectURL(payload?.data.file);
            console.log(payload?.data)
            const selectedLR = pageState.data?.find?.(
              (lr) => lr.id === viewLRId.id
            );
            console.log(selectedLR)
            if (fileURL) {
              if (viewLRId.download) {
                const name = selectedLR.lr_no + ".pdf";
                downloadFile(fileURL, name);
              } else {
                window.open(fileURL, "_blank");
              }
            }
          }
        })
        .catch((error) => {
          SetIsLoading(false)
          setHttpError(error.message);
        });
    }
  }, [viewLRId]);

  useEffect(() => {
    if (sendEmail && emailAddress && selectedLR) {
      setIsOpenEmail(false);
      dispatch(
        downloadLorryReceipt({
          id: selectedLR.id,
          email: emailAddress,
          user: user?.employee?.name || "",
        })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          }
          setSendEmail(false);
          setSelectedLR(null);
        })
        .catch((error) => {
          setHttpError(error.message);
          setSelectedLR(null);
        });
    }
  }, [sendEmail, emailAddress, selectedLR]);

  const onSearchChange = (e) => {
    console.log(e.target.value); 
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
      // Log the sanitized value before dispatching
  console.log('Sanitized search value:', sanitizedValue);
    setPaginationModel({
      page: 0,
      pageSize: 100,
    });
    
    // dispatch(onSearch(sanitizedValue));
    setSearchDataa(sanitizedValue)
  };
  

  const handleSendEmail = (email) => {
    setSendEmail(true);
    setEmailAddress(email);
  };

  const handleAddLR = () => {
    // if (checkAuth("Accounts", "LorryReceipt", "write")) {
      navigate("/ClientaddLorryReceipt", {
        state: selectedBranch,
      });
    // }
  };

  const navigateToEdit = (id) => {
    // if (checkAuth("Sales/Purchase", "LorryReceipt", "write")) {
      navigate("/transactions/lorryReceipts/editLorryReceipt", {
        state: { lrId: id },
      });
    // }
  };

  const removeLorryReceipt = (id) => {
    // if (checkAuth("Sales/Purchase", "LorryReceipt", "write")) {
      setSelectedId(id);
      setIsDialogOpen(true);
    // }
  };

  const handleDialogClose = (e) => {
    setIsDialogOpen(true);
    if (e.target.value === "true") {
      dispatch(deleteLorryReceipt(selectedId))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            fetchData();
          }
          setIsDialogOpen(false);
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    } else {
      setSelectedId("");
    }
    setIsDialogOpen(false);
  };

  const branchChangeHandler = (e, value) => {
    setSelectedBranch(value);
    setPaginationModel({
      page: 0,
      pageSize: 100,
    });
    dispatch(setBranch(value._id));
  };

  const selectAllChangeHandler = ({ target }) => {
    setShowUnAcknowledge(target.checked);
    setPaginationModel({
      page: 0,
      pageSize: 100,
    });
  };

  const onExport = () => {
    const requestObject = {
      branch: selectedBranch.branch_id,
      search: searchDataa,
      showUnAcknowledge,
    };
    dispatch(downloadLorryReceipts(requestObject))
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
            `LorryReceipts${new Date().getTime()}-${getFormattedDate(
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
            content="Do you want to delete the lorry receipt?"
            warning
          />
        )}

        <div className="page_head">
          <h1 className="pageHead">Client Lorry receipts</h1>
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
              onClick={handleAddLR}
            >
              Add a Client lorry receipt
            </Button>
            {/* <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={onExport}
            >
              Export
            </Button> */}
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
            apiRef={apiRef}
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
                          autoFocus={!!searchDataa}
                          onChange={onSearchChange}
                          value={searchDataa}
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
          <SendEmail
            isOpen={isOpenEmail}
            setIsOpen={setIsOpenEmail}
            handleEmailClose={() => {
              setIsOpenEmail(false);
              setSelectedLR(null);
            }}
            handleSendEmail={(email) => handleSendEmail(email)}
            contentBody=""
          />
        </div>
      </div>
    </>
  );
};

export default ClientLorryReceipts;
