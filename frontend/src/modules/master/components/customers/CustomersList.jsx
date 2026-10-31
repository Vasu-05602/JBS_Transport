import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Button,
  InputAdornment,
  Snackbar,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DataGrid, GridToolbarContainer } from "@mui/x-data-grid";
import { Alert, Stack } from "@mui/material";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingSpinner, Dialog } from "../../../../ui-controls";
import { checkAuth } from "../../../../router/RequireAuth";
import { useDispatch, useSelector } from "react-redux";
import {
  getCustomers,
  deleteCustomer as removeCustomer,
  selectIsLoading,
  setSearch,
  getPlaces,
} from "./slice/customerSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { isSuperAdminOrAdmin } from "../../../../services/utils";

const options = [
  { label: "All", value: "" },
  { label: "Name", value: "name" },
  { label: "Address", value: "address" },
  { label: "Email", value: "email" },
  { label: "City", value: "city" },
  { label: "Telephone", value: "telephone" },
];
const CustomersList = () => {
  const columns = [
    { field: "customer_id", headerName: "Id" },
    { field: "customer_name", headerName: "Name", flex: 1 },
    { field: "address", headerName: "Address", flex: 1 },
    { field: "emailid", headerName: "Email", flex: 1 },
    { field: "city", headerName: "City", flex: 1 },
    { field: "telephoneno", headerName: "Telephone", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.customer_id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteCustomer(params.row.customer_id);
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
  const { search } = useSelector(({ customer }) => customer);
  const navigate = useNavigate();
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUnauth, setIsUnauth] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const isLoading = useSelector(selectIsLoading);
  const [searchType, setSearchType] = useState({ label: "All", value: "" });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });
  const [pageState, setPageState] = useState({
    isLoading: false,
    data: [],
    total: 0,
  });

  const fetchData = () => {
    dispatch(
      getCustomers({
        pagination: {
          limit: paginationModel.pageSize ? paginationModel.pageSize : 100,
          page: paginationModel.page,
        },
        search,
        searchType: searchType?.value,
      })
    )
      .then(({ payload = {} }) => {
        const { message, customers, count } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setPageState((currState) => {
            return {
              ...currState,
              isLoading: false,
              data: customers,
              total: count,
            };
          });
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
  }, [paginationModel, searchType, search]);

  useEffect(() => {
    dispatch(getPlaces());
  }, []);

  const onSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
    dispatch(setSearch(sanitizedValue));
    setPaginationModel((prevState) => ({ ...prevState, page: 0 }));
  };
  
  const handleAddCustomer = () => {
    navigate("/master/customers/addCustomer");
  };

  const navigateToEdit = (id) => {
    if (checkAuth("Admin", "Customers", "write")) {
      navigate("/master/customers/editCustomer", { state: { customerId: id } });
    } else {
      setIsUnauth(true);
    }
  };

  const deleteCustomer = (id) => {
    if (checkAuth("Admin", "Customers", "write")) {
      setSelectedId(id);
      setIsDialogOpen(true);
    } else {
      setIsUnauth(true);
    }
  };

  // const handleDialogClose = (e) => {
  //   if (e.target.value === "true") {
  //     dispatch(removeCustomer(selectedId))
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
      dispatch(removeCustomer(selectedId))
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

  const autocompleteChangeListener = (e, value) => {
    setSearchType(value);
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}

      {isDialogOpen && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          title="Are you sure?"
          content="Do you want to delete the customer?"
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
          <h1 className="pageHead">Customers list</h1>
          <div className="page_actions">
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={handleAddCustomer}
            >
              Add a customer
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
            getRowId={(row) => row?.customer_id}
            sx={{ backgroundColor: "primary.contrastText" }}
            initialState={{
              ...columns,
              columns: {
                columnVisibilityModel: {
                  customer_id: false,
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
                  <Autocomplete
                    autoSelect
                    size="small"
                    name="filter"
                    options={options}
                    value={searchType || null}
                    onChange={(e, value) =>
                      autocompleteChangeListener(e, value)
                    }
                    style={{ width: "200px" }}
                    openOnFocus
                    renderInput={(params) => (
                      <TextField {...params} label="Type" fullWidth />
                    )}
                    itemID="customer_id"
                  />
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
          />
        </div>
      </div>
    </>
  );
};

export default CustomersList;
