import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, debounce, InputAdornment } from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  useGridApiRef,
} from "@mui/x-data-grid";
import { IconButton } from "@mui/material";
import { Alert, Stack } from "@mui/material";
import { TextField, FormControl } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingSpinner, Dialog } from "../../../ui-controls";
import {
  getUsers,
  deleteUser as removeUser,
  searchUser,
  selectIsLoading,
  setSearch as onSearch,
} from "../slice/userSlice";
import { useDispatch, useSelector } from "react-redux";
import SearchOutlined from "@mui/icons-material/SearchOutlined";

const UserList = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const columns = [
    { field: "_id", headerName: "Id" },
    { field: "branch_name", headerName: "Employee branch", flex: 1 },
    { field: "employee_name", headerName: "Employee name", flex: 1 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "usertype", headerName: "User type", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const onClick = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteUser(params.row.id);
        };

        return (
          <>
            <IconButton size="small" onClick={onClick} color="primary">
              <EditIcon />
            </IconButton>
            &nbsp;&nbsp;
            <IconButton size="small" onClick={triggerDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </>
        );
      },
    },
  ];

  const [httpError, setHttpError] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isloading, setLoading] = useState(false);
  const apiRef = useGridApiRef();
  const { search: searchData } = useSelector(({ user }) => user);
  const navigate = useNavigate();

  const fetchData = () => {
    dispatch(getUsers())
      .then(({ payload = {} }) => {
        if (payload?.status === 200) {
          const { message } = payload?.data || {};
          if (message) {
            setHttpError(message);
          } else {
            setHttpError("");
            setUsers(payload?.data);
          }
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      })
      .finally(() => {});
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
    if (searchData && users?.length) {
      setLoading(true);
      updateSearchValue(searchData);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [users]);

  const onSearchChange = (e) => {
    updateSearchValue(e.target.value);
    dispatch(onSearch(e.target.value));
  };
  const navigateToEdit = (id) => {
    navigate("/users/userEdit", { state: { userId: id } });
  };

  const deleteUser = (id) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      dispatch(removeUser(selectedId))
        .then(({ payload = {} }) => {
          setIsDialogOpen(false);
          fetchData();
        })
        .catch(() => {
          setHttpError("Something went wrong! Please try later or contact Administrator.");
        });
    } else {
      setIsDialogOpen(false);
    }
  };
  

  const handleRegisterUser = () => {
    navigate("/users/userRegistration");
  };

  const handleSearchInput = (e) => {
    setSearch(e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(searchUser(search))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setUsers(payload?.data);
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
  };

  return (
    <>
      {(isLoading || isloading) && <LoadingSpinner />}

      {isDialogOpen && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          title="Are you sure"
          content="Do you want to delete the user?"
          warning
        />
      )}

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

      <div className="inner-wrap">
        <div className="page_head">
          <h1 className="pageHead">Users list</h1>
          <div className="page_actions">
            <div className="bl_search">
              {/* <form onSubmit={handleSearch}>
                <div style={{ float: "left" }}>
                  <FormControl fullWidth>
                    <TextField
                      variant="outlined"
                      size="small"
                      label=""
                      placeholder="Search"
                      value={search}
                      style={{ width: "300px" }}
                      name="search"
                      id="search"
                      onChange={handleSearchInput}
                      inputProps={{ maxLength: 50 }}
                    />
                  </FormControl>
                </div>
                <IconButton
                  size="small"
                  variant="contained"
                  color="primary"
                  type="submit"
                  style={{ backgroundColor: "#337ab7", marginLeft: "5px" }}
                >
                  <SearchIcon
                    style={{ color: "#ffffff", verticalAlign: "middle" }}
                  />
                </IconButton>
              </form> */}
            </div>
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              onClick={handleRegisterUser}
            >
              Register a user
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

        <DataGrid
          apiRef={apiRef}
          sx={{ backgroundColor: "primary.contrastText" }}
          autoHeight
          density="compact"
          rows={users}
          columns={columns}
          getRowId={(row) => row.username}
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
              </GridToolbarContainer>
            ),
          }}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
        />
      </div>
    </>
  );
};

export default UserList;
