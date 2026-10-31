import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Grid,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import PaymentIcon from "@mui/icons-material/Payment";
import AddIcon from "@mui/icons-material/Add";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  getPaymentCollectionHistory,
  updatePaymentCollection,
  createPaymentCollectionForBill,
} from "./slice/billSlice";

const PAYMENT_MODES = [
  "Cash",
  "Cheque",
  "NEFT/RTGS",
  "UPI",
  "Demand Draft",
  "Net Banking",
];

const PaymentCollectionHistoryCard = ({ billId, bill }) => {
  const dispatch = useDispatch();

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    receiving_amount: "",
    tds: "",
    pay_mode: "Cash",
    receiving_date: dayjs(),
    bank_name: "",
    cheque_rtgs_no: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Add Payment Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    receiving_amount: "",
    tds: "0.00",
    pay_mode: "Cash",
    receiving_date: dayjs(),
    bank_name: "",
    cheque_rtgs_no: "",
  });
  const [addErrors, setAddErrors] = useState({});
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);
  const [addSubmitError, setAddSubmitError] = useState("");

  // Financial Metrics (Option A: Settled = Received + TDS)
  const grandTotal = parseFloat(
    bill?.grandTotal !== undefined && bill?.grandTotal !== "" && bill?.grandTotal !== null
      ? bill.grandTotal
      : bill?.tot_amount !== undefined && bill?.tot_amount !== "" && bill?.tot_amount !== null
      ? bill.tot_amount
      : history[0]?.total_bill_amount || 0
  ) || 0;

  const toCents = (val) => {
    if (val === undefined || val === null || val === "") return 0;
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, "").trim());
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  const grandTotalCents = toCents(grandTotal);
  const totalSettledCents = history.reduce(
    (sum, r) => sum + toCents(r.receiving_amount) + toCents(r.tds),
    0
  );
  const totalReceived = history.reduce(
    (sum, r) => sum + (parseFloat(r.receiving_amount) || 0),
    0
  );
  const totalTds = history.reduce(
    (sum, r) => sum + (parseFloat(r.tds) || 0),
    0
  );
  const totalSettled = totalSettledCents / 100;
  const outstandingBalanceCents = Math.max(0, grandTotalCents - totalSettledCents);
  const outstandingBalance = outstandingBalanceCents / 100;

  // Live calculation for Add Form
  const addRecCents = toCents(addForm.receiving_amount);
  const addTdsCents = toCents(addForm.tds);
  const addSettlementCents = addRecCents + addTdsCents;
  const isAddExceeding = addSettlementCents > outstandingBalanceCents;
  const addRemainingAfterCents = Math.max(0, outstandingBalanceCents - addSettlementCents);

  // Live calculation for Edit Form
  const editOldRecCents = selectedRecord ? toCents(selectedRecord.receiving_amount) : 0;
  const editOldTdsCents = selectedRecord ? toCents(selectedRecord.tds) : 0;
  const editOtherSettledCents = totalSettledCents - (editOldRecCents + editOldTdsCents);
  const maxPermittedEditCents = Math.max(0, grandTotalCents - editOtherSettledCents);
  const editRecCents = toCents(editForm.receiving_amount);
  const editTdsCents = toCents(editForm.tds);
  const editSettlementCents = editRecCents + editTdsCents;
  const isEditExceeding = editSettlementCents > maxPermittedEditCents;
  const editRemainingAfterCents = Math.max(0, maxPermittedEditCents - editSettlementCents);

  const loadHistory = useCallback(() => {
    if (!billId) {
      setHistory([]);
      setIsLoading(false);
      setFetchError("");
      return;
    }
    setIsLoading(true);
    setFetchError("");
    dispatch(getPaymentCollectionHistory(billId))
      .then(({ payload = {} }) => {
        setIsLoading(false);
        const data = payload?.data;
        if (Array.isArray(data)) {
          setHistory(data);
        } else if (data?.history && Array.isArray(data.history)) {
          setHistory(data.history);
        } else if (payload?.status === 200) {
          setHistory([]);
        } else {
          setHistory([]);
          if (data?.message) {
            setFetchError(data.message);
          }
        }
      })
      .catch((err) => {
        setIsLoading(false);
        setFetchError("Failed to load payment collection history.");
        console.error("Error loading payment history:", err);
      });
  }, [dispatch, billId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleOpenEdit = (record) => {
    setSelectedRecord(record);
    setSubmitError("");
    setEditErrors({});

    let parsedDate = dayjs();
    if (record.raw_receiving_date) {
      parsedDate = dayjs(record.raw_receiving_date);
    } else if (record.receiving_date) {
      // Could be DD-MM-YYYY or YYYY-MM-DD
      const parts = record.receiving_date.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          parsedDate = dayjs(record.receiving_date);
        } else {
          parsedDate = dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
    }

    setEditForm({
      receiving_amount: record.receiving_amount ? String(record.receiving_amount) : "",
      tds: record.tds ? String(record.tds) : "0.00",
      pay_mode: record.pay_mode || "Cash",
      receiving_date: parsedDate.isValid() ? parsedDate : dayjs(),
      bank_name: record.bank_name || "",
      cheque_rtgs_no: record.cheque_rtgs_no || "",
    });
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    if (isSubmitting) return;
    setEditModalOpen(false);
    setSelectedRecord(null);
    setSubmitError("");
    setEditErrors({});
  };

  const handleOpenAdd = () => {
    setAddForm({
      receiving_amount: "",
      tds: "0.00",
      pay_mode: "Cash",
      receiving_date: dayjs(),
      bank_name: "",
      cheque_rtgs_no: "",
    });
    setAddErrors({});
    setAddSubmitError("");
    setAddModalOpen(true);
  };

  const handleCloseAdd = () => {
    if (isAddSubmitting) return;
    setAddModalOpen(false);
    setAddErrors({});
    setAddSubmitError("");
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (addErrors[name]) {
      setAddErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateAddForm = () => {
    const errors = {};
    const recAmt = parseFloat(addForm.receiving_amount);
    if (
      addForm.receiving_amount === "" ||
      isNaN(recAmt) ||
      recAmt <= 0
    ) {
      errors.receiving_amount = "Receiving amount must be greater than 0";
    }

    const tdsAmt = parseFloat(addForm.tds || 0);
    if (addForm.tds !== "" && (isNaN(tdsAmt) || tdsAmt < 0)) {
      errors.tds = "TDS cannot be negative";
    }

    if (!errors.receiving_amount && !errors.tds) {
      if (addSettlementCents > outstandingBalanceCents) {
        errors.receiving_amount = `Settlement amount (₹${(addSettlementCents / 100).toFixed(2)}) exceeds maximum permitted settlement (₹${(outstandingBalanceCents / 100).toFixed(2)}). Total cumulative settlement cannot exceed Grand Total (₹${(grandTotalCents / 100).toFixed(2)}).`;
      }
    }

    if (!addForm.pay_mode || !addForm.pay_mode.trim()) {
      errors.pay_mode = "Payment mode is required";
    }

    if (
      !addForm.receiving_date ||
      !dayjs(addForm.receiving_date).isValid()
    ) {
      errors.receiving_date = "A valid receiving date is required";
    }

    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!validateAddForm()) return;
    if (isAddSubmitting || !billId) return;

    setIsAddSubmitting(true);
    setAddSubmitError("");

    const formattedDate = dayjs(addForm.receiving_date).format("YYYY-MM-DD");

    const payload = {
      bill_id: String(billId),
      receiving_amount: parseFloat(addForm.receiving_amount).toFixed(2),
      tds: parseFloat(addForm.tds || 0).toFixed(2),
      pay_mode: addForm.pay_mode.trim(),
      receiving_date: formattedDate,
      bank_name: addForm.bank_name ? addForm.bank_name.trim() : "",
      cheque_rtgs_no: addForm.cheque_rtgs_no ? addForm.cheque_rtgs_no.trim() : "",
    };

    dispatch(createPaymentCollectionForBill(payload))
      .then(({ payload: res = {}, error }) => {
        setIsAddSubmitting(false);
        const data = res?.data || res;
        if (data?.success || res?.status === 200) {
          setSuccessMessage(data?.message || "Payment collection recorded successfully!");
          handleCloseAdd();
          loadHistory();
        } else {
          setAddSubmitError(
            data?.message || error?.message || "Failed to record payment collection. Please try again."
          );
        }
      })
      .catch((err) => {
        setIsAddSubmitting(false);
        console.error("Error recording payment collection:", err);
        const errMsg = err?.response?.data?.message || err?.message || "Server error while recording payment collection.";
        setAddSubmitError(errMsg);
      });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (editErrors[name]) {
      setEditErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateEditForm = () => {
    const errors = {};
    const recAmt = parseFloat(editForm.receiving_amount);
    if (
      editForm.receiving_amount === "" ||
      isNaN(recAmt) ||
      recAmt <= 0
    ) {
      errors.receiving_amount = "Receiving amount must be greater than 0";
    }

    const tdsAmt = parseFloat(editForm.tds || 0);
    if (editForm.tds !== "" && (isNaN(tdsAmt) || tdsAmt < 0)) {
      errors.tds = "TDS cannot be negative";
    }

    if (!errors.receiving_amount && !errors.tds && selectedRecord) {
      if (editSettlementCents > maxPermittedEditCents) {
        errors.receiving_amount = `Updated settlement (₹${(editSettlementCents / 100).toFixed(2)}) exceeds maximum permitted settlement (₹${(maxPermittedEditCents / 100).toFixed(2)}). Total cumulative settlement cannot exceed Grand Total (₹${(grandTotalCents / 100).toFixed(2)}).`;
      }
    }

    if (!editForm.pay_mode || !editForm.pay_mode.trim()) {
      errors.pay_mode = "Payment mode is required";
    }

    if (
      !editForm.receiving_date ||
      !dayjs(editForm.receiving_date).isValid()
    ) {
      errors.receiving_date = "A valid receiving date is required";
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;
    if (!selectedRecord || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    const formattedDate = dayjs(editForm.receiving_date).format("YYYY-MM-DD");

    const payload = {
      id: selectedRecord.id,
      bill_id: String(selectedRecord.bill_id || billId),
      receiving_amount: parseFloat(editForm.receiving_amount).toFixed(2),
      tds: parseFloat(editForm.tds || 0).toFixed(2),
      pay_mode: editForm.pay_mode.trim(),
      receiving_date: formattedDate,
      bank_name: editForm.bank_name.trim(),
      cheque_rtgs_no: editForm.cheque_rtgs_no.trim(),
    };

    dispatch(updatePaymentCollection(payload))
      .then(({ payload: res = {}, error }) => {
        setIsSubmitting(false);
        const data = res?.data || res;
        if (data?.success || res?.status === 200) {
          setSuccessMessage(data?.message || "Payment collection updated successfully!");
          handleCloseEdit();
          loadHistory();
        } else {
          setSubmitError(
            data?.message || error?.message || "Failed to update payment collection. Please try again."
          );
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        console.error("Error saving payment collection:", err);
        const errMsg = err?.response?.data?.message || err?.message || "Server error while updating payment collection.";
        setSubmitError(errMsg);
      });
  };

  // Exact 8 columns as requested:
  // 1. Bill No.
  // 2. Bill Date
  // 3. Total Bill Amount
  // 4. Receiving Amount
  // 5. TDS
  // 6. Payment Mode
  // 7. Receiving Date
  // 8. Action
  const columns = [
    { field: "id", headerName: "Id", hide: true },
    {
      field: "bill_no",
      headerName: "Bill No.",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <span style={{ fontWeight: 600 }}>{params.value || "-"}</span>
      ),
    },
    {
      field: "bill_date",
      headerName: "Bill Date",
      flex: 1,
      minWidth: 110,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "total_bill_amount",
      headerName: "Total Bill Amount",
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <strong style={{ color: "#1976d2" }}>
          ₹ {Number(params.value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </strong>
      ),
    },
    {
      field: "receiving_amount",
      headerName: "Receiving Amount",
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <strong style={{ color: "#2e7d32" }}>
          ₹ {Number(params.value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </strong>
      ),
    },
    {
      field: "tds",
      headerName: "TDS",
      flex: 1,
      minWidth: 110,
      renderCell: (params) => (
        <span>
          ₹ {Number(params.value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      field: "pay_mode",
      headerName: "Payment Mode",
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <span
          style={{
            backgroundColor: "#f0f4f8",
            padding: "3px 8px",
            borderRadius: "4px",
            fontWeight: 500,
            fontSize: "0.85rem",
          }}
        >
          {params.value || "Cash"}
        </span>
      ),
    },
    {
      field: "receiving_date",
      headerName: "Receiving Date",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <span>{params.value || params.row.formatted_receiving_date || "-"}</span>
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      sortable: false,
      minWidth: 110,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<EditIcon fontSize="small" />}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEdit(params.row);
          }}
          sx={{ textTransform: "none", fontWeight: 600, px: 1.5 }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Paper
      sx={{
        padding: "20px",
        marginBottom: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <PaymentIcon color="primary" />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: "#1a202c" }}>
            Payment Collection History
          </Typography>
          {!billId ? (
            <span
              style={{
                backgroundColor: "#fef3c7",
                color: "#92400e",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "12px",
                marginLeft: "8px",
              }}
            >
              New Bill
            </span>
          ) : history.length > 0 ? (
            <span
              style={{
                backgroundColor: "#e3f2fd",
                color: "#1565c0",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "12px",
                marginLeft: "8px",
              }}
            >
              {history.length} {history.length === 1 ? "record" : "records"}
            </span>
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {billId && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              disabled={outstandingBalance <= 0}
              sx={{ textTransform: "none", fontWeight: 600, px: 2 }}
            >
              {outstandingBalance <= 0 ? "Fully Settled" : "Record Payment"}
            </Button>
          )}

          <Tooltip title={!billId ? "Save the bill first to view payment history" : "Refresh Payment History"}>
            <span>
              <IconButton
                size="small"
                onClick={loadHistory}
                disabled={isLoading || !billId}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Financial Summary Box (Option A: Settled = Received + TDS) */}
      {billId && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
            gap: 2,
            p: 2,
            mb: 2.5,
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Bill Grand Total
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#1e293b">
              ₹ {Number(grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Total Received
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#059669">
              ₹ {Number(totalReceived).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Total TDS Deducted
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#475569">
              ₹ {Number(totalTds).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Outstanding Balance
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              color={outstandingBalance <= 0 ? "#059669" : "#dc2626"}
            >
              ₹ {Number(outstandingBalance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Notifications */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{ marginBottom: "16px" }}
        >
          {successMessage}
        </Alert>
      )}

      {fetchError && (
        <Alert
          severity="error"
          onClose={() => setFetchError("")}
          sx={{ marginBottom: "16px" }}
        >
          {fetchError}
        </Alert>
      )}

      {/* Loading state */}
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px",
          }}
        >
          <CircularProgress size={32} />
          <Typography variant="body2" sx={{ ml: 2, color: "text.secondary" }}>
            Loading payment collection history...
          </Typography>
        </Box>
      ) : !billId ? (
        /* New / Unsaved Bill state */
        <Box
          sx={{
            padding: "36px 20px",
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <Typography variant="subtitle1" sx={{ color: "text.secondary", fontWeight: 500 }}>
            Payment collection history will be available after the bill is saved.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.disabled", marginTop: "4px" }}>
            Once this bill is created and saved, any payment collections, TDS deductions, and receipts recorded against it will appear here.
          </Typography>
        </Box>
      ) : history.length === 0 ? (
        /* Empty state for saved bill with no collections */
        <Box
          sx={{
            padding: "36px 20px",
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <Typography variant="subtitle1" sx={{ color: "text.secondary", fontWeight: 500 }}>
            No payment collections found for this bill.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.disabled", marginTop: "4px", marginBottom: "16px" }}>
            Collections made against this bill will be tracked here with their bill number, date, receiving amount, TDS, and payment mode.
          </Typography>
          {outstandingBalance > 0 && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{ textTransform: "none", fontWeight: 600, px: 2 }}
            >
              Record First Payment
            </Button>
          )}
        </Box>
      ) : (
        /* Data Table with exact 8 columns */
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            sx={{
              backgroundColor: "#ffffff",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f4f6f8",
                fontWeight: 600,
                fontSize: "0.875rem",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f8fafc",
              },
            }}
            autoHeight
            density="compact"
            getRowId={(row) => row.id}
            rows={history}
            columns={columns}
            initialState={{
              columns: {
                columnVisibilityModel: {
                  id: false,
                },
              },
            }}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
          />
        </Box>
      )}

      {/* Edit Payment Collection Modal */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
        aria-labelledby="edit-payment-dialog-title"
      >
        <DialogTitle
          id="edit-payment-dialog-title"
          sx={{
            fontWeight: 600,
            borderBottom: "1px solid #e2e8f0",
            pb: 1.5,
          }}
        >
          Edit Payment Collection
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          {selectedRecord && (
            <Box component="form" id="editPaymentForm" onSubmit={handleSaveEdit} noValidate>
              {/* Context Summary Cards (Read-only) */}
              <Box
                sx={{
                  backgroundColor: "#f8fafc",
                  p: 2,
                  borderRadius: "6px",
                  mb: 2.5,
                  border: "1px solid #e2e8f0",
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      Bill No.
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedRecord.bill_no || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      Bill Grand Total
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      ₹ {(grandTotalCents / 100).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      Other Receipts Settled
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="#475569">
                      ₹ {(editOtherSettledCents / 100).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      Max Allowable for Edit
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="#059669">
                      ₹ {(maxPermittedEditCents / 100).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={2}>
                {/* Receiving Amount */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={Boolean(editErrors.receiving_amount)}>
                    <TextField
                      label="Receiving Amount *"
                      name="receiving_amount"
                      type="number"
                      size="small"
                      value={editForm.receiving_amount}
                      onChange={handleFormChange}
                      error={Boolean(editErrors.receiving_amount)}
                      helperText={editErrors.receiving_amount}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                      inputProps={{ min: "0.01", step: "0.01" }}
                    />
                  </FormControl>
                </Grid>

                {/* TDS */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={Boolean(editErrors.tds)}>
                    <TextField
                      label="TDS"
                      name="tds"
                      type="number"
                      size="small"
                      value={editForm.tds}
                      onChange={handleFormChange}
                      error={Boolean(editErrors.tds)}
                      helperText={editErrors.tds}
                      disabled={isSubmitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                      inputProps={{ min: "0", step: "0.01" }}
                    />
                  </FormControl>
                </Grid>

                {/* Payment Mode */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" error={Boolean(editErrors.pay_mode)}>
                    <InputLabel id="payment-mode-label">Payment Mode *</InputLabel>
                    <Select
                      labelId="payment-mode-label"
                      label="Payment Mode *"
                      name="pay_mode"
                      value={editForm.pay_mode}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    >
                      {PAYMENT_MODES.map((mode) => (
                        <MenuItem key={mode} value={mode}>
                          {mode}
                        </MenuItem>
                      ))}
                    </Select>
                    {editErrors.pay_mode && (
                      <FormHelperText>{editErrors.pay_mode}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Receiving Date */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={Boolean(editErrors.receiving_date)}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Receiving Date *"
                        inputFormat="DD/MM/YYYY"
                        value={editForm.receiving_date}
                        disableFuture={true}
                        onChange={(newValue) => {
                          setEditForm((prev) => ({
                            ...prev,
                            receiving_date: newValue,
                          }));
                          if (editErrors.receiving_date) {
                            setEditErrors((prev) => ({
                              ...prev,
                              receiving_date: "",
                            }));
                          }
                        }}
                        disabled={isSubmitting}
                        renderInput={(params) => (
                          <TextField
                            size="small"
                            fullWidth
                            {...params}
                            error={Boolean(editErrors.receiving_date)}
                            helperText={editErrors.receiving_date}
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </FormControl>
                </Grid>

                {/* Bank Name (Optional) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Bank Name"
                    name="bank_name"
                    size="small"
                    fullWidth
                    value={editForm.bank_name}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                    placeholder="e.g. HDFC Bank"
                  />
                </Grid>

                {/* Cheque / RTGS / UTR No (Optional) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cheque / RTGS / UTR No."
                    name="cheque_rtgs_no"
                    size="small"
                    fullWidth
                    value={editForm.cheque_rtgs_no}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                    placeholder="e.g. CHQ123456"
                  />
                </Grid>
              </Grid>

              {/* Live Settlement Calculation for Edit */}
              {(editRecCents > 0 || editTdsCents > 0) && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    backgroundColor: isEditExceeding ? "#fef2f2" : "#f0fdf4",
                    borderRadius: "6px",
                    border: `1px solid ${isEditExceeding ? "#fecaca" : "#bbf7d0"}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: isEditExceeding ? "#b91c1c" : "#166534",
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    Revised Settlement: ₹ {(editSettlementCents / 100).toFixed(2)} (Receiving: ₹ {(editRecCents / 100).toFixed(2)} + TDS: ₹ {(editTdsCents / 100).toFixed(2)})
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isEditExceeding ? "#dc2626" : "#475569",
                      fontWeight: 500,
                      display: "block",
                      mt: 0.5,
                    }}
                  >
                    {isEditExceeding
                      ? `Exceeds allowable settlement (₹ ${(maxPermittedEditCents / 100).toFixed(2)}) by ₹ ${((editSettlementCents - maxPermittedEditCents) / 100).toFixed(2)}! Total cumulative settlement cannot exceed Grand Total.`
                      : `Projected Remaining Balance: ₹ ${(editRemainingAfterCents / 100).toFixed(2)}`}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e2e8f0" }}>
          <Button
            variant="outlined"
            onClick={handleCloseEdit}
            disabled={isSubmitting}
            size="medium"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            form="editPaymentForm"
            disabled={isSubmitting || isEditExceeding || editRecCents <= 0}
            size="medium"
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Collection Modal */}
      <Dialog
        open={addModalOpen}
        onClose={handleCloseAdd}
        maxWidth="sm"
        fullWidth
        aria-labelledby="add-payment-dialog-title"
      >
        <DialogTitle
          id="add-payment-dialog-title"
          sx={{
            fontWeight: 600,
            borderBottom: "1px solid #e2e8f0",
            pb: 1.5,
          }}
        >
          Record Payment Collection
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          {addSubmitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addSubmitError}
            </Alert>
          )}

          <Box component="form" id="addPaymentForm" onSubmit={handleSaveAdd} noValidate>
            {/* Context Summary Cards (Read-only) */}
            <Box
              sx={{
                backgroundColor: "#f8fafc",
                p: 2,
                borderRadius: "6px",
                mb: 2.5,
                border: "1px solid #e2e8f0",
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">
                    Bill No.
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {bill?.billNo || history[0]?.bill_no || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">
                    Bill Grand Total
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    ₹ {(grandTotalCents / 100).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">
                    Already Settled
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#475569">
                    ₹ {(totalSettledCents / 100).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">
                    Allowable Settlement
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#dc2626">
                    ₹ {(outstandingBalanceCents / 100).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Grid container spacing={2}>
              {/* Receiving Amount */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(addErrors.receiving_amount)}>
                  <TextField
                    label="Receiving Amount *"
                    name="receiving_amount"
                    type="number"
                    size="small"
                    value={addForm.receiving_amount}
                    onChange={handleAddFormChange}
                    error={Boolean(addErrors.receiving_amount)}
                    helperText={addErrors.receiving_amount}
                    disabled={isAddSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                    inputProps={{ min: "0.01", max: outstandingBalance, step: "0.01" }}
                  />
                </FormControl>
              </Grid>

              {/* TDS */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(addErrors.tds)}>
                  <TextField
                    label="TDS"
                    name="tds"
                    type="number"
                    size="small"
                    value={addForm.tds}
                    onChange={handleAddFormChange}
                    error={Boolean(addErrors.tds)}
                    helperText={addErrors.tds}
                    disabled={isAddSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                    inputProps={{ min: "0", step: "0.01" }}
                  />
                </FormControl>
              </Grid>

              {/* Payment Mode */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={Boolean(addErrors.pay_mode)}>
                  <InputLabel id="add-payment-mode-label">Payment Mode *</InputLabel>
                  <Select
                    labelId="add-payment-mode-label"
                    name="pay_mode"
                    value={addForm.pay_mode}
                    label="Payment Mode *"
                    onChange={handleAddFormChange}
                    disabled={isAddSubmitting}
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <MenuItem key={mode} value={mode}>
                        {mode}
                      </MenuItem>
                    ))}
                  </Select>
                  {addErrors.pay_mode && (
                    <FormHelperText>{addErrors.pay_mode}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Receiving Date */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Receiving Date *"
                      inputFormat="DD-MM-YYYY"
                      value={addForm.receiving_date}
                      onChange={(newValue) => {
                        setAddForm((prev) => ({
                          ...prev,
                          receiving_date: newValue,
                        }));
                        if (addErrors.receiving_date) {
                          setAddErrors((prev) => ({
                            ...prev,
                            receiving_date: "",
                          }));
                        }
                      }}
                      disabled={isAddSubmitting}
                      renderInput={(params) => (
                        <TextField
                          size="small"
                          fullWidth
                          {...params}
                          error={Boolean(addErrors.receiving_date)}
                          helperText={addErrors.receiving_date}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </FormControl>
              </Grid>

              {/* Bank Name (Optional) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Bank Name"
                  name="bank_name"
                  size="small"
                  fullWidth
                  value={addForm.bank_name}
                  onChange={handleAddFormChange}
                  disabled={isAddSubmitting}
                  placeholder="e.g. HDFC Bank"
                />
              </Grid>

              {/* Cheque / RTGS / UTR No (Optional) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cheque / RTGS / UTR No."
                  name="cheque_rtgs_no"
                  size="small"
                  fullWidth
                  value={addForm.cheque_rtgs_no}
                  onChange={handleAddFormChange}
                  disabled={isAddSubmitting}
                  placeholder="e.g. CHQ123456"
                />
              </Grid>
            </Grid>

            {/* Live Settlement Calculation note */}
            {(addRecCents > 0 || addTdsCents > 0) && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  backgroundColor: isAddExceeding ? "#fef2f2" : "#f0fdf4",
                  borderRadius: "6px",
                  border: `1px solid ${isAddExceeding ? "#fecaca" : "#bbf7d0"}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: isAddExceeding ? "#b91c1c" : "#166534",
                    fontWeight: 600,
                    display: "block",
                  }}
                >
                  Settlement on this receipt: ₹ {(addSettlementCents / 100).toFixed(2)} (Receiving: ₹ {(addRecCents / 100).toFixed(2)} + TDS: ₹ {(addTdsCents / 100).toFixed(2)})
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isAddExceeding ? "#dc2626" : "#475569",
                    fontWeight: 500,
                    display: "block",
                    mt: 0.5,
                  }}
                >
                  {isAddExceeding
                    ? `Exceeds allowable remaining settlement (₹ ${(outstandingBalanceCents / 100).toFixed(2)}) by ₹ ${((addSettlementCents - outstandingBalanceCents) / 100).toFixed(2)}! Total cumulative settlement cannot exceed Grand Total.`
                    : `Projected Remaining Balance: ₹ ${(addRemainingAfterCents / 100).toFixed(2)}`}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e2e8f0" }}>
          <Button
            variant="outlined"
            onClick={handleCloseAdd}
            disabled={isAddSubmitting}
            size="medium"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            form="addPaymentForm"
            disabled={isAddSubmitting || isAddExceeding || addRecCents <= 0}
            size="medium"
            startIcon={isAddSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isAddSubmitting ? "Saving..." : "Save Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PaymentCollectionHistoryCard;
