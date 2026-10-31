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
import { IconButton } from "@mui/material";
import { Alert, Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getFormattedDate,
  isSuperAdminOrAdmin,
} from "../../../../services/utils";
import { checkAuth } from "../../../../router/RequireAuth";
import { Dialog, LoadingSpinner } from "../../../../ui-controls";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteEmployee,
  getEmployees,
  selectIsLoading,
  setSearch,
} from "./slice/employeeSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";

const EmployeeList = () => {
  const columns = [
    { field: "emp_id", headerName: "Id" },
    { field: "employee_name", headerName: "Name", flex: 1 },
    { field: "designation", headerName: "Designation", flex: 1 },
    { field: "emailid", headerName: "Email Id", flex: 1 },
    {
      field: "joining_date",
      headerName: "Joining date",
      flex: 1,
    },
    { field: "mobileno", headerName: "Telephone", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const onClick = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.emp_id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteBranch(params.row.emp_id);
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
  const apiRef = useGridApiRef();
  const { search } = useSelector(({ employee }) => employee);
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUnauth, setIsUnauth] = useState(false);
  const isLoading = useSelector(selectIsLoading);
  const [isloading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchData = () => {
    dispatch(getEmployees())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setEmployees(
            payload?.data?.map?.((employee) => ({
              ...employee,
              joiningDate: employee.joiningDate
                ? getFormattedDate(new Date(employee.joiningDate))
                : "",
            }))
          );
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
    return () => {
      setHttpError("");
      setEmployees([]);
    };
  }, []);
  const updateSearchValue = useMemo(() => {
    return debounce((newValue) => {
      apiRef.current.setQuickFilterValues(
        newValue.split?.(" ")?.filter?.((word) => word !== "")
      );
    }, 500);
  }, [apiRef]);

  useEffect(() => {
    if (search && employees?.length) {
      setLoading(true);
      updateSearchValue(search);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [employees]);

  const onSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
    updateSearchValue(sanitizedValue);
    dispatch(setSearch(sanitizedValue));
  };
  
  const handleAddEmployee = () => {
    navigate("/master/employees/addEmployee");
  };

  const navigateToEdit = (id) => {
    navigate("/master/employees/editEmployee", { state: { employeeId: id } });
  };

  const deleteBranch = (id) => {
    if (checkAuth("Admin", "Employee", "write")) {
      setSelectedId(id);
      setIsDialogOpen(true);
    } else {
      setIsUnauth(true);
    }
  };

  // const handleDialogClose = (e) => {
  //   if (e.target.value === "true") {
  //     dispatch(deleteEmployee(selectedId))
  //       .then(({ payload = {} }) => {
  //         const { message } = payload?.data || {};
  //           fetchData();
  //         setIsDialogOpen(false);
  //       })
  //       .catch((error) => {
  //         setHttpError(error.message);
  //       });
  //   } else {
  //     setIsDialogOpen(false);
  //   }
  // };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      dispatch(deleteEmployee(selectedId))
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
          content="Do you want to delete the employee?"
          warning
        />
      )}
      <Snackbar
        open={isUnauth}
        autoHideDuration={6000}
        onClose={handleUnauthClose}
        message="You are not authorized to perform delete"
      />

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
          <h1 className="pageHead">Employee list</h1>
          <div className="page_actions">
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={handleAddEmployee}
            >
              Add an employee
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
              getRowId={(row) => row.emp_id}
              rows={employees}
              columns={columns}
              initialState={{
                ...columns,
                columns: {
                  columnVisibilityModel: {
                    emp_id: false,
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

export default EmployeeList;
