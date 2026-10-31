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
  getVehicles,
  deleteVehicle as removeVehicle,
  selectIsLoading,
  setSearch,
} from "./slice/vehicleSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { isSuperAdminOrAdmin } from "../../../../services/utils";

const VehiclesList = () => {
  const columns = [
    { field: "vehicle_id", headerName: "Id" },
    { field: "vehicleno", headerName: "Vehicle no", flex: 1 },
    {
      field: "vehical_owner_name",
      headerName: "Owner",
      flex: 1,
      renderCell: ({ row }) => row.ownerName || row.owner,
    },
    { field: "address", headerName: "Owner address", flex: 1 },
    {
      field: "vehicletype",
      headerName: "Vehicle type",
      flex: 1,
      renderCell: ({ row }) => row.vehicleType || row.vehicleTypeId,
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.vehicle_id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteVehicle(params.row.vehicle_id);
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
  const { search } = useSelector(({ vehicle }) => vehicle);
  const navigate = useNavigate();
  const [vehicleList, setVehicleList] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [isUnauth, setIsUnauth] = useState(false);
  const isLoading = useSelector(selectIsLoading);
  const [isloading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchData = () => {
    dispatch(getVehicles())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setVehicleList(payload?.data);
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
    if (search && vehicleList?.length) {
      setLoading(true);
      updateSearchValue(search);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [vehicleList]);

   const onSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
     updateSearchValue(sanitizedValue);
     dispatch(setSearch(sanitizedValue));
   };
   
  const handleAddVehicle = () => {
    navigate("/master/vehicles/addVehicle");
  };

  const navigateToEdit = (id) => {
    if (checkAuth("Admin", "Vehicle", "write")) {
      navigate("/master/vehicles/editVehicle", { state: { vehicleId: id } });
    } else {
      setIsUnauth(true);
    }
  };

  const deleteVehicle = (id) => {
    if (checkAuth("Admin", "Vehicle", "write")) {
      setSelectedId(id);
      setIsDialogOpen(true);
    } else {
      setIsUnauth(true);
    }
  };

  // const handleDialogClose = (e) => {
  //   setIsDialogOpen(true);
  //   if (e.target.value === "true") {
  //     dispatch(removeVehicle(selectedId))
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
      dispatch(removeVehicle(selectedId))
        .then((response) => {
          if (response.payload && response.payload.data && response.payload.data.message) {
            setSnackbarMessage(response.payload.data.message); 
            setSnackbarOpen(true); 
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
          content="Do you want to delete the vehicle?"
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
          <h1 className="pageHead">Vehicles list</h1>
          <div className="page_actions">
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={handleAddVehicle}
            >
              Add a vehicle
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
            getRowId={(row) => row.vehicle_id}
            rows={vehicleList}
            columns={columns}
            initialState={{
              ...columns,
              columns: {
                columnVisibilityModel: {
                  vehicle_id: false,
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

export default VehiclesList;
