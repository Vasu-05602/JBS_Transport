import React, { useEffect, useState } from "react";
import { Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Alert, Stack } from "@mui/material";
import { LoadingSpinner } from "../../../../ui-controls";
import { getUsers, selectIsLoading } from "./slice/userRegisterSlice";
import { useDispatch, useSelector } from "react-redux";

const UserList = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const columns = [
    { field: "id", headerName: "Id" },
    { field: "branch", headerName: "Branch Name", flex: 1 },
    { field: "username", headerName: "User Name", flex: 1 },
    { field: "employee", headerName: "Employee Name", flex: 1 },
    { field: "createdBy", headerName: "Approved Role", flex: 1 },
    { field: "", headerName: "Rejected Role", flex: 1 },
    { field: "createdAt", headerName: "Active Date", flex: 1 },
    {
      field: "active",
      headerName: "Activate",
      flex: 1,
      renderCell: (params) => {
        return <strong> {params.row.active ? "Yes" : "No"}</strong>;
      },
    },
  ];

  const [httpError, setHttpError] = useState("");
  const [users, setUsers] = useState([]);

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

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className="inner-wrap">
        <div
          className="page_head-1"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <h1 className="pageHead">User Register</h1>
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

        <Paper sx={{ width: "100%" }}>
          <DataGrid
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
            pageSize={10}
            rowsPerPageOptions={[10]}
            disableSelectionOnClick
          />
        </Paper>
      </div>
    </>
  );
};

export default UserList;
