import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  debounce,
  InputAdornment,
  Snackbar,
  TextField,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  useGridApiRef,
} from "@mui/x-data-grid";
import { Alert, Stack } from "@mui/material";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingSpinner, Dialog } from "../../../../ui-controls";
import { checkAuth } from "../../../../router/RequireAuth";
import { useDispatch, useSelector } from "react-redux";
import {
  getSuppliers,
  deleteSupplier as removeSupplier,
  selectIsLoading,
  setSearch,
} from "./slice/supplierSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { isSuperAdminOrAdmin } from "../../../../services/utils";

const SuppliersList = () => {
  const columns = [
    { field: "vod_id", headerName: "Id" },
    { field: "vehical_owner_name", headerName: "Name", flex: 1 },
    { field: "owner_type", headerName: "Type", flex: 1 },
    { field: "address", headerName: "Address", flex: 1 },
    { field: "emailid", headerName: "Email", flex: 1 },
    { field: "city", headerName: "City", flex: 1 },
    { field: "telephoneno", headerName: "Contact No", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.vod_id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteSupplier(params.row.vod_id);
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
  const apiRef = useGridApiRef();
  const { search } = useSelector(({ supplier }) => supplier);
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [isUnauth, setIsUnauth] = useState(false);
  const isLoading = useSelector(selectIsLoading);
  const [isloading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchData = () => {
    dispatch(getSuppliers())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setSuppliers(payload?.data);
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
    if (search && suppliers?.length) {
      setLoading(true);
      updateSearchValue(search);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [suppliers]);

  const onSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
    updateSearchValue(sanitizedValue);
    dispatch(setSearch(sanitizedValue));
  };
  

  const handleAddSupplier = () => {
    navigate("/master/suppliers/addSupplier");
  };

  const navigateToEdit = (id) => {
    if (checkAuth("Admin", "Supplier", "write")) {
      navigate("/master/suppliers/editSupplier", { state: { supplierId: id } });
    } else {
      setIsUnauth(true);
    }
  };

  const deleteSupplier = (id) => {
    if (checkAuth("Admin", "Supplier", "write")) {
      setSelectedId(id);
      setIsDialogOpen(true);
    } else {
      setIsUnauth(true);
    }
  };

  // const handleDialogClose = (e) => {
  //   if (e.target.value === "true") {
  //     dispatch(removeSupplier(selectedId))
  //       .then(() => {
  //         setIsDialogOpen(false);
  //         fetchData();
  //       })
  //       .catch(() => {
  //         setHttpError(
  //           "Something went wrong! Please try later or contact Administrator."
  //         );
  //       });
  //   } else {
  //     setIsDialogOpen(false);
  //   }
  // };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      dispatch(removeSupplier(selectedId))
        .then((response) => {
          if (response.payload && response.payload.data && response.payload.data.message) {
            setSnackbarMessage(response.payload.data.message); // Set the Snackbar message
            setSnackbarOpen(true); // Open the Snackbar
          }
          setIsDialogOpen(false);
          fetchData();
        })
        .catch((error) => {
          setHttpError(error.message || "Something went wrong! Please try later or contact Administrator.");
        });
    } else {
      setIsDialogOpen(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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
          content="Do you want to delete the supplier?"
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
      <div className="inner-wrap">
        <div className="page_head">
          <h1 className="pageHead">Suppliers list</h1>
          <div className="page_actions">
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={handleAddSupplier}
            >
              Add a supplier
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
            getRowId={(row) => row.vod_id}
            rows={suppliers}
            columns={columns}
            initialState={{
              ...columns,
              columns: {
                columnVisibilityModel: {
                  vod_id: false,
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

export default SuppliersList;
