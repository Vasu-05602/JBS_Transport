import React, { useEffect, useMemo, useState } from "react";
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
  FormControl,
  Button,
  TextField,
  InputAdornment,
  debounce,
  Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  LoadingSpinner,
  Dialog as CustomDialog,
} from "../../../../ui-controls";
import {
  getFormattedDate,
  getFormattedPettyCashNo,
  isSuperAdminOrAdmin,
} from "../../../../services/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteMoneyTransfer,
  getBranches,
  getMoneyTransfers,
  selectIsLoading,
  setSearch,
} from "./slice/moneyTransferSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { setBranch } from "../../../user/slice/userSlice";

const MoneyTransfers = () => {
  const columns = [
    { field: "_id", headerName: "Id" },
    {
      field: "pettyCashNo",
      headerName: "Petty cash no.",
      flex: 1,
    },
    {
      field: "transferToBranch",
      headerName: "Transfer to branch",
      flex: 1,
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => {
        return <strong>₹ {params.row.amount}</strong>;
      },
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteMT(params.row._id);
        };

        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row._id);
        };

        return (
          <>
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
  const user = useSelector((state) => state.user);
  const isLoading = useSelector(selectIsLoading);
  const { search } = useSelector(({ moneytransfer }) => moneytransfer);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [branches, setbranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [moneyTransfers, setMoneyTransfers] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [isloading, setLoading] = useState(false);
  const apiRef = useGridApiRef();
  useEffect(() => {
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setbranches(payload?.data);
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
  }, []);

  const fetchData = () => {
    dispatch(getMoneyTransfers(selectedBranch._id))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setMoneyTransfers(
            payload?.data?.map?.((money) => ({
              ...money,
              amount: money.amount?.toFixed?.(2),
              date: getFormattedDate(new Date(money.date)),
              pettyCashNo: getFormattedPettyCashNo(money.pettyCashNo),
              transferToBranch: getBranchNameById(money.transferToBranch),
            }))
          );
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });
  };

  useEffect(() => {
    if (selectedBranch?._id) {
      fetchData();
    }
  }, [selectedBranch]);

  const updateSearchValue = useMemo(() => {
    return debounce((newValue) => {
      apiRef.current.setQuickFilterValues(
        newValue.split?.(" ")?.filter?.((word) => word !== "")
      );
    }, 500);
  }, [apiRef]);

  useEffect(() => {
    if (search && moneyTransfers?.length) {
      setLoading(true);
      updateSearchValue(search);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [moneyTransfers]);

  const onSearchChange = (e) => {
    updateSearchValue(e.target.value);
    dispatch(setSearch(e.target.value));
  };

  const getBranchNameById = (branchId) => {
    if (branches?.length) {
      const filteredBranch = branches?.find?.(
        (branch) => branch._id === branchId
      );
      if (filteredBranch) {
        return filteredBranch.name;
      }
      return branchId;
    }
    return branchId;
  };

  const deleteMT = (id) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  const navigateToEdit = (id) => {
    navigate("/transactions/moneyTransfers/editMoneyTransfer", {
      state: { mtId: id },
    });
  };

  const handleDialogClose = (e) => {
    setIsDialogOpen(true);
    if (e.target.value === "true") {
      dispatch(deleteMoneyTransfer(selectedId))
        .then(({ payload = {} }) => {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            fetchData();
            setIsDialogOpen(false);
          }
        })
        .catch((error) => {
          setHttpError(error.message);
        });
    } else {
      setIsDialogOpen(false);
    }
  };

  const branchChangeHandler = (e, value) => {
    setSelectedBranch(value);
    dispatch(setBranch(value._id));
  };

  const handleAddMT = () => {
    navigate("/transactions/moneyTransfers/addMoneyTransfer", {
      state: selectedBranch,
    });
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
            content="Do you want to delete the money transfer?"
            warning
          />
        )}

        <div className="page_head">
          <h1 className="pageHead">Money transfers</h1>
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
                disabled={
                  user &&
                  user.type &&
                  user.type?.toLowerCase?.() !== "superadmin" &&
                  user.type?.toLowerCase?.() !== "admin"
                }
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
              onClick={handleAddMT}
            >
              Add a money transfer
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
            getRowId={(row) => row._id}
            rows={moneyTransfers}
            columns={columns}
            initialState={{
              ...columns,
              columns: {
                columnVisibilityModel: {
                  _id: false,
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
      </div>
    </>
  );
};

export default MoneyTransfers;
