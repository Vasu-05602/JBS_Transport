import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import {
  IconButton,
  Alert,
  Stack,
  FormControl,
  Button,
  Autocomplete,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import {
  LoadingSpinner,
  Dialog as CustomDialog,
} from "../../../../ui-controls";
import {
  getFormattedDate,
  getFormattedLSNumber,
  getUserData,
} from "../../../../services/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteLoadingSlip,
  getBranches,
  getLoadingSlips,
  getPlaces,
  selectIsLoading,
} from "./slice/localMemoSlice";
import { setBranch } from "../../../user/slice/userSlice";

export const isSuperAdminOrAdmin = () => {
  const user = getUserData();
  return (
    user &&
    user.usertype &&
    (user.usertype?.toLowerCase?.() === "superadmin" ||
      user.usertype?.toLowerCase?.() === "admin")
  );
};
const LocalMemoList = () => {
  const columns = [
    { field: "_id", headerName: "Id" },
    {
      field: "lsNo",
      headerName: "LS no.",
      flex: 1,
      renderCell: (params) => {
        return getFormattedLSNumber(params.row.lsNo);
      },
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        return getFormattedDate(new Date(params.row.createdAt));
      },
    },
    { field: "vehicleNo", headerName: "Vehicle no.", flex: 1 },
    {
      field: "from",
      headerName: "From",
      flex: 1,
      renderCell: (params) => {
        return params.row.from?.name;
      },
    },
    {
      field: "to",
      headerName: "To",
      flex: 1,
      renderCell: (params) => {
        return params.row.to?.name;
      },
    },
    {
      field: "hire",
      headerName: "Hire amount",
      flex: 1,
      renderCell: (params) => {
        return <strong>₹ {params.row.hire?.toFixed?.(2)}</strong>;
      },
    },
    {
      field: "total",
      headerName: "Balance",
      flex: 1,
      renderCell: (params) => {
        return <strong>₹ {params.row.total?.toFixed?.(2)}</strong>;
      },
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const triggerView = (e) => {
          e.stopPropagation();
          //viewLR(params.row._id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteLS(params.row._id);
        };

        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row._id);
        };

        return (
          <>
            <IconButton size="small" onClick={triggerView} color="primary">
              <VisibilityIcon />
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
  const isLoading = useSelector(selectIsLoading);
  const user = useSelector((state) => state.user);

  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loadingSlips, setLoadingSlips] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    dispatch(getBranches())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setBranches(payload?.data);
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

    dispatch(getPlaces())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setPlaces(payload?.data);
        }
      })
      .catch(() => {
        setHttpError(
          "Something went wrong! Please try later or contact Administrator."
        );
      });
  }, []);

  const fetchData = () => {
    dispatch(getLoadingSlips(selectedBranch._id))
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          const updatedResponse = payload?.data?.map?.((ls) => {
            const from = places?.filter?.((place) => place._id === ls.from)[0];
            const to = places?.filter?.((place) => place._id === ls.to)[0];
            return {
              ...ls,
              from: from || "",
              to: to || "",
            };
          });
          const updatedLS = updatedResponse?.filter?.((ls) => ls.isLocalMemo);
          setLoadingSlips(updatedLS);
        }
      })
      .catch((error) => {
        setHttpError(error.message);
      });
  };

  useEffect(() => {
    if (selectedBranch?._id && places?.length) {
      fetchData();
    }
  }, [selectedBranch, places]);

  const branchChangeHandler = (e, value) => {
    const filteredBranch = branches?.filter?.(
      (branch) => branch._id === e.target.value
    );
    setSelectedBranch(filteredBranch[0]);
    dispatch(setBranch(value._id));
  };

  const deleteLS = (id) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      dispatch(deleteLoadingSlip(selectedId))
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

  const handleAddLS = () => {
    navigate("/transactions/localMemoList/addLocalMemoLS");
  };

  const navigateToEdit = (id) => {
    navigate("/transactions/localMemoList/editLocalMemoLS", {
      state: { lsId: id },
    });
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}

      {isDialogOpen && (
        <CustomDialog
          isOpen={true}
          onClose={handleDialogClose}
          title="Are you sure?"
          content="Do you want to delete the loading slip?"
          warning
        />
      )}

      <div className="page_head">
        <h1 className="pageHead">Local memo loading slips</h1>
        <div className="page_actions">
          {
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
          }
          <Button
            variant="contained"
            size="small"
            type="button"
            color="primary"
            className="ml6"
            onClick={handleAddLS}
          >
            Add a loading slip
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
          sx={{ backgroundColor: "primary.contrastText" }}
          autoHeight
          density="compact"
          getRowId={(row) => row._id}
          rows={loadingSlips}
          columns={columns}
          initialState={{
            ...columns,
            columns: {
              columnVisibilityModel: {
                _id: false,
              },
            },
          }}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
        />
      </div>
    </>
  );
};

export default LocalMemoList;
