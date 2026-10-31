import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Snackbar,
  IconButton,
  Alert,
  Stack,
  TextField,
  InputAdornment,
  debounce,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  useGridApiRef,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { checkAuth } from "../../../../router/RequireAuth";
import { Dialog, LoadingSpinner } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import {
  getBranches,
  deleteBranch as removeBranch,
  selectIsLoading,
  setSearch,
} from "./slice/branchSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { isSuperAdminOrAdmin } from "../../../../services/utils";

const Branches = () => {
  const columns = [
    { field: "branch_id", headerName: "Id" },
    { field: "branch_code", headerName: "Code", flex: 1 },
    { field: "branch_abbreviation", headerName: "Abbreviation", flex: 1 },
    { field: "branch_name", headerName: "Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "place_name", headerName: "Place", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const onClick = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.branch_id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteBranch(params.row.branch_id);
        };

        return (
          <>
            <IconButton size="small" onClick={onClick} color="primary">
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
  const apiRef = useGridApiRef();
  const { search } = useSelector(({ branch }) => branch);
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [isUnauth, setIsUnauth] = useState(false);
  const [isloading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const fetchData = () => {
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { data, message } = payload;
        console.log('Data from API:', data);
        console.log('Message from API:', message);
        if (message) {
          console.log('Error message:', message);
          setHttpError(message);
        } else {
          console.log('Setting branches:', data);
          setHttpError("");
          setBranches(data);
        }
      })
      .catch((error) => {
        console.error('Fetch error:', error);
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
    if (search && branches?.length) {
      setLoading(true);
      updateSearchValue(search);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [branches]);

  const onSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
    updateSearchValue(sanitizedValue);
    dispatch(setSearch(sanitizedValue));
  };
  
  const handleAddBranch = () => {
    navigate("/master/branches/addBranch");
  };

  const navigateToEdit = (id) => {
    if (checkAuth("Admin", "Branch", "write")) {
      navigate("/master/branches/editBranch", { state: { branchId: id } });
    } else {
      setIsUnauth(true);
    }
  };

  const deleteBranch = (id) => {
    if (checkAuth("Admin", "Branch", "write")) {
      setSelectedId(id);
      setIsDialogOpen(true);
    } else {
      setIsUnauth(true);
    }
  };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      dispatch(removeBranch(selectedId))
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
          content="Do you want to delete the branch?"
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
          <h1 className="pageHead">Branch list</h1>
          <div className="page_actions">
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={handleAddBranch}
            >
              Add a branch
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

        {
          <div style={{ width: "100%" }}>
            <DataGrid
              apiRef={apiRef}
              sx={{ backgroundColor: "primary.contrastText" }}
              autoHeight
              density="compact"
              getRowId={(row) => row.branch_id}
              rows={branches}
              columns={columns}
              initialState={{
                ...columns,
                columns: {
                  columnVisibilityModel: {
                    branch_id: false,
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
        }
      </div>
     
    </>
  );
};

export default Branches;
