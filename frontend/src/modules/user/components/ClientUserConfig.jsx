import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, Paper, FormControl, Button, FormHelperText } from '@mui/material';
import { Alert, Stack } from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
import { addClientUserConfig, ClientUser, getClientUserConfigdata, selectIsLoading } from '../slice/userSlice';
import { Dialog, LoadingSpinner } from '../../../ui-controls';
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import DeleteIcon from '@mui/icons-material/Delete';
import { getCustomersForRateMaster } from '../../master/components/rate-master/slice/rateMasterSlice';

const ClientUserConfig = () => {
    const dispatch = useDispatch();
    const apiRef = useGridApiRef();
    const isLoading = useSelector(selectIsLoading);
const user = useSelector((state) => state.user);
  console.log(user)
    const [consignors, setConsignors] = useState([]);
    const [consignees, setConsignees] = useState([]);
    const [clientUsers, setClientUsers] = useState([]);
    const [rows, setRows] = useState([]);
    const [selectedUser, setSelectedUser] = useState(
        user.usertype?.toLowerCase() === "clientuser"
          ? { id: user.id, username: user.username }
          : null
      );
      
    const [selectedConsignor, setSelectedConsignor] = useState(null);
    const [selectedConsignee, setSelectedConsignee] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [httpError, setHttpError] = useState('');
    const [formErrors, setFormErrors] = useState({
        clientUser: '',
        consignor: '',
        consignee: '',
    });

    const columns = [
        { field: 'id', headerName: 'Sr. No.', flex: 1 },
        { field: 'consignorName', headerName: 'Consignor', flex: 1 },
        { field: 'consigneeName', headerName: 'Consignee', flex: 1 },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1,
            renderCell: (params) => (
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleDelete(params.id)}
                    startIcon={<DeleteIcon />}
                >
                    Delete
                </Button>
            ),
        },
    ];


    useEffect(() => {
        console.log(selectedUser)
        if (selectedUser?.id) {
            dispatch(getClientUserConfigdata({ clientUserID: selectedUser.id }))
                .then((response) => {

                    const data = response.payload.data || [];
                    setRows(data);
                })
                .catch((error) => {
                    console.error('Error fetching client user config:', error);
                });
        }
    }, [selectedUser, dispatch]);


    useEffect(() => {
        dispatch(getCustomersForRateMaster('consignor'))
            .then(({ payload = {} }) => {
                const { data } = payload || {};
                if (data && data.length > 0) {
                    setConsignors(data.map(customer => ({
                        ...customer,
                        label: customer.customer_name,
                        value: customer.customer_id,
                    })));
                }
            })
            .catch((error) => {
                setHttpError(error.message);
            });
        dispatch(getCustomersForRateMaster('consignee'))
            .then(({ payload = {} }) => {
                const { data } = payload || {};
                if (data && data.length > 0) {
                    setConsignees(data.map(customer => ({
                        ...customer,
                        label: customer.customer_name,
                        value: customer.customer_id,
                    })));
                }
            })
            .catch((error) => {
                setHttpError(error.message);
            });
        dispatch(ClientUser())
            .then(({ payload = {} }) => {
                const { data } = payload;
                console.log(payload)
                if (data && data.length > 0) {
                    setClientUsers(data);
                }
            })
            .catch((error) => {
                console.error('Error fetching client users:', error);
            });
    }, [dispatch]);

    const handleAdd = () => {
        let errors = { clientUser: '', consignor: '', consignee: '' };

        // Ensure Client User, Consignor, and Consignee are selected
        if (!selectedUser) {
            errors.clientUser = 'Client User is required';
        }

        // Check for duplicates in rows, but skip checking if the value is null
        const isConsignorDuplicate = selectedConsignor?.customer_id && rows.some(row => row.consignorId == selectedConsignor.customer_id);
        const isConsigneeDuplicate = selectedConsignee?.customer_id && rows.some(row => row.consigneeId == selectedConsignee.customer_id);

        if (isConsignorDuplicate) {
            errors.consignor = 'This consignor has already been added.';
        }

        if (isConsigneeDuplicate) {
            errors.consignee = 'This consignee has already been added.';
        }

        // Set form errors
        setFormErrors(errors);

        // If there are any errors, return early
        if (errors.clientUser || errors.consignor || errors.consignee) {
            return;
        }

        // Add the new row
        const newRow = {
            id: rows.length + 1,  // Or any other logic to generate ID
            clientUserID: selectedUser.id,
            clientUser: selectedUser.username,
            consignorName: selectedConsignor?.customer_name || '', // Use empty string if null
            consignorId: selectedConsignor?.customer_id || null, // Allow null if no consignor selected
            consigneeName: selectedConsignee?.customer_name || '', // Use empty string if null
            consigneeId: selectedConsignee?.customer_id || null, // Allow null if no consignee selected
        };

        // Add the row to the state
        setRows([...rows, newRow]);

        // Reset form errors after adding
        setFormErrors({ clientUser: '', consignor: '', consignee: '' });
    };


    const handleDelete = (id) => {
        const updatedRows = rows.filter(row => row.id !== id);
        setRows(updatedRows);
    };

    const submitHandler = (e) => {
        e.preventDefault();
        const configurations = rows.map((row) => ({
            clientUserID: row.clientUserID,
            consignorId: row.consignorId,
            consigneeId: row.consigneeId,
        }));
        const requestObject = { configurations };

        dispatch(addClientUserConfig(requestObject))
            .then(({ payload }) => {
                const { message } = payload?.data || {};
                if (message && message.includes("added successfully")) {
                    window.location.reload()
                    // setDialogMessage("Configuration added successfully!");
                    // setHttpError("");
                    // setOpenDialog(true);
                    // handleCancel();
                } else {
                    setHttpError("Failed to add configuration!");
                }
            })
            .catch((error) => {
                setHttpError(error.message);
            });
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setDialogMessage('');
    };


    const handleCancel = () => {
        setRows([]);
        setSelectedUser(null);
        setSelectedConsignor(null);
        setSelectedConsignee(null);
        setFormErrors({ clientUser: '', consignor: '', consignee: '' });
    };

    return (
        <>
            {isLoading && <LoadingSpinner />}
            <div>
                <h1 className="pageHead">Client User Configuration</h1>
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

                {openDialog && (
                    <Dialog
                        isOpen={true}
                        onClose={handleCloseDialog}
                        title="Success"
                        content={dialogMessage}
                    />
                )}
                <form onSubmit={submitHandler}>
                    <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
                        <div className="grid grid-6-col">
                            <div className="grid-item">
                                <FormControl fullWidth size="small" error={!!formErrors.clientUser}>
                                    <Autocomplete
                                        autoSelect
                                        disablePortal
                                        size="small"
                                        options={clientUsers}
                                        getOptionLabel={(option) => option.username || ''}
                                        value={selectedUser}
                                        onChange={(event, newValue) => setSelectedUser(newValue)}
                                        disabled={ user.usertype?.toLowerCase() === "clientuser"}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Client User" fullWidth />
                                        )}
                                    />
                                    {formErrors.clientUser && <FormHelperText>{formErrors.clientUser}</FormHelperText>}
                                </FormControl>
                            </div>

                            <div className="grid-item">
                                <FormControl fullWidth size="small" error={!!formErrors.consignor}>
                                    <Autocomplete
                                        autoSelect
                                        disablePortal
                                        size="small"
                                        options={consignors}
                                        value={selectedConsignor}
                                        onChange={(event, newValue) => setSelectedConsignor(newValue)}
                                        getOptionLabel={(option) => option.label || ''}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Consignor" fullWidth />
                                        )}
                                    />
                                    {formErrors.consignor && <FormHelperText>{formErrors.consignor}</FormHelperText>}
                                </FormControl>
                            </div>

                            <div className="grid-item">
                                <FormControl fullWidth size="small" error={!!formErrors.consignee}>
                                    <Autocomplete
                                        autoSelect
                                        disablePortal
                                        size="small"
                                        options={consignees}
                                        value={selectedConsignee}
                                        onChange={(event, newValue) => setSelectedConsignee(newValue)}
                                        getOptionLabel={(option) => option.label || ''}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Consignee" fullWidth />
                                        )}
                                    />
                                    {formErrors.consignee && <FormHelperText>{formErrors.consignee}</FormHelperText>}
                                </FormControl>
                            </div>

                            <div className="grid-item">
                                <FormControl fullWidth size="small">
                                    <Button
                                        variant="contained"
                                        size="medium"
                                        color="primary"
                                        className="ml6"
                                        style={{ width: "max-content" }}
                                        onClick={handleAdd}
                                    >
                                        Add
                                    </Button>
                                </FormControl>
                            </div>
                        </div>
                        <DataGrid
                            apiRef={apiRef}
                            sx={{ backgroundColor: "primary.contrastText" }}
                            autoHeight
                            density="compact"
                            rows={rows}
                            columns={columns}
                            pageSize={10}
                            rowsPerPageOptions={[10]}
                            disableSelectionOnClick
                            getRowId={(row) => row.id}
                            components={{
                                NoRowsOverlay: () => (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        No data available
                                    </div>
                                ),
                            }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: "5px" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                            >
                                Save
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Paper>
                </form>
            </div>
        </>
    );
};

export default ClientUserConfig;
