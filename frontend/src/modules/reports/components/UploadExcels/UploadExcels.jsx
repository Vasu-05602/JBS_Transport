import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Stack,
    Button,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Chip,
    IconButton,
    Tooltip,
    Typography,
    Box,
    Divider,
    LinearProgress,
    ToggleButtonGroup,
    ToggleButton,
} from "@mui/material";
import {
    Download as DownloadIcon,
    Delete as DeleteIcon,
    InsertDriveFile as FileIcon,
    CheckCircle as CheckCircleIcon,
    CloudUpload as CloudUploadIcon,
    Close as CloseIcon,
    TableChart as TableChartIcon,
    Description as WordIcon,
} from "@mui/icons-material";
import FileSaver from "file-saver";
import { LoadingSpinner } from "../../../../ui-controls";
import {
    getUploadedExcels,
    uploadExcel,
    downloadExcel,
    deleteExcel,
    selectIsLoading,
} from "./slice/UploadExcelsSlice";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_EXCELS = 5;

const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

// ─── Component ────────────────────────────────────────────────────────────────

const UploadExcels = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isLoading = useSelector(selectIsLoading);

    const [excels, setExcels] = useState([]);
    const [httpError, setHttpError] = useState("");

    // Upload area state
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Delete dialog
    const [deleteDialog, setDeleteDialog] = useState({ open: false, excel: null });

    const fileInputRef = useRef(null);

    // ─── Fetch list on mount ───────────────────────────────────────────────────

    useEffect(() => {
        fetchExcels();
    }, []);

    const fetchExcels = () => {
        dispatch(getUploadedExcels())
            .then(({ payload = {} }) => {
                const { message } = payload?.data || {};
                if (message) {
                    setHttpError(message);
                } else {
                    setHttpError("");
                    setExcels(payload?.data || []);
                }
            })
            .catch((error) => setHttpError(error.message));
    };

    // ─── File validation ───────────────────────────────────────────────────────

    const validateFile = (file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        if (!["xlsx", "xls"].includes(ext)) {
            setHttpError("Only Excel files (.xlsx / .xls) are allowed.");
            return false;
        }
        return true;
    };


    const selectedFileRef = useRef(null); // ← ADD THIS

    // In onFileInputChange:
    const onFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            selectedFileRef.current = file;   // ← store in ref BEFORE clearing input
            setSelectedFile(file);
            setHttpError("");
        }
        e.target.value = ""; // ← this can kill the File reference in state
    };

    // In onDrop:
    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && validateFile(file)) {
            selectedFileRef.current = file;   // ← store in ref too
            setSelectedFile(file);
            setHttpError("");
        }
    }, []);

    // ─── Drag & Drop handlers ──────────────────────────────────────────────────

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const onDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    // const onDrop = useCallback((e) => {
    //     e.preventDefault();
    //     setDragOver(false);
    //     const file = e.dataTransfer.files?.[0];
    //     if (file && validateFile(file)) {
    //         setSelectedFile(file);
    //         setHttpError("");
    //     }
    // }, []);

    // const onFileInputChange = (e) => {
    //     const file = e.target.files?.[0];
    //     if (file && validateFile(file)) {
    //         setSelectedFile(file);
    //         setHttpError("");
    //     }
    //     e.target.value = "";
    // };

    // ─── Upload ───────────────────────────────────────────────────────────────

    // const handleUpload = () => {
    //     console.log("selectedFile:", selectedFile); //
    //     if (!selectedFile) {
    //         setHttpError("Please select an Excel file.");
    //         return;
    //     }

    //     setIsUploading(true);
    //     setUploadProgress(0);

    //     // Simulate progress while real upload runs
    //     const interval = setInterval(() => {
    //         setUploadProgress((prev) => {
    //             if (prev >= 90) {
    //                 clearInterval(interval);
    //                 return 90;
    //             }
    //             return prev + 10;
    //         });
    //     }, 150);

    //     const formData = new FormData();
    //     formData.append("file", selectedFile);
    //     console.log("FormData entries:");
    //     for (let [key, val] of formData.entries()) {
    //         console.log(key, val); // Should show: "file", File {...}
    //     }
    //     dispatch(uploadExcel(formData))
    //         .then(({ payload = {} }) => {
    //             clearInterval(interval);
    //             setUploadProgress(100);
    //             setTimeout(() => {
    //                 setIsUploading(false);
    //                 setUploadProgress(0);
    //                 const { message } = payload?.data || {};
    //                 if (message) {
    //                     // Backend sends specific error messages (limit reached / duplicate filename)
    //                     setHttpError(message);
    //                 } else {
    //                     setHttpError("");
    //                     setSelectedFile(null);
    //                     fetchExcels();
    //                 }
    //             }, 400);
    //         })
    //         .catch((error) => {
    //             clearInterval(interval);
    //             setIsUploading(false);
    //             setUploadProgress(0);
    //             setHttpError(error.message);
    //         });
    // };

    // const handleCancel = () => {
    //     setSelectedFile(null);
    //     setHttpError("");
    //     setUploadProgress(0);
    //     setIsUploading(false);
    // };


    const handleUpload = () => {
        const fileToUpload = selectedFileRef.current; // ← READ FROM REF

        if (!fileToUpload) {
            setHttpError("Please select an Excel file.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) { clearInterval(interval); return 90; }
                return prev + 10;
            });
        }, 150);

        const formData = new FormData();
        formData.append("file", fileToUpload); // ← USE REF VALUE

        // verify
        for (let [key, val] of formData.entries()) {
            console.log("FormData check:", key, val); // should show File object now
        }

        dispatch(uploadExcel(fileToUpload))
            .then(({ payload = {} }) => {
                clearInterval(interval);
                setUploadProgress(100);
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                    const { message } = payload?.data || {};
                    if (message) {
                        setHttpError(message);
                    } else {
                        setHttpError("");
                        setSelectedFile(null);
                        selectedFileRef.current = null; // ← clear ref too
                        fetchExcels();
                    }
                }, 400);
            })
            .catch((error) => {
                clearInterval(interval);
                setIsUploading(false);
                setUploadProgress(0);
                setHttpError(error.message);
            });
    };

    // In handleCancel — clear ref too:
    const handleCancel = () => {
        setSelectedFile(null);
        selectedFileRef.current = null; // ← clear ref
        setHttpError("");
        setUploadProgress(0);
        setIsUploading(false);
    };


    // ─── Delete ───────────────────────────────────────────────────────────────

    const openDeleteDialog = (excel) => setDeleteDialog({ open: true, excel });
    const closeDeleteDialog = () => setDeleteDialog({ open: false, excel: null });

    const confirmDelete = () => {
        const { excel } = deleteDialog;
        closeDeleteDialog();
        dispatch(deleteExcel({ id: excel.id }))
            .then(({ payload = {} }) => {
                const { message } = payload?.data || {};
                if (message) {
                    setHttpError(message);
                } else {
                    setHttpError("");
                    fetchExcels();
                }
            })
            .catch((error) => setHttpError(error.message));
    };

    // ─── Download ─────────────────────────────────────────────────────────────

    const handleDownload = (excel) => {
        dispatch(downloadExcel({ id: excel.id }))
            .then(({ payload = {} }) => {
                const { message } = payload?.data || {};
                if (message) {
                    setHttpError(message);
                } else {
                    const blob = new Blob([payload?.data], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });
                    FileSaver.saveAs(blob, excel.original_filename || `excel_${excel.id}.xlsx`);
                }
            })
            .catch((error) => setHttpError(error.message));
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    const isLimitReached = excels.length >= MAX_EXCELS;

    return (
        <>
            {isLoading && <LoadingSpinner />}

            <div className="inner-wrap">
                {/* Page header with report upload category toggle */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 2,
                        mb: 2,
                    }}
                >
                    <div className="page_head-1" style={{ marginBottom: 0 }}>
                        <h1 className="pageHead">Upload Excels</h1>
                    </div>

                    <ToggleButtonGroup
                        value="excel"
                        exclusive
                        size="small"
                        onChange={(e, val) => {
                            if (val === "word") {
                                navigate("/reports/uploadword");
                            }
                        }}
                    >
                        <ToggleButton value="excel" sx={{ fontWeight: 600 }}>
                            <TableChartIcon fontSize="small" sx={{ mr: 1, color: "success.main" }} />
                            Excel Files
                        </ToggleButton>
                        <ToggleButton value="word">
                            <WordIcon fontSize="small" sx={{ mr: 1, color: "#185abd" }} />
                            Word Documents
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Error banner */}
                {httpError && (
                    <Stack
                        sx={{
                            width: "100%",
                            margin: "0 0 20px 0",
                            border: "1px solid red",
                            borderRadius: "4px",
                        }}
                        spacing={2}
                    >
                        <Alert severity="error" onClose={() => setHttpError("")}>
                            {httpError}
                        </Alert>
                    </Stack>
                )}

                {/* ── Upload Area ─────────────────────────────────────────────────── */}
                <Paper sx={{ padding: "24px", marginBottom: "24px" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Upload Excel
                        </Typography>
                        <Chip
                            label={`${excels.length} / ${MAX_EXCELS} files used`}
                            size="small"
                            color={isLimitReached ? "error" : excels.length >= 3 ? "warning" : "default"}
                            variant="outlined"
                        />
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    {/* Limit reached notice */}
                    {isLimitReached ? (
                        <Box
                            sx={{
                                border: "1px solid",
                                borderColor: "error.light",
                                borderRadius: "8px",
                                backgroundColor: "#fff5f5",
                                padding: "20px 24px",
                                textAlign: "center",
                            }}
                        >
                            <Typography variant="body1" sx={{ fontWeight: 600, color: "error.main", mb: 0.5 }}>
                                Upload Limit Reached (5 / 5)
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                You have reached the maximum of 5 Excel files. Please delete an existing file
                                from the list below before uploading a new one.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Drag & Drop zone */}
                            <Box
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                sx={{
                                    border: "2px dashed",
                                    borderColor: dragOver
                                        ? "primary.main"
                                        : selectedFile
                                            ? "success.main"
                                            : "grey.400",
                                    borderRadius: "12px",
                                    padding: "40px 24px",
                                    textAlign: "center",
                                    cursor: isUploading ? "not-allowed" : "pointer",
                                    backgroundColor: dragOver
                                        ? "#e3f2fd"
                                        : selectedFile
                                            ? "#f1f8e9"
                                            : "#fafafa",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        borderColor: isUploading ? "grey.400" : "primary.main",
                                        backgroundColor: isUploading ? "#fafafa" : "#e3f2fd",
                                    },
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    style={{ display: "none" }}
                                    onChange={onFileInputChange}
                                    disabled={isUploading}
                                />

                                {selectedFile ? (
                                    <Box>
                                        <TableChartIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: "success.dark" }}>
                                            {selectedFile.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            File size: <strong>{formatFileSize(selectedFile.size)}</strong>
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">
                                            Click or drag another file to replace
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box>
                                        <CloudUploadIcon sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                                        <Typography variant="body1" sx={{ fontWeight: 500, color: "text.secondary" }}>
                                            Drag & drop your Excel file here
                                        </Typography>
                                        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                                            or{" "}
                                            <span style={{ color: "#1976d2", textDecoration: "underline" }}>
                                                click to browse
                                            </span>
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                            sx={{ mt: 1, display: "block" }}
                                        >
                                            Supported formats: .xlsx, .xls &nbsp;·&nbsp; Max 5 files total
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Progress bar */}
                            {isUploading && (
                                <Box sx={{ mt: 2 }}>
                                    <Box
                                        sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
                                    >
                                        <Typography variant="caption" color="text.secondary">
                                            Uploading {selectedFile?.name}…
                                        </Typography>
                                        <Typography variant="caption" color="primary">
                                            {uploadProgress}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={uploadProgress}
                                        sx={{ borderRadius: 4, height: 6 }}
                                    />
                                </Box>
                            )}

                            {/* Upload / Cancel buttons */}
                            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                                <Button
                                    variant="contained"
                                    size="medium"
                                    startIcon={<CloudUploadIcon />}
                                    onClick={handleUpload}
                                    disabled={!selectedFile || isUploading}
                                >
                                    {isUploading ? "Uploading…" : "Upload"}
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="medium"
                                    startIcon={<CloseIcon />}
                                    onClick={handleCancel}
                                    disabled={isUploading}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </>
                    )}
                </Paper>

                {/* ── Uploaded Excels List ─────────────────────────────────────────── */}
                <Paper sx={{ padding: "24px" }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Uploaded Excel Files&nbsp;
                        <Chip
                            label={excels.length}
                            size="small"
                            color={excels.length === MAX_EXCELS ? "error" : "primary"}
                            sx={{ ml: 1 }}
                        />
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {excels.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 5 }}>
                            <FileIcon sx={{ fontSize: 48, color: "grey.300", mb: 1 }} />
                            <Typography variant="body2" color="text.disabled">
                                No Excel files uploaded yet.
                            </Typography>
                        </Box>
                    ) : (
                        <Box
                            component="table"
                            sx={{
                                width: "100%",
                                borderCollapse: "collapse",
                                "& th, & td": {
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                },
                                "& th": {
                                    backgroundColor: "grey.100",
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    color: "text.secondary",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                },
                                "& tr:last-child td": { borderBottom: "none" },
                                "& tbody tr:hover": { backgroundColor: "action.hover" },
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ width: 60 }}>Sr. No.</th>
                                    <th>File Name</th>
                                    <th>File Size</th>
                                    <th>Uploaded On</th>
                                    <th>Status</th>
                                    <th style={{ width: 120, textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {excels.map((excel, index) => (
                                    <tr key={excel.id}>
                                        <td>
                                            <Typography variant="body2" color="text.secondary">
                                                {index + 1}
                                            </Typography>
                                        </td>

                                        <td>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <TableChartIcon fontSize="small" sx={{ color: "success.main" }} />
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {excel.original_filename}
                                                </Typography>
                                            </Box>
                                        </td>

                                        <td>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatFileSize(excel.file_size)}
                                            </Typography>
                                        </td>

                                        <td>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(excel.created_at)}
                                            </Typography>
                                        </td>

                                        <td>
                                            <Chip
                                                icon={<CheckCircleIcon />}
                                                label="Uploaded"
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
                                        </td>

                                        <td>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 1,
                                                }}
                                            >
                                                <Tooltip title="Download">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleDownload(excel)}
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => openDeleteDialog(excel)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Box>
                    )}
                </Paper>
            </div>

            {/* ── Delete Confirmation Dialog ─────────────────────────────────────── */}
            <Dialog open={deleteDialog.open} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete{" "}
                        <strong>{deleteDialog.excel?.original_filename}</strong>? This action cannot be
                        undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDeleteDialog} variant="outlined">
                        No
                    </Button>
                    <Button onClick={confirmDelete} variant="contained" color="error">
                        Yes, Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default UploadExcels;