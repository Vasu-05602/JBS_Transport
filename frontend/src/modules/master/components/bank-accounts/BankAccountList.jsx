import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, InputAdornment, Snackbar, TextField } from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  useGridApiRef,
} from "@mui/x-data-grid";
import { IconButton } from "@mui/material";
import { Alert, Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingSpinner, Dialog } from "../../../../ui-controls";
import { checkAuth } from "../../../../router/RequireAuth";
import { useDispatch, useSelector } from "react-redux";
import {
  getBankAccounts,
  deleteBankAccount as removeBankAccount,
  selectIsLoading,
  setSearch,
} from "./slice/bankAccountSlice";
import { debounce } from "@mui/material/utils";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { isSuperAdminOrAdmin } from "../../../../services/utils";

const BankAccountList = () => {
  const columns = [
    { field: "_id", headerName: "Id" },
    { field: "accountNo", headerName: "Account number", flex: 1 },
    { field: "accountHolder", headerName: "Account holder", flex: 1 },
    { field: "accountType", headerName: "Account type", flex: 1 },
    { field: "bank", headerName: "Bank name", flex: 1 },
    { field: "ifsc", headerName: "IFSC", flex: 1 },
    { field: "openingBalance", headerName: "Opening balance", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row._id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteBankAccount(params.row._id);
        };

        return (
          <>
            <IconButton size="small" onClick={triggerEdit} color="primary">
              <EditIcon />
            </IconButton>
            &nbsp;&nbsp;
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
  const isLoading = useSelector(selectIsLoading);
  const { search } = useSelector(({ bankaccount }) => bankaccount);

  const navigate = useNavigate();
  const [bankAccountList, setBankAccountList] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [isUnauth, setIsUnauth] = useState(false);
  const [isloading, setLoading] = useState(false);

  const apiRef = useGridApiRef();

  const fetchData = () => {
    dispatch(getBankAccounts())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setBankAccountList(payload?.data);
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
  };

  useEffect(() => {
    fetchData();
  }, []);
  const updateSearchValue = useMemo(() => {
    return debounce((newValue) => {
      apiRef.current.setQuickFilterValues(
        newValue.split?.(" ")?.filter?.((word) => word !== "")
      );
    }, 500);
  }, [apiRef]);

  useEffect(() => {
    if (search && bankAccountList?.length) {
      setLoading(true);
      updateSearchValue(search);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [bankAccountList]);

  const handleAddBankAccount = () => {
    if (checkAuth("Sales/Purchase", "BankAccountMaster", "write")) {
      navigate("/master/bankAccounts/addBankAccount");
    } else {
      setIsUnauth(true);
    }
  };
  const onSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
    updateSearchValue(sanitizedValue);
    dispatch(setSearch(sanitizedValue));
  };
  
  const navigateToEdit = (id) => {
    if (checkAuth("Sales/Purchase", "BankAccountMaster", "write")) {
      navigate("/master/bankAccounts/editBankAccount", {
        state: { bankAccountId: id },
      });
    } else {
      setIsUnauth(true);
    }
  };

  const deleteBankAccount = (id) => {
    if (checkAuth("Sales/Purchase", "BankAccountMaster", "write")) {
      setSelectedId(id);
      setIsDialogOpen(true);
    } else {
      setIsUnauth(true);
    }
  };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      dispatch(removeBankAccount(selectedId))
        .then(() => {
          fetchData();
          setIsDialogOpen(false);
        })
        .catch(() => {
          setHttpError(
            "Something went wrong! Please try later or contact Administrator."
          );
        });
    } else {
      setIsDialogOpen(false);
    }
  };

  const handleUnauthClose = () => {
    setIsUnauth(false);
  };

  return (
    <>
      {(isLoading || isloading) && <LoadingSpinner />}

      {isDialogOpen && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          title="Are you sure?"
          content="Do you want to delete the bank account?"
          warning
        />
      )}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={isUnauth}
        autoHideDuration={6000}
        onClose={handleUnauthClose}
      >
        <Alert severity="warning">
          You are not authorized to perform the action
        </Alert>
      </Snackbar>
      <div className="inner-wrap">
        <div className="page_head">
          <h1 className="pageHead">Bank account list</h1>
          <div className="page_actions">
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={handleAddBankAccount}
            >
              Add a bank account
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
            rows={bankAccountList}
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

export default BankAccountList;
