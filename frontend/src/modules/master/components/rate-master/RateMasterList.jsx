import React, { useEffect,  useState } from "react";
import { Button,  InputAdornment, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  GridToolbarContainer,
} from "@mui/x-data-grid";
import { Alert, Stack } from "@mui/material";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Dialog, LoadingSpinner } from "../../../../ui-controls";
import { checkAuth } from "../../../../router/RequireAuth";
import { useDispatch, useSelector } from "react-redux";
import {
  getRateMasters,
  selectIsLoading,
  setSearch,
  deleteRateMaster as removeRateMaster,
} from "./slice/rateMasterSlice";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { isSuperAdminOrAdmin } from "../../../../services/utils";

const RateMasterList = () => {
  const columns = [
    { field: "id", headerName: "Id" },
    { field: "customer_name", headerName: "Name", minWidth: 250, flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      sortable: false,
      flex: 1,
      renderCell: (params) => {
        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteRateMaster(params.row.id);
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
  const { search } = useSelector(({ ratemaster }) => ratemaster);
  const navigate = useNavigate();
  const [httpError, setHttpError] = useState("");
  const isLoading = useSelector(selectIsLoading);
  const [selectedId, setSelectedId] = useState("");
  const [isUnauth, setIsUnauth] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      getRateMasters({
        pagination: {
          limit: paginationModel.pageSize ? paginationModel.pageSize : 100,
          page: paginationModel.page + 1,
        },
        search,
      })
    )
      .then(({ payload = {} }) => {
        const { message, rateList, count } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setPageState((currState) => {
            return {
              ...currState,
              isLoading: false,
              data: rateList,
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
  }, [paginationModel, search]);

  const onSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
    dispatch(setSearch(sanitizedValue));
  };

  const handleAddRates = () => {
    navigate("/master/rateMasterList/addRateMaster");
  };

  const navigateToEdit = (id) => {
    if (checkAuth("Admin", "RateMaster", "write")) {
      navigate("/master/rateMasterList/editRateMaster", {
        state: { rateMasterId: id },
      });
    }
  };

  const deleteRateMaster = (id) => {
    if (checkAuth("Admin", "RateMaster", "write")) {
      setSelectedId(id);
      setIsDialogOpen(true);
    } else {
      setIsUnauth(true);
    }
  };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      dispatch(removeRateMaster(selectedId))
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

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className="inner-wrap">
        {/* <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={isUnauth}
        autoHideDuration={6000}
        onClose={handleUnauthClose}
      >
        <Alert severity="warning">
          You are not authorized to perform the action
        </Alert>
      </Snackbar> */}

        <div className="page_head">
          <h1 className="pageHead">Rate master</h1>
          <div className="page_actions">
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={handleAddRates}
            >
              Add rates
            </Button>
          </div>
        </div>
        {isDialogOpen && (
          <Dialog
            isOpen={true}
            onClose={handleDialogClose}
            title="Are you sure?"
            content="Do you want to delete the rate master?"
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
            getRowId={(row) => row?.id}
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

export default RateMasterList;
