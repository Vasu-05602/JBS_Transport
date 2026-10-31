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
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  useGridApiRef,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Search from "@mui/icons-material/SearchOutlined";
import { debounce } from "@mui/material/utils";
import { LoadingSpinner, Dialog } from "../../../../ui-controls";
import { checkAuth } from "../../../../router/RequireAuth";
import { useDispatch, useSelector } from "react-redux";
import {
  getArticles,
  deleteArticle as removeArticle,
  selectIsLoading,
  setSearch,
} from "./slice/articleSlice";
import { isSuperAdminOrAdmin } from "../../../../services/utils";

const ArticlesList = () => {
  const columns = [
    { field: "articles_id", headerName: "Id" },
    { field: "articles_name", headerName: "Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "Unit", headerName: "Rate Type", flex: 1 },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const triggerEdit = (e) => {
          e.stopPropagation();
          return navigateToEdit(params.row.articles_id);
        };

        const triggerDelete = (e) => {
          e.stopPropagation();
          return deleteArticle(params.row.articles_id);
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
  const isLoading = useSelector(selectIsLoading);
  const { search } = useSelector(({ article }) => article);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [httpError, setHttpError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [isUnauth, setIsUnauth] = useState(false);
  const [isloading, setLoading] = useState(false);
  const apiRef = useGridApiRef();

  const fetchData = () => {
    dispatch(getArticles())
      .then(({ payload = {} }) => {
        const { message } = payload?.data || {};
        if (message) {
          setHttpError(message);
        } else {
          setHttpError("");
          setArticles(payload?.data);
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
    if (search && articles?.length) {
      setLoading(true);
      updateSearchValue(search);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [articles]);

  const onSearchChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9 -]/g, '');
    updateSearchValue(sanitizedValue);
    dispatch(setSearch(sanitizedValue));
  };
  

  const handleAddArticle = () => {
    navigate("/master/articles/addArticle");
  };

  const navigateToEdit = (id) => {
    if (checkAuth("Admin", "Article", "write")) {
      navigate("/master/articles/editArticle", { state: { articleId: id } });
    } else {
      setIsUnauth(true);
    }
  };

  const deleteArticle = (id) => {
    if (checkAuth("Admin", "Article", "write")) {
      setSelectedId(id);
      setIsDialogOpen(true);
    } else {
      setIsUnauth(true);
    }
  };

  const handleDialogClose = (e) => {
    if (e.target.value === "true") {
      dispatch(removeArticle(selectedId))
        .then(() => {
          setIsDialogOpen(false);
          fetchData();
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
          content="Do you want to delete the article?"
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
          <h1 className="pageHead">Article list</h1>
          <div className="page_actions">
            <Button
              variant="contained"
              size="small"
              type="button"
              color="primary"
              className="ml6"
              onClick={handleAddArticle}
            >
              Add an article
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
            getRowId={(row) => row.articles_id}
            rows={articles}
            columns={columns}
            initialState={{
              ...columns,
              columns: {
                columnVisibilityModel: {
                  articles_id: false,
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
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </GridToolbarContainer>
              ),
            }}
            pageSize={10}
            rowsPerPageOptions={[10]}
          />
        </div>
      </div>
    </>
  );
};

export default ArticlesList;
