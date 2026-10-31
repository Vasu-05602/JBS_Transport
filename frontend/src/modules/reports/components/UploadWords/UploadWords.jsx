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
    Description as WordIcon,
    TableChart as TableChartIcon,
} from "@mui/icons-material";
import FileSaver from "file-saver";
import { LoadingSpinner } from "../../../../ui-controls";
import {
    getUploadedWords,
    uploadWord,
    downloadWord,
    deleteWord,
    selectIsLoading,
} from "./slice/UploadWordsSlice";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_WORDS = 5;

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

const UploadWords = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isLoading = useSelector(selectIsLoading);

    const [words, setWords] = useState([]);
    const [httpError, setHttpError] = useState("");

    // Upload area state
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Delete dialog
    const [deleteDialog, setDeleteDialog] = useState({ open: false, doc: null });

    const fileInputRef = useRef(null);
    const selectedFileRef = useRef(null);

    // ─── Fetch list on mount ───────────────────────────────────────────────────

    useEffect(() => {
        fetchWords();
    }, []);

    const fetchWords = () => {
        dispatch(getUploadedWords())
            .then(({ payload = {} }) => {
                const { message } = payload?.data || {};
                if (message) {
                    setHttpError(message);
                } else {
                    setHttpError("");
                    setWords(Array.isArray(payload?.data) ? payload.data : []);
                }
            })
            .catch((error) => setHttpError(error.message));
    };

    // ─── File validation ───────────────────────────────────────────────────────

    const validateFile = (file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        if (!["docx", "doc"].includes(ext)) {
            setHttpError("Only Word documents (.docx / .doc) are allowed.");
            return false;
        }
        if (file.size === 0) {
            setHttpError("The selected Word document is empty (0 bytes).");
            return false;
        }
        return true;
    };

    const onFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            selectedFileRef.current = file;
            setSelectedFile(file);
            setHttpError("");
        }
        e.target.value = "";
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && validateFile(file)) {
            selectedFileRef.current = file;
            setSelectedFile(file);
            setHttpError("");
        }
    }, []);

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const onDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    // ─── Upload ───────────────────────────────────────────────────────────────

    const handleUpload = () => {
        const fileToUpload = selectedFileRef.current;

        if (!fileToUpload) {
            setHttpError("Please select a Word document.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 10;
            });
        }, 150);

        dispatch(uploadWord(fileToUpload))
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
                        selectedFileRef.current = null;
                        fetchWords();
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

    const handleCancel = () => {
        setSelectedFile(null);
        selectedFileRef.current = null;
        setHttpError("");
        setUploadProgress(0);
        setIsUploading(false);
    };

    // ─── Delete ───────────────────────────────────────────────────────────────

    const openDeleteDialog = (doc) => setDeleteDialog({ open: true, doc });
    const closeDeleteDialog = () => setDeleteDialog({ open: false, doc: null });

    const confirmDelete = () => {
        const { doc } = deleteDialog;
        closeDeleteDialog();
        dispatch(deleteWord({ id: doc.id }))
            .then(({ payload = {} }) => {
                const { message } = payload?.data || {};
                if (message) {
                    setHttpError(message);
                } else {
                    setHttpError("");
                    fetchWords();
                }
            })
            .catch((error) => setHttpError(error.message));
    };

    // ─── Download ─────────────────────────────────────────────────────────────

    const handleDownload = (doc) => {
        dispatch(downloadWord({ id: doc.id }))
            .then(({ payload = {} }) => {
                const { message } = payload?.data || {};
                if (message) {
                    setHttpError(message);
                } else {
                    const ext = (doc.original_filename || "").split(".").pop().toLowerCase();
                    const mimeType =
                        ext === "doc"
                            ? "application/msword"
                            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    const blob = new Blob([payload?.data], { type: mimeType });
                    FileSaver.saveAs(blob, doc.original_filename || `document_${doc.id}.${ext || "docx"}`);
                }
            })
            .catch((error) => setHttpError(error.message));
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    const isLimitReached = words.length >= MAX_WORDS;

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
                        <h1 className="pageHead">Upload Word Documents</h1>
                    </div>

                    <ToggleButtonGroup
                        value="word"
                        exclusive
                        size="small"
                        onChange={(e, val) => {
                            if (val === "excel") {
                                navigate("/reports/uploadexcel");
                            }
                        }}
                    >
                        <ToggleButton value="excel">
                            <TableChartIcon fontSize="small" sx={{ mr: 1, color: "success.main" }} />
                            Excel Files
                        </ToggleButton>
                        <ToggleButton value="word" sx={{ fontWeight: 600 }}>
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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <WordIcon sx={{ color: "#185abd" }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Upload Word Document
                            </Typography>
                        </Box>
                        <Chip
                            label={`${words.length} / ${MAX_WORDS} files used`}
                            size="small"
                            color={isLimitReached ? "error" : words.length >= 3 ? "warning" : "default"}
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
                                Upload Limit Reached ({MAX_WORDS} / {MAX_WORDS})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                You have reached the maximum of {MAX_WORDS} Word documents. Please delete an existing file
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
                                        ? "#185abd"
                                        : selectedFile
                                            ? "primary.main"
                                            : "grey.400",
                                    borderRadius: "12px",
                                    padding: "40px 24px",
                                    textAlign: "center",
                                    cursor: isUploading ? "not-allowed" : "pointer",
                                    backgroundColor: dragOver
                                        ? "#edf4fc"
                                        : selectedFile
                                            ? "#f0f7ff"
                                            : "#fafafa",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        borderColor: isUploading ? "grey.400" : "#185abd",
                                        backgroundColor: isUploading ? "#fafafa" : "#edf4fc",
                                    },
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".docx,.doc"
                                    style={{ display: "none" }}
                                    onChange={onFileInputChange}
                                    disabled={isUploading}
                                />

                                {selectedFile ? (
                                    <Box>
                                        <WordIcon sx={{ fontSize: 48, color: "#185abd", mb: 1 }} />
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#104285" }}>
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
                                            Drag & drop your Word document here
                                        </Typography>
                                        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                                            or{" "}
                                            <span style={{ color: "#185abd", textDecoration: "underline" }}>
                                                click to browse
                                            </span>
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                            sx={{ mt: 1, display: "block" }}
                                        >
                                            Supported formats: .docx, .doc &nbsp;·&nbsp; Max {MAX_WORDS} files total
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
                                            Uploading & verifying {selectedFile?.name}…
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
                                    sx={{ backgroundColor: "#185abd", "&:hover": { backgroundColor: "#104285" } }}
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

                {/* ── Uploaded Word Documents List ─────────────────────────────────── */}
                <Paper sx={{ padding: "24px" }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Uploaded Word Documents&nbsp;
                        <Chip
                            label={words.length}
                            size="small"
                            color={words.length === MAX_WORDS ? "error" : "primary"}
                            sx={{ ml: 1 }}
                        />
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {words.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 5 }}>
                            <FileIcon sx={{ fontSize: 48, color: "grey.300", mb: 1 }} />
                            <Typography variant="body2" color="text.disabled">
                                No Word documents uploaded yet.
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
                                    <th>Document Stats</th>
                                    <th>Uploaded On</th>
                                    <th>Status</th>
                                    <th style={{ width: 120, textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {words.map((doc, index) => {
                                    const isDocx = (doc.original_filename || "").toLowerCase().endsWith(".docx");
                                    return (
                                        <tr key={doc.id}>
                                            <td>
                                                <Typography variant="body2" color="text.secondary">
                                                    {index + 1}
                                                </Typography>
                                            </td>

                                            <td>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <WordIcon fontSize="small" sx={{ color: "#185abd" }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {doc.original_filename}
                                                    </Typography>
                                                    <Chip
                                                        label={isDocx ? "DOCX" : "DOC"}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: "0.7rem",
                                                            color: "#185abd",
                                                            borderColor: "#185abd",
                                                        }}
                                                    />
                                                </Box>
                                            </td>

                                            <td>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatFileSize(doc.file_size)}
                                                </Typography>
                                            </td>

                                            <td>
                                                <Typography variant="body2" color="text.secondary">
                                                    {doc.word_count != null
                                                        ? `${doc.word_count} words`
                                                        : "—"}
                                                    {doc.paragraph_count
                                                        ? ` · ${doc.paragraph_count} para${doc.paragraph_count > 1 ? "s" : ""}`
                                                        : ""}
                                                </Typography>
                                            </td>

                                            <td>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDate(doc.created_at)}
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
                                                            onClick={() => handleDownload(doc)}
                                                        >
                                                            <DownloadIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => openDeleteDialog(doc)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                        <strong>{deleteDialog.doc?.original_filename}</strong>? This action cannot be
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

export default UploadWords;
