import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  GridToolbarContainer,
  useGridApiRef,
} from "@mui/x-data-grid";
import {
  IconButton,
  Alert,
  Stack,
  Button,
  debounce,
  TextField,
  InputAdornment,
  FormControl,
  Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import EmailIcon from "@mui/icons-material/Email";

import {
  LoadingSpinner,
  Dialog as CustomDialog,
  SendEmail,
} from "../../../../ui-controls";
import {
  getFormattedLSNumber,
  getFormattedDate,
  base64ToObjectURL,
  downloadFile,
  pad,
  isSuperAdminOrAdmin,
} from "../../../../services/utils";
import {
  getQuotations,
  deleteQuotation as removeQuotation,
  downloadQuotation,
  selectIsLoading,
  getPlaces,
  setSearch,
  getBranches,
  getCustomers,
} from "./slice/quotationSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { setBranch } from "../../../user/slice/userSlice";

const QuotationList = () => {
  const columns = [
    { field: "id", headerName: "Id" },
    {
      field: "quotationNo",
      headerName: "Quotation no.",
      flex: 1,
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
    },
    {
      field: "customer",
      headerName: "Customer",
      flex: 1,
    },
    {
      field: "customerCity",
      headerName: "Customer City",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const triggerView = (e) => {
          e.stopPropagation();
          setViewQuotation({ ...params.row, download: false });
        };

        const triggerDownload = (e) => {
          e.stopPropagation();
          setViewQuotation({ ...params.row, download: true });
        };

        const triggerEmail = (e) => {
          e.stopPropagation();
          setIsOpenEmail(true);
          setSelectedQuotation({ ...params.row });
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteQuotation(params.row.id || params.row._id);
        };

        const triggerEdit = (e) => {
          e.stopPropagation();
          navigate("/transactions/quotations/editQuotation", {
            state: { quotationId: params.row.id },
          });
        };

        return (
          <>
            <IconButton size="small" onClick={triggerView} color="primary">
              <VisibilityIcon />
            </IconButton>
            <IconButton size="small" onClick={triggerDownload} color="primary">
              <DownloadIcon />
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
  const apiRef = useGridApiRef();
  const navigate = useNavigate();
  const isLoading = useSelector(selectIsLoading);
  const { search, branches } = useSelector(({ quotation }) => quotation);
  const [quotations, setQuotations] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [viewQuotation, setViewQuotation] = useState(null);
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isloading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const user = useSelector((state) => state.user);

  const fetchData = () => {
    if (selectedBranch) {
      dispatch(getQuotations(selectedBranch?._id))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setQuotations(
              (Array.isArray(payload?.data) ? payload.data : []).map(
                (quot) => ({
                  ...quot,
                  date: getFormattedDate(new Date(quot.date)),
                  quotationNo: getFormattedLSNumber(quot.quotationNo),
                  customer: quot.customer?.name
                    ? quot.customer.name
                    : quot.customer,
                  customerCity: quot.customerCity || "-",
                })
              )
            );
          }
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranch]);

  useEffect(() => {
    dispatch(getPlaces());
    dispatch(getCustomers());
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");

          if (payload?.data?.length) {
            // The raw API payload uses branch_id / branch_name.
            // Map it to the same { _id, name } shape the slice stores
            // in state.branches, so it matches what the Autocomplete
            // (getOptionLabel={(branch) => branch.name}) expects.
            const mappedBranches = payload.data.map((branch) => ({
              _id: branch.branch_id,
              name: branch.branch_name,
            }));

            // Try to match the logged-in user's branch.
            // Use String() comparison since user.branch may be a
            // string while branch._id may be a number (or vice versa).
            const filteredBranch = mappedBranches.find(
              (branch) => String(branch._id) === String(user.branch)
            );

            if (filteredBranch) {
              setSelectedBranch(filteredBranch);
            } else {
              // No match found (e.g. SuperAdmin not tied to a specific
              // branch, or user.branch not set yet). Fall back to
              // auto-selecting the first branch so the list isn't
              // left empty with nothing selected.
              console.warn(
                "No branch match for user.branch:",
                user.branch,
                "- falling back to first branch"
              );
              setSelectedBranch(mappedBranches[0]);
            }
          }
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSearchValue = useMemo(() => {
    return debounce((newValue) => {
      apiRef.current.setQuickFilterValues(
        newValue.split?.(" ")?.filter?.((word) => word !== "")
      );
    }, 500);
  }, [apiRef]);

  useEffect(() => {
    if (search && quotations?.length) {
      setLoading(true);
      updateSearchValue(search);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [quotations]);

  const onSearchChange = (e) => {
    updateSearchValue(e.target.value);
    dispatch(setSearch(e.target.value));
  };

  useEffect(() => {
    if (viewQuotation && viewQuotation.id) {
      dispatch(downloadQuotation({ id: viewQuotation.id, email: "" }))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            if (payload?.data.file) {
              const selectedQuotation = quotations?.find?.(
                (quotation) => quotation.id === viewQuotation.id
              );
              const name = pad(selectedQuotation.quotationNo, 6) + ".pdf";
              const fileURL = base64ToObjectURL(payload?.data.file);

              if (viewQuotation.download) {
                downloadFile(fileURL, name);
              } else {
                window.open(fileURL, "_blank");
              }
            }
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    }
  }, [viewQuotation]);

  const deleteQuotation = (id) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  const branchChangeHandler = (e, value) => {
    setSelectedBranch(value);
    dispatch(setBranch(value?._id));
  };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      dispatch(removeQuotation(selectedId))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            fetchData();
            setIsDialogOpen(false);
            setSelectedId("");
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    } else {
      setIsDialogOpen(false);
      setSelectedId("");
    }
  };

  const handleAddQuotation = () => {
    navigate("/transactions/quotations/addQuotation", {
      state: selectedBranch,
    });
  };

  useEffect(() => {
    if (sendEmail && emailAddress && selectedQuotation) {
      setIsOpenEmail(false);
      dispatch(
        downloadQuotation({ id: selectedQuotation.id, email: emailAddress })
      )
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          }
          setSendEmail(false);
          setSelectedQuotation(null);
        })
        .catch((error) => {
          setHttpError(error.message);
          setSelectedQuotation(null);
        });
    }
  }, [sendEmail, emailAddress, selectedQuotation]);

  const handleSendEmail = (email) => {
    setSendEmail(true);
    setEmailAddress(email);
  };

  return (
    <>
      {(isLoading || isloading) && <LoadingSpinner />}
      <div className="inner-wrap">
        {isDialogOpen && (
          <CustomDialog
            isOpen={true}
            onClose={handleDialogClose}
            title="Are you sure?"
            content="Do you want to delete the quotation"
            warning
          />
        )}

        <div className="page_head">
          <h1 className="pageHead">Quotations</h1>
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
                getOptionLabel={(branch) => branch.name}
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
              onClick={handleAddQuotation}
            >
              Add a quotation
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
            apiRef={apiRef}
            sx={{ backgroundColor: "primary.contrastText" }}
            autoHeight
            density="compact"
            getRowId={(row) => row.id}
            rows={quotations || []}
            columns={columns}
            initialState={{
              ...columns,
              columns: {
                columnVisibilityModel: {
                  id: false,
                },
              },
            }}
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
                  <TextField
                    variant="standard"
                    placeholder="Search..."
                    autoFocus={!!search}
                    onChange={onSearchChange}
                    value={search}
                    style={{ width: "300px" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlined />
                        </InputAdornment>
                      ),
                    }}
                  />
                </GridToolbarContainer>
              ),
            }}
            pageSize={10}
            rowsPerPageOptions={[10]}
            disableSelectionOnClick
          />
        </div>
        <SendEmail
          isOpen={isOpenEmail}
          setIsOpen={setIsOpenEmail}
          handleEmailClose={() => {
            setIsOpenEmail(false);
            setSelectedQuotation(null);
          }}
          handleSendEmail={(email) => handleSendEmail(email)}
          contentBody=""
        />
      </div>
    </>
  );
};
export default QuotationList;