const {
  generatePdfBase64,
  buildLorryReceiptDocDefinition,
  buildLoadingSlipDocDefinition,
  buildBillDocDefinition,
  paginateBillTransactions,
  buildQuotationDocDefinition,
  buildVoucherDocDefinition,
  buildLorryReceiptEnDocDefinition,
} = require("../services/pdf");
const numberToWords = require("number-to-words");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { parseWordDocument } = require("../utils/wordParser");

let options = {
  format: "A4",
  orientation: "portrait",
  height: "10.5in",
  width: "8in",
};

const toMySQLDateTime = (isoString) => {
  if (!isoString) return null;
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
  // "2026-07-31 17:27:28"
};

const toMySQLDate = (isoString) => {
  if (!isoString) return null;
  return new Date(isoString).toISOString().slice(0, 10); // "2026-07-31"
};


//const options2 = {
//format: "A4",
//type: "pdf",
//orientation: "portrait",
// height: "10.5in",
// width: "8in",
// paginationOffset: 1,
// footer: {
// height: "15mm",
//contents: {
// default:
//    '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
// },
//},
//};
const numWords = require("num-words");
const ExcelJS = require("exceljs");
const Branch = require("../models/Branch");
const LorryReceipt = require("../models/LorryReceipt");
const LoadingSlip = require("../models/LoadingSlip");
const Customer = require("../models/Customer");
const MoneyTransfer = require("../models/MoneyTransfer");
const PettyTransaction = require("../models/PettyTransaction");
const Bill = require("../models/Bill");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const SuppliersBill = require("../models/SuppliersBill");
const Supplier = require("../models/Supplier");
// const Quotation = require("../models/Quotation");
const RateMaster = require("../models/RateMaster");
const sendEmail = require("../controller/email");
const { translator } = require("./openAI");
const Place = require("../models/Place");
const { TO_BILLED } = require("../utils/constant");
const { sortArray, hasHindiCharacters } = require("../utils");
const { some, map } = require("lodash");
const pool = require("../database/db.js");

// const getLorryReceipts = async (req, res, next) => {
//   const { branch, search, lsId, branches, from, to } = req.body;
//   const query = { active: true };

//   if (branch) {
//     query.branch = branch;
//   }
//   if (branches) {
//     query.branch = { $in: branches };
//   }
//   if (search) {
//     query.lrNo = { $regex: new RegExp(search?.trim?.()), $options: "i" };
//     query["$or"] = [{ associatedLS: "" }, { associatedLS: lsId }];
//   } else if (lsId) {
//     query.associatedLS = lsId;
//   }
//   if (from) {
//     const date = new Date(from);
//     const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//     const newDate = new Date(updatedDate)?.setUTCHours(0, 0, 0, 000);
//     query.date = {
//       ...query.date,
//       $gte: new Date(newDate)?.toISOString(),
//     };
//   }
//   if (to) {
//     const date = new Date(to);
//     const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//     const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
//     query.date = {
//       ...query.date,
//       $lte: new Date(newDate)?.toISOString(),
//     };
//   }
//   try {
//     const lorryReceipts = await LorryReceipt.find(query)
//       .sort("-createdAt")
//       .limit(1000)
//       .lean();
//     res.json(lorryReceipts);
//   } catch (lrError) {
//     return res.status(200).json({
//       message: "Error fetching lorry receipts!",
//     });
//   }
// };
const fetchAndFormatLrNos = async (lrIds) => {
  const lrNoQuery = `
    SELECT lm.id, 
           CONCAT((SELECT branch_abbreviation FROM branch WHERE branch_id = lm.branch), "-", lm.lr_no) AS lr_no 
    FROM lorry_reciept_master lm 
    WHERE lm.id IN (?)`;

  try {
    const [lrNoResults] = await pool.query(lrNoQuery, [lrIds]);

    return lrNoResults;
  } catch (err) {
    console.error("Error executing lrNoQuery:", err);
    throw new Error("Server error");
  }
};

const getLorryReceipts = async (req, res) => {
  const { branches, lsId } = req.body;
  const lrIdQuery = "SELECT lr_id FROM dc_transactions WHERE dc_master_id = ?";
  try {
    const [lrResults] = await pool.query(lrIdQuery, [lsId]);

    if (lrResults.length === 0) {
      return res.status(404).send("No lr_id found for the given id");
    }
    const lrIds = lrResults.map((row) => row.lr_id);

    let lrdata = [];
    if (lrIds.length > 0) {
      lrdata = await fetchAndFormatLrNos(lrIds);
    }
    const query = "CALL lorrymasterlistfordc(?)";
    const [results] = await pool.query(query, [branches]);
    const formattedResults = results[0].map((dc) => {
      return {
        id: dc.id,
        lrNo: dc.lr_info,
      };
    });
    lrdata.forEach((item) => {
      formattedResults.push({
        id: item.id,
        lrNo: item.lr_no,
      });
    });

    return res.json(formattedResults);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).send("Server error");
  }
};

const getLorryReceiptsFO = async (req, res, next) => {
  const { branch, search } = req.body;
  const query = { active: true };

  if (branch) {
    query.branch = branch;
  }

  if (search) {
    query.lrNo = { $regex: new RegExp(search?.trim?.()), $options: "i" };
  }

  try {
    const lorryReceipts = await LorryReceipt.find(query)
      .sort("-createdAt")
      .limit(1000)
      .lean();
    res.json(lorryReceipts);
  } catch (lrError) {
    return res.status(200).json({
      message: "Error fetching lorry receipts!",
    });
  }
};

const getlrdetailsforloadsheet = async (req, res) => {
  const selectedIds = req.body.join(",");
  const query = "CALL getlrdetailsforloadsheet(?)";

  try {
    const [results] = await pool.query(query, [selectedIds]);
    const data = results[0];
    const transformedResults = data.map((item) => {
      return {
        lrNo: item.lr_no,
        date: item.lr_date,
        consignorName: item.consigner,
        consigneeName: item.consignee,
        from: item.from_loc,
        to: item.to_loc,
        article: item.noofarticles,
        weight: item.weight,
        total: item.total,
        id: item.id,
        payType: item.pay_type,
      };
    });

    return res.json(transformedResults);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).send("Server error");
  }
};

const getLorryReceiptsForLS = async (req, res, next) => {
  try {
    const { search } = req.body;
    const [results] = await pool.query("CALL lorrymasterlistfordc(?)", [
      search,
    ]);
    const formattedResults = results[0].map((item) => ({
      id: item.id,
      lrNo: item.lr_info,
    }));

    return res.json({
      lorryReceipts: formattedResults,
      count: formattedResults.length,
      isLastPage: formattedResults.length < 1000,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching lorry receipts!",
      error: error.message,
    });
  }
};

// const getLorryReceiptsWithCount = async (req, res, next) => {
//   try {
//     const { pagination, branch, search, showUnAcknowledge } = req.body;
//     const { page = 1, limit = 100 } = pagination || {};
//     const start = (page - 1) * limit;
//     const param = { branch, active: true };

//     if (!branch || !pagination.page || !pagination.limit) {
//       return res
//         .status(200)
//         .json({ message: "Branch ID & pagination is required!" });
//     }

//     if (search) {
//       const searchText = new RegExp(search);
//       let isoDate = search;
//       const date = new Date(search);
//       if (date instanceof Date && !isNaN(date)) {
//         const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//         const date2 = new Date(updatedDate).toISOString().split("T")[0];
//         if (date2?.split("-")[0]?.length === 4) {
//           isoDate = date2;
//         }
//       }
//       param["$or"] = [
//         { lrNo: { $regex: searchText, $options: "i" } },
//         {
//           date: { $regex: new RegExp(isoDate), $options: "i" },
//         },
//         { consignorName: { $regex: searchText, $options: "i" } },
//         { consigneeName: { $regex: searchText, $options: "i" } },
//         { from: { $regex: searchText, $options: "i" } },
//         { to: { $regex: searchText, $options: "i" } },
//         { payType: { $regex: searchText, $options: "i" } },
//         ...(!isNaN(search) ? [{ total: parseFloat(search) }] : []),
//       ];
//     }

//     if (showUnAcknowledge) {
//       if (param["$or"]) {
//         param["$and"] = [
//           { $or: [{ deliveryDate: null }, { deliveryDate: "" }] },
//           { $or: param["$or"] },
//         ];
//       } else {
//         param["$or"] = [{ deliveryDate: null }, { deliveryDate: "" }];
//       }
//     }

//     const lorryReceipts = await LorryReceipt.find(
//       param,
//       "_id lrNo date consignorName from consigneeName to payType total status invoiceNo deliveryDate transactions"
//     )
//       .sort("-createdAt")
//       .skip(start)
//       .limit(limit)
//       .lean();

//     const count = await LorryReceipt.countDocuments(param);
//     res.json({
//       lorryReceipts,
//       count,
//       isLastPage: false,
//     });
//   } catch (error) {
//     res.status(200).json({
//       message: "Error fetching lorry receipts!",
//       error: error.message,
//     });
//   }
// };

const getLorryReceiptsWithCount = async (req, res, next) => {
  try {
    const { pagination = {}, branch, search, userd_id } = req.body;
    const { page = 1, limit = 100 } = pagination;
    const start = (page - 1) * limit;
    if (!branch || !pagination.page || !pagination.limit) {
      return res
        .status(400)
        .json({ message: "Branch ID & pagination are required!" });
    }
    const [results] = await pool.query("CALL getalllorryreceipts(?,?)", [
      branch,
      userd_id,
    ]);
    let lorryReceipts = results[0];
    const statusMapping = {
      1: "New",
      2: "Challan",
      3: "Billed",
      4: "Acknowledgment",
      5: "Local Memo",
      6: "Paid",
    };
    lorryReceipts = lorryReceipts.map((receipt) => ({
      id: receipt.id,
      lr_no: receipt.lr_no,
      lr_date: receipt.lr_date,
      consigner: receipt.consigner,
      loc_from: receipt.loc_from,
      consignee: receipt.consignee,
      loc_to: receipt.loc_to,
      total: receipt.total,
      status: statusMapping[receipt.lr_status] || "Unknown",
      fileloc: receipt.fileloc,
      pay_type: receipt.pay_type,
      no_of_articles: receipt.no_of_articles,
      invoiceNo: receipt.InvoiceNo,
    }));
    const filterReceipts = (receipts, searchText) => {
      const regex = new RegExp(searchText, "i");
      return receipts.filter(
        (receipt) =>
          regex.test(receipt.lr_no) ||
          regex.test(receipt.consigner) ||
          regex.test(receipt.consignee) ||
          regex.test(receipt.loc_from) ||
          regex.test(receipt.loc_to) ||
          regex.test(receipt.pay_type),
      );
    };

    let filteredReceipts = search
      ? filterReceipts(lorryReceipts, search)
      : lorryReceipts;

    const count = filteredReceipts.length;
    const paginatedReceipts = filteredReceipts.slice(start, start + limit);

    res.json({
      lorryReceipts: paginatedReceipts,
      count,
      isLastPage: start + limit >= count,
    });
  } catch (error) {
    console.error("Error fetching lorry receipts:", error);
    res.status(500).json({
      message: "Error fetching lorry receipts!",
      error: error.message,
    });
  }
};

const getRateMasterForLR = async (req, res, next) => {
  try {
    const { customer_id, article_id, to_id } = req.body;
    if (!customer_id || !article_id || !to_id) {
      return res
        .status(400)
        .json({ message: "customer_id, article_id, and to_id are required!" });
    }
    const [results] = await pool.query("CALL getratemasterforLR(?, ?, ?)", [
      customer_id,
      article_id,
      to_id,
    ]);
    if (results && results[0] && results[0].length > 0) {
      const rateDetails = results[0][0];
      const { rate, Hamalirate } = rateDetails;
      return res.json({
        rate,
        HamaliRate: Hamalirate,
      });
    } else {
      return res.status(404).json({
        message:
          "No matching rate or Hamali rate found for the provided customer_id, article_id, and to_id!",
      });
    }
  } catch (error) {
    console.error("Error fetching rate master for LR:", error);
    res.status(500).json({
      message: "Error fetching rate master for LR!",
      error: error.message,
    });
  }
};

const getClientLorryReceiptsWithCount = async (req, res, next) => {
  try {
    const { pagination = {}, user_id, search } = req.body;
    const { page = 1, limit = 100 } = pagination;
    const start = (page - 1) * limit;

    if (!user_id || !pagination.page || !pagination.limit) {
      return res
        .status(400)
        .json({ message: "Branch ID & pagination are required!" });
    }
    const [results] = await pool.query("CALL getalllorryreceipts_by_user(?)", [
      user_id,
    ]);
    let lorryReceipts = results[0];
    const statusMapping = {
      1: "New",
      2: "Challan",
      3: "Billed",
      4: "Acknowledgment",
      5: "Local Memo",
      6: "Paid",
    };

    lorryReceipts = lorryReceipts.map((receipt) => ({
      id: receipt.id,
      lr_no: receipt.lr_no,
      lr_date: receipt.lr_date,
      consigner: receipt.consigner,
      loc_from: receipt.loc_from,
      consignee: receipt.consignee,
      loc_to: receipt.loc_to,
      total: receipt.total,
      status: statusMapping[receipt.lr_status] || "Unknown",
      fileloc: receipt.fileloc,
      pay_type: receipt.pay_type,
      no_of_articles: receipt.no_of_articles,
      invoiceNo: receipt.InvoiceNo,
    }));

    // Modify filterReceipts to trim search text and apply regex
    const filterReceipts = (receipts, searchText) => {
      const trimmedSearchText = searchText.trim(); // Trim search text before using it
      const regex = new RegExp(trimmedSearchText, "i");
      return receipts.filter(
        (receipt) =>
          regex.test(receipt.lr_no) ||
          regex.test(receipt.consigner) ||
          regex.test(receipt.consignee) ||
          regex.test(receipt.loc_from) ||
          regex.test(receipt.loc_to) ||
          regex.test(receipt.pay_type) ||
          regex.test(receipt.invoiceNo),
      );
    };

    let filteredReceipts = search
      ? filterReceipts(lorryReceipts, search)
      : lorryReceipts;

    const count = filteredReceipts.length;
    const paginatedReceipts = filteredReceipts.slice(start, start + limit);

    res.json({
      lorryReceipts: paginatedReceipts,
      count,
      isLastPage: start + limit >= count,
    });
  } catch (error) {
    console.error("Error fetching lorry receipts:", error);
    res.status(500).json({
      message: "Error fetching lorry receipts!",
      error: error.message,
    });
  }
};

const UPLOAD_DIR = path.join(__dirname, "../uploads/excels");

// Create folder if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Remove label dependency — just use timestamp + original name
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".xlsx" || ext === ".xls") {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files (.xlsx / .xls) are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

// Export multer middleware so the router can use it
const uploadMiddleware = upload.single("file");

// ─────────────────────────────────────────────────────────────────────────────
// GET /upload-excels  →  list all uploaded excels
// ─────────────────────────────────────────────────────────────────────────────
const getUploadedExcels = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, original_filename, saved_filename, file_size, created_at
       FROM uploaded_excels
       ORDER BY created_at DESC`,
    );
    return res.json(rows);
  } catch (error) {
    console.error("getUploadedExcels error:", error);
    return res.status(500).json({ message: "Error fetching uploaded excels!" });
  }
};

const uploadExcelFile = async (req, res, next) => {
  console.log("req.file:", req.file);
  console.log("req.body:", req.body);
  console.log("Content-Type:", req.headers["content-type"]);
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // ── Check 1: Max 5 files ───────────────────────────────────────────────
    const [[{ count }]] = await pool.query(
      "SELECT COUNT(*) AS count FROM uploaded_excels",
    );

    if (count >= 5) {
      // Clean up the uploaded temp file since we won't save it
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      return res.json({
        message:
          "Upload limit reached! You can upload a maximum of 5 Excel files. " +
          "Please delete an existing file before uploading a new one.",
      });
    }

    // ── Check 2: Duplicate filename ────────────────────────────────────────
    const [existing] = await pool.query(
      "SELECT id FROM uploaded_excels WHERE original_filename = ?",
      [file.originalname],
    );

    if (existing.length > 0) {
      // Clean up the uploaded temp file since we won't save it
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      return res.json({
        message:
          `A file named "${file.originalname}" already exists. ` +
          "Please delete that file first and then upload the new one.",
      });
    }

    // ── All clear: Insert record ───────────────────────────────────────────
    await pool.query(
      `INSERT INTO uploaded_excels (original_filename, saved_filename, file_path, file_size)
       VALUES (?, ?, ?, ?)`,
      [file.originalname, file.filename, file.path, file.size],
    );

    return res.json({ message: null, success: true });
  } catch (error) {
    console.error("uploadExcelFile error:", error);
    // Clean up uploaded file if DB insert failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: "Error uploading excel file!" });
  }
};

const downloadExcelFile = async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Excel ID is required." });
    }

    const [rows] = await pool.query(
      "SELECT original_filename, file_path FROM uploaded_excels WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Excel file not found." });
    }

    const { original_filename, file_path } = rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ message: "File not found on disk." });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${original_filename}"`,
    );

    const fileStream = fs.createReadStream(file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error("downloadExcelFile error:", error);
    return res.status(500).json({ message: "Error downloading excel file!" });
  }
};

const deleteExcelFile = async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Excel ID is required." });
    }

    const [rows] = await pool.query(
      "SELECT file_path FROM uploaded_excels WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Excel record not found." });
    }

    const { file_path } = rows[0];

    // Delete file from disk
    if (fs.existsSync(file_path)) {
      fs.unlinkSync(file_path);
    }

    // Delete record from DB
    await pool.query("DELETE FROM uploaded_excels WHERE id = ?", [id]);

    return res.json({ message: null, success: true });
  } catch (error) {
    console.error("deleteExcelFile error:", error);
    return res.status(500).json({ message: "Error deleting excel file!" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Word Document Upload & Management (/reports/uploadword)
// ─────────────────────────────────────────────────────────────────────────────

const UPLOAD_WORDS_DIR = path.join(__dirname, "../uploads/words");

if (!fs.existsSync(UPLOAD_WORDS_DIR)) {
  fs.mkdirSync(UPLOAD_WORDS_DIR, { recursive: true });
}

const wordStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_WORDS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const wordFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".docx" || ext === ".doc") {
    cb(null, true);
  } else {
    cb(new Error("Only Word documents (.docx / .doc) are allowed."), false);
  }
};

const uploadWord = multer({ storage: wordStorage, fileFilter: wordFileFilter });

// Export multer middleware for Word uploads
const uploadWordMiddleware = (req, res, next) => {
  uploadWord.single("file")(req, res, (err) => {
    if (err) {
      return res.json({ message: err.message || "File upload error" });
    }
    next();
  });
};

const getUploadedWords = async (req, res, next) => {
  try {
    // Ensure table exists
    await pool.query(
      `CREATE TABLE IF NOT EXISTS uploaded_words (
        id INT(11) NOT NULL AUTO_INCREMENT,
        label VARCHAR(255) DEFAULT NULL,
        original_filename VARCHAR(255) NOT NULL,
        saved_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT(20) NOT NULL DEFAULT 0,
        word_count INT(11) NOT NULL DEFAULT 0,
        paragraph_count INT(11) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY label (label)
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1;`
    );

    const [rows] = await pool.query(
      `SELECT id, original_filename, saved_filename, file_size, word_count, paragraph_count, created_at
       FROM uploaded_words
       ORDER BY created_at DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error("getUploadedWords error:", error);
    return res.status(500).json({ message: "Error fetching uploaded Word documents!" });
  }
};

const uploadWordFile = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // ── Check 1: Max 5 files (consistent with Excel upload limits) ────────────
    const [[{ count }]] = await pool.query(
      "SELECT COUNT(*) AS count FROM uploaded_words"
    );

    if (count >= 5) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      return res.json({
        message:
          "Upload limit reached! You can upload a maximum of 5 Word files. " +
          "Please delete an existing file before uploading a new one.",
      });
    }

    // ── Check 2: Duplicate filename ──────────────────────────────────────────
    const [existing] = await pool.query(
      "SELECT id FROM uploaded_words WHERE original_filename = ?",
      [file.originalname]
    );

    if (existing.length > 0) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      return res.json({
        message:
          `A file named "${file.originalname}" already exists. ` +
          "Please delete that file first and then upload the new one.",
      });
    }

    // ── Check 3: Word parsing, structure & emptiness validation ──────────────
    let parsedData;
    try {
      parsedData = await parseWordDocument(file.path, file.originalname);
    } catch (parseError) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.json({
        message: parseError.message || "Invalid Word document.",
      });
    }

    // ── Check 4: Insert record with extracted document metrics ───────────────
    await pool.query(
      `INSERT INTO uploaded_words (original_filename, saved_filename, file_path, file_size, word_count, paragraph_count)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        file.originalname,
        file.filename,
        file.path,
        file.size,
        parsedData?.wordCount || 0,
        parsedData?.paragraphCount || 0,
      ]
    );

    return res.json({ message: null, success: true });
  } catch (error) {
    console.error("uploadWordFile error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: "Error uploading Word document!" });
  }
};

const downloadWordFile = async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Word document ID is required." });
    }

    const [rows] = await pool.query(
      "SELECT original_filename, file_path FROM uploaded_words WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Word document not found." });
    }

    const { original_filename, file_path } = rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ message: "File not found on disk." });
    }

    const ext = path.extname(original_filename).toLowerCase();
    const contentType =
      ext === ".docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${original_filename}"`
    );

    const fileStream = fs.createReadStream(file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error("downloadWordFile error:", error);
    return res.status(500).json({ message: "Error downloading Word document!" });
  }
};

const deleteWordFile = async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Word document ID is required." });
    }

    const [rows] = await pool.query(
      "SELECT file_path FROM uploaded_words WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Word document record not found." });
    }

    const { file_path } = rows[0];

    if (fs.existsSync(file_path)) {
      fs.unlinkSync(file_path);
    }

    await pool.query("DELETE FROM uploaded_words WHERE id = ?", [id]);

    return res.json({ message: null, success: true });
  } catch (error) {
    console.error("deleteWordFile error:", error);
    return res.status(500).json({ message: "Error deleting Word document!" });
  }
};

const exportToExcelLorryReceipt = async (req, res, next) => {
  try {
    const { branch, search, showUnAcknowledge } = req.body;
    let query = `
      SELECT 
        lrm.id, 
        CONCAT(
    (SELECT branch_abbreviation 
     FROM branch 
     WHERE branch_id = lrm.branch
    ), 
    "-", 
    lrm.lr_no
  ) AS lr_no, 
        lrm.lr_date, 
        lrm.consigner, 
        lrm.loc_from, 
        p1.place_name AS loc_from_name, 
        lrm.consignee, 
        lrm.loc_to, 
        p2.place_name AS loc_to_name, 
        c1.customer_name AS consigner_name, 
        c2.customer_name AS consignee_name, 
        lrm.pay_type, 
        lrm.total, 
        lrm.lr_status, 
        lrm.InvoiceNo
      FROM 
        lorry_reciept_master lrm
      JOIN 
        customer c1 ON lrm.consigner = c1.customer_id 
      JOIN 
        customer c2 ON lrm.consignee = c2.customer_id 
      JOIN 
        place p1 ON lrm.loc_from = p1.place_id 
      JOIN 
        place p2 ON lrm.loc_to = p2.place_id`;

    const queryParams = [];
    const conditions = [];

    if (branch) {
      conditions.push("lrm.branch = ?");
      queryParams.push(branch);
    }

    if (search) {
      const searchText = `%${search}%`;
      conditions.push(`lrm.lr_no LIKE ? OR
                       lrm.lr_date LIKE ? OR
                       lrm.consigner LIKE ? OR
                       lrm.consignee LIKE ? OR
                       lrm.loc_from LIKE ? OR
                       lrm.loc_to LIKE ? OR
                       lrm.pay_type LIKE ?`);
      const date = new Date(search);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split("T")[0];
        conditions.push("lrm.lr_date = ?");
        queryParams.push(isoDate);
      }
      queryParams.push(
        searchText,
        searchText,
        searchText,
        searchText,
        searchText,
        searchText,
      );
    }

    if (showUnAcknowledge) {
      conditions.push("(delivery_date IS NULL OR delivery_date = '')");
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const [lorryReceipts] = await pool.query(query, queryParams);

    // Reverse the data order here
    const reversedReceipts = lorryReceipts.reverse();

    // Generate Excel workbook
    const workbook = exportLorryReceiptToXlsx(
      reversedReceipts.map((lr, index) => ({
        ...lr,
        srNo: index + 1,
        formattedDate: getFormattedDate(lr.lr_date),
      })),
    );

    // Set headers for the Excel file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=lorry_receipts.xlsx",
    );

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error("Error fetching lorry receipts:", error);
    res.status(500).json({
      message: "Error fetching lorry receipts!",
      error: error.message,
    });
  }
};

const exportUnacknowledged = async (req, res, next) => {
  try {
    const { pagination, branch } = req.body;
    const { page = 1, limit = 100, search } = pagination || {};
    const start = (page - 1) * limit;

    if (!branch || !pagination.page || !pagination.limit) {
      return res
        .status(200)
        .json({ message: "Branch ID & pagination is required!" });
    }

    const param = {
      active: true,
      branch: req.body.branch,
    };

    if (req.body.query.startDate) {
      const date = new Date(req.body.query.startDate);
      const updatedDate = new Date(date).setDate(date?.getDate());
      const newDate = new Date(updatedDate)?.setUTCHours(0, 0, 0, 000);
      param.date = {
        ...param.date,
        $gte: new Date(newDate)?.toISOString(),
      };
    }
    if (req.body.query.endDate) {
      const date = new Date(req.body.query.endDate);
      const updatedDate = new Date(date).setDate(date?.getDate() + 1);
      const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
      param.date = {
        ...param.date,
        $lte: new Date(newDate)?.toISOString(),
      };
    }

    if (req.body.query.showUnAcknowledge) {
      if (search) {
        const searchText = new RegExp(search);
        let isoDate = search;
        const date = new Date(search);
        if (date instanceof Date && !isNaN(date)) {
          const updatedDate = new Date(date).setDate(date?.getDate() + 1);
          const date2 = new Date(updatedDate).toISOString().split("T")[0];
          if (date2?.split("-")[0]?.length === 4) {
            isoDate = date2;
          }
        }
        param["$or"] = [
          { lrNo: { $regex: searchText, $options: "i" } },
          {
            date: { $regex: new RegExp(isoDate), $options: "i" },
          },
          { consignorName: { $regex: searchText, $options: "i" } },
          { consigneeName: { $regex: searchText, $options: "i" } },
          { from: { $regex: searchText, $options: "i" } },
          { to: { $regex: searchText, $options: "i" } },
          {
            "loadingSlipDetails.vehicleNo": {
              $regex: searchText,
              $options: "i",
            },
          },
          { payType: { $regex: searchText, $options: "i" } },
          ...(!isNaN(search) ? [{ total: parseFloat(search) }] : []),
        ];
      }
      if (param["$or"]) {
        param["$and"] = [
          { $or: [{ deliveryDate: null }, { deliveryDate: "" }] },
          { $or: param["$or"] },
        ];
      } else {
        param["$or"] = [{ deliveryDate: null }, { deliveryDate: "" }];
      }
    }
    const lorryReceipts = await LorryReceipt.aggregate(
      [
        { $sort: { createdAt: -1 } },
        {
          $addFields: {
            lsNo: {
              $cond: {
                if: { $eq: ["$memoNo", ""] },
                then: null,
                else: { $toInt: "$memoNo" },
              },
            },
          },
        },
        {
          $lookup: {
            from: "loadingSlip",
            localField: "lsNo",
            foreignField: "lsNo",
            as: "loadingSlipDetails",
          },
        },
        {
          $unwind: {
            path: "$loadingSlipDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: param },
        { $limit: limit },
        { $skip: start },
      ],
      {
        allowDiskUse: true,
      },
    );

    const workbook = exportUnacknowledgedToXlsx(
      map(lorryReceipts, (lr, index) => {
        const totalArticles = lr.transactions?.reduce(
          (sum, { articleNo }) => sum + parseFloat(articleNo || 0),
          0,
        );
        return {
          ...lr,
          srNo: index + 1,
          formattedDate: getFormattedDate(lr.date),
          vehicleNo: lr.loadingSlipDetails?.vehicleNo || "",
          noOfArticle: totalArticles,
        };
      }),
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=" + "bill.xlsx");
    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  } catch (error) {
    res.status(200).json({
      message: "Error fetching lorry receipts!",
      error: error.message,
    });
  }
};

const getLRAckWithCount = async (req, res, next) => {
  try {
    const { pagination, branch } = req.body;
    const { page = 1, limit = 100, search } = pagination || {};
    const start = (page - 1) * limit;

    if (!branch || !pagination.page || !pagination.limit) {
      return res
        .status(200)
        .json({ message: "Branch ID & pagination is required!" });
    }

    const param = {
      active: true,
      branch: req.body.branch,
    };

    if (req.body.query.startDate) {
      const date = new Date(req.body.query.startDate);
      const updatedDate = new Date(date).setDate(date?.getDate());
      const newDate = new Date(updatedDate)?.setUTCHours(0, 0, 0, 000);
      param.date = {
        ...param.date,
        $gte: new Date(newDate)?.toISOString(),
      };
    }
    if (req.body.query.endDate) {
      const date = new Date(req.body.query.endDate);
      const updatedDate = new Date(date).setDate(date?.getDate() + 1);
      const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
      param.date = {
        ...param.date,
        $lte: new Date(newDate)?.toISOString(),
      };
    }

    if (req.body.query.type === "delivered") {
      param.deliveryDate = { $exists: true, $ne: null };
    }
    if (req.body.query.type === "undelivered") {
      param.deliveryDate = null;
    }

    if (search) {
      const searchText = new RegExp(search);
      param["$or"] = [
        { lrNo: { $regex: searchText, $options: "i" } },
        { memoNo: { $regex: searchText, $options: "i" } },
        { deliveryDate: { $regex: searchText, $options: "i" } },
        { payType: { $regex: searchText, $options: "i" } },
        {
          "loadingSlipDetails.vehicleNo": { $regex: searchText, $options: "i" },
        },
        ...(!isNaN(search) ? [{ total: parseFloat(search) }] : []),
      ];
    }
    if (req.body.query.showUnAcknowledge) {
      if (search) {
        const searchText = new RegExp(search);
        let isoDate = search;
        const date = new Date(search);
        if (date instanceof Date && !isNaN(date)) {
          const updatedDate = new Date(date).setDate(date?.getDate() + 1);
          const date2 = new Date(updatedDate).toISOString().split("T")[0];
          if (date2?.split("-")[0]?.length === 4) {
            isoDate = date2;
          }
        }
        param["$or"] = [
          { lrNo: { $regex: searchText, $options: "i" } },
          {
            date: { $regex: new RegExp(isoDate), $options: "i" },
          },
          { consignorName: { $regex: searchText, $options: "i" } },
          { consigneeName: { $regex: searchText, $options: "i" } },
          { from: { $regex: searchText, $options: "i" } },
          { to: { $regex: searchText, $options: "i" } },
          {
            "loadingSlipDetails.vehicleNo": {
              $regex: searchText,
              $options: "i",
            },
          },
          { payType: { $regex: searchText, $options: "i" } },
          ...(!isNaN(search) ? [{ total: parseFloat(search) }] : []),
        ];
      }
      if (param["$or"]) {
        param["$and"] = [
          { $or: [{ deliveryDate: null }, { deliveryDate: "" }] },
          { $or: param["$or"] },
        ];
      } else {
        param["$or"] = [{ deliveryDate: null }, { deliveryDate: "" }];
      }
    }
    const lorryReceipts = await LorryReceipt.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          lsNo: {
            $cond: {
              if: { $eq: ["$memoNo", ""] },
              then: null,
              else: { $toInt: "$memoNo" },
            },
          },
        },
      },
      {
        $lookup: {
          from: "loadingSlip",
          localField: "lsNo",
          foreignField: "lsNo",
          as: "loadingSlipDetails",
        },
      },
      {
        $unwind: {
          path: "$loadingSlipDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: param },
      {
        $facet: {
          count: [{ $count: "count" }],
          data: [{ $skip: start }, { $limit: limit }],
        },
      },
    ]);
    const [data] = lorryReceipts || [];
    res.json({
      lorryReceipts: data?.data,
      count: data.count[0]?.count,
      isLastPage: false,
    });
  } catch (error) {
    res.status(200).json({
      message: "Error fetching lorry receipts!",
      error: error.message,
    });
  }
};

const getAllLorryReceiptsWithCount = (req, res, next) => {
  if (!req.body.pagination.page || !req.body.pagination.limit) {
    return res.status(200).json({ message: "Pagination inputs not provided!" });
  }

  const limit = req.body.pagination.limit || 100;
  const start = (req.body.pagination.page - 1) * limit;
  const end = req.body.pagination.page * limit;

  LorryReceipt.find({ active: true })
    .lean()
    // .limit(limit)
    // .skip(skip)
    .sort("-createdAt")
    .exec((lrError, lorryReceipts) => {
      if (lrError) {
        return res.status(200).json({
          message: "Error fetching lorry receipts!",
        });
      } else {
        const isLastPage = count - (skip + limit) <= 0;
        res.json({
          lorryReceipts: lorryReceipts.slice(start, end),
          count: lorryReceipts?.length,
          isLastPage: false,
        });
      }
    });
};

// const getLorryReceiptsByConsignor = async (req, res, next) => {
//   if (!req.body.branch) {
//     return res.status(200).json({ message: "Branch ID is required!" });
//   }

//   if (!req.body.consignor) {
//     return res.status(200).json({ message: "Consignor ID is required!" });
//   }

//   let query = {
//     // branch: req.body.branch,
//     // consignor: req.body.consignor,
//     active: true,
//     payType: "TBB",
//   };

//   if (req.body.from) {
//     const date = new Date(req.body.from);
//     const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//     const newDate = new Date(updatedDate)?.setUTCHours(0, 0, 0, 000);
//     query.date = {
//       $gte: new Date(newDate)?.toISOString(),
//     };
//   }
//   if (req.body.to) {
//     const date = new Date(req.body.to);
//     const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//     const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
//     query.date = {
//       ...query.date,
//       $lte: new Date(newDate)?.toISOString(),
//     };
//   }
//   if (req.body.billId) {
//     query["$or"] = [
//       {
//         branch: req.body.branch,
//         $or: [
//           { toBilled: TO_BILLED[0].value, consignor: req.body.consignor },
//           { toBilled: TO_BILLED[1].value, consignee: req.body.consignor },
//         ],
//       },
//     ];
//   } else {
//     query = {
//       ...query,
//       ...{
//         branch: req.body.branch,
//         $or: [
//           { toBilled: TO_BILLED[0].value, consignor: req.body.consignor },
//           { toBilled: TO_BILLED[1].value, consignee: req.body.consignor },
//         ],
//       },
//     };
//   }
//   try {
//     const lorryReceipts = await LorryReceipt.find(query)
//       .sort("-createdAt")
//       .lean();
//     res.json(lorryReceipts);
//   } catch (error) {
//     return res.status(200).json({
//       message: "Error fetching lorry receipts!",
//     });
//   }
// };

const getLorryReceiptsByConsignor = async (req, res) => {
  const { consignor, billType, from, to } = req.body;

  if (!consignor || !billType) {
    return res.status(400).send("Missing required query parameters.");
  }
  let query;
  let queryParams;

  try {
    if (from && to) {
      const formattedFromDate = new Date(from)
        .toLocaleDateString("en-IN")
        .split("/")
        .reverse()
        .join("-");
      const formattedToDate = new Date(to)
        .toLocaleDateString("en-IN")
        .split("/")
        .reverse()
        .join("-");

      query = "CALL lorrymasterlistforbillbydate(?, ?, ?, ?)";
      queryParams = [consignor, billType, formattedFromDate, formattedToDate];
    } else {
      query = "CALL lorrymasterlistforbill(?, ?)";
      queryParams = [consignor, billType];
    }
    const [results] = await pool.query(query, queryParams);
    const rawList = results[0] || [];

    // Query all LR IDs that are already associated with an existing bill in bill_details
    const [billedLrs] = await pool.query(
      `SELECT DISTINCT bd.lr_id 
       FROM bill_details bd 
       JOIN bills b ON bd.bill_id = b.id`
    );
    const billedLrIdSet = new Set(billedLrs.map((r) => String(r.lr_id)));

    const transformedResults = rawList
      .filter((item) => !billedLrIdSet.has(String(item.id)))
      .map((item) => {
        const formattedDate = new Date(item.lr_date)
          .toLocaleDateString("en-IN")
          .split("/")
          .reverse()
          .join("-");
        return {
          id: item.id,
          lrNo: item.lr_number,
          date: formattedDate, // Use the formatted date
          total: item.total,
          articles: item.total_no_of_articles,
          description: item.descriptions,
          billGenerated: false,
        };
      });
    return res.json(transformedResults);
  } catch (err) {
    console.error("Error executing query:", err);
    return res.status(500).send("Server error");
  }
};

const generateFormattedLR = (lastNo, abbreviation) => {
  // let formattedLR;
  // if (foundLR) {
  //   const splitedNo = foundLR.lrNo?.split("-");
  //   const nu = splitedNo[splitedNo?.length - 1];
  //   const numLeadingZeros = parseInt(nu?.replace(/[^0-9]/g, ""));
  //   formattedLR = `${abbreviation}-${(numLeadingZeros + 1 + "")?.padStart(
  //     6,
  //     "0"
  //   )}`;
  // } else {
  //   formattedLR = `${abbreviation}-${(1 + "").padStart(6, "0")}`;
  // }

  return `${abbreviation}${(lastNo + 1 + "").padStart(6, "0")}`;
};

const getTranslatedData = async (data, isFromOrTo = true) => {
  const optionalFilter = [
    {
      to: data.to?.toUpperCase?.(),
    },
    {
      from: data.from?.toUpperCase?.(),
    },
  ];
  const list = await LorryReceipt.find(
    {
      $or: [
        {
          consigneeName: data.consigneeName?.toUpperCase?.(),
        },
        ...(isFromOrTo ? optionalFilter : []),
        {
          consignorName: data.consignorName?.toUpperCase?.(),
        },
      ],
    },
    "_id consignorNameMr consigneeNameMr fromMr toMr consigneeName to from consignorName",
  ).lean();
  let consignorNameMr = "",
    consigneeNameMr = "",
    fromMr = "",
    toMr = "";
  some(list, (lr) => {
    if (
      !consigneeNameMr &&
      lr.consigneeName?.trim()?.toUpperCase() ===
      data.consigneeName?.trim?.()?.toUpperCase() &&
      hasHindiCharacters(lr.consigneeNameMr)
    ) {
      consigneeNameMr = lr.consigneeNameMr;
    }
    if (
      !toMr &&
      lr.to?.trim()?.toUpperCase() === data.to?.trim?.()?.toUpperCase() &&
      hasHindiCharacters(lr.toMr)
    ) {
      toMr = lr.toMr;
    }
    if (
      !fromMr &&
      lr.from?.trim()?.toUpperCase() === data.from?.trim?.()?.toUpperCase() &&
      hasHindiCharacters(lr.fromMr)
    ) {
      fromMr = lr.fromMr;
    }
    if (
      !consignorNameMr &&
      lr.consignorName?.trim()?.toUpperCase() ===
      data.consignorName?.trim?.()?.toUpperCase() &&
      hasHindiCharacters(lr.consignorNameMr)
    ) {
      consignorNameMr = lr.consignorNameMr;
    }
    return (
      consignorNameMr && consigneeNameMr && (!isFromOrTo || (fromMr && toMr))
    );
  });

  if (!consigneeNameMr) {
    const name = await translator(data.consigneeName?.trim?.());
    if (name && typeof name === "string") {
      consigneeNameMr = name;
    }
  }
  if (!toMr && isFromOrTo) {
    const to = await translator(data.to?.trim?.());
    if (to && typeof to === "string") {
      toMr = to;
    }
  }
  if (!fromMr && isFromOrTo) {
    const from = await translator(data.from?.trim?.());
    if (from && typeof from === "string") {
      fromMr = from;
    }
  }
  if (!consignorNameMr) {
    const conName = await translator(data.consignorName?.trim?.());
    if (conName && typeof conName === "string") {
      consignorNameMr = conName;
    }
  }

  return { consignorNameMr, consigneeNameMr, fromMr, toMr };
};

const createLorryReceipt = async (req, res) => {
  try {
    const { consignorNameMr, consigneeNameMr, fromMr, toMr } =
      await getTranslatedData(req.body);
    const lastLr = await LorryReceipt.countDocuments({
      branch: req.body.branch,
    });
    const lorryReceipt = {
      branch: req.body.branch,
      date: req.body.date,
      invoiceNo: req.body.invoiceNo,
      eWayBillNo: req.body.eWayBillNo,
      foNum: req.body.foNum,
      consignor: req.body.consignor,
      consignorName: req.body.consignorName?.trim?.(),
      consignorAddress: req.body.consignorAddress?.trim?.(),
      consignorPhone: req.body.consignorPhone,
      consignorEmail: req.body.consignorEmail?.trim?.(),
      from: req.body.from,
      consignee: req.body.consignee,
      consigneeName: req.body.consigneeName?.trim?.(),
      consigneeAddress: req.body.consigneeAddress?.trim?.(),
      consigneePhone: req.body.consigneePhone,
      consigneeEmail: req.body.consigneeEmail?.trim?.(),
      to: req.body.to,
      materialCost: req.body.materialCost,
      deliveryType: req.body.deliveryType,
      deliveryInDays: req.body.deliveryInDays,
      serviceTaxBy: req.body.serviceTaxBy,
      payType: req.body.payType,
      toBilled: req.body.toBilled || "Consignor",
      collectAt: req.body.collectAt,
      payMode: req.body.payMode,
      bankName: req.body.bankName,
      chequeNo: req.body.chequeNo,
      chequeDate: req.body.chequeDate,
      remark: req.body.remark,
      transactions: req.body.transactions,
      totalFreight: req.body.totalFreight,
      hamali: req.body.hamali,
      deliveryCharges: req.body.deliveryCharges,
      lrCharges: req.body.lrCharges,
      total: req.body.total,
      unloadDate: req.body.unloadDate,
      deliveryDate: req.body.deliveryDate,
      deliveredTo: req.body.deliveredTo,
      close: req.body.close,
      createdBy: req.body.createdBy,
      consignorNameMr,
      consigneeNameMr,
      fromMr,
      toMr,
    };
    const abbreviation = req.body.branchCode?.trim();
    const formattedLR = await validateLRNo(lastLr, abbreviation);
    lorryReceipt.lrNo = formattedLR?.trim?.();
    const data = await LorryReceipt.create(lorryReceipt);
    data.user = req.body.user;
    generateLrPdf(data.toObject(), req, res, req.body.isSaveAndPrint, false);
  } catch (error) {
    return res.status(200).json({ message: error.message });
  }
};

const validateLRNo = async (lastLrNo, abbreviation) => {
  let formattedLR = generateFormattedLR(lastLrNo, abbreviation);

  while (true) {
    const lrDetails = await LorryReceipt.findOne(
      { lrNo: formattedLR },
      "_id",
    ).lean();

    if (!lrDetails) {
      // If no duplicate is found, return the formatted LR number
      return formattedLR;
    }
    // If duplicate is found, increment lastLrNo and generate a new formatted LR
    lastLrNo += 1;
    formattedLR = generateFormattedLR(lastLrNo, abbreviation);
  }
};

// const addLorryReceipt = async (req, res, next) => {
//   try {
//     // let year = new Date(req.body.date).getFullYear();
//     // const now = new Date();
//     // if (
//     //   year === now.getFullYear() &&
//     //   new Date(now.getFullYear(), now.getMonth(), now.getDay()) <
//     //     new Date(year, 3, 1)
//     // ) {
//     //   year -= 1;
//     // }
//     // const foundLR = await LorryReceipt.findOne(
//     //   {
//     //     lrNo: {
//     //       $regex: abbreviation,
//     //     },
//     //     $expr: {
//     //       $gte: [
//     //         {
//     //           $toDate: "$date",
//     //         },
//     //         new Date(year - 1, 3, 1),
//     //       ],
//     //     },
//     //   },
//     //   "lrNo"
//     // )
//     //   .sort([
//     //     ["_id", -1],
//     //     ["lrNo", -1],
//     //     ["createdAt", -1],
//     //   ])
//     //   .lean();

//     const foundConsignor =
//       req.body.consignor ||
//       (await Customer.findOne(
//         {
//           name: req.body.consignorName?.toUpperCase()?.trim?.(),
//         },
//         "_id"
//       ).lean());

//     const foundConsignee =
//       req.body.consignee ||
//       (await Customer.findOne(
//         {
//           name: req.body.consigneeName?.toUpperCase()?.trim?.(),
//         },
//         "_id"
//       ).lean());
//     const consignor = {
//       name: req.body.consignorName?.toUpperCase(),
//       address: req.body.consignorAddress?.trim?.(),
//       city: req.body.from?.trim?.(),
//       telephone: req.body.consignorPhone,
//       createdBy: req.body.createdBy,
//       email: req.body.consignorEmail,
//     };

//     const consignee = {
//       name: req.body.consigneeName?.toUpperCase(),
//       address: req.body.consigneeAddress?.trim?.(),
//       city: req.body.to?.trim?.(),
//       telephone: req.body.consigneePhone,
//       createdBy: req.body.createdBy,
//       email: req.body.consigneeEmail,
//     };

//     // if (req.body.consignee) {
//     //   Customer.findByIdAndUpdate(
//     //     req.body.consignee,
//     //     {
//     //       $set: {
//     //         updatedBy: req.body.createdBy,
//     //         name: req.body.consigneeName?.toUpperCase(),
//     //         address: req.body.consigneeAddress?.trim?.(),
//     //         city: req.body.to?.trim?.(),
//     //         telephone: req.body.consigneePhone,
//     //         createdBy: req.body.createdBy,
//     //         email: req.body.consigneeEmail,
//     //       },
//     //     },
//     //     { new: true },
//     //     (error, data) => {}
//     //   );
//     // }
//     // if (req.body.consignor) {
//     //   Customer.findByIdAndUpdate(
//     //     req.body.consignor,
//     //     {
//     //       $set: {
//     //         updatedBy: req.body.createdBy,
//     //         name: req.body.consignorName?.toUpperCase(),
//     //         address: req.body.consignorAddress?.trim?.(),
//     //         city: req.body.from?.trim?.(),
//     //         telephone: req.body.consignorPhone,
//     //         createdBy: req.body.createdBy,
//     //         email: req.body.consignorEmail,
//     //       },
//     //     },
//     //     { new: true },
//     //     (error, data) => {}
//     //   );
//     // }
//     if (foundConsignor && foundConsignee) {
//       await createLorryReceipt(req, res);
//     } else if (!foundConsignor && !foundConsignee) {
//       const { from, to } = await createFromOrTo(consignor.city, consignee.city);
//       consignor.city = from;
//       consignee.city = to;
//       const createdConsignor = await Customer.create(consignor);
//       const createdConsignee = await Customer.create(consignee);
//       if (createdConsignor && createdConsignee) {
//         req.body.consignor = createdConsignor._id;
//         req.body.consignorName = createdConsignor.name?.trim?.();
//         req.body.consignorAddress = createdConsignor.address?.trim?.();
//         req.body.consignorPhone = createdConsignor.telephone;
//         req.body.consignorEmail = createdConsignor.email?.trim?.();

//         req.body.consignee = createdConsignee._id;
//         req.body.consigneeName = createdConsignee.name?.trim?.();
//         req.body.consigneeAddress = createdConsignee.address?.trim?.();
//         req.body.consigneePhone = createdConsignee.telephone;
//         req.body.consigneeEmail = createdConsignee.email?.trim?.();
//       }
//       await createLorryReceipt(req, res);
//     } else if (foundConsignor && !foundConsignee) {
//       const { from, to } = await createFromOrTo("", consignee.city);
//       consignee.city = to;
//       const createdConsignee = await Customer.create(consignee);
//       if (createdConsignee) {
//         req.body.consignee = createdConsignee._id;
//         req.body.consigneeName = createdConsignee.name?.trim?.();
//         req.body.consigneeAddress = createdConsignee.address?.trim?.();
//         req.body.consigneePhone = createdConsignee.telephone;
//         req.body.consigneeEmail = createdConsignee.email?.trim?.();
//       }
//       await createLorryReceipt(req, res);
//     } else if (!foundConsignor && foundConsignee) {
//       const { from, to } = await createFromOrTo(consignor.city, "");
//       consignor.city = from;
//       const createdConsignor = await Customer.create(consignor);

//       if (createdConsignor) {
//         req.body.consignor = createdConsignor._id;
//         req.body.consignorName = createdConsignor.name?.trim?.();
//         req.body.consignorAddress = createdConsignor.address?.trim?.();
//         req.body.consignorPhone = createdConsignor.telephone;
//         req.body.consignorEmail = createdConsignor.email?.trim?.();
//       }
//       await createLorryReceipt(req, res);
//     }
//   } catch (e) {
//     return res.status(200).json({ message: e.message });
//   }
// };
const addLorryReceipt = async (req, res) => {
  try {
    const {
      lrNo,
      date,
      consignmentNoteNo,
      truckNo,
      consignor,
      consignorGst,
      consignorAddress,
      fromId,
      consignee,
      consigneeGst,
      consigneeAddress,
      toId,
      consigneePhone,
      materialCost,
      deliveryType,
      deliveryDays,
      payType,
      collectAt,
      gstPayBy,
      customerCopy,
      toBilled,
      remark,
      transactions,
      user_id,
      branch,
      thirdPartyCust,
      invoiceNo,
      eWayBillNo,
      totalFreight,
      hamali,
      lrCharges,
      deliveryCharges,
      bankName,
      chequeNo,
      total,
      payMode,
      chequeDate,
    } = req.body;

    const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");
    const formattedDate = date
      ? new Date(date).toISOString().slice(0, 19).replace("T", " ")
      : currentTime;
    const formattedChequeDate = chequeDate
      ? new Date(chequeDate).toISOString().slice(0, 19).replace("T", " ")
      : null;

    const addLrMasterSp = `
      CALL insert_lr_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [results] = await pool.query(addLrMasterSp, [
      lrNo || null,
      formattedDate,
      consignmentNoteNo,
      truckNo,
      consignor,
      consignorGst || null,
      consignorAddress,
      fromId,
      consignee,
      consigneeGst,
      consigneeAddress,
      toId,
      consigneePhone || null,
      materialCost || null,
      deliveryType || null,
      deliveryDays || null,
      payType || null,
      collectAt || null,
      gstPayBy || null,
      customerCopy || null,
      toBilled || null,
      remark || null,
      totalFreight || null,
      transactions.collection || null,
      hamali || null,
      deliveryCharges || null,
      transactions.otherChar || null,
      transactions.weightCharge || null,
      lrCharges || null,
      total || null,
      transactions.ratePer || null,
      user_id,
      branch,
      thirdPartyCust || null,
      invoiceNo || null,
      eWayBillNo || null,
      bankName || null,
      chequeNo || null,
      formattedChequeDate || null,
      payMode || null,
    ]);
    console.log(req.body);
    console.log(results);
    const { message, inserted_id } = results[0][0];
    if (!inserted_id) {
      return res
        .status(400)
        .json({ error: "Failed to insert LR Master. No ID returned." });
    }
    const lrdata = transactions.map((row, index) => [
      index + 1,
      row.description,
      row.article,
      row.articleNo,
      row.weight,
      row.chargeWeight,
      row.rateType,
      row.rate,
      row.hamalirate,
      row.freight,
      inserted_id,
    ]);

    const insertTransactionsQuery = `
  INSERT INTO transactions_lr (sr_no, description, articles, no_of_articles, actual_wt, char_wt,
    rate_per, rate, hamalirate, inv_amt, lr_master_id)
  VALUES ?
`;

    await pool.query(insertTransactionsQuery, [lrdata]);

    return res.json({ message, inserted_id });
  } catch (err) {
    console.error("Error executing transaction:", err);
    return res.status(500).send("Server error");
  }
};

const createFromOrTo = async (_from, _to) => {
  let from = !_from
    ? {}
    : await Place.findOne({
      name: { $regex: getRegex(_from?.trim?.()), $options: "i" },
    }).lean();
  let to = !_to
    ? {}
    : await Place.findOne({
      name: { $regex: getRegex(_to?.trim?.()), $options: "i" },
    }).lean();

  if (!from) {
    from = await Place.create({
      name: _from?.toUpperCase(),
    });
  }
  if (!to) {
    to = await Place.create({
      name: _to?.toUpperCase(),
    });
  }

  return { from: from?._id, to: to?._id };
};

// const removeLorryReceipt = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Lorry receipt ID is required!" });
//   }
//   const query = {
//     lrList: {
//       $elemMatch: {
//         _id: req.params.id,
//       },
//     },
//     active: true,
//   };
//   LoadingSlip.findOne(query)
//     .lean()
//     .exec((lrError, found) => {
//       if (lrError) {
//         return res.status(200).json({
//           message: "Error fetching lorry receipts!",
//         });
//       } else {
//         if (found) {
//           return res.status(200).json({
//             message: `This LR is used in Challan ${found.lsNo}. First, delete the challan.`,
//           });
//         }

//         LorryReceipt.findByIdAndUpdate(
//           req.params.id,
//           {
//             $set: {
//               updatedBy: req.body.updatedBy,
//               active: false,
//             },
//           },
//           (error, data) => {
//             if (error) {
//               res.status(200).json({ message: error.message });
//             } else {
//               res.json({ id: data._id });
//             }
//           }
//         );
//       }
//     });
// };

const removeLorryReceipt = async (req, res) => {
  const { id } = req.params;
  const ids = id.split(",").map((singleId) => singleId.trim());
  let messages = [];

  try {
    for (const singleId of ids) {
      // Call the stored procedure
      await pool.query("CALL delete_lr_master(?, @message)", [singleId]);

      // Get the output parameter
      const [results] = await pool.query("SELECT @message as message");
      const message = results[0].message;

      messages.push({ id: singleId, message });
    }
    return res.json({ messages });
  } catch (err) {
    console.error("Error executing delete:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

const generateLrPdf = async (data, req, res, isSend, isUpdate, isView) => {
  console.log("========== generateLrPdf CALLED ==========");
  if (!isSend && !isView) {
    return res.json(data);
  }

  const LRData = { ...data }; // Make a copy of data to avoid mutation

  LRData.date = new Date(data.lr_date).toLocaleDateString();
  LRData.LRNo = data.lr_number;

  if (!LRData.LRNo) {
    console.error("Missing LRNo in data:", data);
    return res.status(400).json({ message: "Missing LRNo." });
  }

  const isWithoutAmount = req.body.isWithoutAmount || false;

  // Prepare transactions and totals
  let totalArticles = 0;
  let totalWeight = 0;
  let totalChargeWeight = 0;

  LRData.transactions.forEach((tr, index) => {
    totalArticles += Number(tr.no_of_articles) || 0;
    totalWeight += Number(tr.actual_wt) || 0;
    totalChargeWeight += Number(tr.char_wt) || 0;

    tr.rate = (Number(tr.rate) || 0).toFixed(2);
    tr.freight = (Number(tr.freight) || 0).toFixed(2);
    tr.srNo = index + 1;
  });

  const formatAmount = (amount) =>
    isWithoutAmount ? "   -   " : (parseFloat(amount) || 0).toFixed(2);

  LRData.totalFreight = formatAmount(LRData.totalFreight);
  LRData.deliveryCharges = formatAmount(LRData.deliveryCharges);
  LRData.lrCharges = formatAmount(LRData.lrCharges);
  LRData.hamali = formatAmount(LRData.hamali);
  LRData.total = formatAmount(LRData.total);

  try {
    const docDef = await buildLorryReceiptEnDocDefinition({
      data: LRData,
      isWithoutAmount,
      printDate: LRData.date,
      user: req.user?.username || "",
    });

    const base64String = await generatePdfBase64(docDef);

    if (isSend && req.body.email && req.body.email.trim() !== "") {
      try {
        await sendEmail(
          req.body.email,
          base64String,
          `${LRData.LRNo}.pdf`,
          `JBS - Lorry receipt no. ${LRData.LRNo}`,
          `JBS - Bill no. ${LRData.LRNo}`,
          `<p><b>Hello</b></p><p>Please find attached lorry receipt.</p>`,
        );

        return res.json({ success: true });
      } catch (err) {
        return res.status(401).json({
          message: err.message,
        });
      }
    }

    return res.json({
      file: base64String,
      lrNo: LRData.LRNo,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};
// const viewLorryReceipt = async (req, res, next) => {
//   try {
//     const data = await LorryReceipt.findById(req.params.id).lean();
//     generateLrPdf(data, req, res, false, false, true);
//   } catch (error) {
//     return res.status(200).json({ message: error.message });
//   }
// };
const getTotalWeight = (transactions) => {
  let totalWeight = 0;
  transactions.forEach((transaction) => {
    totalWeight += +transaction.weight;
  });
  return totalWeight;
};

const getTotalArticles = (transactions) => {
  let totalArticles = 0;
  transactions.forEach((transaction) => {
    totalArticles += +transaction.articleNo;
  });
  return totalArticles;
};

const converDateFormat = (date = new Date()) => {
  const day = new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return day;
};

// const viewLorryReceipt = async (req, res, next) => {
//   try {
//     const lrid = req.params.id;

//     const query = `CALL getlorryreceiptforprint(?)`;
//     const query2 = `CALL get_transactionlrbyid(?)`;

//     const LRDataObj = await pool.query(query, lrid);
//     let fileName;

//     if (LRDataObj) {
//       const TransactionData = await pool.query(query2, lrid);

//       const {
//         lr_number,
//         id,
//         lr_date,
//         InvoiceNo,
//         EwayNo,
//         truck_tempo_number,
//         consigner,
//         consigner_address,
//         consignee,
//         consignee_address,
//         deliveryAt,
//         deliveryAddress,
//         deliveryCity,
//         loc_from,
//         loc_to,
//         freight,
//         hamali,
//         osc,
//         delivery,
//         other_charges,
//         statatical,
//         material_cost,
//         total,
//         delivery_type,
//         pay_type,
//         to_billed,
//         serviceTaxBy,
//         branch,
//         remarks,
//         consignorgst,
//         consigneegst,
//         toplacecontact,
//         consigner_telephone,
//       } = LRDataObj[0][0][0];

//       const isWithoutAmount = req.body.isWithoutAmount === true;
//       const transactions = TransactionData[0][0].map((row) => ({
//         article: row.articles || "",
//         articleNo: parseInt(row.no_of_articles),
//         description: row.description || "",
//         weight: row.actual_wt || 0,
//         chargeWeight: row.char_wt || 0,
//         rateType: row.rate_per || null,
//         rate: isWithoutAmount || pay_type === "TBB" ? 0 : row.rate || 0,
//         freight: isWithoutAmount || pay_type === "TBB" ? 0 : row.inv_amt || 0,
//         _id: row.sr_no,
//       }));

//       let totalFreight = 0;
//       transactions.forEach((transaction) => {
//         if (transaction.rate) {
//           transaction.rate = parseFloat(transaction.rate).toFixed(2);
//         }
//         if (transaction.freight) {
//           transaction.freight = parseFloat(transaction.freight).toFixed(2);
//           totalFreight += parseFloat(transaction.freight);
//         }
//         transaction.hasDesc = transaction.description.trim() !== "";
//       });

//       transactions.forEach((transaction, index) => {
//         if (index === 0) {
//           transaction.totalFreight =
//             totalFreight > 0 ? totalFreight.toFixed(2) : "";
//           transaction.length = transactions.length;
//           transaction.hasValue = true;
//         } else {
//           transaction.hasValue = false;
//         }
//       });

//       let isPaid = pay_type == "Paid";
//       let isToPay = pay_type == "ToPay";
//       let isTBB = pay_type == "TBB";

//       const formattedLrDate = new Date(lr_date).toLocaleDateString("en-GB");
//       let LRData = {
//         _id: id,
//         branch: branch,
//         lrNo: lr_number,
//         date: formattedLrDate,
//         invoiceNo: InvoiceNo,
//         eWayBillNo: EwayNo,
//         vehicleNo: truck_tempo_number,
//         consignorGst: consignorgst,
//         consignorName: consigner,
//         consignorAddress: consigner_address,
//         consignorPhone: consigner_telephone,
//         consigneeName: consignee,
//         consigneeGst: consigneegst,
//         consigneePhone: toplacecontact,
//         consigneeAddress: consignee_address,
//         from: loc_from || "",
//         to: loc_to || "",
//         deliveryAt: deliveryAt,
//         deliveryAddress: deliveryAddress,
//         deliveryCity: deliveryCity,
//         totalFreight:
//           isWithoutAmount || pay_type === "TBB" ? " " : freight || "",
//         osc: isWithoutAmount || pay_type === "TBB" ? " " : osc || "",
//         otherCharges:
//           isWithoutAmount || pay_type === "TBB" ? " " : other_charges || "",
//         lrCharges:
//           isWithoutAmount || pay_type === "TBB" ? " " : statatical || "",
//         hamali: isWithoutAmount || pay_type === "TBB" ? " " : hamali || "",
//         deliveryCharges:
//           isWithoutAmount || pay_type === "TBB" ? " " : delivery || "",
//         total: isWithoutAmount || pay_type === "TBB" ? " " : total,
//         materialCost:
//           isWithoutAmount || pay_type === "TBB"
//             ? " "
//             : parseFloat(material_cost) || 0,
//         isPaid: isPaid,
//         isToPay: isToPay,
//         isTBB: isTBB,
//         toBilled: to_billed,
//         deliveryType: delivery_type,
//         serviceTaxBy: serviceTaxBy,
//         remark: remarks || "",
//         transactions: transactions || [],
//         totalWeight: getTotalWeight(transactions) || "",
//         totalArticles: getTotalArticles(transactions) || "",
//       };

//       // Format numbers if isWithoutAmount is false
//       // if (!isWithoutAmount) {
//       //   LRData.totalFreight = LRData.totalFreight && !isNaN(LRData.totalFreight) ? parseFloat(LRData.totalFreight).toFixed(2) : "";
//       //   LRData.total = LRData.total && !isNaN(LRData.total) ? parseFloat(LRData.total).toFixed(2) : "";
//       //   LRData.hamali = LRData.hamali && !isNaN(LRData.hamali) ? parseFloat(LRData.hamali).toFixed(2) : "";
//       //   LRData.osc = LRData.osc && !isNaN(LRData.osc) ? parseFloat(LRData.osc).toFixed(2) : "";
//       //   LRData.deliveryCharges = LRData.deliveryCharges && !isNaN(LRData.deliveryCharges) ? parseFloat(LRData.deliveryCharges).toFixed(2) : "";
//       //   LRData.otherCharges = LRData.otherCharges && !isNaN(LRData.otherCharges) ? parseFloat(LRData.otherCharges).toFixed(2) : "";
//       //   LRData.lrCharges = LRData.lrCharges && !isNaN(LRData.lrCharges) ? parseFloat(LRData.lrCharges).toFixed(2) : "";
//       //   LRData.totalWeight = getTotalWeight(LRData.transactions) || "";
//       //   LRData.totalArticles = getTotalArticles(LRData.transactions) || "";
//       // }

//       const imagePath = path.join(__dirname, "../public/images/jsb.png");
//       const checkedImagePath = path.join(
//         __dirname,
//         "../public/images/checked.png",
//       );
//       const checkedImageBase64 = fs
//         .readFileSync(checkedImagePath)
//         .toString("base64");
//       const checkedImage = `data:image/png;base64,${checkedImageBase64}`;
//       const imageBase64 = fs.readFileSync(imagePath).toString("base64");
//       const imgSrc = `data:image/png;base64,${imageBase64}`;
//       const templatePath =
//         path.join(__dirname, "../bills/") + "LorryReceipt-Marathi.html";

//       res.render(
//         templatePath,
//         {
//           info: {
//             lr: LRData,
//             printDate: converDateFormat(Date.now()),
//             logo: imgSrc,
//             checked: checkedImage,
//           },
//         },
//         async (err, HTML) => {
//           fileName = LRData.lrNo;
//           if (err) {
//             return res.status(500).json({ message: err.message });
//           }

//           var isWin = process.platform === "win32";
//           let htmlRaw = HTML;
//           if (isWin) {
//             htmlRaw = htmlRaw.replace("0.55", "1");
//           }

//           try {
//             const tempDir = path.join(__dirname, "../temp");

//             if (!fs.existsSync(tempDir)) {
//               fs.mkdirSync(tempDir, { recursive: true });
//             }

//             const outputPath = path.join(
//               tempDir,
//               `${fileName}_${Date.now()}.pdf`,
//             );

//             await generatePdfFromHtml(htmlRaw, outputPath, {
//               format: "A4",
//               printBackground: true,
//             });

//             const buffer = fs.readFileSync(outputPath);

//             const base64String = buffer.toString("base64");

//             fs.unlinkSync(outputPath);

//             if (req.body.email && req.body.email.trim() !== "") {
//               console.log("req.body.email", req.body.email);

//               await sendEmail(
//                 req.body.email,
//                 base64String,
//                 `${fileName}.pdf`,
//                 `JBS - Lorry receipt no. ${fileName}`,
//                 `JBS - Bill no. ${fileName}`,
//                 `<p><b>Hello</b></p><p>Please find attached lorry receipt.</p>`,
//               );

//               return res.json({
//                 success: true,
//               });
//             }

//             return res.json({
//               file: base64String,
//               lrnum: LRData.lrNo,
//             });
//           } catch (err) {
//             console.error(err);

//             return res.status(500).json({
//               message: err.message,
//             });
//           }
//         },
//       );
//     }
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

const viewLorryReceipt = async (req, res, next) => {
  try {
    const lrid = req.params.id;

    const query = `CALL getlorryreceiptforprint(?)`;
    const query2 = `CALL get_transactionlrbyid(?)`;

    const LRDataObj = await pool.query(query, lrid);
    let fileName;

    if (LRDataObj) {
      const TransactionData = await pool.query(query2, lrid);

      const {
        lr_number,
        id,
        lr_date,
        InvoiceNo,
        EwayNo,
        truck_tempo_number,
        consigner,
        consigner_address,
        consignee,
        consignee_address,
        deliveryAt,
        deliveryAddress,
        deliveryCity,
        loc_from,
        loc_to,
        freight,
        hamali,
        osc,
        delivery,
        other_charges,
        statatical,
        material_cost,
        total,
        delivery_type,
        pay_type,
        to_billed,
        serviceTaxBy,
        branch,
        remarks,
        consignorgst,
        consigneegst,
        toplacecontact,
        consigner_telephone,
      } = LRDataObj[0][0][0];

      const isWithoutAmount = req.body.isWithoutAmount === true;
      const transactions = TransactionData[0][0].map((row) => ({
        article: row.articles || "",
        articleNo: parseInt(row.no_of_articles),
        description: row.description || "",
        weight: row.actual_wt || 0,
        chargeWeight: row.char_wt || 0,
        rateType: row.rate_per || null,
        rate: isWithoutAmount || pay_type === "TBB" ? 0 : row.rate || 0,
        freight: isWithoutAmount || pay_type === "TBB" ? 0 : row.inv_amt || 0,
        _id: row.sr_no,
      }));

      let totalFreight = 0;
      transactions.forEach((transaction) => {
        if (transaction.rate) {
          transaction.rate = parseFloat(transaction.rate).toFixed(2);
        }
        if (transaction.freight) {
          transaction.freight = parseFloat(transaction.freight).toFixed(2);
          totalFreight += parseFloat(transaction.freight);
        }
        transaction.hasDesc = transaction.description.trim() !== "";
      });

      transactions.forEach((transaction, index) => {
        if (index === 0) {
          transaction.totalFreight =
            totalFreight > 0 ? totalFreight.toFixed(2) : "";
          transaction.length = transactions.length;
          transaction.hasValue = true;
        } else {
          transaction.hasValue = false;
        }
      });

      let isPaid = pay_type == "Paid";
      let isToPay = pay_type == "ToPay";
      let isTBB = pay_type == "TBB";

      const formattedLrDate = new Date(lr_date).toLocaleDateString("en-GB");
      let LRData = {
        _id: id,
        branch: branch,
        lrNo: lr_number,
        date: formattedLrDate,
        invoiceNo: InvoiceNo,
        eWayBillNo: EwayNo,
        vehicleNo: truck_tempo_number,
        consignorGst: consignorgst,
        consignorName: consigner,
        consignorAddress: consigner_address,
        consignorPhone: consigner_telephone,
        consigneeName: consignee,
        consigneeGst: consigneegst,
        consigneePhone: toplacecontact,
        consigneeAddress: consignee_address,
        from: loc_from || "",
        to: loc_to || "",
        deliveryAt: deliveryAt,
        deliveryAddress: deliveryAddress,
        deliveryCity: deliveryCity,
        totalFreight:
          isWithoutAmount || pay_type === "TBB" ? " " : freight || "",
        osc: isWithoutAmount || pay_type === "TBB" ? " " : osc || "",
        otherCharges:
          isWithoutAmount || pay_type === "TBB" ? " " : other_charges || "",
        lrCharges:
          isWithoutAmount || pay_type === "TBB" ? " " : statatical || "",
        hamali: isWithoutAmount || pay_type === "TBB" ? " " : hamali || "",
        deliveryCharges:
          isWithoutAmount || pay_type === "TBB" ? " " : delivery || "",
        total: isWithoutAmount || pay_type === "TBB" ? " " : total,
        materialCost:
          isWithoutAmount || pay_type === "TBB"
            ? " "
            : parseFloat(material_cost) || 0,
        isPaid: isPaid,
        isToPay: isToPay,
        isTBB: isTBB,
        toBilled: to_billed,
        deliveryType: delivery_type,
        serviceTaxBy: serviceTaxBy,
        remark: remarks || "",
        transactions: transactions || [],
        totalWeight: getTotalWeight(transactions) || "",
        totalArticles: getTotalArticles(transactions) || "",
      };

      // Format numbers if isWithoutAmount is false
      // if (!isWithoutAmount) {
      //   LRData.totalFreight = LRData.totalFreight && !isNaN(LRData.totalFreight) ? parseFloat(LRData.totalFreight).toFixed(2) : "";
      //   LRData.total = LRData.total && !isNaN(LRData.total) ? parseFloat(LRData.total).toFixed(2) : "";
      //   LRData.hamali = LRData.hamali && !isNaN(LRData.hamali) ? parseFloat(LRData.hamali).toFixed(2) : "";
      //   LRData.osc = LRData.osc && !isNaN(LRData.osc) ? parseFloat(LRData.osc).toFixed(2) : "";
      //   LRData.deliveryCharges = LRData.deliveryCharges && !isNaN(LRData.deliveryCharges) ? parseFloat(LRData.deliveryCharges).toFixed(2) : "";
      //   LRData.otherCharges = LRData.otherCharges && !isNaN(LRData.otherCharges) ? parseFloat(LRData.otherCharges).toFixed(2) : "";
      //   LRData.lrCharges = LRData.lrCharges && !isNaN(LRData.lrCharges) ? parseFloat(LRData.lrCharges).toFixed(2) : "";
      //   LRData.totalWeight = getTotalWeight(LRData.transactions) || "";
      //   LRData.totalArticles = getTotalArticles(LRData.transactions) || "";
      // }

      try {
        const docDef = await buildLorryReceiptDocDefinition({
          lr: LRData,
          printDate: converDateFormat(Date.now()),
          user: req.user ? req.user.username : "",
        });

        const base64String = await generatePdfBase64(docDef);
        const fileName = LRData.lrNo;

        if (req.body.email && req.body.email.trim() !== "") {
          console.log("req.body.email", req.body.email);

          await sendEmail(
            req.body.email,
            base64String,
            `${fileName}.pdf`,
            `JBS - Lorry receipt no. ${fileName}`,
            `JBS - Bill no. ${fileName}`,
            `<p><b>Hello</b></p><p>Please find attached lorry receipt.</p>`,
          );

          return res.json({
            success: true,
          });
        }

        return res.json({
          file: base64String,
          lrnum: LRData.lrNo,
        });
      } catch (err) {
        console.error(err);

        return res.status(500).json({
          message: err.message,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getLorryReceipt = async (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({ message: "Lorry receipt ID is required!" });
  }
  const id = req.params.id;

  try {
    const [data] = await pool.query("CALL getlrbyid(?)", [id]);
    const lorryReceipt = data[0][0];
    if (!lorryReceipt) {
      return res.status(404).json({ message: "Lorry receipt not found!" });
    }
    const [transactions] = await pool.query(
      "SELECT * FROM transactions_lr WHERE lr_master_id = ?",
      [id],
    );
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      articles_name: transaction.articles,
      articleNo: transaction.no_of_articles,
      description: transaction.description || "",
      weight: transaction.actual_wt,
      chargeWeight: transaction.char_wt,
      rateType: transaction.rate_per,
      hamalirate: transaction.hamalirate,
      rate: transaction.rate,
      freight: transaction.inv_amt,
    }));

    const [consignee] = await pool.query(
      "SELECT * FROM customer WHERE customer_id = ?",
      [lorryReceipt.consignee],
    );
    const [consignor] = await pool.query(
      "SELECT * FROM customer WHERE customer_id = ?",
      [lorryReceipt.consigner],
    );

    res.send({
      ...lorryReceipt,
      transactions: formattedTransactions,
      consignee: { ...(consignee[0] || {}), label: consignee[0]?.name || "" },
      consignor: { ...(consignor[0] || {}), label: consignor[0]?.name || "" },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// const updateLorryReceipt = async (req, res, next) => {
//   const _id = req.body._id;

//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Lorry receipt ID is required!" });
//   }
//   const lr = await LorryReceipt.findById(
//     req.body._id,
//     "consigneeName to from consignorName"
//   ).lean();
//   const consignorName = req.body.consignorName?.toUpperCase()?.trim?.();
//   const consigneeName = req.body.consigneeName?.toUpperCase()?.trim?.();
//   const foundConsignor =
//     req.body.consignor ||
//     (await Customer.findOne({ name: consignorName }, "_id").lean());
//   const foundConsignee =
//     req.body.consignee ||
//     (await Customer.findOne({ name: consigneeName }, "_id").lean());

//   const { consignorNameMr, consigneeNameMr, fromMr, toMr } =
//     await getTranslatedData(req.body);

//   // if (req.body.consignee) {
//   //   Customer.findByIdAndUpdate(
//   //     req.body.consignee,
//   //     {
//   //       $set: {
//   //         updatedBy: req.body.createdBy,
//   //         name: req.body.consigneeName?.toUpperCase(),
//   //         address: req.body.consigneeAddress?.trim?.(),
//   //         city: req.body.to?.trim?.(),
//   //         telephone: req.body.consigneePhone,
//   //         createdBy: req.body.createdBy,
//   //         email: req.body.consigneeEmail,
//   //       },
//   //     },
//   //     { new: true },
//   //     (error, data) => {}
//   //   );
//   // }

//   let model = {
//     branch: req.body.branch,
//     lrNo: req.body.lrNo?.trim?.(),
//     date: req.body.date,
//     invoiceNo: req.body.invoiceNo?.trim?.(),
//     eWayBillNo: req.body.eWayBillNo?.trim?.(),
//     foNum: req.body.foNum?.trim?.(),
//     consignor: req.body.consignor?.trim?.(),
//     consignorName: req.body.consignorName?.trim?.(),
//     consignorAddress: req.body.consignorAddress?.trim?.(),
//     consignorPhone: req.body.consignorPhone?.trim?.(),
//     consignorEmail: req.body.consignorEmail?.trim?.(),
//     from: req.body.from?.trim?.(),
//     consignee: req.body.consignee?.trim?.(),
//     consigneeName: req.body.consigneeName?.trim?.(),
//     consigneeAddress: req.body.consigneeAddress?.trim?.(),
//     consigneePhone: req.body.consigneePhone?.trim?.(),
//     consigneeEmail: req.body.consigneeEmail?.trim?.(),
//     to: req.body.to?.trim?.(),
//     materialCost: req.body.materialCost?.trim?.(),
//     deliveryType: req.body.deliveryType?.trim?.(),
//     deliveryInDays: req.body.deliveryInDays?.trim?.(),
//     serviceTaxBy: req.body.serviceTaxBy?.trim?.(),
//     payType: req.body.payType,
//     toBilled: req.body.toBilled,
//     collectAt: req.body.collectAt,
//     payMode: req.body.payMode,
//     bankName: req.body.bankName?.trim?.(),
//     chequeNo: req.body.chequeNo,
//     chequeDate: req.body.chequeDate,
//     remark: req.body.remark,
//     transactions: req.body.transactions,
//     totalFreight: req.body.totalFreight,
//     hamali: req.body.hamali,
//     deliveryCharges: req.body.deliveryCharges,
//     lrCharges: req.body.lrCharges,
//     total: req.body.total,
//     unloadDate: req.body.unloadDate,
//     deliveryDate: req.body.deliveryDate,
//     deliveredTo: req.body.deliveredTo,
//     close: req.body.close,
//     updatedBy: req.body.updatedBy,
//     consignorNameMr,
//     consigneeNameMr,
//     fromMr,
//     toMr,
//   };

//   const updateLorryReceipt = async (model) => {
//     try {
//       const updatedData = await LorryReceipt.findByIdAndUpdate(
//         _id,
//         { $set: model },
//         { new: true }
//       ).lean();

//       if (!updatedData) {
//         throw new Error("Error updating Lorry Receipt.");
//       }

//       updatedData.user = req.body.user;
//       generateLrPdf(updatedData, req, res, req.body.isSaveAndPrint, true);
//     } catch (error) {
//       return res.status(200).json({ message: error.message });
//     }
//   };

//   try {
//     const query = {
//       lrList: {
//         $elemMatch: {
//           _id: req.params.id,
//         },
//       },
//       active: true,
//     };
//     const found = await LoadingSlip.findOne(query, "_id lsNo").lean();
//     if (found) {
//       return res.status(200).json({
//         message: `This LR is used in Challan ${found.lsNo}. First, delete the challan.`,
//       });
//     }

//     // if (req.body.consignor) {
//     //   Customer.findByIdAndUpdate(
//     //     req.body.consignor,
//     //     {
//     //       $set: {
//     //         updatedBy: req.body.createdBy,
//     //         name: req.body.consignorName?.toUpperCase(),
//     //         address: req.body.consignorAddress?.trim?.(),
//     //         city: req.body.to?.trim?.(),
//     //         telephone: req.body.consignorPhone,
//     //         createdBy: req.body.createdBy,
//     //         email: req.body.consignorEmail,
//     //       },
//     //     },
//     //     { new: true },
//     //     (error, data) => {}
//     //   );
//     // }
//     if (foundConsignor && foundConsignee) {
//       updateLorryReceipt(model);
//     } else {
//       if (!foundConsignor && !foundConsignee) {
//         try {
//           const consignor = {
//             name: req.body.consignorName?.toUpperCase(),
//             address: req.body.consignorAddress?.trim?.(),
//             city: req.body.from?.trim?.(),
//             telephone: req.body.consignorPhone,
//             createdBy: req.body.createdBy,
//             email: req.body.consignorEmail,
//           };

//           const consignee = {
//             name: req.body.consigneeName?.toUpperCase(),
//             address: req.body.consigneeAddress?.trim?.(),
//             city: req.body.to?.trim?.(),
//             telephone: req.body.consigneePhone,
//             createdBy: req.body.createdBy,
//             email: req.body.consigneeEmail,
//           };
//           const { from, to } = await createFromOrTo(
//             consignor.city,
//             consignee.city
//           );
//           consignor.city = from;
//           consignee.city = to;
//           const createdConsignor = await Customer.create(consignor);
//           const createdConsignee = await Customer.create(consignee);
//           if (createdConsignor && createdConsignee) {
//             updateLorryReceipt({
//               ...model,
//               consignor: createdConsignor._id,
//               consignee: createdConsignee._id,
//               consignorName: createdConsignor.name,
//               consigneeName: createdConsignee.name,
//             });
//           }
//         } catch (e) {
//           return res.status(200).json({ message: e.message });
//         }
//       }

//       if (foundConsignor && !foundConsignee) {
//         try {
//           const consignee = {
//             name: req.body.consigneeName?.toUpperCase(),
//             address: req.body.consigneeAddress?.trim?.(),
//             city: req.body.to?.trim?.(),
//             telephone: req.body.consigneePhone,
//             createdBy: req.body.createdBy,
//             email: req.body.consigneeEmail,
//           };
//           const { from, to } = await createFromOrTo("", consignee.city);
//           consignee.city = to;
//           const createdConsignee = await Customer.create(consignee);
//           if (createdConsignee) {
//             updateLorryReceipt({
//               ...model,
//               consignee: createdConsignee._id,
//               consigneeName: createdConsignee.name,
//             });
//           }
//         } catch (e) {
//           return res.status(200).json({ message: e.message });
//         }
//       }
//       if (!foundConsignor && foundConsignee) {
//         try {
//           const consignor = {
//             name: req.body.consignorName?.toUpperCase(),
//             address: req.body.consignorAddress?.trim?.(),
//             city: req.body.from?.trim?.(),
//             telephone: req.body.consignorPhone,
//             createdBy: req.body.createdBy,
//             email: req.body.consignorEmail,
//           };
//           const { from, to } = await createFromOrTo(consignor.city, "");
//           consignor.city = from;
//           const createdConsignor = await Customer.create(consignor);
//           if (createdConsignor) {
//             updateLorryReceipt({
//               ...model,
//               consignor: createdConsignor._id,
//               consignorName: createdConsignor.name,
//             });
//           }
//         } catch (e) {
//           return res.status(200).json({ message: e.message });
//         }
//       }
//     }
//   } catch (e) {
//     return res.status(200).json({ message: e.message });
//   }
// };

const updateLorryReceipt = async (req, res) => {
  const id = req.params.id;
  const {
    lr_no,
    lr_date,
    consignor,
    consignorAddress,
    consignee: consigneeName,
    consigneeGst,
    consigneeAddress,
    fromId,
    toId,
    toplacecontact: toPlaceContact,
    totalFreight,
    collection,
    hamali: varaiHamali,
    other_charges: otherChar,
    wt_charges: weightCharge,
    lrCharges,
    material_cost: materialCost,
    total,
    delivery_type: deliveryType,
    delivery_days: deliveryDays,
    gst_pay_by: gstPayBy,
    payType,
    toBilled,
    collect_at_branch: collectAt,
    remarks: remark,
    transactions,
    thirdpartycust: thirdPartyCust,
    payMode,
    InvoiceNo,
    EwayNo,
    delivery,
    bank_name,
    chqno,
    chqdate,
    branch,
  } = req.body;

  const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");
  const formattedDate = lr_date
    ? new Date(lr_date).toISOString().slice(0, 19).replace("T", " ")
    : currentTime;
  const formattedDatecheq = chqdate
    ? new Date(chqdate).toISOString().slice(0, 19).replace("T", " ")
    : currentTime;
  try {
    const updateLrMasterSp = `CALL update_lr_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?)`;
    const [results] = await pool.query(updateLrMasterSp, [
      id,
      lr_no,
      null,
      formattedDate,
      null,
      consignor,
      null,
      consignorAddress,
      consigneeName,
      consigneeGst,
      consigneeAddress,
      fromId,
      toId,
      toPlaceContact,
      totalFreight,
      collection,
      varaiHamali,
      delivery,
      otherChar,
      weightCharge,
      lrCharges,
      materialCost,
      total,
      deliveryType,
      deliveryDays,
      gstPayBy,
      payType,
      payMode,
      toBilled,
      collectAt,
      remark,
      null,
      thirdPartyCust,
      InvoiceNo,
      EwayNo,
      bank_name,
      chqno,
      formattedDatecheq,
      branch,
    ]);
    const { message, updated_id } = results[0][0];
    const lrdata = transactions.map((row, index) => [
      index + 1,
      row.description,
      row.article,
      row.articleNo,
      row.weight,
      row.chargeWeight,
      row.rateType,
      row.rate,
      row.hamalirate,
      row.freight,
      updated_id,
    ]);

    const insertTransactionsQuery =
      "INSERT INTO transactions_lr (sr_no, description, articles, no_of_articles, actual_wt, char_wt, rate_per, rate, hamalirate, inv_amt, lr_master_id) VALUES ?";
    await pool.query(insertTransactionsQuery, [lrdata]);

    return res.json({ message, updated_id });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Server error");
  }
};

const updateLorryReceiptAck = (req, res, next) => {
  const _id = req.params.id || req.body._id;

  if (!_id) {
    return res.status(200).json({ message: "Lorry receipt ID is required!" });
  }

  if (!req.body.deliveryDate) {
    return res.status(200).json({ message: "Delivery date is required!" });
  }

  LorryReceipt.findByIdAndUpdate(
    _id,
    {
      $set: {
        deliveryDate: req.body.deliveryDate,
        updatedBy: req.body.updatedBy,
      },
    },
    { new: true },
    (error, data) => {
      if (error) {
        res.status(200).json({ message: error.message });
      } else {
        res.json(data);
      }
    },
  );
};

const updateMultiLorryReceiptAck = async (req, res, next) => {
  const { list, updatedBy } = req.body;

  if (!list?.length) {
    return res.status(200).json({ message: "Lorry receipt ID is required!" });
  }

  try {
    const promises = map(list, ({ deliveryDate, _id }) =>
      LorryReceipt.findByIdAndUpdate(
        _id,
        {
          $set: {
            deliveryDate: deliveryDate,
            updatedBy: updatedBy,
          },
        },
        { new: true },
      ),
    );
    const data = await Promise.all(promises);
    res.json(data);
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
};

const removeLorryReceiptAck = (req, res) => {
  const _id = req.params.id;

  if (!_id) {
    return res.status(200).json({ message: "Lorry receipt ID is required!" });
  }

  LorryReceipt.findById(_id, (foundLRErr, foundLRData) => {
    if (foundLRErr) {
      return res.status(200).json({ message: foundLRErr.message });
    }

    if (foundLRData && foundLRData.ack) {
      const filePath = foundLRData.ack;
      const parts = filePath.split("/");
      const fileName = parts[parts.length - 1];
      const fileToRemove = path.join(
        __dirname,
        "../acknowledgement/",
        fileName,
      );
      fs.unlinkSync(fileToRemove);

      LorryReceipt.findByIdAndUpdate(
        _id,
        {
          $set: {
            ack: "",
            updatedBy: req.body.updatedBy,
          },
        },
        { new: true },
        (error, data) => {
          if (error) {
            res.status(200).json({ message: error.message });
          } else {
            res.json(data);
          }
        },
      );
    }
    if (!foundLRData) {
      return res.status(200).json({ message: "Lorry receipt not found!" });
    }
  });
};

// const getLoadingSlips = async (req, res, next) => {
//   try {
//     const { pagination, branch, search, showUnAcknowledge } = req.body;
//     const { page = 1, limit = 100 } = pagination || {};
//     const start = (page - 1) * limit;
//     const param = { branch, active: true };

//     if (!branch || !pagination.page || !pagination.limit) {
//       return res
//         .status(200)
//         .json({ message: "Branch ID & pagination is required!" });
//     }

//     if (search) {
//       const searchText = new RegExp(search);
//       let isoDate = search;
//       const date = new Date(search);
//       if (date instanceof Date && !isNaN(date)) {
//         const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//         const date2 = new Date(updatedDate).toISOString().split("T")[0];
//         if (date2?.split("-")[0]?.length === 4) {
//           isoDate = date2;
//         }
//       }
//       param["$or"] = [
//         {
//           date: { $regex: new RegExp(isoDate), $options: "i" },
//         },
//         { vehicleNo: { $regex: searchText, $options: "i" } },
//         { fromName: { $regex: searchText, $options: "i" } },
//         { toName: { $regex: searchText, $options: "i" } },
//         ...(!isNaN(search)
//           ? [
//               { totalFreight: parseFloat(search) },
//               { totalPayable: parseFloat(search) },
//               { lsNo: parseFloat(search) },
//             ]
//           : []),
//       ];
//     }
//     let loadingSlips = [];
//     let count = 0;
//     if (showUnAcknowledge) {
//       param.unacknowledgedCount = { ["$gt"]: 0 };
//       loadingSlips = await LoadingSlip.aggregate([
//         { $sort: { createdAt: -1 } },
//         {
//           $addFields: {
//             list: {
//               $map: {
//                 input: "$lrList",
//                 as: "lrObj",
//                 in: "$$lrObj.lrNo",
//               },
//             },
//           },
//         },
//         {
//           $lookup: {
//             from: "lorryReceipt",
//             let: { lrList: "$list" },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: { $in: ["$lrNo", "$$lrList"] },
//                   $or: [{ deliveryDate: null }, { deliveryDate: "" }],
//                 },
//               },
//             ],
//             as: "lorryReceipts",
//           },
//         },
//         {
//           $project: {
//             _id: 1,
//             date: 1,
//             vehicleNo: 1,
//             fromName: 1,
//             toName: 1,
//             totalFreight: 1,
//             totalPayable: 1,
//             lsNo: 1,
//             isLocalMemo: 1,
//             branch: 1,
//             active: 1,
//             unacknowledgedCount: { $size: "$lorryReceipts" },
//             totalCount: { $size: "$lrList" },
//           },
//         },
//         { $match: param },
//       ]);
//       count = loadingSlips.length;
//       loadingSlips = loadingSlips.slice(start, start + limit);
//     } else {
//       loadingSlips = await LoadingSlip.aggregate([
//         { $sort: { createdAt: -1 } },
//         { $match: param },
//         { $skip: start },
//         { $limit: limit },
//         {
//           $addFields: {
//             list: {
//               $map: {
//                 input: "$lrList",
//                 as: "lrObj",
//                 in: "$$lrObj.lrNo",
//               },
//             },
//           },
//         },
//         {
//           $lookup: {
//             from: "lorryReceipt",
//             let: { lrList: "$list" },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: { $in: ["$lrNo", "$$lrList"] },
//                   $or: [{ deliveryDate: null }, { deliveryDate: "" }],
//                 },
//               },
//             ],
//             as: "lorryReceipts",
//           },
//         },
//         {
//           $project: {
//             _id: 1,
//             date: 1,
//             vehicleNo: 1,
//             fromName: 1,
//             toName: 1,
//             totalFreight: 1,
//             totalPayable: 1,
//             lsNo: 1,
//             isLocalMemo: 1,
//             branch: 1,
//             active: 1,
//             unacknowledgedCount: { $size: "$lorryReceipts" },
//             totalCount: { $size: "$lrList" },
//           },
//         },
//       ]);

//       count = await LoadingSlip.countDocuments(param);
//     }

//     res.json({
//       loadingSlips: loadingSlips,
//       count,
//       isLastPage: false,
//     });
//   } catch (error) {
//     res.status(200).json({
//       message: "Error fetching lorry receipts!",
//       error: error.message,
//     });
//   }
// };

// const getLoadingSlips = async (req, res, next) => {
//   try {
//     const { pagination, branch, search, showUnAcknowledge } = req.body;
//     const { page = 1, limit = 100 } = pagination || {};
//     const start = (page - 1) * limit;
//     const param = { branch, active: true };

//     if (!branch || !pagination.page || !pagination.limit) {
//       return res
//         .status(200)
//         .json({ message: "Branch ID & pagination is required!" });
//     }

//     if (search) {
//       const searchText = new RegExp(search);
//       let isoDate = search;
//       const date = new Date(search);
//       if (date instanceof Date && !isNaN(date)) {
//         const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//         const date2 = new Date(updatedDate).toISOString().split("T")[0];
//         if (date2?.split("-")[0]?.length === 4) {
//           isoDate = date2;
//         }
//       }
//       param["$or"] = [
//         {
//           date: { $regex: new RegExp(isoDate), $options: "i" },
//         },
//         { vehicleNo: { $regex: searchText, $options: "i" } },
//         { fromName: { $regex: searchText, $options: "i" } },
//         { toName: { $regex: searchText, $options: "i" } },
//         ...(!isNaN(search)
//           ? [
//             { totalFreight: parseFloat(search) },
//             { totalPayable: parseFloat(search) },
//             { lsNo: parseFloat(search) },
//           ]
//           : []),
//       ];
//     }
//     const loadingSlips = await LoadingSlip.find(param)
//       .sort("-createdAt")
//       .skip(start)
//       .limit(limit)
//       .lean();

//     const count = await LoadingSlip.countDocuments(param);
//     res.json({
//       loadingSlips: loadingSlips,
//       count,
//       isLastPage: false,
//     });
//   } catch (error) {
//     res.status(200).json({
//       message: "Error fetching lorry receipts!",
//       error: error.message,
//     });
//   }
// };
const getLoadingSlips = async (req, res, next) => {
  try {
    const { pagination = {}, branch, search } = req.body;
    const { page = 1, limit = 100 } = pagination;
    const start = (page - 1) * limit;

    if (!branch || !pagination.page || !pagination.limit) {
      return res
        .status(400)
        .json({ message: "Branch ID & pagination are required!" });
    }
    const [results] = await pool.query("CALL getallloadingshets(?)", [branch]);
    let loadingSlips = results[0];
    const statusMapping = {
      1: "New",
      2: "Challan",
      3: "Local Memo",
      4: "Acknowledgment",
      5: "Billed",
      6: "Paid",
    };
    loadingSlips = loadingSlips.map((receipt) => ({
      id: receipt.id,
      dc_no:
        receipt[
        'CONCAT((SELECT branch_abbreviation FROM branch WHERE branch_id=dm.branch),"-",dm.dc_no)'
        ],
      dc_date: receipt.dc_date,
      vehicle_number: receipt.vehicle_number,
      loc_from: receipt.from_loc,
      loc_to: receipt.to_loc,
      total: receipt.total,
      status: statusMapping[receipt.lr_status] || "Unknown",
      hire: receipt.hire,
    }));
    const filterReceipts = (receipts, searchText) => {
      const regex = new RegExp(searchText, "i");
      return receipts.filter(
        (receipt) =>
          regex.test(receipt.dc_no) ||
          regex.test(receipt.loc_from) ||
          regex.test(receipt.loc_to),
      );
    };

    let filteredReceipts = search
      ? filterReceipts(loadingSlips, search)
      : loadingSlips;

    const count = filteredReceipts.length;
    const paginatedReceipts = filteredReceipts.slice(start, start + limit);

    res.json({
      loadingSlips: paginatedReceipts,
      count,
      isLastPage: start + limit >= count,
    });
  } catch (error) {
    console.error("Error fetching lorry receipts:", error);
    res.status(500).json({
      message: "Error fetching lorry receipts!",
      error: error.message,
    });
  }
};

// const exportToExcelChallans = async (req, res, next) => {
//   try {
//     const { pagination, branch, search, showUnAcknowledge } = req.body;
//     const param = { branch, active: true };
//     const { page = 1, limit = 100 } = pagination || {};
//     const start = (page - 1) * limit;
//     if (search) {
//       const searchText = new RegExp(search);
//       let isoDate = search;
//       const date = new Date(search);
//       if (date instanceof Date && !isNaN(date)) {
//         const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//         const date2 = new Date(updatedDate).toISOString().split("T")[0];
//         if (date2?.split("-")[0]?.length === 4) {
//           isoDate = date2;
//         }
//       }
//       param["$or"] = [
//         {
//           date: { $regex: new RegExp(isoDate), $options: "i" },
//         },
//         { vehicleNo: { $regex: searchText, $options: "i" } },
//         { fromName: { $regex: searchText, $options: "i" } },
//         { toName: { $regex: searchText, $options: "i" } },
//         ...(!isNaN(search)
//           ? [
//             { totalFreight: parseFloat(search) },
//             { totalPayable: parseFloat(search) },
//             { lsNo: parseFloat(search) },
//           ]
//           : []),
//       ];
//     }

//     if (showUnAcknowledge) {
//       param.unacknowledgedCount = { ["$gt"]: 0 };
//     }

//     // const loadingSlips = await LoadingSlip.aggregate([
//     //   { $sort: { createdAt: -1 } },
//     //   {
//     //     $addFields: {
//     //       list: {
//     //         $map: {
//     //           input: "$lrList",
//     //           as: "lrObj",
//     //           in: "$$lrObj.lrNo",
//     //         },
//     //       },
//     //     },
//     //   },
//     //   {
//     //     $lookup: {
//     //       from: "lorryReceipt",
//     //       let: { lrList: "$list" },
//     //       pipeline: [
//     //         {
//     //           $match: {
//     //             $expr: { $in: ["$lrNo", "$$lrList"] },
//     //             $or: [{ deliveryDate: null }, { deliveryDate: "" }],
//     //           },
//     //         },
//     //       ],
//     //       as: "lorryReceipts",
//     //     },
//     //   },
//     //   {
//     //     $project: {
//     //       _id: 1,
//     //       date: 1,
//     //       vehicleNo: 1,
//     //       fromName: 1,
//     //       toName: 1,
//     //       totalFreight: 1,
//     //       totalPayable: 1,
//     //       lsNo: 1,
//     //       isLocalMemo: 1,
//     //       branch: 1,
//     //       active: 1,
//     //       unacknowledgedCount: { $size: "$lorryReceipts" },
//     //       totalCount: { $size: "$lrList" },
//     //     },
//     //   },
//     //   { $match: param },
//     // ]);

//     const loadingSlips = await LoadingSlip.find(param)
//       .sort("-createdAt")
//       .skip(start)
//       .limit(limit)
//       .lean();

//     const workbook = exportChallanToXlsx(
//       map(loadingSlips, (challan, index) => ({
//         ...challan,
//         srNo: index + 1,
//         formattedDate: getFormattedDate(challan.date),
//       }))
//     );
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader("Content-Disposition", "attachment; filename=" + "bill.xlsx");
//     return workbook.xlsx.write(res).then(() => {
//       res.status(200).end();
//     });
//   } catch (error) {
//     res.status(200).json({
//       message: "Error fetching lorry receipts!",
//       error: error.message,
//     });
//   }
// };
const exportToExcelChallans = async (req, res, next) => {
  try {
    const { branch } = req.body;

    const params = [branch];
    const [loadingSlips] = await pool.query(
      "CALL getallloadingshets(?)",
      params,
    );

    if (!loadingSlips || loadingSlips.length === 0) {
      return res.status(404).json({ message: "No loading sheets found!" });
    }
    const firstLoadingSlip = loadingSlips[0];

    const workbook = exportChallanToXlsx(
      firstLoadingSlip.map((challan, index) => ({
        srNo: index + 1,
        dcNo: challan[
          'CONCAT((SELECT branch_abbreviation FROM branch WHERE branch_id=dm.branch),"-",dm.dc_no)'
        ],
        formattedDate: challan.dc_date,
        vehicleNumber: challan.vehicle_number,
        fromLoc: challan.from_loc,
        toLoc: challan.to_loc,
        fileLoc: challan.fileloc,
        hire: challan.hire,
        total: challan.total,
      })),
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=bill.xlsx");

    await workbook.xlsx.write(res);
    return res.status(200).end();
  } catch (error) {
    console.error("Error in exportToExcelChallans:", error); // Log the error for debugging
    return res.status(500).json({
      message: "Error fetching loading sheets!",
      error: error.message,
    });
  }
};

const getLoadingSlipsById = (req, res, next) => {
  LoadingSlip.find(
    {
      _id: { $in: req.body.lsList },
      active: true,
    },
    (error, loadingSlips) => {
      if (error) {
        res.send(error);
      }
      res.send(loadingSlips);
    },
  );
};

// const addLoadingSlip = (req, res, next) => {
//   const loadingSlip = {
//     branch: req.body.branch,
//     date: req.body.date,
//     vehicleNo: req.body.vehicleNo,
//     vehicleOwner: req.body.vehicleOwner,
//     vehicleOwnerAddress: req.body.vehicleOwnerAddress,
//     vehicleOwnerPhone: req.body.vehicleOwnerPhone,
//     driverName: req.body.driverName,
//     licenseNo: req.body.licenseNo,
//     phone: req.body.phone,
//     from: req.body.from,
//     fromName: req.body.fromName,
//     to: req.body.to,
//     toName: req.body.toName,
//     lrList: req.body.lrList,
//     totalFreight: req.body.totalFreight,
//     rent: req.body.rent,
//     advance: req.body.advance,
//     totalPayable: req.body.totalPayable,
//     totalWeight: req.body.totalWeight,
//     currentTime: req.body.currentTime,
//     reachTime: req.body.reachTime,
//     paybleAt: req.body.paybleAt,
//     remark: req.body.remark,
//     isLocalMemo: req.body.isLocalMemo ? req.body.isLocalMemo : false,
//     createdBy: req.body.createdBy,
//   };

//   LoadingSlip.findOne(
//     {},
//     {},
//     { sort: { createdAt: -1 } },
//     function (err, foundLS) {
//       if (foundLS) {
//         loadingSlip.lsNo = (foundLS.lsNo || 0) + 1;
//       } else {
//         loadingSlip.lsNo = 1;
//       }
//       LoadingSlip.create(loadingSlip, (error, data) => {
//         if (error) {
//           if (error.code === 11000) {
//             return res.status(200).json({
//               message: `LoadingSlip with challan no (${loadingSlip.lsNo}) already exist!`,
//             });
//           }
//           res.send(error);
//         } else {
//           Driver.findByIdAndUpdate(
//             req.body.driver?._id,
//             {
//               $set: {
//                 updatedBy: req.body.createdBy,
//                 licenseNo: req.body.licenseNo,
//                 telephone: req.body.phone,
//               },
//             },
//             { new: true },
//             (error, data) => { }
//           );

//           const address = req.body.vehicleOwnerAddress?.split?.(", ") || [];
//           const supplier = {
//             name: req.body.vehicleOwner,
//             address: address.slice(0, address?.length - 1)?.toString?.() || "",
//             city: address?.at?.(-1) || "",
//             phone: req.body.vehicleOwnerPhone || "",
//             updatedBy: req.body.createdBy,
//           };
//           if (req.body.vehicle?.owner) {
//             Supplier.findByIdAndUpdate(
//               req.body.vehicle?.owner,
//               {
//                 $set: {
//                   ...supplier,
//                 },
//               },
//               {
//                 new: true,
//               },
//               (error, data) => { }
//             );
//           }
//           const allLR = req.body.lrList.map((lr) => lr?._id);
//           LorryReceipt.updateMany(
//             { _id: { $in: allLR } },
//             {
//               $set: {
//                 status: 1,
//                 associatedLS: data?._id,
//                 memoNo: data.lsNo,
//                 updatedBy: req.body.createdBy,
//               },
//             },
//             { multi: true },
//             (error, updatedLR) => {
//               if (!error) {
//                 res.send(data);
//               } else {
//                 res.send(error);
//               }
//             }
//           );
//         }
//       });
//     }
//   );
// };

const addLoadingSlip = async (req, res, next) => {
  const formatDateTime = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  const in_dc_data = req.body.lrList
    .map((lr) => `(${lr.id}, 0, @@)`)
    .join(", ");
  const in_lr_data = `(${req.body.lrList.map((lr) => lr.id).join(", ")})`;

  const in_lrtoshowamount = req.body.lrtoshowamount;
  const in_lrtoshowamountStr = in_lrtoshowamount
    ? `(${in_lrtoshowamount.join(", ")})`
    : "()";
  const loadingSlip = {
    branch: req.body.branch,
    dc_no: req.body.dc_no || null,
    dc_date: formatDateTime(req.body.date),
    vehicle_id: req.body.vehicle.vehicle_id,
    driver_id: req.body.driver,
    from_loc: req.body.from.id,
    to_loc: req.body.to.id,
    hire: req.body.rent,
    extra_wt_ch: req.body.extraWeightCharge || 0,
    hamali: req.body.hamali || 0,
    commission: req.body.commission || 0,
    adv_amt: req.body.advance,
    diesel_ch: req.body.dieselCharge || 0,
    petrol_pump: req.body.petrolPump || 0,
    total: req.body.totalPayable,
    total_wt: req.body.totalWeight || 0,
    bal_amt: 0,
    bal_amt_date: null,
    pay_mode: "CASH",
    bank_name: null,
    cheque_rtgs: null,
    cheque_rtgs_date: null,
    payble_at: req.body.paybleAt.branch_id,
    total_packages: req.body.lrList.length,
    remarks: req.body.remark,
    fileloc: "Null",
    user_id: req.body.createdBy,
    total_pay_amount: 0,
    driver_charges: req.body.driverCharges || 0,
  };

  try {
    const [result] = await pool.query(
      `CALL add_dc_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message, @inserted_id, ?, ?, ?)`,
      [
        loadingSlip.dc_no,
        loadingSlip.dc_date,
        loadingSlip.vehicle_id,
        loadingSlip.driver_id,
        loadingSlip.from_loc,
        loadingSlip.to_loc,
        loadingSlip.hire,
        loadingSlip.extra_wt_ch,
        loadingSlip.hamali,
        loadingSlip.commission,
        loadingSlip.adv_amt,
        loadingSlip.diesel_ch,
        loadingSlip.petrol_pump,
        loadingSlip.total,
        loadingSlip.total_wt,
        loadingSlip.bal_amt,
        loadingSlip.bal_amt_date,
        loadingSlip.pay_mode,
        loadingSlip.bank_name,
        loadingSlip.cheque_rtgs,
        loadingSlip.cheque_rtgs_date,
        loadingSlip.payble_at,
        loadingSlip.total_packages,
        loadingSlip.remarks,
        in_dc_data,
        in_lr_data,
        loadingSlip.branch,
        loadingSlip.fileloc,
        loadingSlip.user_id,
        in_lrtoshowamountStr,
        loadingSlip.total_pay_amount,
        loadingSlip.driver_charges,
      ],
    );

    const message = result[0][0].message;
    const insertedId = result[1][0].inserted_id;

    res.status(200).json({ message, insertedId });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const removeLoadingSlip = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Loading slip ID is required!" });
//   }

//   LoadingSlip.findById(req.params.id, (error, loadingSlip) => {
//     if (error) {
//       return res.status(200).json({ message: "Loading slip not found!" });
//     }

//     LoadingSlip.findByIdAndUpdate(
//       req.params.id,
//       {
//         $set: {
//           active: false,
//           updatedBy: req.body.updatedBy,
//         },
//       },
//       { new: true },
//       (error, data) => {
//         if (error) {
//           return res.status(200).json({ message: error.message });
//         } else {
//           LorryReceipt.updateMany(
//             { associatedLS: data._id },
//             {
//               $set: {
//                 status: 0,
//                 associatedLS: "",
//                 memoNo: "",
//                 updatedBy: req.body.updatedBy,
//               },
//             },
//             { multi: true },
//             (error, removedAssciationData) => {
//               if (error) {
//                 return res.send(error);
//               }
//             }
//           );
//         }
//       }
//     );

//     const allLR = loadingSlip.lrList.map((lr) => lr._id);
//     LorryReceipt.updateMany(
//       { _id: { $in: allLR } },
//       {
//         $set: {
//           status: 0,
//           associatedLS: "",
//           memoNo: "",
//           updatedBy: req.body.updatedBy,
//         },
//       },
//       { multi: true },
//       (error, updatedLR) => {
//         if (!error) {
//           LoadingSlip.findByIdAndUpdate(
//             req.params.id,
//             { $set: { active: false, updatedBy: req.body.updatedBy } },
//             (lsError, data) => {
//               if (lsError) {
//                 return res.status(200).json({ message: lsError.message });
//               } else {
//                 res.status(200).json({ id: req.params.id });
//               }
//             }
//           );
//         } else {
//           res.send(error);
//         }
//       }
//     );
//   });
// };
const removeLoadingSlip = async (req, res) => {
  const { id } = req.params;

  try {
    // Call the stored procedure
    await pool.query("CALL delete_dc_master(?, @message)", [id]);

    // Get the output parameter
    const [results] = await pool.query("SELECT @message as message");
    const message = results[0].message;

    return res.json({ message });
  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).send("Server error");
  }
};

// const updateLoadingSlip = (req, res, next) => {

//   const _id = req.body._id;

//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Loading slip ID is required!" });
//   }

//   LoadingSlip.findByIdAndUpdate(
//     _id,
//     {
//       $set: {
//         branch: req.body.branch,
//         date: req.body.date,
//         vehicleNo: req.body.vehicleNo,
//         vehicleOwner: req.body.vehicleOwner,
//         vehicleOwnerAddress: req.body.vehicleOwnerAddress,
//         vehicleOwnerPhone: req.body.vehicleOwnerPhone,
//         driverName: req.body.driverName,
//         licenseNo: req.body.licenseNo,
//         phone: req.body.phone,
//         from: req.body.from,
//         fromName: req.body.fromName,
//         to: req.body.to,
//         toName: req.body.toName,
//         lrList: req.body.lrList,
//         totalFreight: req.body.totalFreight,
//         rent: req.body.rent,
//         advance: req.body.advance,
//         totalPayable: req.body.totalPayable,
//         totalWeight: req.body.totalWeight,
//         currentTime: req.body.currentTime,
//         reachTime: req.body.reachTime,
//         paybleAt: req.body.paybleAt,
//         remark: req.body.remark,
//         isLocalMemo: req.body.isLocalMemo ? req.body.isLocalMemo : false,
//         updatedBy: req.body.updatedBy,
//       },
//     },
//     { new: true },
//     (error, data) => {
//       if (error) {
//         res.status(200).json({ message: error.message });
//       } else {
//         Driver.findByIdAndUpdate(
//           req.body.driver?._id,
//           {
//             $set: {
//               updatedBy: req.body.createdBy,
//               licenseNo: req.body.licenseNo,
//               telephone: req.body.phone,
//             },
//           },
//           { new: true },
//           (error, data) => { }
//         );

//         const address = req.body.vehicleOwnerAddress?.split?.(", ") || [];
//         const supplier = {
//           name: req.body.vehicleOwner,
//           address: address.slice(0, address?.length - 1)?.toString?.() || "",
//           city: address?.at?.(-1) || "",
//           phone: req.body.vehicleOwnerPhone || "",
//           updatedBy: req.body.createdBy,
//         };
//         if (req.body.vehicle?.owner) {
//           Supplier.findByIdAndUpdate(
//             req.body.vehicle?.owner,
//             {
//               $set: {
//                 ...supplier,
//               },
//             },
//             {
//               new: true,
//             },
//             (error, data) => { }
//           );
//         }
//         LorryReceipt.updateMany(
//           { associatedLS: data._id },
//           {
//             $set: {
//               status: 0,
//               associatedLS: "",
//               memoNo: "",
//               updatedBy: req.body.updatedBy,
//             },
//           },
//           { multi: true },
//           (error, removedAssciationData) => {
//             if (!error) {
//               const allLR = req.body.lrList.map((lr) => lr._id);
//               LorryReceipt.updateMany(
//                 { _id: { $in: allLR } },
//                 {
//                   $set: {
//                     status: 1,
//                     associatedLS: data._id,
//                     memoNo: data.lsNo,
//                     updatedBy: req.body.updatedBy,
//                   },
//                 },
//                 { multi: true },
//                 (error, updatedLR) => {
//                   if (!error) {
//                     res.send(data);
//                   } else {
//                     res.send(error);
//                   }
//                 }
//               );
//             } else {
//               res.send(error);
//             }
//           }
//         );
//       }
//     }
//   );
// };

const updateLoadingSlip = async (req, res, next) => {
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadingSlip = {
    id: req.body.id,
    dc_no: req.body.dc_no || null,
    dc_date: formatDate(req.body.date),
    vehicle_id: req.body.vehicle.vehicle_id,
    driver_id: req.body.driver || null,
    from_loc: req.body.from.id,
    to_loc: req.body.to.id,
    hire: req.body.rent,
    extra_wt_ch: req.body.extraWeightCharge || 0,
    hamali: req.body.hamali || 0,
    commission: req.body.commission || 0,
    adv_amt: req.body.advance,
    diesel_ch: req.body.dieselCharge || 0,
    petrol_pump: req.body.petrolPump || null,
    total: req.body.totalPayable,
    total_wt: req.body.totalWeight || 0,
    bal_amt: 0,
    bal_amt_date: null,
    pay_mode: "CASH",
    bank_name: req.body.bank_name || null,
    cheque_rtgs: req.body.cheque_rtgs || null,
    cheque_rtgs_date: req.body.cheque_rtgs_date || null,
    payble_at: req.body.paybleAt.branch_id,
    total_packages: req.body.lrList.length,
    remarks: req.body.remark,
    fileloc: req.body.fileloc || "Null",
    user_id: req.body.updatedBy,
    total_pay_amount: 0,
    driver_charges: req.body.driverCharges || 0,
  };

  const in_dc_data = req.body.lrList
    .map((lr) => `(${lr.id}, 0, @@)`)
    .join(", ");
  const in_lr_data = `(${req.body.lrList.map((lr) => lr.id).join(", ")})`;

  const in_lrtoshowamount = req.body.lrtoshowamount;
  const in_lrtoshowamountStr = in_lrtoshowamount
    ? `(${in_lrtoshowamount.join(", ")})`
    : "()";
  try {
    const [result] = await pool.query(
      `CALL update_dc_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message, @inserted_id, ?, ?, ?)`,
      [
        loadingSlip.id,
        loadingSlip.dc_date,
        loadingSlip.vehicle_id,
        loadingSlip.driver_id,
        loadingSlip.from_loc,
        loadingSlip.to_loc,
        loadingSlip.hire,
        loadingSlip.extra_wt_ch,
        loadingSlip.hamali,
        loadingSlip.commission,
        loadingSlip.adv_amt,
        loadingSlip.diesel_ch,
        loadingSlip.petrol_pump,
        loadingSlip.total,
        loadingSlip.total_wt,
        loadingSlip.bal_amt,
        loadingSlip.bal_amt_date,
        loadingSlip.pay_mode,
        loadingSlip.bank_name,
        loadingSlip.cheque_rtgs,
        loadingSlip.cheque_rtgs_date,
        loadingSlip.payble_at,
        loadingSlip.total_packages,
        loadingSlip.remarks,
        in_dc_data,
        in_lr_data,
        loadingSlip.branch,
        loadingSlip.fileloc,
        loadingSlip.user_id,
        in_lrtoshowamountStr,
        loadingSlip.total_pay_amount,
        loadingSlip.driver_charges,
      ],
    );

    const message = result[0][0].message;
    const insertedId = result[1][0].inserted_id;

    res.status(200).json({ message, insertedId });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const getLoadingSlip = async (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Loading slip ID is required!" });
//   }
//   try {
//     const data = await LoadingSlip.findById(req.params.id).lean();
//     const allLR = data?.lrList?.map?.((lr) => lr?._id) || [];
//     const lrList = await LorryReceipt.find({ _id: { $in: allLR } }).lean();
//     let list = [];
//     data?.lrList.forEach?.((element, index) => {
//       const lr = lrList.find(
//         ({ _id }) => element._id?.toString() === _id?.toString()
//       );
//       if (lr) {
//         list = [...list, { ...lr, index: index + 1, checked: true }];
//       }
//     });

//     res.send({ ...(data || {}), lrList: list || [] });
//   } catch (error) {
//     return res.status(200).json({ message: error.message });
//   }
// };

// const printLoadingSlip = (req, res) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Challan ID is required!" });
//   }
//   LoadingSlip.findById(req.params.id, async (lsErr, lsData) => {
//     if (lsErr) {
//       return res.status(200).json({ message: lsErr.message });
//     }
//     let total = 0;
//     const lrList = [];
//     for (let index = 0; index < lsData.lrList.length; index++) {
//       const lr = lsData.lrList[index];
//       const lrData = await LorryReceipt.findById(lr?._id).lean();
//       if (lrData) {
//         const updatedLR = JSON.parse(JSON.stringify(lrData));
//         updatedLR.articles = updatedLR.transactions
//           .reduce((acc, item) => acc + item.articleNo, 0)
//           ?.toFixed(2);
//         updatedLR.weight = updatedLR.transactions
//           .reduce((acc, item) => acc + item.weight, 0)
//           ?.toFixed(2);
//         updatedLR.srNo = index + 1;
//         updatedLR.total =
//           updatedLR.payType === "ToPay" ? updatedLR.total?.toFixed(2) : "-";
//         updatedLR.lrNo = updatedLR.lrNo;
//         if (updatedLR.payType === "ToPay") {
//           total += +updatedLR.total;
//         }
//         if (!hasHindiCharacters(lrData.consigneeNameMr)) {
//           const { consignorNameMr: name, consigneeNameMr: conName } =
//             await getTranslatedData(lrData, false);
//           updatedLR.consignorNameMr = name;
//           updatedLR.consigneeNameMr = conName;
//         }
//         updatedLR.acknowledge = updatedLR.deliveryDate ? "Yes" : "No";
//         lrList.push(updatedLR);
//       }
//     }

//     const isTwoRowsOccupied = lrList?.some(
//       ({ consigneeAddress, consignorName, consigneeName }) =>
//         consigneeAddress?.length > 20 ||
//         consignorName?.length > 20 ||
//         consigneeName?.length > 20
//     );
//     const blankRows = [];
//     const length = 27 - (isTwoRowsOccupied ? lrList.length * 2 : lrList.length);
//     for (let i = 0; i < length; i = i + 1) {
//       blankRows.push({ sr: "-" });
//     }
//     const logo = base64_encode(
//       path.join(__dirname, "../public/images/logo.png")
//     );
//     const laxmi = base64_encode(
//       path.join(__dirname, "../public/images/laxmi.jpeg")
//     );
//     const templatePath = path.join(__dirname, "../bills/") + "LoadingSlip.html";
//     res.render(
//       templatePath,
//       {
//         info: {
//           lsData: lsData,
//           lsNo: lsData.lsNo,
//           date: getFormattedDate(lsData.date),
//           lrList: lrList,
//           payable: getWordNumber(lsData.totalPayable || 0),
//           freight: lsData.totalFreight?.toFixed(2),
//           advance: lsData.advance?.toFixed(2),
//           rent: lsData.rent?.toFixed(2),
//           totalPayable: lsData.totalPayable?.toFixed(2),
//           blankRows: blankRows,
//           logo: logo,
//           laxmi: laxmi,
//           total: [{ total: total?.toFixed(2) }],
//           createdDate: convertDateFormat(lsData.createdAt),
//           printDate: convertDateFormat(Date.now()),
//         },
//       },
//       (err, HTML) => {
//         const fileName = "JSMT-" + lsData.lsNo;
//         var isWin = process.platform === "win32";
//         let htmlRaw = HTML;
//         if (isWin) {
//           htmlRaw = htmlRaw.replace("0.55", "0.98");
//         }
//         pdf.create(htmlRaw, options2).toBuffer((buffErr, buffer) => {
//           if (buffErr) {
//             return res.status(200).json({ message: buffErr.message });
//           }
//           const base64String = buffer.toString("base64");
//           if (req.body.email && req.body.email?.trim() !== "") {
//             sendEmail(
//               req.body.email,
//               base64String,
//               `${fileName}.pdf`,
//               `JSM - Lorry Freight Challan no. ${fileName}`,
//               `JSM - Lorry Freight Challan no. ${fileName}`,
//               `<p><b>Hello</b></p><p>Please find attached lorry freight challan</p>`
//             )
//               .then((response) => {
//                 return res.json({ success: true });
//               })
//               .catch((err) => {
//                 return res.status(200).json({ message: err.response });
//               });
//           } else {
//             return res.json({ file: base64String });
//           }
//         });
//       }
//     );
//   });
// };
const getLoadingSlip = async (req, res) => {
  const id = req.params.id;

  const query = `
        CALL get_loadingsheet_freight_by_id(?)
    `;

  try {
    const [results] = await pool.query(query, [id]);
    if (results[0].length === 0) {
      return res.status(404).send("No record found");
    }

    // Extract the results from the stored procedure
    const masterData = results[0][0];

    const transectEntries = results[1];

    masterData.transectEntries = transectEntries;

    // Send the combined result
    return res.json(masterData);
  } catch (err) {
    console.error("Error executing query:", err);
    return res.status(500).send("Server error");
  }
};

// const printLoadingSlip = async (req, res, next) => {
//   try {
//     const lrid = req.params.id;

//     const query = `SELECT 
//     dc_master.*, 
//     DATE_FORMAT(dc_master.dc_date, '%d-%m-%Y') AS dc_date,
//     vehicle.vehicleno, 
//     vehicle_owner_details.vehical_owner_name,
//     vehicle_owner_details.telephoneno,
//     vehicle_owner_details.address,
//     place.place_name AS fromplace,
//     place2.place_name AS toplace,
//     driver.driver_name,
//     CONCAT(branch.branch_abbreviation, '-', dc_master.dc_no) AS lts_no,
//     driver.licenseno,
//     driver.mobileno,
//     GROUP_CONCAT(dc_transactions.lr_id) AS lr_ids
// FROM 
//     dc_master 
// JOIN 
//     vehicle ON dc_master.vehicle_id = vehicle.vehicle_id 
// JOIN 
//     vehicle_owner_details ON vehicle.vo_id = vehicle_owner_details.vod_id
// JOIN 
//     place ON dc_master.from_loc = place.place_id
// JOIN 
//     place AS place2 ON dc_master.to_loc = place2.place_id 
// JOIN 
//     driver ON dc_master.driver_id = driver.driver_id 
// JOIN 
//     branch ON dc_master.branch = branch.branch_id  
// JOIN 
//     dc_transactions ON dc_master.id = dc_transactions.dc_master_id  
// WHERE 
//     dc_master.id = ?
// GROUP BY
//     dc_master.id;`;

//     const [DCDataObj] = await pool.query(query, lrid);

//     let fileName;

//     if (DCDataObj) {
//       const {
//         dc_no,
//         id,
//         dc_date,
//         vehical_owner_name,
//         vehicleno,
//         address,
//         fromplace,
//         toplace,
//         driver_name,
//         licenseno,
//         mobileno,
//         hire,
//         adv_amt,
//         total,
//         pay_type,
//         branch,
//         remarks,
//         telephoneno,
//         lr_ids,
//       } = DCDataObj[0];

//       // Step 1: Format lr_ids for SQL query
//       const lrIdsArray = lr_ids.split(",").map((id) => `'${id.trim()}'`);
//       const formattedSelectedIds = lrIdsArray.join(",");

//       // Step 2: Use formattedSelectedIds in the new query
//       const query3 = `
//         SELECT 
//           lm.lr_no,
//           lm.pay_type,
//           CONCAT(branch.branch_abbreviation, '-', lm.lr_no) AS lrnumber,
//           branch.branch_abbreviation,
//           DATE_FORMAT(lm.lr_date, '%d-%m-%Y') AS lr_date,
//           cust1.customer_name AS consigner,
//           cust2.customer_name AS consignee,
//           fplace.place_name AS from_loc,
//           tplace.place_name AS to_loc,
//           SUM(lt.no_of_articles) AS noofarticles,
//           SUM(lt.char_wt) AS weight,
//           lm.total,
//           lm.id ,
//               lm.InvoiceNo
//         FROM 
//           lorry_reciept_master lm 
//         INNER JOIN 
//           transactions_lr lt ON lm.id = lt.lr_master_id 
//         LEFT JOIN 
//           customer cust1 ON cust1.customer_id = lm.consigner 
//         LEFT JOIN 
//           customer cust2 ON cust2.customer_id = lm.consignee 
//         LEFT JOIN 
//           place fplace ON fplace.place_id = lm.loc_from 
//         LEFT JOIN 
//           place tplace ON tplace.place_id = lm.loc_to
//         LEFT JOIN 
//           branch ON branch.branch_id = lm.branch 
//         WHERE 
//           lm.id IN (${formattedSelectedIds}) 
//         GROUP BY 
//           lm.id;`;

//       const transactionData = await pool.query(query3);

//       const transactions = transactionData[0].map((row, index) => ({
//         lrNo: row.lrnumber || "",
//         payType: row.pay_type,
//         branch_abbreviation: row.branch_abbreviation || "",
//         lr_date: row.lr_date || "",
//         consignorNameMr: row.consigner || "",
//         consigneeNameMr: row.consignee || "",
//         from_loc: row.from_loc || "",
//         consigneeAddress: row.to_loc || "",
//         articles: parseFloat(row.noofarticles) || 0,
//         weight: row.weight || 0,
//         total: row.pay_type === "TBB" ? null : parseFloat(row.total) || 0,
//         InvoiceNo: row.InvoiceNo,
//         _id: row.id,
//         srNo: index + 1,
//       }));
//       const totalArticles = transactions.reduce(
//         (sum, transaction) => sum + transaction.articles,
//         0,
//       );
//       let LRData = {
//         _id: id,
//         branch: branch,
//         lsNo: dc_no,
//         date: dc_date,
//         vehicleOwner: vehical_owner_name,
//         vehicleNo: vehicleno,
//         vehicleOwnerAddress: address,
//         vehicleOwnerPhone: telephoneno,
//         driverName: driver_name,
//         licenseNo: licenseno,
//         phone: mobileno,
//         fromName: fromplace || "",
//         toName: toplace || "",
//         advance: adv_amt || "",
//         rent: hire || "",
//         totalPayable: total,
//         remark: remarks || "",
//         freight:
//           (parseFloat(total) || 0) +
//           (parseFloat(hire) || 0) -
//           (parseFloat(adv_amt) || 0),
//         lrList: transactions || [],
//         totalArticles: totalArticles,
//       };
//       LRData.freight =
//         LRData.freight && !isNaN(LRData.freight)
//           ? parseFloat(LRData.freight).toFixed(2)
//           : "";
//       LRData.total =
//         LRData.total && !isNaN(LRData.total)
//           ? parseFloat(LRData.total).toFixed(2)
//           : "";
//       const numberToWords = (num) => {
//         const belowTwenty = [
//           "Zero",
//           "One",
//           "Two",
//           "Three",
//           "Four",
//           "Five",
//           "Six",
//           "Seven",
//           "Eight",
//           "Nine",
//           "Ten",
//           "Eleven",
//           "Twelve",
//           "Thirteen",
//           "Fourteen",
//           "Fifteen",
//           "Sixteen",
//           "Seventeen",
//           "Eighteen",
//           "Nineteen",
//         ];
//         const tens = [
//           "",
//           "",
//           "Twenty",
//           "Thirty",
//           "Forty",
//           "Fifty",
//           "Sixty",
//           "Seventy",
//           "Eighty",
//           "Ninety",
//         ];
//         const thousands = ["", "Thousand", "Million", "Billion"];

//         if (num === 0) return belowTwenty[0];

//         let words = "";
//         let thousandCounter = 0;

//         while (num > 0) {
//           let part = num % 1000;
//           if (part > 0) {
//             let str = "";
//             if (part % 100 < 20) {
//               str = belowTwenty[part % 100];
//             } else {
//               str =
//                 tens[Math.floor((part % 100) / 10)] +
//                 (part % 10 > 0 ? " " + belowTwenty[part % 10] : "");
//             }
//             if (Math.floor(part / 100) > 0) {
//               str =
//                 belowTwenty[Math.floor(part / 100)] +
//                 " Hundred" +
//                 (str ? " " + str : "");
//             }
//             words =
//               str +
//               " " +
//               thousands[thousandCounter] +
//               (words ? " " + words : "");
//           }
//           num = Math.floor(num / 1000);
//           thousandCounter++;
//         }

//         return words.trim();
//       };
//       const totalPayableInWords = numberToWords(
//         parseFloat(LRData.totalPayable),
//       );
//       LRData.payable = totalPayableInWords;
//       const imagePath = path.join(__dirname, "../public/images/jsb.png");
//       const checkedImagePath = path.join(
//         __dirname,
//         "../public/images/checked.png",
//       );
//       const checkedImageBase64 = fs
//         .readFileSync(checkedImagePath)
//         .toString("base64");
//       const checkedImage = `data:image/png;base64,${checkedImageBase64}`;
//       const imageBase64 = fs.readFileSync(imagePath).toString("base64");
//       const imgSrc = `data:image/png;base64,${imageBase64}`;
//       const templatePath =
//         path.join(__dirname, "../bills/") + "LoadingSlip.html";

//       res.render(
//         templatePath,
//         {
//           info: {
//             lsData: LRData,
//             printDate: converDateFormat(Date.now()),
//             logo: imgSrc,
//             checked: checkedImage,
//           },
//         },
//         async (err, HTML) => {
//           fileName = LRData.lsNo;
//           if (err) {
//             return res.status(500).json({ message: err.message });
//           }

//           var isWin = process.platform === "win32";
//           let htmlRaw = HTML;
//           if (isWin) {
//             htmlRaw = htmlRaw.replace("0.55", "1");
//           }
//           try {
//             const tempDir = path.join(__dirname, "../temp");

//             if (!fs.existsSync(tempDir)) {
//               fs.mkdirSync(tempDir, { recursive: true });
//             }

//             const outputPath = path.join(
//               tempDir,
//               `${fileName}_${Date.now()}.pdf`,
//             );

//             await generatePdfFromHtml(htmlRaw, outputPath, {
//               format: "A4",
//               printBackground: true,
//             });

//             const buffer = fs.readFileSync(outputPath);

//             const base64String = buffer.toString("base64");

//             fs.unlinkSync(outputPath);

//             if (req.body.email && req.body.email.trim() !== "") {
//               await sendEmail(
//                 req.body.email,
//                 base64String,
//                 `${fileName}.pdf`,
//                 `DTC - Challan no. ${fileName}`,
//                 `DTC - Bill no. ${fileName}`,
//                 `<p><b>Hello</b></p><p>Please find attached Challan.</p>`,
//               );

//               return res.json({ success: true });
//             }

//             return res.json({
//               file: base64String,
//               lsNo: LRData.lsNo,
//             });
//           } catch (err) {
//             console.error(err);

//             return res.status(500).json({
//               message: err.message,
//             });
//           }
//         },
//       );
//     }
//   } catch (error) {
//     return res.status(500).json(error);
//   }
// };

const printLoadingSlip = async (req, res, next) => {
  try {
    const lrid = req.params.id;

    const query = `SELECT 
    dc_master.*, 
    DATE_FORMAT(dc_master.dc_date, '%d-%m-%Y') AS dc_date,
    vehicle.vehicleno, 
    vehicle_owner_details.vehical_owner_name,
    vehicle_owner_details.telephoneno,
    vehicle_owner_details.address,
    place.place_name AS fromplace,
    place2.place_name AS toplace,
    driver.driver_name,
    CONCAT(branch.branch_abbreviation, '-', dc_master.dc_no) AS lts_no,
    driver.licenseno,
    driver.mobileno,
    GROUP_CONCAT(dc_transactions.lr_id) AS lr_ids
FROM 
    dc_master 
JOIN 
    vehicle ON dc_master.vehicle_id = vehicle.vehicle_id 
JOIN 
    vehicle_owner_details ON vehicle.vo_id = vehicle_owner_details.vod_id
JOIN 
    place ON dc_master.from_loc = place.place_id
JOIN 
    place AS place2 ON dc_master.to_loc = place2.place_id 
JOIN 
    driver ON dc_master.driver_id = driver.driver_id 
JOIN 
    branch ON dc_master.branch = branch.branch_id  
JOIN 
    dc_transactions ON dc_master.id = dc_transactions.dc_master_id  
WHERE 
    dc_master.id = ?
GROUP BY
    dc_master.id;`;

    const [DCDataObj] = await pool.query(query, lrid);

    let fileName;

    if (DCDataObj) {
      const {
        dc_no,
        id,
        dc_date,
        vehical_owner_name,
        vehicleno,
        address,
        fromplace,
        toplace,
        driver_name,
        licenseno,
        mobileno,
        hire,
        adv_amt,
        total,
        pay_type,
        branch,
        remarks,
        telephoneno,
        lr_ids,
      } = DCDataObj[0];

      // Step 1: Format lr_ids for SQL query
      const lrIdsArray = lr_ids.split(",").map((id) => `'${id.trim()}'`);
      const formattedSelectedIds = lrIdsArray.join(",");

      // Step 2: Use formattedSelectedIds in the new query
      const query3 = `
        SELECT 
          lm.lr_no,
          lm.pay_type,
          CONCAT(branch.branch_abbreviation, '-', lm.lr_no) AS lrnumber,
          branch.branch_abbreviation,
          DATE_FORMAT(lm.lr_date, '%d-%m-%Y') AS lr_date,
          cust1.customer_name AS consigner,
          cust2.customer_name AS consignee,
          fplace.place_name AS from_loc,
          tplace.place_name AS to_loc,
          SUM(lt.no_of_articles) AS noofarticles,
          SUM(lt.char_wt) AS weight,
          lm.total,
          lm.id ,
              lm.InvoiceNo
        FROM 
          lorry_reciept_master lm 
        INNER JOIN 
          transactions_lr lt ON lm.id = lt.lr_master_id 
        LEFT JOIN 
          customer cust1 ON cust1.customer_id = lm.consigner 
        LEFT JOIN 
          customer cust2 ON cust2.customer_id = lm.consignee 
        LEFT JOIN 
          place fplace ON fplace.place_id = lm.loc_from 
        LEFT JOIN 
          place tplace ON tplace.place_id = lm.loc_to
        LEFT JOIN 
          branch ON branch.branch_id = lm.branch 
        WHERE 
          lm.id IN (${formattedSelectedIds}) 
        GROUP BY 
          lm.id;`;

      const transactionData = await pool.query(query3);

      const transactions = transactionData[0].map((row, index) => ({
        lrNo: row.lrnumber || "",
        payType: row.pay_type,
        branch_abbreviation: row.branch_abbreviation || "",
        lr_date: row.lr_date || "",
        consignorNameMr: row.consigner || "",
        consigneeNameMr: row.consignee || "",
        from_loc: row.from_loc || "",
        consigneeAddress: row.to_loc || "",
        articles: parseFloat(row.noofarticles) || 0,
        weight: row.weight || 0,
        total: row.pay_type === "TBB" ? null : parseFloat(row.total) || 0,
        InvoiceNo: row.InvoiceNo,
        _id: row.id,
        srNo: index + 1,
      }));

      const totalArticles = transactions.reduce(
        (sum, transaction) => sum + transaction.articles,
        0,
      );

      // ---- Pagination logic: split LRs into pages of 20 ----
      const LR_PER_PAGE = 20;
      const chunks = [];
      for (let i = 0; i < transactions.length; i += LR_PER_PAGE) {
        chunks.push(transactions.slice(i, i + LR_PER_PAGE));
      }
      if (chunks.length === 0) chunks.push([]); // still render an empty table if no LRs

      const totalPagesCount = chunks.length;

      const pages = chunks.map((rows, idx) => ({
        pageNumber: idx + 1,
        totalPages: totalPagesCount,
        isLastPage: idx === totalPagesCount - 1,
        lrList: rows,
      }));
      // ---- End pagination logic ----

      let LRData = {
        _id: id,
        branch: branch,
        lsNo: dc_no,
        date: dc_date,
        vehicleOwner: vehical_owner_name,
        vehicleNo: vehicleno,
        vehicleOwnerAddress: address,
        vehicleOwnerPhone: telephoneno,
        driverName: driver_name,
        licenseNo: licenseno,
        phone: mobileno,
        fromName: fromplace || "",
        toName: toplace || "",
        advance: adv_amt || "",
        rent: hire || "",
        totalPayable: total,
        remark: remarks || "",
        freight:
          (parseFloat(total) || 0) +
          (parseFloat(hire) || 0) -
          (parseFloat(adv_amt) || 0),
        lrList: transactions || [],
        pages: pages,
        totalArticles: totalArticles,
      };

      LRData.freight =
        LRData.freight && !isNaN(LRData.freight)
          ? parseFloat(LRData.freight).toFixed(2)
          : "";
      LRData.total =
        LRData.total && !isNaN(LRData.total)
          ? parseFloat(LRData.total).toFixed(2)
          : "";

      const numberToWords = (num) => {
        const belowTwenty = [
          "Zero",
          "One",
          "Two",
          "Three",
          "Four",
          "Five",
          "Six",
          "Seven",
          "Eight",
          "Nine",
          "Ten",
          "Eleven",
          "Twelve",
          "Thirteen",
          "Fourteen",
          "Fifteen",
          "Sixteen",
          "Seventeen",
          "Eighteen",
          "Nineteen",
        ];
        const tens = [
          "",
          "",
          "Twenty",
          "Thirty",
          "Forty",
          "Fifty",
          "Sixty",
          "Seventy",
          "Eighty",
          "Ninety",
        ];
        const thousands = ["", "Thousand", "Million", "Billion"];

        if (num === 0) return belowTwenty[0];

        let words = "";
        let thousandCounter = 0;

        while (num > 0) {
          let part = num % 1000;
          if (part > 0) {
            let str = "";
            if (part % 100 < 20) {
              str = belowTwenty[part % 100];
            } else {
              str =
                tens[Math.floor((part % 100) / 10)] +
                (part % 10 > 0 ? " " + belowTwenty[part % 10] : "");
            }
            if (Math.floor(part / 100) > 0) {
              str =
                belowTwenty[Math.floor(part / 100)] +
                " Hundred" +
                (str ? " " + str : "");
            }
            words =
              str +
              " " +
              thousands[thousandCounter] +
              (words ? " " + words : "");
          }
          num = Math.floor(num / 1000);
          thousandCounter++;
        }

        return words.trim();
      };

      const totalPayableInWords = numberToWords(
        parseFloat(LRData.totalPayable),
      );
      LRData.payable = totalPayableInWords;

      try {
        const docDef = buildLoadingSlipDocDefinition({
          lsData: LRData,
          printDate: converDateFormat(Date.now()),
        });

        const base64String = await generatePdfBase64(docDef);
        const fileName = LRData.lsNo;

        if (req.body.email && req.body.email.trim() !== "") {
          await sendEmail(
            req.body.email,
            base64String,
            `${fileName}.pdf`,
            `DTC - Challan no. ${fileName}`,
            `DTC - Bill no. ${fileName}`,
            `<p><b>Hello</b></p><p>Please find attached Challan.</p>`,
          );

          return res.json({ success: true });
        }

        return res.json({
          file: base64String,
          lsNo: LRData.lsNo,
        });
      } catch (err) {
        console.error(err);

        return res.status(500).json({
          message: err.message,
        });
      }
    }
  } catch (error) {
    return res.status(500).json(error);
  }
};

const getMoneyTransfers = (req, res, next) => {
  if (!req.body.branch) {
    return res.status(200).json({ message: "Branch ID is required!" });
  }

  MoneyTransfer.find({ branch: req.body.branch, active: true })
    .limit(1000)
    .sort("-createdAt")
    .exec((error, moneyTransfers) => {
      if (error) {
        return res.status(200).json({
          message: "Error fetching money transfer list!",
        });
      } else {
        res.json(moneyTransfers);
      }
    });
};

const addMoneyTransfer = (req, res, next) => {
  const moneyTransfer = {
    branch: req.body.branch,
    transferToBranch: req.body.transferToBranch,
    date: req.body.date,
    amount: req.body.amount,
    remark: req.body.remark,
    createdBy: req.body.createdBy,
  };

  MoneyTransfer.findOne(
    {},
    {},
    { sort: { createdAt: -1 } },
    function (err, foundMT) {
      if (foundMT) {
        moneyTransfer.pettyCashNo = foundMT.pettyCashNo + 1;
      } else {
        moneyTransfer.pettyCashNo = 1;
      }
      MoneyTransfer.create(moneyTransfer, (error, data) => {
        if (error) {
          if (error.code === 11000) {
            return res.status(200).json({
              message: `Money Transfer with petty cash no (${moneyTransfer.pettyCashNo}) already exist!`,
            });
          }
          return res.status(200).json({ message: error.message });
        } else {
          res.send(data);
        }
      });
    },
  );
};

const removeMoneyTransfer = (req, res, next) => {
  if (!req.params.id || !req.body.id) {
    return res.status(200).json({ message: "Money transfer ID is required!" });
  }
  const _id = req.body.id || req.params.id;
  MoneyTransfer.findByIdAndUpdate(
    _id,
    {
      $set: {
        active: false,
        updatedBy: req.body.updatedBy,
      },
    },
    { new: true },
    (error, data) => {
      if (error) {
        res.status(200).json({ message: error.message });
      } else {
        res.json(data);
      }
    },
  );
};

const updateMoneyTransfer = (req, res, next) => {
  const _id = req.body._id;

  if (!req.params.id || !_id) {
    return res.status(200).json({ message: "Money transfer ID is required!" });
  }

  MoneyTransfer.findByIdAndUpdate(
    _id,
    {
      $set: {
        branch: req.body.branch,
        transferToBranch: req.body.transferToBranch,
        date: req.body.date,
        amount: req.body.amount,
        remark: req.body.remark,
        updatedBy: req.body.updatedBy,
      },
    },
    { new: true },
    (error, data) => {
      if (error) {
        res.status(200).json({ message: error.message });
      } else {
        res.json(data);
      }
    },
  );
};

const getMoneyTransfer = (req, res, next) => {
  if (!req.params.id) {
    return res.status(200).json({ message: "Money transfer ID is required!" });
  }
  MoneyTransfer.findById(req.params.id, (error, data) => {
    if (error) {
      return res.status(200).json({ message: error.message });
    }
    res.send(data);
  });
};

const getPettyTransactions = (req, res, next) => {
  if (!req.body.branch) {
    return res.status(200).json({ message: "Branch ID is required!" });
  }

  PettyTransaction.find({ branch: req.body.branch, active: true })
    .limit(1000)
    .sort("-createdAt")
    .exec((error, pettyTransactions) => {
      if (error) {
        return res.status(200).json({
          message: "Error fetching petty cash transactions!",
        });
      } else {
        res.json(pettyTransactions);
      }
    });
};

const addPettyTransaction = (req, res, next) => {
  const pettyTransaction = {
    branch: req.body.branch,
    transactionType: req.body.transactionType,
    transactionName: req.body.transactionName,
    type: req.body.type,
    lsNo: req.body.lsNo,
    amount: +req.body.amount,
    availableBal: +req.body.availableBal,
    date: req.body.date,
    bank: req.body.bank,
    bankAccountNumber: req.body.bankAccountNumber,
    description: req.body.description,
    createdBy: req.body.createdBy,
  };

  PettyTransaction.findOne(
    {},
    {},
    { sort: { createdAt: -1 } },
    function (err, foundPT) {
      if (foundPT) {
        pettyTransaction.transactionNo = foundPT.transactionNo + 1;
        if (pettyTransaction.type?.toLowerCase() === "credit") {
          pettyTransaction.availableBal =
            pettyTransaction.amount + foundPT.availableBal;
        }
        if (pettyTransaction.type?.toLowerCase() === "debit") {
          pettyTransaction.availableBal =
            foundPT.availableBal - pettyTransaction.amount;
        }
      } else {
        pettyTransaction.transactionNo = 1;
        if (pettyTransaction.type?.toLowerCase() === "credit") {
          pettyTransaction.availableBal = pettyTransaction.amount;
        }
        if (pettyTransaction.type?.toLowerCase() === "debit") {
          pettyTransaction.availableBal =
            pettyTransaction.availableBal - pettyTransaction.amount;
        }
      }
      PettyTransaction.create(pettyTransaction, (error, data) => {
        if (error) {
          if (error.code === 11000) {
            return res.status(200).json({
              message: `Petty Transaction with transaction no. (${pettyTransaction.transactionNo}) already exist!`,
            });
          }
          return res.status(200).json({ message: error.message });
        } else {
          res.send(data);
        }
      });
    },
  );
};

const getPettyCashBalance = (req, res, next) => {
  PettyTransaction.findOne(
    {},
    {},
    { sort: { createdAt: -1 } },
    function (error, foundPT) {
      if (error) {
        res.send(error);
      }
      if (foundPT && foundPT.availableBal) {
        res.send({ balance: foundPT.availableBal });
      } else {
        res.send({ balance: 0 });
      }
    },
  );
};

const getPettyTransactionsByDate = (req, res, next) => {
  if (!req.body.startDate || !req.body.endDate) {
    return res
      .status(200)
      .json({ message: "Start and end dates are required!" });
  }
  PettyTransaction.find(
    {
      createdAt: {
        $gte: new Date(req.body.startDate),
        $lte: new Date(req.body.endDate),
      },
      active: true,
    },
    (error, data) => {
      if (error) {
        res.status(200).json({ message: error.message });
      } else {
        res.json(data);
      }
    },
  );
};

const getLorryReceiptsByDate = (req, res, next) => {
  if (!req.body.startDate || !req.body.endDate) {
    return res
      .status(200)
      .json({ message: "Start and end dates are required!" });
  }
  if (!req.body.pagination.page || !req.body.pagination.limit) {
    return res.status(200).json({ message: "Pagination inputs not provided!" });
  }

  const limit = req.body.pagination.limit || 100;
  const start = (req.body.pagination.page - 1) * limit;
  const end = req.body.pagination.page * limit;
  const query = {
    active: true,
  };
  if (req.body.startDate) {
    const date = new Date(req.body.startDate);
    const updatedDate = new Date(date).setDate(date?.getDate() + 1);
    const newDate = new Date(updatedDate).setUTCHours(0, 0, 0, 000);
    query.date = {
      ...query.date,
      $gte: new Date(newDate)?.toISOString(),
    };
  }
  if (req.body.endDate) {
    const date = new Date(req.body.endDate);
    const updatedDate = new Date(date).setDate(date?.getDate() + 1);
    const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
    query.date = {
      ...query.date,
      $lte: new Date(newDate)?.toISOString(),
    };
  }

  if (req.body.type === "loaded") {
    query.status = 1;
  }
  if (req.body.type === "unloaded") {
    query.unloadDate = { $exists: true, $ne: null };
  }

  LorryReceipt.find(query)
    .lean()
    // .limit(limit)
    // .skip(skip)
    .sort("-createdAt")
    .exec((err, data) => {
      if (err) {
        return res.status(200).json({ message: err.message });
      } else {
        return res.json({
          lorryReceipts: data.slice(start, end),
          count: data?.length,
        });
      }
    });
};

// const getBills = async (req, res, next) => {
//   try {
//     const { pagination, branch, search, from, to } = req.body;
//     const { page = 1, limit = 100 } = pagination || {};
//     const start = (page - 1) * limit;
//     const param = { branch, active: true };

//     if (!branch || !pagination.page || !pagination.limit) {
//       return res
//         .status(200)
//         .json({ message: "Branch ID & pagination is required!" });
//     }

//     if (from) {
//       const date = new Date(from);
//       const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//       const newDate = new Date(updatedDate)?.setUTCHours(0, 0, 0, 000);
//       param.date = {
//         ...param.date,
//         $gte: new Date(newDate)?.toISOString(),
//       };
//     }
//     if (to) {
//       const date = new Date(to);
//       const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//       const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
//       param.date = {
//         ...param.date,
//         $lte: new Date(newDate)?.toISOString(),
//       };
//     }

//     if (search) {
//       const searchText = new RegExp(search);
//       let isoDate = search;
//       const date = new Date(search);
//       if (date instanceof Date && !isNaN(date)) {
//         const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//         const date2 = new Date(updatedDate).toISOString().split("T")[0];
//         if (date2?.split("-")[0]?.length === 4) {
//           isoDate = date2;
//         }
//       }
//       param["$or"] = [
//         {
//           date: { $regex: new RegExp(isoDate), $options: "i" },
//         },
//         { ["customer.name"]: { $regex: searchText, $options: "i" } },
//         ...(!isNaN(search)
//           ? [{ total: parseFloat(search) }, { billNo: parseInt(search) }]
//           : []),
//       ];
//     }

//     const bills = await Bill.aggregate([
//       { $sort: { createdAt: -1 } },
//       {
//         $addFields: {
//           customerId: { $toObjectId: "$customer" },
//         },
//       },
//       {
//         $lookup: {
//           from: "customer",
//           localField: "customerId",
//           foreignField: "_id",
//           as: "customer",
//         },
//       },
//       { $match: param },
//       { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
//       { $skip: start },
//       { $limit: limit },
//     ]);
//     const count = await Bill.countDocuments(param);

//     return res.json({
//       bills,
//       count: count < bills.length ? bills.length : count,
//     });
//   } catch (error) {
//     return res.status(200).json({
//       message: "Error fetching bills!",
//     });
//   }
// };

const parseDateParam = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === "string") {
    const trimmed = dateStr.trim();
    if (!trimmed) return null;

    // Check DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, "0");
      const month = dmyMatch[2].padStart(2, "0");
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Check YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, "0");
      const day = ymdMatch[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return null;
};

const buildBillSearchConditions = (branch, search, from, to) => {
  let whereClauses = ["b.branch = ?"];
  const params = [branch];

  const fromDate = parseDateParam(from);
  const toDate = parseDateParam(to);

  if (fromDate) {
    whereClauses.push("DATE(LEFT(b.bill_date, 10)) >= ?");
    params.push(fromDate);
  }

  if (toDate) {
    whereClauses.push("DATE(LEFT(b.bill_date, 10)) <= ?");
    params.push(toDate);
  }

  if (search && search.trim()) {
    const trimmed = search.trim();
    const searchLike = `%${trimmed}%`;

    const digitsOnly = trimmed.replace(/\D/g, "");
    const numericVal = digitsOnly ? parseInt(digitsOnly, 10) : null;
    const branchMatch = trimmed.match(/^([A-Za-z]+)[- ]/i);
    const branchPrefix = branchMatch ? branchMatch[1].toUpperCase() : null;
    const isNumeric = !isNaN(Number(trimmed));

    const conditions = [];

    // 1. Bill Number matches
    const billConds = [];
    if (numericVal !== null) {
      if (branchPrefix) {
        billConds.push(
          "((SELECT branch_abbreviation FROM branch WHERE branch_id = b.branch) = ? AND b.bill_no = ?)"
        );
        params.push(branchPrefix, numericVal);
      } else {
        billConds.push("b.bill_no = ?");
        params.push(numericVal);
      }
      billConds.push("CAST(b.bill_no AS CHAR) = ?");
      params.push(trimmed);
      billConds.push("LPAD(CAST(b.bill_no AS CHAR), 5, '0') = ?");
      params.push(trimmed);
      billConds.push(
        'LOWER(CONCAT((SELECT branch_abbreviation FROM branch WHERE branch_id = b.branch), "-", b.bill_no)) = LOWER(?)'
      );
      params.push(trimmed);
      billConds.push(
        'LOWER(CONCAT((SELECT branch_abbreviation FROM branch WHERE branch_id = b.branch), "-", CAST(b.bill_no AS UNSIGNED))) = LOWER(?)'
      );
      params.push(trimmed);
    }

    if (billConds.length > 0) {
      conditions.push(`(${billConds.join(" OR ")})`);
    }

    // 2. LR Number matches via bill_details
    const lrConds = [];
    const lrParams = [];
    if (numericVal !== null) {
      if (branchPrefix) {
        lrConds.push("(br_lr.branch_abbreviation = ? AND lrm.lr_no = ?)");
        lrParams.push(branchPrefix, numericVal);
      } else {
        lrConds.push("lrm.lr_no = ?");
        lrParams.push(numericVal);
      }
      lrConds.push("CAST(lrm.lr_no AS CHAR) = ?");
      lrParams.push(trimmed);
      lrConds.push("LPAD(CAST(lrm.lr_no AS CHAR), 5, '0') = ?");
      lrParams.push(trimmed);
      lrConds.push(
        'LOWER(CONCAT(br_lr.branch_abbreviation, "-", lrm.lr_no)) = LOWER(?)'
      );
      lrParams.push(trimmed);
      lrConds.push(
        'LOWER(CONCAT(br_lr.branch_abbreviation, "-", CAST(lrm.lr_no AS UNSIGNED))) = LOWER(?)'
      );
      lrParams.push(trimmed);
    }

    if (lrConds.length > 0) {
      conditions.push(`b.id IN (
        SELECT bd.bill_id 
        FROM bill_details bd 
        JOIN lorry_reciept_master lrm ON lrm.id = bd.lr_id 
        LEFT JOIN branch br_lr ON br_lr.branch_id = lrm.branch 
        WHERE ${lrConds.join(" OR ")}
      )`);
      params.push(...lrParams);
    }

    // 3. Customer name match
    conditions.push("cust.customer_name LIKE ?");
    params.push(searchLike);

    // 4. Remarks match
    conditions.push("b.remarks LIKE ?");
    params.push(searchLike);

    // 5. Grand total exact numeric match (if valid number)
    if (isNumeric) {
      conditions.push(
        "ROUND(CAST(b.grandTotal AS DECIMAL(10,2)), 2) = ROUND(?, 2)"
      );
      params.push(Number(trimmed));
    }

    whereClauses.push(`(${conditions.join(" OR ")})`);
  }

  return {
    whereClause: `WHERE ${whereClauses.join(" AND ")}`,
    params,
  };
};

const getBills = async (req, res) => {
  const { pagination = {}, branch, search, from, to } = req.body;

  const { page = 1, limit = 100 } = pagination;
  const start = (page - 1) * limit;

  if (!branch || !pagination.page || !pagination.limit) {
    return res
      .status(400)
      .json({ message: "Branch ID & pagination are required!" });
  }

  try {
    const { whereClause, params } = buildBillSearchConditions(
      branch,
      search,
      from,
      to
    );

    // Get total count matching criteria
    const countQuery = `
      SELECT COUNT(DISTINCT b.id) AS total 
      FROM bills b 
      INNER JOIN customer cust ON cust.customer_id = b.customer_id 
      ${whereClause}
    `;
    const [countResults] = await pool.query(countQuery, params);
    const count = countResults[0]?.total || 0;

    // Get paginated bills
    const billsQuery = `
      SELECT 
        b.id,
        CONCAT((SELECT branch_abbreviation FROM branch WHERE branch_id = b.branch), "-", b.bill_no) AS bill_no,
        DATE_FORMAT(b.bill_date, "%d-%m-%Y") AS bill_date,
        cust.customer_name,
        b.grandTotal,
        cust.emailid,
        b.fileloc,
        b.remarks
      FROM 
        bills b 
      INNER JOIN 
        customer cust ON cust.customer_id = b.customer_id 
      ${whereClause} 
      ORDER BY 
        b.id DESC 
      LIMIT ? OFFSET ?
    `;

    const [bills] = await pool.query(billsQuery, [
      ...params,
      Number(limit),
      Number(start),
    ]);

    const formattedBills = bills.map((bill) => ({
      ...bill,
      bill_no: bill.bill_no ? bill.bill_no.toUpperCase() : bill.bill_no,
      customer_name: bill.customer_name
        ? bill.customer_name.toUpperCase()
        : bill.customer_name,
      remark: bill.remarks || "-",
    }));

    return res.json({
      bills: formattedBills,
      count,
      isLastPage: start + limit >= count,
    });
  } catch (err) {
    console.error("Error executing getBills query:", err);
    return res.status(500).send("Server error");
  }
};

const getBillsByCustomer = async (req, res, next) => {
  if (!req.body.customer) {
    return res.status(400).json({ message: "Customer ID is required!" });
  }

  try {
    const [bills] = await pool.query("CALL getbillsbycust(?)", [req.body.customer]);
    const formattedBills = (bills[0] || []).map((b) => {
      const received = parseFloat(b["SUM(IFNULL(pcd.received,0))"] || 0);
      const total = parseFloat(b.tot_amount || 0);
      return {
        _id: b.id,
        id: b.id,
        billNo: b.bill_no,
        date: b.bill_date,
        total: total,
        received: received,
        balance: total - received,
        customer_name: b.customer_name,
      };
    });
    return res.json(formattedBills);
  } catch (error) {
    console.error("Error in getBillsByCustomer:", error);
    return res.status(500).json({ message: "Failed to fetch bills by customer" });
  }
};

// const addBill = (req, res, next) => {
//   const bill = {
//     branch: req.body.branch,
//     date: req.body.date,
//     from: req.body.from,
//     to: req.body.to,
//     customer: req.body.customer,
//     lrList: req.body.lrList,
//     totalFreight: +req.body.totalFreight,
//     freight: +req.body.freight,
//     localFreight: +req.body.localFreight,
//     cgst: +req.body.cgst,
//     cgstPercent: +req.body.cgstPercent,
//     sgst: +req.body.sgst,
//     sgstPercent: +req.body.sgstPercent,
//     total: +req.body.total,
//     grandTotal: +req.body.grandTotal,
//     remark: req.body.remark,
//     createdBy: req.body.createdBy,
//   };

//   Bill.findOne({}, {}, { sort: { createdAt: -1 } }, function (err, foundBill) {
//     if (foundBill) {
//       bill.billNo = foundBill.billNo + 1;
//     } else {
//       bill.billNo = 1;
//     }
//     Bill.create(bill, (error, data) => {
//       if (error) {
//         if (error.code === 11000) {
//           return res.status(200).json({
//             message: `Bill with Bill no. (${bill.billNo}) already exist!`,
//           });
//         }
//         res.send(error);
//       } else {
//         const allLR = req.body.lrList.map((lr) => lr._id);
//         LorryReceipt.updateMany(
//           { _id: { $in: allLR } },
//           {
//             $set: {
//               billGenerated: true,
//               assoBill: data._id,
//               updatedBy: req.body.createdBy,
//             },
//           },
//           { multi: true },
//           (error, updatedLR) => {
//             if (!error) {
//               res.send(data);
//             } else {
//               res.send(error);
//             }
//           }
//         );
//       }
//     });
//   });
// };

const addBill = async (req, res) => {
  const {
    bill_no,
    date,
    billType,
    customer,
    totalFreight,
    tot_hamali,
    service_ch,
    del_char,
    other_ch,
    demurage,
    tds,
    tot_tax,
    total,
    remark,
    in_fileloc,
    branch,
    user_id,
    lrList,
    localFreight, // New parameter
    cgst, // New parameter
    cgstPercent, // New parameter
    sgst, // New parameter
    sgstPercent, // New parameter
    grandTotal, // New parameter
    freight,
  } = req.body;

  const validTotTax = tot_tax ? tot_tax : "0";

  let query;
  if (!bill_no) {
    query = `
      SET @message = '';
      SET @inserted_id = 0;
      CALL add_bill_master_auto(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message, @inserted_id);
      SELECT @message as message, @inserted_id as inserted_id;
    `;
  } else {
    query = `
      SET @message = '';
      SET @inserted_id = 0;
      CALL add_bill_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message, @inserted_id);
      SELECT @message as message, @inserted_id as inserted_id;
    `;
  }

  const parameters = [
    bill_no,
    date, // Updated variable name
    billType, // Updated variable name
    customer,
    totalFreight,
    tot_hamali,
    service_ch,
    del_char,
    other_ch,
    demurage,
    tds,
    validTotTax,
    total,
    remark,
    in_fileloc,
    branch,
    user_id,
    localFreight, // Include localFreight
    cgst, // Include CGST
    cgstPercent, // Include CGST Percent
    sgst, // Include SGST
    sgstPercent, // Include SGST Percent
    grandTotal, // Include Grand Total
    freight,
  ];

  try {
    if (lrList && lrList.length > 0) {
      const lrIds = lrList.map((item) => item.id).filter(Boolean);
      if (lrIds.length > 0) {
        const [existingBilled] = await pool.query(
          `SELECT bd.lr_id, 
                  CONCAT(b_branch.branch_abbreviation, "-", lrm.lr_no) AS lr_number, 
                  CONCAT(b_bill.branch_abbreviation, "-", bills.bill_no) AS bill_number
           FROM bill_details bd 
           JOIN bills ON bd.bill_id = bills.id 
           JOIN lorry_reciept_master lrm ON bd.lr_id = lrm.id 
           JOIN branch b_branch ON lrm.branch = b_branch.branch_id 
           JOIN branch b_bill ON bills.branch = b_bill.branch_id 
           WHERE bd.lr_id IN (?)`,
          [lrIds]
        );
        if (existingBilled.length > 0) {
          const duplicateList = existingBilled
            .map((b) => `${b.lr_number} (already in Bill ${b.bill_number})`)
            .join(", ");
          return res.status(400).json({
            message: `Cannot generate bill: The following LR(s) have already been billed: ${duplicateList}`,
          });
        }
      }
    }

    const [results] = await pool.query(query, parameters);
    let message, inserted_id;

    if (results[2] && results[2][0]) {
      message = results[2][0].message;
    }

    if (results[3] && results[3][0]) {
      inserted_id = results[3][0].inserted_id;
    }

    if (lrList && lrList.length > 0) {
      const detailQuery = `
        CALL add_bill_details(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;

      const promises = lrList.map((detail) => {
        return pool.query(detailQuery, [
          inserted_id,
          detail.id,
          detail.table_lr_freight || null,
          detail.table_lr_hamali || null,
          detail.table_lr_collection || null,
          detail.table_lr_delivery || null,
          detail.table_lr_wtcharges || null,
          detail.table_lr_otherchar || null,
          detail.table_lr_statistical || null,
          detail.total || null,
          "",
          detail.table_lr_gstpayby || null,
          detail.table_lr_gst_amount || null,
        ]);
      });

      await Promise.all(promises);
    }

    return res.json({ message, inserted_id });
  } catch (err) {
    console.error("Error executing query:", err);
    return res
      .status(500)
      .json({ error: "Server error", message: err.message });
  }
};

// const removeBill = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Bill ID is required!" });
//   }

//   Bill.findById(req.params.id, (err, foundBill) => {
//     if (err) {
//       return res.status(200).json({ message: err.message });
//     } else {
//       const allLR = foundBill.lrList.map((lr) => lr._id);

//       Bill.findByIdAndUpdate(
//         req.params.id,
//         {
//           $set: {
//             active: false,
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { new: true },
//         (billError, updatedBill) => {
//           if (billError) {
//             return res.status(200).json({ message: billError.message });
//           } else {
//             LorryReceipt.updateMany(
//               { _id: { $in: allLR } },
//               {
//                 $set: {
//                   billGenerated: false,
//                   assoBill: "",
//                   updatedBy: req.body.updatedBy,
//                 },
//               },
//               { multi: true },
//               (lrError, updatedLR) => {
//                 if (!lrError) {
//                   res.status(200).json({ id: updatedBill._id });
//                 } else {
//                   res.send(lrError);
//                 }
//               }
//             );
//           }
//         }
//       );
//     }
//   });
// };
const removeBill = async (req, res) => {
  const id = req.params.id;

  const query = `
        CALL deletebills(?, @message);
        SELECT @message AS message;
    `;

  try {
    const [results] = await pool.query(query, [id]);
    const message = results[2][0].message;
    return res.json({ message });
  } catch (err) {
    console.error("Error executing query:", err);
    return res.status(500).send("Server error");
  }
};

// const getBill = async (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Bill ID is required!" });
//   }
//   try {
//     const data = await Bill.findById(req.params.id).lean();
//     const customer = await Customer.findById(data.customer).lean();
//     res.send({ ...data, customer });
//   } catch (error) {
//     return res.status(200).json({ message: error.message });
//   }
// };
const getBill = async (req, res) => {
  const id = req.params.id;
  const queryBill = "CALL getbillbyid(?)";
  const queryBillDetails = "CALL getbilldetailsbyid(?)";
  const getLocQuery = `
    SELECT loc_from, loc_to
    FROM lorry_reciept_master
    WHERE id = ?
  `;
  const getPlaceNameQuery = `
    SELECT place_id, place_name
    FROM place
    WHERE place_id = ?
  `;

  try {
    const [billResults] = await pool.query(queryBill, [id]);
    if (billResults.length === 0) {
      return res.status(404).send("Bill not found");
    }
    const bill = billResults[0][0];

    const [billDetailsResults] = await pool.query(queryBillDetails, [id]);
    if (billDetailsResults.length === 0) {
      return res.status(404).send("Bill details not found");
    }
    const billDetails = billDetailsResults[0];
    const lr_id = billDetails[0].lr_id;

    const [locResults] = await pool.query(getLocQuery, [lr_id]);
    if (locResults.length === 0) {
      return res.status(404).send("Lorry receipt not found");
    }
    const { loc_from, loc_to } = locResults[0];

    const [locFromResult] = await pool.query(getPlaceNameQuery, [loc_from]);
    if (locFromResult.length === 0) {
      return res.status(404).send("Location from not found");
    }
    const loc_from_name = locFromResult[0].place_name;

    const [locToResult] = await pool.query(getPlaceNameQuery, [loc_to]);
    if (locToResult.length === 0) {
      return res.status(404).send("Location to not found");
    }
    const loc_to_name = locToResult[0].place_name;

    // Add location details to billDetails
    billDetails.loc_from = loc_from;
    billDetails.loc_to = loc_to;

    // Ensure article-wise quantities and descriptions are properly attached
    const lrIds = (billDetailsResults[0] || []).map((d) => d.lr_id).filter(Boolean);
    if (lrIds.length > 0) {
      const [lrTrans] = await pool.query(
        `SELECT lr_master_id, description, articles, no_of_articles 
         FROM transactions_lr 
         WHERE lr_master_id IN (?) 
         ORDER BY lr_master_id, id`,
        [lrIds]
      );
      const transByLr = {};
      lrTrans.forEach((t) => {
        if (!transByLr[t.lr_master_id]) {
          transByLr[t.lr_master_id] = [];
        }
        transByLr[t.lr_master_id].push(t);
      });

      billDetailsResults[0].forEach((detail) => {
        const trans = transByLr[detail.lr_id];
        if (trans && trans.length > 0) {
          detail.article_quantities = trans
            .map((t) => t.no_of_articles)
            .filter((v) => v !== undefined && v !== null && v !== "")
            .join(", ");
          detail.articles = detail.article_quantities;
          detail.description = trans
            .map((t) => t.description || t.articles || "")
            .filter(Boolean)
            .join(", ");
        } else if (detail.article_quantities) {
          detail.articles = detail.article_quantities;
        } else {
          detail.article_quantities = detail.total_articles !== undefined && detail.total_articles !== null ? String(detail.total_articles) : "";
          detail.articles = detail.article_quantities;
        }
      });
    }

    // Include additional details in the bill object
    bill.details = {
      loc_from_name,
      loc_to_name,
    };
    bill.billDetailsResults = billDetailsResults[0];

    return res.json(bill);
  } catch (error) {
    console.error("Error fetching bill data:", error);
    return res.status(500).send("Server error");
  }
};

const getLorryMasterListForBillUpdate = async (req, res) => {
  const { consignor, billType, billId } = req.body;

  if (!consignor || !billType) {
    return res
      .status(400)
      .send("Bad request: Missing required query parameters");
  }

  // First query to get the unbilled lorry details based on consignor and bill type (excluding LRs billed in other bills)
  const query = `
  SELECT 
    lm.id AS lr_id,
    lm.lr_date,
    CONCAT(
      (SELECT branch_abbreviation 
       FROM branch 
       WHERE branch_id = lm.branch), 
      "-", 
      lm.lr_no
    ) AS lr_display,
    lm.total,
    GROUP_CONCAT(COALESCE(tl.description, tl.articles, '') ORDER BY tl.id SEPARATOR ', ') AS descriptions,
    GROUP_CONCAT(tl.no_of_articles ORDER BY tl.id SEPARATOR ', ') AS article_quantities,
    SUM(tl.no_of_articles) AS total_articles
  FROM 
    lorry_reciept_master lm
  LEFT JOIN 
    transactions_lr tl ON lm.id = tl.lr_master_id 
  WHERE 
    (lm.consigner = ? OR lm.consignee = ?)
    AND lm.pay_type = ?
    AND lm.id NOT IN (
      SELECT DISTINCT bd.lr_id 
      FROM bill_details bd 
      JOIN bills b_tbl ON bd.bill_id = b_tbl.id
      ${billId ? 'WHERE bd.bill_id != ?' : ''}
    )
  GROUP BY 
    lm.id, lm.lr_date, lm.branch, lm.lr_no, lm.total
  ORDER BY 
    lm.id DESC;
  `;

  try {
    // Query execution for first query
    const queryParams = billId 
      ? [consignor, consignor, billType, billId]
      : [consignor, consignor, billType];
    const [results] = await pool.query(query, queryParams);

    const finalResult = results.map((item) => {
      // Format the date as YYYY-MM-DD
      const formattedDate = new Date(item.lr_date).toISOString().split("T")[0];
      return {
        id: item.lr_id,
        lrNo: item.lr_display,
        date: formattedDate, // Use the formatted date here
        total: item.total,
        articles: item.article_quantities || (item.total_articles !== undefined && item.total_articles !== null ? String(item.total_articles) : ""),
        totalArticles: item.total_articles,
        description: item.descriptions || item.description || "",
      };
    });

    // Second query to get the lorry details from bill details
    const secondQuery = `
      SELECT 
        lrm.id AS lr_id, 
        lrm.lr_no,
        lrm.lr_date,
        CONCAT(
          (SELECT branch_abbreviation 
           FROM branch 
           WHERE branch_id = lrm.branch
          ), 
          "-", 
          lrm.lr_no
        ) AS lr_display,
        GROUP_CONCAT(COALESCE(tl.description, tl.articles, '') ORDER BY tl.id SEPARATOR ', ') AS description, 
        GROUP_CONCAT(tl.no_of_articles ORDER BY tl.id SEPARATOR ', ') AS article_quantities,
        SUM(tl.no_of_articles) AS total_articles,  
        GROUP_CONCAT(tl.articles ORDER BY tl.id SEPARATOR ', ') AS articles,  
        lrm.total AS total_lr 
      FROM 
        bill_details bd
      JOIN 
        lorry_reciept_master lrm ON bd.lr_id = lrm.id
      LEFT JOIN 
        transactions_lr tl ON lrm.id = tl.lr_master_id  
      WHERE 
        bd.bill_id = ?
      GROUP BY 
        lrm.id, lrm.lr_no, lrm.lr_date, lrm.total;
    `;

    // Query execution for second query
    const [additionalResults] = await pool.query(secondQuery, [billId]);

    // Merging the results
    additionalResults.forEach((additional) => {
      const formattedDate = new Date(additional.lr_date)
        .toISOString()
        .split("T")[0];
      const matchedItem = finalResult.find(
        (item) => item.id === additional.lr_id,
      );
      const articleQuantities = additional.article_quantities || (additional.total_articles !== undefined && additional.total_articles !== null ? String(additional.total_articles) : "");
      if (matchedItem) {
        matchedItem.lrNo = additional.lr_display;
        if (articleQuantities) {
          matchedItem.articles = articleQuantities;
        }
        if (additional.description) {
          matchedItem.description = additional.description;
        }
        matchedItem.totalArticles = additional.total_articles;
      } else {
        finalResult.push({
          id: additional.lr_id,
          lrNo: additional.lr_display,
          date: formattedDate,
          total: additional.total_lr,
          articles: articleQuantities,
          totalArticles: additional.total_articles,
          description: additional.description || "",
        });
      }
    });

    // Sending the final response with the combined data
    return res.json(finalResult);
  } catch (err) {
    console.error("Error executing query:", err);
    return res.status(500).send("Server error");
  }
};

// const updateBill = (req, res, next) => {
//   const _id = req.body._id;

//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Bill ID is required!" });
//   }

//   Bill.findById(req.params.id, (err, foundBill) => {
//     if (foundBill) {
//       const allLR = foundBill.lrList.map((lr) => lr._id);
//       LorryReceipt.updateMany(
//         { _id: { $in: allLR } },
//         {
//           $set: {
//             billGenerated: false,
//             assoBill: "",
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { multi: true },
//         (lrError, updatedLR) => {
//           if (!lrError) {
//             Bill.findByIdAndUpdate(
//               _id,
//               {
//                 $set: {
//                   branch: req.body.branch,
//                   date: req.body.date,
//                   from: req.body.from,
//                   to: req.body.to,
//                   customer: req.body.customer,
//                   lrList: req.body.lrList,
//                   totalFreight: +req.body.totalFreight,
//                   freight: +req.body.freight,
//                   localFreight: +req.body.localFreight,
//                   cgst: +req.body.cgst,
//                   cgstPercent: +req.body.cgstPercent,
//                   sgst: +req.body.sgst,
//                   sgstPercent: +req.body.sgstPercent,
//                   total: +req.body.total,
//                   grandTotal: +req.body.grandTotal,
//                   remark: req.body.remark,
//                   updatedBy: req.body.updatedBy,
//                 },
//               },
//               { new: true },
//               (error, data) => {
//                 if (error) {
//                   res.status(200).json({ message: error.message });
//                 } else {
//                   const updatedLR = req.body.lrList.map((lr) => lr._id);
//                   LorryReceipt.updateMany(
//                     { _id: { $in: updatedLR } },
//                     {
//                       $set: {
//                         billGenerated: true,
//                         assoBill: _id,
//                         updatedBy: req.body.updatedBy,
//                       },
//                     },
//                     { multi: true },
//                     (updatedLRError, updatedBilledLR) => {
//                       if (!updatedLRError) {
//                         res.send(data);
//                       } else {
//                         res.send(updatedLRError);
//                       }
//                     }
//                   );
//                 }
//               }
//             );
//           } else {
//             res.send(lrError);
//           }
//         }
//       );
//     }
//   });
// };

// const printBill = (req, res) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Bill ID is required!" });
//   }
//   Bill.findById(req.params.id, (findBillErr, data) => {
//     if (findBillErr) {
//       return res.status(200).json(findBillErr);
//     }
//     Customer.findById(data.customer, async (findCustErr, custData) => {
//       if (findCustErr) {
//         return res.status(200).json(findCustErr);
//       }

//       let city = custData?.city;
//       if (city) {
//         city = await Place.findById(city, "name").lean();
//         city = city?.name;
//       }

//       const lrList = [];
//       for (let index = 0; index < data.lrList.length; index++) {
//         const lorryReceipt = data.lrList[index];

//         const foundLR = await LorryReceipt.findById(lorryReceipt._id).lean();
//         const _id = lorryReceipt._id;
//         const lr = JSON.parse(JSON.stringify(foundLR));
//         lr.formattedDate = getFormattedDate2(lr.date);
//         lr.formattedLRNo = lr.lrNo;
//         lrList.push(lr);
//       }
//       const updatedLRList = [];
//       let totalWeight = 0;
//       let totalArticles = 0;
//       lrList.forEach((lr) => {
//         lr.transactions.forEach((tr, index) => {
//           totalWeight = totalWeight + +tr.weight;
//           totalArticles = totalArticles + +tr.articleNo;
//           if (index === 0) {
//             updatedLRList.push({
//               ...lr,
//               ...tr,
//               articleNo: tr.articleNo?.toFixed(2),
//               rate: tr.rate?.toFixed(2),
//               lrCharges: lr.lrCharges ? lr.lrCharges?.toFixed(2) : "0.00",
//               hamali: lr.hamali ? lr.hamali?.toFixed(2) : "0.00",
//               deliveryCharges: lr.deliveryCharges
//                 ? lr.deliveryCharges?.toFixed(2)
//                 : "0.00",
//               total: (
//                 +tr.freight +
//                 +lr.lrCharges +
//                 +lr.hamali +
//                 +lr.deliveryCharges
//               )?.toFixed(2),
//             });
//           } else {
//             updatedLRList.push({
//               ...tr,
//               articleNo: tr.articleNo?.toFixed(2),
//               rate: tr.rate?.toFixed(2),
//               total: tr.freight?.toFixed(2),
//             });
//           }
//         });
//       });
//       let blankRows = [];
//       const isTwoRowsOccupied = lrList?.some(
//         ({ article, to, invoiceNo }) =>
//           to?.length > 15 || article?.length > 15 || invoiceNo?.length > 15
//       );
//       const length =
//         20 -
//         (isTwoRowsOccupied ? updatedLRList.length * 2 : updatedLRList.length);
//       for (let i = 0; i < length; i = i + 1) {
//         blankRows.push({ sr: "-" });
//       }
//       let index = 0;
//       const printData = {
//         billNo: data.billNo,
//         customerName: custData.name?.toUpperCase(),
//         customerAddress: city
//           ? `${custData.address}, ${city}`
//           : custData.address,
//         customerPhone: custData.telephone,
//         customerGst: custData.gstNo,
//         from: lrList[0].from ? lrList[0].from?.toUpperCase() : lrList[0].from,
//         to: lrList[0].to ? lrList[0].to?.toUpperCase() : lrList[0].to,
//         date: getFormattedDate(data.date),
//         bill: data,
//         customer: custData,
//         lrList: lrList,
//         updatedLRList: sortArray(updatedLRList, "lrNo").map((data) => {
//           if (data.formattedLRNo) {
//             index += 1;
//           }
//           return {
//             ...data,
//             srNo: data.formattedLRNo ? index : "",
//           };
//         }),
//         blankRows,
//         totalWeight: totalWeight?.toFixed(2),
//         totalArticles: totalArticles?.toFixed(2),
//         freight: (+data.totalFreight)?.toFixed(2),
//         cgst: (+data.cgst)?.toFixed(2),
//         cgstPercent: +data.cgstPercent?.toFixed(2),
//         sgst: (+data.sgst)?.toFixed(2),
//         sgstPercent: +data.sgstPercent?.toFixed(2),
//         grandTotal: (
//           +data.totalFreight +
//           +data.freight +
//           +data.localFreight +
//           +data.sgst +
//           +data.cgst
//         )?.toFixed(2),
//         totalInWords: getWordNumber(
//           +data.totalFreight +
//           +data.freight +
//           +data.localFreight +
//           +data.sgst +
//           +data.cgst || 0
//         ),
//         otherFreight: data.freight,
//         localFreight: data.localFreight,
//       };
//       const laxmi = base64_encode(
//         path.join(__dirname, "../public/images/laxmi.jpeg")
//       );
//       const logo = base64_encode(
//         path.join(__dirname, "../public/images/logo.png")
//       );
//       const templatePath = path.join(__dirname, "../bills/") + "Bill.html";
//       res.render(
//         templatePath,
//         {
//           info: {
//             ...printData,
//             logo,
//             laxmi,
//             createdDate: convertDateFormat(data.createdAt),
//             printDate: convertDateFormat(Date.now()),
//           },
//         },
//         (err, HTML) => {
//           const finalPath = path.join(__dirname, "../bills/bills/");
//           const fileName = "JSMT-" + data.billNo;
//           var isWin = process.platform === "win32";
//           let htmlRaw = HTML;
//           if (isWin) {
//             htmlRaw = htmlRaw.replace("0.55", "0.98");
//           }
//           pdf
//             .create(htmlRaw, options2)
//             // .toFile(
//             //   path.join(finalPath, fileName + ".pdf"),
//             //   (err, result) => {
//             //     if (err) {
//             //       return res.status(200).send({
//             //         message: err,
//             //       });
//             //     }
//             //     return res.send(printData);
//             //   }
//             // );
//             .toBuffer((buffErr, buffer) => {
//               if (buffErr) {
//                 return res.status(200).json({ message: buffErr.message });
//               }
//               const base64String = buffer.toString("base64");
//               if (req.body.email && req.body.email?.trim() !== "") {
//                 sendEmail(
//                   req.body.email,
//                   base64String,
//                   `${fileName}.pdf`,
//                   `JSM - Bill no. ${fileName}`,
//                   `JSM - Bill no. ${fileName}`,
//                   `<p><b>Hello</b></p><p>Please find attached bill.</p>`
//                 )
//                   .then((response) => {
//                     return res.json({ success: true });
//                   })
//                   .catch((err) => {
//                     return res.status(200).json({ message: err.response });
//                   });
//               } else {
//                 return res.json({ file: base64String });
//               }
//             });
//         }
//       );
//     });
//   });
// };

const updateBill = async (req, res) => {
  const {
    id,
    billNo,
    date,
    billType,
    customer,
    totalFreight,
    tot_hamali,
    service_ch,
    delivery_ch,
    other_ch,
    demurage,
    tds,
    tot_tax,
    remark,
    branch,
    updatedBy,
    lrList,
    freight,
    localFreight,
    cgstPercent,
    sgstPercent,
    cgst,
    sgst,
    total,
    grandTotal,
  } = req.body;

  const sqlUpdateBill = `
    CALL update_bill_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message, @inserted_id, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const parameters = [
    billNo,
    date,
    billType,
    customer,
    totalFreight || null,
    tot_hamali ? tot_hamali.toString() : null,
    service_ch ? service_ch.toString() : null,
    delivery_ch ? delivery_ch.toString() : null,
    other_ch ? other_ch.toString() : null,
    demurage ? demurage.toString() : null,
    tds ? tds.toString() : null,
    tot_tax ? tot_tax.toString() : null,
    total,
    remark,
    "", // Placeholder for in_fileloc
    branch,
    updatedBy,
    id,
    localFreight || null,
    cgst || null,
    cgstPercent || null,
    sgst || null,
    sgstPercent || null,
    grandTotal || null,
    freight || null,
  ];

  try {
    if (lrList && lrList.length > 0) {
      const lrIds = lrList.map((item) => item.id).filter(Boolean);
      if (lrIds.length > 0) {
        const [existingBilled] = await pool.query(
          `SELECT bd.lr_id, 
                  CONCAT(b_branch.branch_abbreviation, "-", lrm.lr_no) AS lr_number, 
                  CONCAT(b_bill.branch_abbreviation, "-", bills.bill_no) AS bill_number
           FROM bill_details bd 
           JOIN bills ON bd.bill_id = bills.id 
           JOIN lorry_reciept_master lrm ON bd.lr_id = lrm.id 
           JOIN branch b_branch ON lrm.branch = b_branch.branch_id 
           JOIN branch b_bill ON bills.branch = b_bill.branch_id 
           WHERE bd.lr_id IN (?) AND bd.bill_id != ?`,
          [lrIds, id]
        );
        if (existingBilled.length > 0) {
          const duplicateList = existingBilled
            .map((b) => `${b.lr_number} (already in Bill ${b.bill_number})`)
            .join(", ");
          return res.status(400).json({
            message: `Cannot update bill: The following LR(s) have already been billed in another bill: ${duplicateList}`,
          });
        }
      }
    }

    // Update the bill
    const [results] = await pool.query(sqlUpdateBill, parameters);

    // Fetch the OUT parameters after executing the stored procedure
    const [[result]] = await pool.query(
      "SELECT @message AS message, @inserted_id AS inserted_id",
    );

    const message = result.message;
    const inserted_id = result.inserted_id;

    const sqlAddBillDetails = `
      CALL add_bill_details(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    // Execute each bill detail query one by one
    for (const detail of lrList) {
      await pool.query(sqlAddBillDetails, [
        inserted_id,
        detail.id,
        detail.table_lr_freight || null,
        detail.table_lr_hamali || null,
        detail.table_lr_collection || null,
        detail.table_lr_delivery || null,
        detail.table_lr_wtcharges || null,
        detail.table_lr_otherchar || null,
        detail.table_lr_statistical || null,
        detail.total || null,
        detail.table_gstn || null,
        detail.table_lr_gstpayby || null,
        detail.table_lr_gst_amount || null,
      ]);
    }

    return res.json({
      message,
      inserted_id,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// const printBill = async (req, res, next) => {
//   try {
//     const lrid = req.params.id;

//     const [LRDataObj] = await pool.query(`CALL getbillprintbyid(?)`, [lrid]);
//     const [TransactionData] = await pool.query(
//       `CALL getbilldetailsprintbyid(?)`,
//       [lrid],
//     );

//     if (!LRDataObj[0] || !TransactionData[0]) {
//       return res.status(404).json({ message: "Data not found" });
//     }

//     const {
//       id,
//       bill_no,
//       tot_freight,
//       "IFNULL(b.delivery_ch,0)": deliveryCharge,
//       "IFNULL(b.tot_hamali,0)": hamali,
//       "IFNULL(b.tot_tax,0)": totalTax,
//       "IFNULL(b.service_ch,0)": serviceCharge,
//       "IFNULL(b.other_ch,0)": otherCharges,
//       "IFNULL(b.tds,0)": tds,
//       "IFNULL(b.demurage,0)": demurrage,
//       "IFNULL(b.tot_amount,0)": totalAmount,
//       remarks,
//       bill_date,
//       customer_name,
//       customer_address: customerAddress,
//       customer_phone: customerPhone,
//       customer_gst: customerGst,
//       "IFNULL(cust.vendor_code,'')": vendorCode,
//       cc_charge,
//       insurance,
//       docket,
//       grandTotal,
//       localFreight,
//       freight,
//       cgst,
//       cgstPercent,
//       sgst,
//       sgstPercent,
//     } = LRDataObj[0][0];

//     const grandTotalFormatted = parseFloat(grandTotal).toFixed(2);
//     const grandTotalInWords = numberToWords
//       .toWords(grandTotalFormatted)
//       .toUpperCase();

//     const transactions = TransactionData[0].map((row, index) => {
//       const articleCount = parseInt(row.total_articles) || 0;
//       const chargeWeight = parseFloat(row.total_charge_weight) || 0;

//       return {
//         article: row.articles || "",
//         formattedLRNo: row.lrno,
//         articleNo: articleCount,
//         description: row.description || "",
//         weight: chargeWeight,
//         descriptions: row.descriptions,
//         dc_numbers: row.dc_numbers,
//         totalArticles: articleCount,
//         to: row.to_place,
//         hamali: row.hamali,
//         deliveryCharges: row.delivery,
//         total: row.total,
//         remark: row.remarks,
//         lrCharges: row.statistics,
//         formattedDate: row.lrdate || null,
//         rate: parseFloat(row.rate || 0).toFixed(2),
//         freight: parseFloat(row.inv_amt || 0).toFixed(2),
//         srNo: index + 1,
//         customer_name: row.customer_name,
//         InvoiceNo: row.InvoiceNo,
//       };
//     });

//     const LRData = {
//       _id: id,
//       billNo: bill_no,
//       date: bill_date,
//       customerName: customer_name,
//       customerAddress,
//       customerPhone,
//       customerGst,
//       vendorCode,
//       totalFreight: tot_freight,
//       deliveryCharge: parseFloat(deliveryCharge).toFixed(2),
//       hamali: parseFloat(hamali).toFixed(2),
//       totalTax: parseFloat(totalTax).toFixed(2),
//       serviceCharge: parseFloat(serviceCharge).toFixed(2),
//       otherCharges: parseFloat(otherCharges).toFixed(2),
//       tds: parseFloat(tds).toFixed(2),
//       demurrage: parseFloat(demurrage).toFixed(2),
//       totalAmount: parseFloat(totalAmount).toFixed(2),
//       remark: remarks || "",
//       ccCharge: parseFloat(cc_charge).toFixed(2),
//       insurance: parseFloat(insurance).toFixed(2),
//       docket: parseFloat(docket).toFixed(2),
//       transactions,
//       totalWeight: transactions
//         .reduce(
//           (sum, transaction) => sum + (parseFloat(transaction.weight) || 0),
//           0,
//         )
//         .toFixed(2),
//       totalArticles: transactions.reduce(
//         (sum, transaction) => sum + (parseInt(transaction.articleNo) || 0),
//         0,
//       ),
//       grandTotal: grandTotalFormatted,
//       totalInWords: grandTotalInWords,
//       localFreight,
//       freight,
//       cgst,
//       cgstPercent,
//       sgst,
//       sgstPercent,
//     };

//     const [imgSrc, checkedImage] = await Promise.all([
//       readImageAsBase64(path.join(__dirname, "../public/images/jsb.png")),
//       readImageAsBase64(path.join(__dirname, "../public/images/checked.png")),
//     ]);

//     const templatePath = path.join(__dirname, "../bills/Bill.html");

//     res.render(
//       templatePath,
//       {
//         info: {
//           lr: LRData,
//           printDate: converDateFormat(Date.now()),
//           logo: imgSrc,
//           checked: checkedImage,
//         },
//       },
//       async (err, HTML) => {
//         if (err) {
//           return res.status(500).json({ message: err.message });
//         }

//         const isWin = process.platform === "win32";
//         const htmlRaw = isWin ? HTML.replace("0.55", "1") : HTML;

//         try {
//           const tempDir = path.join(__dirname, "../temp");

//           if (!fs.existsSync(tempDir)) {
//             fs.mkdirSync(tempDir, { recursive: true });
//           }

//           const fileName = LRData.billNo;

//           const outputPath = path.join(
//             tempDir,
//             `${fileName}_${Date.now()}.pdf`,
//           );

//           await generatePdfFromHtml(htmlRaw, outputPath, {
//             format: "A4",
//             printBackground: true,
//           });

//           const buffer = fs.readFileSync(outputPath);

//           const base64String = buffer.toString("base64");

//           fs.unlinkSync(outputPath);

//           if (req.body.email && req.body.email.trim() !== "") {
//             await sendEmail(
//               req.body.email,
//               base64String,
//               `${fileName}.pdf`,
//               `JBS - Bill no. ${fileName}`,
//               `JBS - Bill no. ${fileName}`,
//               `<p><b>Hello</b></p><p>Please find attached Bill.</p>`,
//             );

//             return res.json({ success: true });
//           }

//           return res.json({
//             file: base64String,
//             lsNo: LRData.billNo,
//           });
//         } catch (err) {
//           console.error(err);

//           return res.status(500).json({
//             message: err.message,
//           });
//         }
//       },
//     );
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// Helper functions remain unchanged

const printBill = async (req, res, next) => {
  try {
    const lrid = req.params.id;

    const [LRDataObj] = await pool.query(`CALL getbillprintbyid(?)`, [lrid]);
    const [TransactionData] = await pool.query(
      `CALL getbilldetailsprintbyid(?)`,
      [lrid],
    );

    if (!LRDataObj[0] || !TransactionData[0]) {
      return res.status(404).json({ message: "Data not found" });
    }

    const {
      id,
      bill_no,
      tot_freight,
      "IFNULL(b.delivery_ch,0)": deliveryCharge,
      "IFNULL(b.tot_hamali,0)": hamali,
      "IFNULL(b.tot_tax,0)": totalTax,
      "IFNULL(b.service_ch,0)": serviceCharge,
      "IFNULL(b.other_ch,0)": otherCharges,
      "IFNULL(b.tds,0)": tds,
      "IFNULL(b.demurage,0)": demurrage,
      "IFNULL(b.tot_amount,0)": totalAmount,
      remarks,
      bill_date,
      customer_name,
      customer_address: customerAddress,
      customer_phone: customerPhone,
      customer_gst: customerGst,
      "IFNULL(cust.vendor_code,'')": vendorCode,
      cc_charge,
      insurance,
      docket,
      grandTotal,
      localFreight,
      freight,
      cgst,
      cgstPercent,
      sgst,
      sgstPercent,
    } = LRDataObj[0][0];

    const grandTotalFormatted = parseFloat(grandTotal).toFixed(2);
    const grandTotalInWords = numberToWords
      .toWords(grandTotalFormatted)
      .toUpperCase();

    const lrIds = (TransactionData[0] || []).map((row) => row.lr_id).filter(Boolean);
    let transByLr = {};
    if (lrIds.length > 0) {
      const [lrTrans] = await pool.query(
        `SELECT lr_master_id, description, articles, no_of_articles 
         FROM transactions_lr 
         WHERE lr_master_id IN (?) 
         ORDER BY lr_master_id, id`,
        [lrIds]
      );
      lrTrans.forEach((t) => {
        if (!transByLr[t.lr_master_id]) {
          transByLr[t.lr_master_id] = [];
        }
        transByLr[t.lr_master_id].push(t);
      });
    }

    const transactions = TransactionData[0].map((row, index) => {
      const totalArticleSum = parseInt(row.total_articles) || 0;
      const chargeWeight = parseFloat(row.total_charge_weight) || 0;
      const trans = transByLr[row.lr_id];

      let articleQuantities;
      let articleNames = row.articles || "";

      if (trans && trans.length > 0) {
        articleQuantities = trans
          .map((t) => t.no_of_articles)
          .filter((v) => v !== undefined && v !== null && v !== "")
          .join(", ");
        articleNames = trans
          .map((t) => t.articles || t.description || "")
          .filter(Boolean)
          .join(", ");
      } else {
        articleQuantities = totalArticleSum ? String(totalArticleSum) : "0";
      }

      return {
        article: articleNames || row.articles || "",
        formattedLRNo: row.lrno,
        articleNo: articleQuantities,
        description: row.description || "",
        weight: chargeWeight,
        descriptions: row.descriptions,
        dc_numbers: row.dc_numbers,
        totalArticles: totalArticleSum,
        to: row.to_place,
        hamali: row.hamali,
        deliveryCharges: row.delivery,
        total: row.total,
        remark: row.remarks,
        lrCharges: row.statistics,
        formattedDate: row.lrdate || null,
        rate: parseFloat(row.rate || 0).toFixed(2),
        freight: parseFloat(row.inv_amt || 0).toFixed(2),
        srNo: index + 1,
        customer_name: row.customer_name,
        InvoiceNo: row.InvoiceNo,
      };
    });

    const totalWeight = transactions
      .reduce(
        (sum, transaction) => sum + (parseFloat(transaction.weight) || 0),
        0,
      )
      .toFixed(2);

    const totalArticles = transactions.reduce(
      (sum, transaction) => sum + (parseInt(transaction.totalArticles) || 0),
      0,
    );

    // ---- Pagination logic: adaptive pagination targeting 28–30 rows per page ----
    const pages = paginateBillTransactions(transactions, 30);
    // ---- End pagination logic ----

    const LRData = {
      _id: id,
      billNo: bill_no,
      date: bill_date,
      customerName: customer_name,
      customerAddress,
      customerPhone,
      customerGst,
      vendorCode,
      totalFreight: tot_freight,
      deliveryCharge: parseFloat(deliveryCharge).toFixed(2),
      hamali: parseFloat(hamali).toFixed(2),
      totalTax: parseFloat(totalTax).toFixed(2),
      serviceCharge: parseFloat(serviceCharge).toFixed(2),
      otherCharges: parseFloat(otherCharges).toFixed(2),
      tds: parseFloat(tds).toFixed(2),
      demurrage: parseFloat(demurrage).toFixed(2),
      totalAmount: parseFloat(totalAmount).toFixed(2),
      remark: remarks || "",
      ccCharge: parseFloat(cc_charge).toFixed(2),
      insurance: parseFloat(insurance).toFixed(2),
      docket: parseFloat(docket).toFixed(2),
      transactions,
      pages,
      totalWeight,
      totalArticles,
      grandTotal: grandTotalFormatted,
      totalInWords: grandTotalInWords,
      localFreight,
      freight,
      cgst,
      cgstPercent,
      sgst,
      sgstPercent,
    };

    try {
      const docDef = buildBillDocDefinition({
        lr: LRData,
        printDate: converDateFormat(Date.now()),
      });

      const base64String = await generatePdfBase64(docDef);
      const fileName = LRData.billNo;

      if (req.body.email && req.body.email.trim() !== "") {
        await sendEmail(
          req.body.email,
          base64String,
          `${fileName}.pdf`,
          `JBS - Bill no. ${fileName}`,
          `JBS - Bill no. ${fileName}`,
          `<p><b>Hello</b></p><p>Please find attached Bill.</p>`,
        );

        return res.json({ success: true });
      }

      return res.json({
        file: base64String,
        lsNo: LRData.billNo,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        message: err.message,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const exportToExcelBill = (req, res) => {
  if (!req.params.id) {
    return res.status(200).json({ message: "Bill ID is required!" });
  }
  Bill.findById(req.params.id, (findBillErr, data) => {
    if (findBillErr) {
      return res.status(200).json(findBillErr);
    }
    Customer.findById(data.customer, async (findCustErr, custData) => {
      if (findCustErr) {
        return res.status(200).json(findCustErr);
      }
      const lrList = [];
      for (let index = 0; index < data.lrList.length; index++) {
        const lorryReceipt = data.lrList[index];

        const foundLR = await LorryReceipt.findById(lorryReceipt._id).lean();
        const _id = lorryReceipt._id;
        const lr = JSON.parse(JSON.stringify(foundLR));
        lr.formattedDate = getFormattedDate(lr.date);
        lr.formattedLRNo = lr.lrNo;
        lrList.push(lr);
      }
      const updatedLRList = [];
      const sortedList = sortArray(lrList, "lrNo");
      let totalWeight = 0;
      let totalArticles = 0;
      sortedList.forEach((lr) => {
        lr.transactions.forEach((tr, index) => {
          totalWeight = totalWeight + +tr.weight;
          totalArticles = totalArticles + +tr.articleNo;
          if (index === 0) {
            updatedLRList.push({
              ...lr,
              ...tr,
              srNo: index + 1,
              articleNo: tr.articleNo?.toFixed(2),
              rate: tr.rate?.toFixed(2),
              lrCharges: lr.lrCharges ? lr.lrCharges?.toFixed(2) : "0.00",
              hamali: lr.hamali ? lr.hamali?.toFixed(2) : "0.00",
              deliveryCharges: lr.deliveryCharges
                ? lr.deliveryCharges?.toFixed(2)
                : "0.00",
              total: (
                +tr.freight +
                +lr.lrCharges +
                +lr.hamali +
                +lr.deliveryCharges
              )?.toFixed(2),
            });
          } else {
            updatedLRList.push({
              ...tr,
              srNo: index + 1,
              articleNo: tr.articleNo?.toFixed(2),
              rate: tr.rate?.toFixed(2),
              total: tr.freight?.toFixed(2),
            });
          }
        });
      });

      const workbook = exportBillToXlsx(updatedLRList);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "bill.xlsx",
      );
      return workbook.xlsx.write(res).then(() => {
        res.status(200).end();
      });
    });
  });
};

const updateBills = async (req, res, next) => {
  try {
    const { bills } = req.body;
    if (!bills || bills.length <= 0) {
      return res.status(400).json({ message: "Bills are required!" });
    }

    const firstBill = bills[0];
    const payment = firstBill.payment || {};
    const totalReceive = bills.reduce(
      (sum, b) => sum + (parseFloat(b.payment?.receive || b.receive || 0) || 0),
      0
    );
    const totalTds = bills.reduce(
      (sum, b) => sum + (parseFloat(b.payment?.tds || b.tds_ded || 0) || 0),
      0
    );

    const receivingDate = payment.receivingDate
      ? new Date(payment.receivingDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const chequeDate = payment.chequeDate
      ? new Date(payment.chequeDate).toISOString().split("T")[0]
      : receivingDate;

    let customerId = payment.customer_id;
    let branchId = payment.branch;
    if (!customerId || !branchId) {
      const [billData] = await pool.query(
        "SELECT customer_id, branch FROM bills WHERE id = ?",
        [firstBill.id || firstBill._id]
      );
      if (billData && billData[0]) {
        customerId = customerId || billData[0].customer_id;
        branchId = branchId || billData[0].branch;
      }
    }

    const [headerResult] = await pool.query(
      `INSERT INTO payment_collection (
        date, type, customer_id, receive, party_ded, tds_ded, 
        pay_mode, bank_name, cheque_rtgs_no, cheque_rtgs_date, branch, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        receivingDate,
        "bill",
        String(customerId || ""),
        String(totalReceive.toFixed(2)),
        "0.00",
        String(totalTds.toFixed(2)),
        payment.payMode || "Cash",
        payment.bankName || "",
        payment.chequeNo || payment.transactionNo || "",
        chequeDate,
        String(branchId || ""),
        String(payment.createdBy || req.userData?.userId || "1"),
      ]
    );

    const payCollId = headerResult.insertId;

    for (const b of bills) {
      const recAmt = parseFloat(b.payment?.receive || b.receive || 0) || 0;
      const tdsAmt = parseFloat(b.payment?.tds || b.tds_ded || 0) || 0;
      const billId = b.id || b._id;
      if (billId && recAmt > 0) {
        await pool.query(
          `INSERT INTO pay_coll_details (pay_coll_id, bill_id, received, party_ded, tds_ded) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            String(payCollId),
            String(billId),
            String(recAmt.toFixed(2)),
            "0.00",
            String(tdsAmt.toFixed(2)),
          ]
        );
      }
    }

    return res.json({
      success: true,
      message: "Payment collection recorded successfully",
      pay_coll_id: payCollId,
    });
  } catch (error) {
    console.error("Error in updateBills:", error);
    return res.status(500).json({ message: "Failed to record payment collection" });
  }
};

const exportToExcelBills = async (req, res) => {
  try {
    const { branch, search, from, to } = req.body;

    if (!branch) {
      return res.status(400).json({ message: "Branch ID is required!" });
    }

    const { whereClause, params } = buildBillSearchConditions(
      branch,
      search,
      from,
      to
    );

    const query = `
      SELECT 
        b.id,
        CONCAT((SELECT branch_abbreviation FROM branch WHERE branch_id = b.branch), "-", b.bill_no) AS bill_no,
        DATE_FORMAT(b.bill_date, "%d-%m-%Y") AS bill_date,
        cust.customer_name,
        b.grandTotal,
        cust.emailid,
        b.fileloc
      FROM 
        bills b 
      INNER JOIN 
        customer cust ON cust.customer_id = b.customer_id 
      ${whereClause}
      ORDER BY 
        b.id DESC
    `;

    const [bills] = await pool.query(query, params);

    const list = bills.map((bill, index) => ({
      ...bill,
      bill_no: bill.bill_no ? bill.bill_no.toUpperCase() : bill.bill_no,
      srNo: index + 1,
      customer: bill.customer_name ? bill.customer_name.toUpperCase() : "",
      grandTotal: bill.grandTotal || "",
    }));

    const workbook = exportBillsToXlsx(list);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=bill.xlsx");
    await workbook.xlsx.write(res);
    return res.status(200).end();
  } catch (e) {
    console.error("exportToExcelBills error:", e);
    return res.status(500).json({ message: e.message });
  }
};

const getLastLR = (req, res, next) => {
  LorryReceipt.find({ active: true })
    .lean()
    .sort({ _id: -1 })
    .limit(1)
    .exec(function (err, lr) {
      if (err) {
        res.status(200).json({ message: err.message });
      }
      if (lr.length) {
        return res.send(lr[0]);
      } else {
        return res.send({ lastLR: null });
      }
    });
};

const getLoadingSlipsBySupplier = (req, res, next) => {
  if (!req.params.id) {
    res.status(200).json({ message: "Supplier ID is required" });
  }

  Vehicle.find(
    { owner: req.params.id, active: true },
    (vehicleErr, vehicleData) => {
      if (vehicleErr) {
        return res.status(200).json({ message: vehicleErr.message });
      }
      if (vehicleData.length) {
        const vehicleNos = vehicleData.map(({ vehicleNo }) => vehicleNo);
        let query = {
          vehicleNo: {
            $in: vehicleNos,
          },
          active: true,
        };
        if (req.body.branch) {
          query = { ...query, branch: req.body.branch };
        }
        LoadingSlip.find(query, (LSErr, LSData) => {
          if (LSErr) {
            return res.status(200).json({ message: LSErr.message });
          }
          res.send(LSData);
        });
      } else {
        res.send([]);
      }
    },
  );
};

const saveSupplierPayments = (req, res, next) => {
  if (req.body.loadingSlips.length <= 0) {
    return res.status(200).json({ message: "Loading slips are required!" });
  }

  let updatedLs = [];
  req.body.loadingSlips.forEach(async (ls) => {
    try {
      const LSToBeUpdated = await LoadingSlip.findOne({ _id: ls.ls_id });
      LSToBeUpdated.supplierPayments.push(ls.payment);
      let savedLs = await LSToBeUpdated.save();
      if (savedLs) {
        updatedLs.push(savedLs);
        savedLs = null;
        if (updatedLs.length === req.body.loadingSlips.length) {
          return res.send(updatedLs);
        }
      }
    } catch (e) {
      return res.status(200).json({ message: e.message });
    }
  });
};

const saveSupplierBill = (req, res, next) => {
  const bill = {
    branch: req.body.branch,
    supplier: req.body.supplier,
    supplierType: req.body.supplierType,
    supplyContent: req.body.supplyContent,
    date: req.body.date,
    invoiceNo: req.body.invoiceNo,
    invoiceDate: req.body.invoiceDate,
    quantity: req.body.quantity,
    amount: req.body.amount,
    createdBy: req.body.createdBy,
  };

  SuppliersBill.create(bill, (error, data) => {
    if (error) {
      res.send(error);
    } else {
      res.send(data);
    }
  });
};

const getSupplierBills = (req, res, next) => {
  if (!req.params.supplier) {
    return res.status(200).json({ message: "Supplier ID is required!" });
  }
  let params = {
    supplier: req.params.supplier,
    active: true,
  };
  if (req.body.branch) {
    params = { ...params, branch: req.body.branch };
  }
  SuppliersBill.find(
    { supplier: req.params.supplier, active: true },
    {},
    { sort: { createdAt: -1 } },
    (err, data) => {
      if (err) {
        res.status(200).json({ message: err.message });
      }
      res.send(data);
    },
  );
};

const updateSupplierBills = (req, res, next) => {
  if (req.body.supplierBills.length <= 0) {
    return res.status(200).json({ message: "Supplier bills are required!" });
  }

  const updatedBills = [];
  req.body.supplierBills.forEach(async (suppBill) => {
    try {
      const billsToBeUpdated = await SuppliersBill.findOne({
        _id: suppBill._id,
      });
      billsToBeUpdated.payments.push(suppBill.payment);
      let savedBill = await billsToBeUpdated.save();
      if (savedBill) {
        updatedBills.push(savedBill);
        savedBill = null;
        if (updatedBills.length === req.body.supplierBills.length) {
          return res.send(updatedBills);
        }
      }
    } catch (e) {
      return res.status(200).json({ message: e.message });
    }
  });
};

const updateLorryReceiptAckByLRNo = (req, res, next) => {
  if (!req.body.lrNo || req.noLrNo) {
    return res.status(200).json({ message: "Lorry receipt no is required!" });
  }

  if (req.alreadyExist) {
    return res
      .status(200)
      .json({ message: `POD file for ${req.body.lrNo} already exist!` });
  }

  if (req.lrNotExist) {
    return res
      .status(200)
      .json({ message: `${req.body.lrNo} does not exist!` });
  }

  if (!req.file) {
    return res.status(200).json({ message: "POD file is required!" });
  }
  let filePath = "";
  if (req.file) {
    const url = "https://" + req.get("host") + "/acknowledgement/";
    filePath = url + req.file.filename;
  }

  LorryReceipt.findOneAndUpdate(
    { wayBillNo: req.body.lrNo?.trim?.() },
    {
      $set: {
        ack: filePath,
        updatedBy: req.body.updatedBy,
      },
    },
    { new: true },
    (error, data) => {
      if (error) {
        res.status(200).json({ message: error.message });
      } else {
        res.json(data);
      }
    },
  );
};

// const getQuotations = (req, res) => {
//   // const { branch } = req.query;
//   // Quotation.find(
//   //   { active: true, branch },
//   //   {},
//   //   { sort: { createdAt: -1 } },
//   //   (err, data) => {
//   //     if (err) {
//   //       return res.status(200).json({ message: err.message });
//   //     }
//   //     return res.send(data);
//   //   },
//   // );

// };


const getQuotations = async (req, res) => {
  const { branch } = req.query;

  try {
    const quotationQuery = `
      SELECT q.id,
             q.quotation_number AS quotationNo,
             q.quotation_date AS date,
             q.branch,
             COALESCE(q.customer_city, c.city, '') AS customerCity,
             c.customer_name AS customer
      FROM quotation q
      LEFT JOIN customer c ON c.customer_id = q.customer
      WHERE q.active = 1
        AND q.branch = ?
      ORDER BY q.created_at DESC
    `;

    const [rows] = await pool.query(quotationQuery, [branch]);

    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error("Error executing getQuotations:", err);
    return res.status(200).json({ message: "Server error" });
  }
};


// const getQuotation = async (req, res) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Quotation id is required" });
//   }
//   try {
//     const data = await Quotation.findById(req.params.id).lean();
//     const customerId = await Customer.findById(data.customerId).lean();
//     const branch = await Branch.findById(data.branch).lean();

//     return res.send({ ...data, customerId, branch });
//   } catch (err) {
//     return res.status(200).json({ message: err.message });
//   }
// };

// const addQuotation = (req, res) => {
//   const quotation = {
//     date: req.body.date,
//     customer: req.body.customer,
//     customerId: req.body.customerId,
//     branch: req.body.branch,
//     from: req.body.from,
//     to: req.body.to,
//     ratePer: req.body.ratePer,
//     otherField: req.body.otherField,
//     stations: req.body.stations,
//     field1: req.body.field1,
//     field2: req.body.field2,
//     field3: req.body.field3,
//     termsAndCond: req.body.termsAndCond,
//     ddChanger: req.body.ddChanger,
//     createdBy: req.body.createdBy,
//   };

//   Quotation.findOne(
//     {},
//     {},
//     { sort: { createdAt: -1 } },
//     function (err, foundQuotation) {
//       if (foundQuotation) {
//         quotation.quotationNo = foundQuotation.quotationNo + 1;
//       } else {
//         quotation.quotationNo = 1;
//       }
//       Quotation.create(quotation, (error, data) => {
//         if (error) {
//           return res.status(200).json({ message: error.message });
//         } else {
//           return res.send(data);
//         }
//       });
//     },
//   );
// };


const getQuotation = async (req, res) => {
  if (!req.params.id) {
    return res.status(200).json({ message: "Quotation id is required" });
  }

  try {
    // 1. Get the quotation row
    const [quotationRows] = await pool.query(
      `SELECT * FROM quotation WHERE id = ?`,
      [req.params.id]
    );

    if (!quotationRows.length) {
      return res.status(200).json({ message: "Quotation not found" });
    }
    const quotation = quotationRows[0];

    // 2. Get related customer
    const [customerRows] = await pool.query(
      `SELECT customer_id, customer_name, city FROM customer WHERE customer_id = ?`,
      [quotation.customer]
    );
    const customer = customerRows[0]
      ? { _id: customerRows[0].customer_id, name: customerRows[0].customer_name, label: customerRows[0].customer_name, city: customerRows[0].city }
      : null;

    // 3. Get related branch
    const [branchRows] = await pool.query(
      `SELECT branch_id, branch_name FROM branch WHERE branch_id = ?`,
      [quotation.branch]
    );
    const branch = branchRows[0]
      ? { _id: branchRows[0].branch_id, name: branchRows[0].branch_name }
      : null;

    // 4. Get stations with place name resolution
    const [stationRows] = await pool.query(
      `SELECT
         qs.id,
         qs.quotation_id,
         COALESCE(
           p_st_id.place_name,
           NULLIF(TRIM(qs.station_name), ''),
           p_pl_id.place_name,
           NULLIF(TRIM(qs.place), ''),
           ''
         ) AS station_name,
         COALESCE(
           NULLIF(TRIM(qs.place), ''),
           p_pl_id.place_name,
           p_st_id.place_name,
           NULLIF(TRIM(qs.station_name), ''),
           ''
         ) AS place,
         qs.amount,
         qs.other_field_value,
         qs.field1_value,
         qs.field2_value,
         qs.field3_value
       FROM quotation_station qs
       LEFT JOIN place p_st_id ON (qs.station_name REGEXP '^[0-9]+$' AND p_st_id.place_id = CAST(qs.station_name AS UNSIGNED))
       LEFT JOIN place p_pl_id ON (qs.place REGEXP '^[0-9]+$' AND p_pl_id.place_id = CAST(qs.place AS UNSIGNED))
       WHERE qs.quotation_id = ?
       ORDER BY qs.id ASC`,
      [quotation.id]
    );
    const stations = stationRows.map((s) => ({
      id: s.id,
      station: s.station_name,
      stationName: s.station_name,
      place: s.place,
      amount: s.amount,
      otherFieldValue: s.other_field_value,
      field1: s.field1_value,
      field2: s.field2_value,
      field3: s.field3_value,
    }));

    // 5. Shape response to match frontend field names
    return res.send({
      id: quotation.id,
      quotationNo: quotation.quotation_number,
      date: quotation.quotation_date,
      from: quotation.from_date,
      to: quotation.to_date,
      customer: customer?.name || "",
      customerId: customer,
      customerCity: quotation.customer_city ?? customer?.city ?? "",
      branch,
      otherField: quotation.other_field,
      field1: quotation.field1,
      field2: quotation.field2,
      field3: quotation.field3,
      termsAndCond: quotation.terms_and_cond,
      ddChanger: quotation.dd_changer,
      ratePer: quotation.rate_per,
      stations,
    });
  } catch (err) {
    return res.status(200).json({ message: err.message });
  }
};

const addQuotation = async (req, res) => {
  const {
    date,
    customer,
    customerId,
    customerCity,
    branch,
    from,
    to,
    ratePer,
    otherField,
    stations,
    field1,
    field2,
    field3,
    termsAndCond,
    ddChanger,
    createdBy,
  } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get next quotation_number (mirrors your findOne + sort desc logic)
    const [rows] = await connection.query(
      `SELECT quotation_number FROM quotation ORDER BY quotation_number DESC LIMIT 1`
    );
    // const quotationNo = rows.length ? rows[0].quotation_number + 1 : 1;
    const quotationNo = rows.length ? Number(rows[0].quotation_number) + 1 : 1;
    // 2. Insert into quotation
    const [quotationResult] = await connection.query(
      `INSERT INTO quotation
        (quotation_number, quotation_date, customer, customer_city, branch, from_date, to_date,
         other_field, field1, field2, field3, terms_and_cond, dd_changer, rate_per)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quotationNo,
        toMySQLDate(date),      // was: date
        customerId ?? customer,
        customerCity || null,
        branch,
        toMySQLDate(from),      // was: from
        toMySQLDate(to),        // was: to
        otherField,
        field1,
        field2,
        field3,
        termsAndCond,
        ddChanger,
        ratePer,
      ]
    );

    const quotationId = quotationResult.insertId;

    // 3. Insert stations (bulk insert)
    if (Array.isArray(stations) && stations.length) {
      const stationValues = await Promise.all(
        stations.map(async (s) => {
          let stName =
            (typeof s.station === "object" && s.station !== null
              ? s.station.place_name || s.station.name || s.station.label || s.station.value
              : s.station) ||
            s.stationName ||
            s.station_name ||
            s.destination ||
            null;

          if (stName && !isNaN(Number(stName)) && String(stName).trim() !== "") {
            const [pRows] = await connection.query(
              `SELECT place_name FROM place WHERE place_id = ?`,
              [Number(stName)]
            );
            if (pRows.length && pRows[0].place_name) {
              stName = pRows[0].place_name;
            }
          }

          let plName =
            (typeof s.place === "object" && s.place !== null
              ? s.place.place_name || s.place.name || s.place.label
              : s.place) || null;

          if (plName && !isNaN(Number(plName)) && String(plName).trim() !== "") {
            const [pRows] = await connection.query(
              `SELECT place_name FROM place WHERE place_id = ?`,
              [Number(plName)]
            );
            if (pRows.length && pRows[0].place_name) {
              plName = pRows[0].place_name;
            }
          }

          const finalStationName = stName ? String(stName).trim() : (plName ? String(plName).trim() : null);
          const finalPlaceName = plName ? String(plName).trim() : (stName ? String(stName).trim() : null);

          return [
            quotationId,
            finalStationName,
            finalPlaceName,
            s.amount,
            s.otherFieldValue,
            s.field1,
            s.field2,
            s.field3,
          ];
        })
      );

      await connection.query(
        `INSERT INTO quotation_station
          (quotation_id, station_name, place, amount, other_field_value,
           field1_value, field2_value, field3_value)
         VALUES ?`,
        [stationValues]
      );
    }

    await connection.commit();

    // 4. Return the created quotation with its stations (mirrors old res.send(data))
    const [quotationRows] = await connection.query(
      `SELECT * FROM quotation WHERE id = ?`,
      [quotationId]
    );
    const [stationRows] = await connection.query(
      `SELECT * FROM quotation_station WHERE quotation_id = ?`,
      [quotationId]
    );

    return res.send({
      ...quotationRows[0],
      customerCity: quotationRows[0].customer_city,
      stations: stationRows,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(200).json({ message: error.message }); // kept status 200 to match your original behavior
  } finally {
    connection.release();
  }
};




// const updateQuotation = (req, res) => {
//   if (!req.body._id) {
//     return res.status(200).json({ message: "Quotation ID is required!" });
//   }

//   Quotation.findByIdAndUpdate(
//     req.body._id,
//     {
//       $set: {
//         date: req.body.date,
//         customer: req.body.customer,
//         customerId: req.body.customerId,
//         branch: req.body.branch,
//         from: req.body.from,
//         to: req.body.to,
//         ratePer: req.body.ratePer,
//         otherField: req.body.otherField,
//         field1: req.body.field1,
//         field2: req.body.field2,
//         field3: req.body.field3,
//         termsAndCond: req.body.termsAndCond,
//         ddChanger: req.body.ddChanger,
//         stations: req.body.stations,
//         updatedBy: req.body.updatedBy,
//       },
//     },
//     { new: true },
//     (error, data) => {
//       if (error) {
//         return res.status(200).json({ message: error.message });
//       } else {
//         return res.json(data);
//       }
//     },
//   );
// };


const updateQuotation = async (req, res) => {
  const {
    id,
    date,
    customer,
    customerId,
    customerCity,
    branch,
    from,
    to,
    ratePer,
    otherField,
    stations,
    field1,
    field2,
    field3,
    termsAndCond,
    ddChanger,
    updatedBy,
  } = req.body;

  if (!id) {
    return res.status(200).json({ message: "Quotation ID is required!" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Update quotation row
    const [updateResult] = await connection.query(
      `UPDATE quotation
       SET quotation_date = ?,
           customer = ?,
           customer_city = ?,
           branch = ?,
           from_date = ?,
           to_date = ?,
           other_field = ?,
           field1 = ?,
           field2 = ?,
           field3 = ?,
           terms_and_cond = ?,
           dd_changer = ?,
           rate_per = ?,
           updated_by = ?
       WHERE id = ?`,
      [
        toMySQLDate(date),
        customerId ?? customer,
        customerCity || null,
        branch,
        toMySQLDate(from),
        toMySQLDate(to),
        otherField,
        field1,
        field2,
        field3,
        termsAndCond,
        ddChanger,
        ratePer,
        updatedBy,
        id,
      ]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(200).json({ message: "Quotation not found!" });
    }

    // 2. Replace stations: delete old, insert current array
    await connection.query(
      `DELETE FROM quotation_station WHERE quotation_id = ?`,
      [id]
    );

    if (Array.isArray(stations) && stations.length) {
      const stationValues = await Promise.all(
        stations.map(async (s) => {
          let stName =
            (typeof s.station === "object" && s.station !== null
              ? s.station.place_name || s.station.name || s.station.label || s.station.value
              : s.station) ||
            s.stationName ||
            s.station_name ||
            s.destination ||
            null;

          if (stName && !isNaN(Number(stName)) && String(stName).trim() !== "") {
            const [pRows] = await connection.query(
              `SELECT place_name FROM place WHERE place_id = ?`,
              [Number(stName)]
            );
            if (pRows.length && pRows[0].place_name) {
              stName = pRows[0].place_name;
            }
          }

          let plName =
            (typeof s.place === "object" && s.place !== null
              ? s.place.place_name || s.place.name || s.place.label
              : s.place) || null;

          if (plName && !isNaN(Number(plName)) && String(plName).trim() !== "") {
            const [pRows] = await connection.query(
              `SELECT place_name FROM place WHERE place_id = ?`,
              [Number(plName)]
            );
            if (pRows.length && pRows[0].place_name) {
              plName = pRows[0].place_name;
            }
          }

          const finalStationName = stName ? String(stName).trim() : (plName ? String(plName).trim() : null);
          const finalPlaceName = plName ? String(plName).trim() : (stName ? String(stName).trim() : null);

          return [
            id,
            finalStationName,
            finalPlaceName,
            s.amount,
            s.otherFieldValue,
            s.field1,
            s.field2,
            s.field3,
          ];
        })
      );

      await connection.query(
        `INSERT INTO quotation_station
          (quotation_id, station_name, place, amount, other_field_value,
           field1_value, field2_value, field3_value)
         VALUES ?`,
        [stationValues]
      );
    }

    await connection.commit();

    // 3. Return updated quotation with stations
    const [quotationRows] = await connection.query(
      `SELECT * FROM quotation WHERE id = ?`,
      [id]
    );
    const [stationRows] = await connection.query(
      `SELECT * FROM quotation_station WHERE quotation_id = ?`,
      [id]
    );

    return res.send({
      ...quotationRows[0],
      customerCity: quotationRows[0].customer_city,
      stations: stationRows,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(200).json({ message: error.message });
  } finally {
    connection.release();
  }
};


const removeQuotation = async (req, res) => {
  const rawId = req.body?.id || req.params?.id;
  if (!rawId || rawId === "undefined" || rawId === "null" || isNaN(Number(rawId))) {
    return res.status(200).json({ message: "Quotation ID is required!" });
  }
  const id = Number(rawId);

  const updatedBy = req.body?.updatedBy
    ? Number(req.body.updatedBy) || null
    : null;

  try {
    const [result] = await pool.query(
      `UPDATE quotation SET active = 0, updated_by = ? WHERE id = ?`,
      [updatedBy, id]
    );

    if (result.affectedRows === 0) {
      return res.status(200).json({ message: "Quotation not found!" });
    }

    return res.status(200).json({ id: Number(id), success: true });
  } catch (err) {
    console.error("Error executing removeQuotation:", err);
    return res.status(200).json({ message: err.message || "Server error" });
  }
};

// const viewQuotation = (req, res) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Quotation ID is required" });
//   }
//   Quotation.findById(req.params.id, (error, data) => {
//     if (error) {
//       return res.status(200).json({ message: error.message });
//     }
//     if (data) {
//       const stations1 = [];

//       data.stations.forEach((station, index) => {
//         stations1.push(station);
//       });
//       let blankRows1 = [];

//       blankRows1.length =
//         30 - stations1?.length < 0 ? 0 : 30 - stations1?.length;

//       const logo = base64_encode(
//         path.join(__dirname, "../public/images/logo.png"),
//       );
//       const laxmi = base64_encode(
//         path.join(__dirname, "../public/images/laxmi.jpeg"),
//       );
//       const templatePath = path.join(__dirname, "../bills/") + "Quotation.html";
//       res.render(
//         templatePath,
//         {
//           info: {
//             quotation: data,
//             date: getFormattedDateString(data.date),
//             fromDate: getFormattedDateString(data.from),
//             toDate: getFormattedDateString(data.to),
//             stations1: stations1,
//             logo: logo,
//             laxmi: laxmi,
//             blankRows1,
//             createdDate: convertDateFormat(data.createdAt),
//             printDate: convertDateFormat(Date.now()),
//           },
//         },
//         async (err, HTML) => {
//           const finalPath = path.join(__dirname, "../bills/quotations/");
//           const fileName = "JSMT-" + data.quotationNo;
//           var isWin = process.platform === "win32";
//           let htmlRaw = HTML;
//           if (isWin) {
//             htmlRaw = htmlRaw.replace("0.55", "0.98");
//           }
//           pdf;
//           //.create(htmlRaw, options2)
//           // .toFile(path.join(finalPath, fileName + ".pdf"), (err, result) => {
//           //   if (err) {
//           //     return res.status(200).send({
//           //       message: err,
//           //     });
//           //   }
//           //   return res.sendFile(result.filename);
//           // });
//           //.toBuffer((buffErr, buffer) => {
//           // if (buffErr) {
//           //   return res.status(200).json({ message: buffErr.message });
//           // }
//           // const base64String = buffer.toString("base64");

//           // if (req.body.email && req.body.email?.trim() !== "") {
//           //  sendEmail(
//           //  req.body.email,
//           //   base64String,
//           //  `${fileName}.pdf`,
//           //   `JSM - Quotation no. ${fileName}`,
//           //  `JSM - Quotation no. ${fileName}`,
//           //  `<p><b>Hello</b></p><p>Please find attached quotation.</p>`
//           // )
//           // .then((response) => {
//           //   return res.json({ success: true });
//           // })
//           // .catch((err) => {
//           //   return res.status(200).json({ message: err.response });
//           //  });
//           // } else {
//           //  return res.json({ file: base64String });
//           // }
//           //});
//           try {
//             const tempDir = path.join(__dirname, "../temp");

//             if (!fs.existsSync(tempDir)) {
//               fs.mkdirSync(tempDir, { recursive: true });
//             }

//             const outputPath = path.join(
//               tempDir,
//               `${fileName}_${Date.now()}.pdf`,
//             );

//             await generatePdfFromHtml(htmlRaw, outputPath, {
//               format: "A4",
//               printBackground: true,
//             });

//             const buffer = fs.readFileSync(outputPath);

//             const base64String = buffer.toString("base64");

//             fs.unlinkSync(outputPath);

//             if (req.body.email && req.body.email.trim() !== "") {
//               await sendEmail(
//                 req.body.email,
//                 base64String,
//                 `${fileName}.pdf`,
//                 `JSM - Quotation no. ${fileName}`,
//                 `JSM - Quotation no. ${fileName}`,
//                 `<p><b>Hello</b></p><p>Please find attached quotation.</p>`,
//               );

//               return res.json({ success: true });
//             }

//             return res.json({ file: base64String });
//           } catch (err) {
//             console.error(err);

//             return res.status(200).json({
//               message: err.message,
//             });
//           }
//         },
//       );
//     }
//   });
// };

const viewQuotation = async (req, res) => {
  if (!req.params.id) {
    return res.status(200).json({ message: "Quotation ID is required" });
  }

  const { id } = req.params;

  const fillBlank = (val) =>
    val === null || val === undefined || String(val).trim() === "" ? "-" : val;

  try {
    const [quotationRows] = await pool.query(
      `SELECT q.*, c.customer_name AS customerName
       FROM quotation q
       LEFT JOIN customer c ON c.customer_id = q.customer
       WHERE q.id = ?`,
      [id]
    );

    if (!quotationRows.length) {
      return res.status(200).json({ message: "Quotation not found" });
    }

    const quotationRow = quotationRows[0];

    const [stationRows] = await pool.query(
      `SELECT
         qs.id,
         qs.quotation_id,
         COALESCE(
           p_st_id.place_name,
           NULLIF(TRIM(qs.station_name), ''),
           p_pl_id.place_name,
           NULLIF(TRIM(qs.place), ''),
           ''
         ) AS station,
         COALESCE(
           NULLIF(TRIM(qs.place), ''),
           p_pl_id.place_name,
           p_st_id.place_name,
           NULLIF(TRIM(qs.station_name), ''),
           ''
         ) AS place,
         qs.amount,
         qs.other_field_value AS otherFieldValue,
         qs.field1_value AS field1,
         qs.field2_value AS field2,
         qs.field3_value AS field3
       FROM quotation_station qs
       LEFT JOIN place p_st_id ON (qs.station_name REGEXP '^[0-9]+$' AND p_st_id.place_id = CAST(qs.station_name AS UNSIGNED))
       LEFT JOIN place p_pl_id ON (qs.place REGEXP '^[0-9]+$' AND p_pl_id.place_id = CAST(qs.place AS UNSIGNED))
       WHERE qs.quotation_id = ?
       ORDER BY qs.id ASC`,
      [id]
    );

    const data = {
      ...quotationRow,
      quotationNo: quotationRow.quotation_number,
      customer: quotationRow.customerName,
      customerCity: quotationRow.customer_city || "",
      termsAndCond: quotationRow.terms_and_cond || "",
      date: quotationRow.quotation_date,
      from: quotationRow.from_date,
      to: quotationRow.to_date,
      otherField: quotationRow.other_field,
      ratePer: quotationRow.rate_per,
      createdAt: quotationRow.created_at,
      stations: stationRows,
    };

    const stations1 = data.stations.map((station, index) => {
      const stName =
        (station.station && String(station.station).trim() !== "" && String(station.station).trim() !== "-")
          ? String(station.station).trim()
          : (station.place && String(station.place).trim() !== "" && String(station.place).trim() !== "-")
          ? String(station.place).trim()
          : "";
      return {
        ...station,
        srNo: index + 1,
        station: fillBlank(stName),
        stationName: fillBlank(stName),
        place: fillBlank(station.place),
        amount: fillBlank(station.amount),
        otherFieldValue: fillBlank(station.otherFieldValue),
        field1: fillBlank(station.field1),
        field2: fillBlank(station.field2),
        field3: fillBlank(station.field3),
      };
    });

    let blankRows1 = [];
    blankRows1.length =
      30 - stations1?.length < 0 ? 0 : 30 - stations1?.length;

    try {
      const docDef = buildQuotationDocDefinition({
        quotation: data,
        date: getFormattedDateString(data.date),
        fromDate: getFormattedDateString(data.from),
        toDate: getFormattedDateString(data.to),
        stations1: stations1,
        companyName: "J.B.S. TRANSPUNE",
        companyTagline: "Jai Jagannath",
        companyAddress:
          "Jadhav Warehouse, Gat no.2324, Priyanka Nagari, opp. Datta Temple, Pune-Nagar Road, Wagholi, Tal. Haveli, Dist. Pune-412207",
        companyMobile: "8055424121 / 9325247465",
        companyEmail: "jbstranspune@gmail.com / purusotamdalai@gmail.com",
        companyGST: "",
        createdDate: convertDateFormat(data.createdAt),
        printDate: convertDateFormat(Date.now()),
      });

      const base64String = await generatePdfBase64(docDef);
      const fileName = "JBS-" + data.quotationNo;

      if (req.body.email && req.body.email.trim() !== "") {
        await sendEmail(
          req.body.email,
          base64String,
          `${fileName}.pdf`,
          `JBS - Quotation no. ${fileName}`,
          `JBS - Quotation no. ${fileName}`,
          `<p><b>Hello</b></p><p>Please find attached quotation.</p>`,
        );
        return res.json({ success: true });
      }

      return res.json({ file: base64String });
    } catch (err) {
      console.error(err);
      return res.status(200).json({ message: err.message });
    }
  } catch (error) {
    return res.status(200).json({ message: error.message });
  }
};

const viewPaymentCollection = (req, res) => {
  if (!req.params.billId || !req.params.collectionId) {
    return res
      .status(200)
      .json({ message: "Bill and Collection IDs are required" });
  }
  Bill.findById(req.params.billId, async (err, data) => {
    if (err) {
      return res.status(200).json({ message: err.message });
    }
    let payment;
    if (data && data.paymentCollection && data.paymentCollection.length) {
      Customer.findById(data.customer, async (customerErr, customerData) => {
        if (customerErr) {
          return res.status(200).json({ message: customerErr.message });
        }
        const payments = JSON.parse(JSON.stringify(data.paymentCollection));
        payment = payments.find((pay) => pay._id === req.params.collectionId);
        paymentIndex =
          payments.findIndex((pay) => pay._id === req.params.collectionId) + 1;
        const voucherNumber = `${data.billNo}_${paymentIndex}`;

        try {
          const docDef = buildVoucherDocDefinition({
            info: {
              bill: data,
              billNo: data.billNo,
              billDate: getFormattedDateString(data.date),
              paymentDate: payment.chequeDate
                ? getFormattedDateString(payment.chequeDate)
                : getFormattedDateString(payment.receivingDate),
              voucherNumber: voucherNumber,
              customer: customerData,
              payment: payment.receive?.toFixed(2),
              paymentMode:
                payment.payMode?.toLowerCase() === "cheque"
                  ? `by ${payment.payMode} no`
                  : `by ${payment.payMode}`,
              chequeNo: payment.chequeNo ? payment.chequeNo : "-",
              bank: payment.bankName ? payment.bankName : "-",
              receive: getWordNumber(payment.receive || 0),
              date: getFormattedDateString(payment.receivingDate),
              note:
                payment.payMode?.toLowerCase() === "cheque"
                  ? "Subject to realisation of cheque"
                  : "",
              createdDate: convertDateFormat(data.createdAt),
              printDate: convertDateFormat(Date.now()),
            },
          });

          const base64String = await generatePdfBase64(docDef);
          const fileName = "JSMT-" + voucherNumber;

          if (req.body.email && req.body.email.trim() !== "") {
            await sendEmail(
              req.body.email,
              base64String,
              `${fileName}.pdf`,
              `JSM - Payment voucher no. ${fileName}`,
              `JSM - Payment voucher no. ${fileName}`,
              `<p><b>Hello</b></p><p>Please find attached payment voucher.</p>`,
            );

            return res.json({ success: true });
          }

          return res.json({ file: base64String });
        } catch (err) {
          console.error(err);

          return res.status(200).json({
            message: err.message,
          });
        }
      });
    }
  });
};

const getPaymentCollectionHistory = async (req, res) => {
  const billId = req.params.billId;
  if (!billId || isNaN(parseInt(billId))) {
    return res.status(400).json({ message: "Valid Bill ID is required" });
  }

  try {
    const [results] = await pool.query(
      "CALL getpaymentcollectionhistorybybillid(?)",
      [billId]
    );
    const rows = results[0] || [];
    const formatted = rows.map((r) => {
      let formattedRecDate = "";
      if (r.receiving_date) {
        const d = new Date(r.receiving_date);
        if (!isNaN(d.getTime())) {
          formattedRecDate = `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
        } else {
          formattedRecDate = String(r.receiving_date);
        }
      }

      let formattedBillDate = "";
      if (r.bill_date) {
        formattedBillDate = String(r.bill_date);
      }

      return {
        id: r.id,
        collection_detail_id: r.collection_detail_id,
        pay_coll_id: r.pay_coll_id,
        bill_id: r.bill_id,
        bill_no: r.bill_no,
        bill_date: formattedBillDate,
        total_bill_amount: parseFloat(r.total_bill_amount || 0).toFixed(2),
        receiving_amount: parseFloat(r.receiving_amount || 0).toFixed(2),
        tds: parseFloat(r.tds || 0).toFixed(2),
        party_ded: parseFloat(r.party_ded || 0).toFixed(2),
        pay_mode: r.pay_mode || "",
        receiving_date: formattedRecDate,
        raw_receiving_date: r.receiving_date || "",
        bank_name: r.bank_name || "",
        cheque_rtgs_no: r.cheque_rtgs_no || "",
        cheque_rtgs_date: r.cheque_rtgs_date || "",
      };
    });
    return res.json(formatted);
  } catch (error) {
    console.error("Error in getPaymentCollectionHistory:", error);
    return res.status(500).json({ message: "Failed to fetch payment collection history" });
  }
};

// Helper functions for precise decimal arithmetic without floating-point errors
const toCents = (amt) => {
  if (amt === undefined || amt === null || amt === "") return 0;
  const num = typeof amt === "number" ? amt : parseFloat(String(amt).replace(/,/g, "").trim());
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
};

const centsToRupees = (cents) => {
  return (cents / 100).toFixed(2);
};

const recordPaymentCollectionForBill = async (req, res) => {
  const {
    bill_id,
    receiving_amount,
    tds,
    pay_mode,
    receiving_date,
    bank_name,
    cheque_rtgs_no,
    cheque_rtgs_date,
  } = req.body;

  if (!bill_id || isNaN(parseInt(bill_id))) {
    return res.status(400).json({ message: "Valid Bill ID is required." });
  }

  const cleanRecAmt = parseFloat(String(receiving_amount).trim());
  if (
    receiving_amount === undefined ||
    receiving_amount === null ||
    String(receiving_amount).trim() === "" ||
    isNaN(cleanRecAmt) ||
    cleanRecAmt <= 0
  ) {
    return res.status(400).json({ message: "Receiving amount must be a valid number greater than 0." });
  }

  let cleanTds = 0;
  if (tds !== undefined && tds !== null && String(tds).trim() !== "") {
    cleanTds = parseFloat(String(tds).trim());
    if (isNaN(cleanTds) || cleanTds < 0) {
      return res.status(400).json({ message: "TDS amount cannot be negative or invalid." });
    }
  }

  if (!pay_mode || typeof pay_mode !== "string" || !pay_mode.trim()) {
    return res.status(400).json({ message: "Payment mode is required." });
  }

  if (!receiving_date || isNaN(new Date(receiving_date).getTime())) {
    return res.status(400).json({ message: "Valid receiving date is required." });
  }

  const recAmtCents = toCents(cleanRecAmt);
  const tdsCents = toCents(cleanTds);
  const incomingSettlementCents = recAmtCents + tdsCents;

  if (incomingSettlementCents <= 0) {
    return res.status(400).json({ message: "Total settlement amount must be greater than 0." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Exclusively lock the bill row for update to ensure concurrency safety
    const [bills] = await connection.query(
      "SELECT id, bill_no, branch, customer_id, tot_amount, grandTotal FROM bills WHERE id = ? FOR UPDATE",
      [bill_id]
    );

    if (!bills || bills.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Bill not found." });
    }

    const bill = bills[0];
    const grandTotalCents = toCents(bill.grandTotal || bill.tot_amount || 0);

    // 2. Fetch all existing payment receipts for this bill within the locked transaction
    const [existingRows] = await connection.query(
      "SELECT received, tds_ded FROM pay_coll_details WHERE bill_id = ?",
      [String(bill_id)]
    );

    const existingSettledCents = existingRows.reduce((sum, row) => {
      return sum + toCents(row.received) + toCents(row.tds_ded);
    }, 0);

    const remainingPermittedCents = grandTotalCents - existingSettledCents;

    // 3. Absolute Grand Total Enforcement (Total Settled <= Grand Total must ALWAYS hold)
    if (remainingPermittedCents <= 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "Bill is already fully settled. Maximum permitted additional settlement is ₹0.00.",
        maxPermitted: "0.00",
        grandTotal: centsToRupees(grandTotalCents),
        existingSettled: centsToRupees(existingSettledCents),
      });
    }

    if (incomingSettlementCents > remainingPermittedCents) {
      await connection.rollback();
      const maxPermitted = centsToRupees(remainingPermittedCents);
      const incomingStr = centsToRupees(incomingSettlementCents);
      const grandTotalStr = centsToRupees(grandTotalCents);
      return res.status(400).json({
        message: `Settlement amount (₹${incomingStr}) exceeds maximum permitted settlement (₹${maxPermitted}). Total cumulative settlement cannot exceed Grand Total (₹${grandTotalStr}).`,
        maxPermitted,
        grandTotal: grandTotalStr,
        existingSettled: centsToRupees(existingSettledCents),
      });
    }

    const recDate = new Date(receiving_date).toISOString().split("T")[0];
    const chqDate = cheque_rtgs_date
      ? new Date(cheque_rtgs_date).toISOString().split("T")[0]
      : recDate;

    // 4. Insert payment collection header atomically within the transaction
    const [headerResult] = await connection.query(
      `INSERT INTO payment_collection (
        date, type, customer_id, receive, party_ded, tds_ded,
        pay_mode, bank_name, cheque_rtgs_no, cheque_rtgs_date, branch, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recDate,
        "bill",
        String(bill.customer_id || ""),
        centsToRupees(recAmtCents),
        "0.00",
        centsToRupees(tdsCents),
        pay_mode.trim(),
        bank_name ? bank_name.trim() : "",
        cheque_rtgs_no ? cheque_rtgs_no.trim() : "",
        chqDate,
        String(bill.branch || ""),
        String(req.userData?.userId || "1"),
      ]
    );

    const payCollId = headerResult.insertId;

    // 5. Insert payment collection detail linked to this bill
    const [detailResult] = await connection.query(
      `INSERT INTO pay_coll_details (pay_coll_id, bill_id, received, party_ded, tds_ded)
       VALUES (?, ?, ?, ?, ?)`,
      [
        String(payCollId),
        String(bill_id),
        centsToRupees(recAmtCents),
        "0.00",
        centsToRupees(tdsCents),
      ]
    );

    // Commit transaction atomically
    await connection.commit();

    const newTotalSettledCents = existingSettledCents + incomingSettlementCents;
    const newOutstandingCents = Math.max(0, grandTotalCents - newTotalSettledCents);

    return res.json({
      success: true,
      message: "Payment collection recorded successfully.",
      collection_detail_id: detailResult.insertId,
      pay_coll_id: payCollId,
      bill_id: String(bill_id),
      receiving_amount: centsToRupees(recAmtCents),
      tds: centsToRupees(tdsCents),
      grand_total: centsToRupees(grandTotalCents),
      cumulative_settled: centsToRupees(newTotalSettledCents),
      outstanding_balance: centsToRupees(newOutstandingCents),
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error in recordPaymentCollectionForBill:", error);
    return res.status(500).json({ message: "Failed to record payment collection." });
  } finally {
    connection.release();
  }
};

const updatePaymentCollection = async (req, res) => {
  const id = req.params.id;
  const {
    bill_id,
    receiving_amount,
    tds,
    pay_mode,
    receiving_date,
    bank_name,
    cheque_rtgs_no,
  } = req.body;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: "Invalid payment collection ID." });
  }
  if (!bill_id) {
    return res.status(400).json({ message: "Bill ID is required." });
  }

  const cleanRecAmt = parseFloat(String(receiving_amount).trim());
  if (
    receiving_amount === undefined ||
    receiving_amount === null ||
    String(receiving_amount).trim() === "" ||
    isNaN(cleanRecAmt) ||
    cleanRecAmt <= 0
  ) {
    return res.status(400).json({ message: "Receiving amount must be a valid number greater than 0." });
  }

  let cleanTds = 0;
  if (tds !== undefined && tds !== null && String(tds).trim() !== "") {
    cleanTds = parseFloat(String(tds).trim());
    if (isNaN(cleanTds) || cleanTds < 0) {
      return res.status(400).json({ message: "TDS amount cannot be negative or invalid." });
    }
  }

  if (!pay_mode || typeof pay_mode !== "string" || !pay_mode.trim()) {
    return res.status(400).json({ message: "Payment mode is required." });
  }

  if (!receiving_date || isNaN(new Date(receiving_date).getTime())) {
    return res.status(400).json({ message: "Valid receiving date is required." });
  }

  const recAmtCents = toCents(cleanRecAmt);
  const tdsCents = toCents(cleanTds);
  const incomingSettlementCents = recAmtCents + tdsCents;

  if (incomingSettlementCents <= 0) {
    return res.status(400).json({ message: "Total settlement amount must be greater than 0." });
  }

  const recDate = new Date(receiving_date).toISOString().split("T")[0];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Exclusively lock the bill row for update
    const [bills] = await connection.query(
      "SELECT id, bill_no, branch, customer_id, tot_amount, grandTotal FROM bills WHERE id = ? FOR UPDATE",
      [bill_id]
    );

    if (!bills || bills.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Bill not found." });
    }

    const bill = bills[0];
    const grandTotalCents = toCents(bill.grandTotal || bill.tot_amount || 0);

    // 2. Fetch other payments excluding this specific detail record
    const [otherRows] = await connection.query(
      "SELECT received, tds_ded FROM pay_coll_details WHERE bill_id = ? AND id != ?",
      [String(bill_id), parseInt(id)]
    );

    const otherSettledCents = otherRows.reduce((sum, row) => {
      return sum + toCents(row.received) + toCents(row.tds_ded);
    }, 0);

    const maxPermittedCents = grandTotalCents - otherSettledCents;

    // 3. Absolute limit check for revised receipt
    if (incomingSettlementCents > maxPermittedCents) {
      await connection.rollback();
      const maxPermitted = centsToRupees(Math.max(0, maxPermittedCents));
      const incomingStr = centsToRupees(incomingSettlementCents);
      const grandTotalStr = centsToRupees(grandTotalCents);
      return res.status(400).json({
        message: `Updated settlement amount (₹${incomingStr}) exceeds maximum permitted settlement (₹${maxPermitted}). Total cumulative settlement cannot exceed Grand Total (₹${grandTotalStr}).`,
        maxPermitted,
        grandTotal: grandTotalStr,
        otherSettled: centsToRupees(otherSettledCents),
      });
    }

    // 4. Call existing stored procedure on the transaction connection
    await connection.query(
      "CALL updatepaymentcollectionrecord(?, ?, ?, ?, ?, ?, ?, ?, @out_status, @out_msg)",
      [
        parseInt(id),
        String(bill_id),
        centsToRupees(recAmtCents),
        centsToRupees(tdsCents),
        pay_mode.trim(),
        recDate,
        bank_name ? bank_name.trim() : null,
        cheque_rtgs_no ? cheque_rtgs_no.trim() : null,
      ]
    );

    const [[result]] = await connection.query(
      "SELECT @out_status AS status, @out_msg AS message"
    );

    if (result && result.status === 404) {
      await connection.rollback();
      return res.status(404).json({ message: result.message });
    }

    await connection.commit();

    return res.json({
      success: true,
      message: result?.message || "Payment collection updated successfully.",
      receiving_amount: centsToRupees(recAmtCents),
      tds: centsToRupees(tdsCents),
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error in updatePaymentCollection:", error);
    return res.status(500).json({ message: "Failed to update payment collection." });
  } finally {
    connection.release();
  }
};

// const getLorryReceiptsForReport = async (req, res, next) => {
//   try {
//     const { pagination, query } = req.body;
//     const { page = 1, limit = 100 } = pagination || {};
//     const start = (page - 1) * limit;

//     if (!pagination.page || !pagination.limit) {
//       return res
//         .status(200)
//         .json({ message: "Pagination inputs not provided!" });
//     }

//     const param = { active: true };
//     if (query) {
//       if (query.branch) {
//         param.branch = query.branch;
//       }
//       if (query.from) {
//         const date = new Date(query.from);
//         const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//         const newDate = new Date(updatedDate).setUTCHours(0, 0, 0, 000);
//         param.date = {
//           ...param.date,
//           $gte: new Date(newDate)?.toISOString(),
//         };
//       }
//       if (query.to) {
//         const date = new Date(query.to);
//         const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//         const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
//         param.date = {
//           ...param.date,
//           $lte: new Date(newDate)?.toISOString(),
//         };
//       }
//       if (query.payType) {
//         param.payType = query.payType;
//       }

//       let allSearch = "",
//         consignor = "";
//       if (query.searchText) {
//         const searchText = new RegExp(query.searchText);
//         let isoDate = query.searchText;
//         const date = new Date(query.searchText);
//         if (date instanceof Date && !isNaN(date)) {
//           const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//           const date2 = new Date(updatedDate).toISOString().split("T")[0];
//           if (date2?.split("-")[0]?.length === 4) {
//             isoDate = date2;
//           }
//         }
//         allSearch = [
//           { lrNo: { $regex: searchText, $options: "i" } },
//           {
//             date: { $regex: new RegExp(isoDate), $options: "i" },
//           },
//           { invoiceNo: { $regex: searchText, $options: "i" } },
//           { consignorName: { $regex: searchText, $options: "i" } },
//           { consigneeName: { $regex: searchText, $options: "i" } },
//           { from: { $regex: searchText, $options: "i" } },
//           { to: { $regex: searchText, $options: "i" } },
//           { payType: { $regex: searchText, $options: "i" } },
//           ...(!isNaN(query.searchText)
//             ? [{ total: parseFloat(query.searchText) }]
//             : []),
//         ];
//       }
//       if (query.consignor) {
//         consignor = [
//           { consignor: query.consignor },
//           { consignee: query.consignor },
//         ];
//       }
//       if (query.searchText && query.consignor) {
//         param["$and"] = [{ $or: allSearch }, { $or: consignor }];
//       } else if (query.searchText) {
//         param["$or"] = allSearch;
//       } else if (query.consignor) {
//         param["$or"] = consignor;
//       }
//     }

//     const lorryReceipts = await LorryReceipt.find(param)
//       .sort("-createdAt")
//       .skip(start)
//       .limit(limit)
//       .lean();
//     const count = await LorryReceipt.countDocuments(param);
//     res.json({
//       lorryReceipts,
//       count,
//     });
//   } catch (lrError) {
//     return res.status(200).json({
//       message: "Error fetching lorry receipts!",
//     });
//   }
// };

const getLorryReceiptsForReport = async (req, res, next) => {
  try {
    const { pagination, query } = req.body;
    const { page, limit } = pagination || {};
    const start = (page - 1) * limit;

    if (!pagination.page || !pagination.limit) {
      return res
        .status(400)
        .json({ message: "Pagination inputs not provided!" });
    }
    const branch = query.branch || null;
    const consignor = query.consignor || null;
    const fromDate = query.from;
    const toDate = query.to;
    const payType = query.payType || null;
    let searchText = query.searchText || null;

    if (searchText) {
      searchText = searchText.replace(/^\D+/g, "");
    }

    const [results] = await pool.query(
      "CALL getlrlistforreportbydate(?, ?, ?, ?, ?, ?)",
      [branch, fromDate, toDate, payType, searchText, consignor],
    );

    const paginatedResults = results[0].slice(start, start + limit);
    const count = results[0].length;

    res.json({
      lorryReceipts: paginatedResults,
      count,
    });
  } catch (lrError) {
    console.error(lrError);
    return res.status(500).json({
      message: "Error fetching lorry receipts!",
    });
  }
};

const getBillRegisterReport = async (req, res, next) => {
  try {
    const { pagination, query } = req.body;
    const { page, limit } = pagination || {};
    const start = (page - 1) * limit;

    if (!pagination.page || !pagination.limit) {
      return res
        .status(400)
        .json({ message: "Pagination inputs not provided!" });
    }

    const branch = query.branch || null;
    const consignor = query.consignor || null; // Add consignor
    const fromDate = query.from
      ? new Date(query.from).toISOString().split("T")[0]
      : null;
    const toDate = query.to
      ? new Date(query.to).toISOString().split("T")[0]
      : null;
    const payType = query.payType || null; // Add payType
    // const searchText = query.searchText || null; // Add searchText
    const searchText = query.searchText
      ? query.searchText.replace(/\D/g, "")
      : null;
    console.log(fromDate, toDate);
    const [results] = await pool.query(
      "CALL getbilllistforreportbydate(?, ?, ?, ?)",
      [fromDate, toDate, consignor, searchText],
    );

    const paginatedResults = results[0].slice(start, start + limit);
    const count = results[0].length;

    res.json({
      lorryReceipts: paginatedResults,
      count,
    });
  } catch (lrError) {
    console.error(lrError);
    return res.status(500).json({
      message: "Error fetching lorry receipts!",
    });
  }
};

const getPendingLorryReceiptForReport = async (req, res, next) => {
  try {
    const { pagination, query } = req.body;
    const { page = 1, limit = 100 } = pagination || {};
    const start = (page - 1) * limit;

    if (!pagination.page || !pagination.limit) {
      return res.status(200).json({ message: "pagination is required!" });
    }

    const param = {
      active: true,
    };
    if (req.body.query) {
      if (req.body.query.branch) {
        param.branch = req.body.query.branch;
      }
      if (req.body.query.consignor) {
        param.consignor = req.body.query.consignor;
      }
      if (req.body.query.consignee) {
        param.consignee = req.body.query.consignee;
      }
      if (req.body.query.from) {
        const date = new Date(req.body.query.from);
        const updatedDate = new Date(date).setDate(date?.getDate() + 1);
        const newDate = new Date(updatedDate).setUTCHours(0, 0, 0, 000);
        param.date = {
          ...param.date,
          $gte: new Date(newDate)?.toISOString(),
        };
      }
      if (req.body.query.to) {
        const date = new Date(req.body.query.to);
        const updatedDate = new Date(date).setDate(date?.getDate() + 1);
        const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
        param.date = {
          ...param.date,
          $lte: new Date(newDate)?.toISOString(),
        };
      }

      if (req.body.query.searchText) {
        const searchText = new RegExp(req.body.query.searchText);
        let isoDate = req.body.query.searchText;
        const date = new Date(req.body.query.searchText);
        if (date instanceof Date && !isNaN(date)) {
          const updatedDate = new Date(date).setDate(date?.getDate() + 1);
          const date2 = new Date(updatedDate).toISOString().split("T")[0];
          if (date2?.split("-")[0]?.length === 4) {
            isoDate = date2;
          }
        }
        param["$and"] = [
          { $or: [{ deliveryDate: null }, { deliveryDate: "" }] },
          {
            $or: [
              { lrNo: { $regex: searchText, $options: "i" } },
              {
                date: { $regex: new RegExp(isoDate), $options: "i" },
              },
              { consignorName: { $regex: searchText, $options: "i" } },
              { consigneeName: { $regex: searchText, $options: "i" } },
              ...(!isNaN(req.body.query.searchText)
                ? [{ total: parseFloat(req.body.query.searchText) }]
                : []),
            ],
          },
        ];
      } else {
        param["$or"] = [{ deliveryDate: null }, { deliveryDate: "" }];
      }
    }

    const lorryReceipts = await LorryReceipt.find(param)
      .sort("-createdAt")
      .skip(start)
      .limit(limit)
      .lean();

    const count = await LorryReceipt.countDocuments(param);

    res.json({
      lorryReceipts,
      count,
    });
  } catch (lrError) {
    return res.status(200).json({
      message: "Error fetching lorry receipts!",
    });
  }
};

const getLoadedLorryReceiptForReport = async (req, res, next) => {
  try {
    const { pagination, query } = req.body;
    const { page = 1, limit = 100 } = pagination || {};
    const start = (page - 1) * limit;

    if (!pagination.page || !pagination.limit) {
      return res.status(200).json({ message: "pagination is required!" });
    }

    const param = {
      active: true,
      status: 1,
    };

    if (query) {
      if (query.branch) {
        query.branch = query.branch;
      }
      if (query.from) {
        const date = new Date(query.from);
        const updatedDate = new Date(date).setDate(date?.getDate() + 1);
        const newDate = new Date(updatedDate).setUTCHours(0, 0, 0, 000);
        param.date = {
          ...param.date,
          $gte: new Date(newDate)?.toISOString(),
        };
      }
      if (query.to) {
        const date = new Date(query.to);
        const updatedDate = new Date(date).setDate(date?.getDate() + 1);
        const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
        param.date = {
          ...param.date,
          $lte: new Date(newDate)?.toISOString(),
        };
      }
      let allSearch = "",
        payType = "",
        orAnd = "$or";

      if (query.searchText) {
        const searchText = new RegExp(query.searchText);
        let isoDate = query.searchText;
        const date = new Date(query.searchText);
        if (date instanceof Date && !isNaN(date)) {
          const updatedDate = new Date(date).setDate(date?.getDate() + 1);
          const date2 = new Date(updatedDate).toISOString().split("T")[0];
          if (date2?.split("-")[0]?.length === 4) {
            isoDate = date2;
          }
        }
        allSearch = [
          { lrNo: { $regex: searchText, $options: "i" } },
          {
            date: { $regex: new RegExp(isoDate), $options: "i" },
          },
          { consignorName: { $regex: searchText, $options: "i" } },
          { consigneeName: { $regex: searchText, $options: "i" } },
          { from: { $regex: searchText, $options: "i" } },
          { to: { $regex: searchText, $options: "i" } },
          { payType: { $regex: searchText, $options: "i" } },
        ];
      }

      if (query.payType) {
        if (query.payType?.toLowerCase() === "open") {
          payType = [{ deliveryDate: null }, { deliveryDate: "" }];
        } else {
          orAnd = "$and";
          payType = [
            { deliveryDate: { $ne: null } },
            { deliveryDate: { $ne: "" } },
          ];
        }
      }

      if (query.searchText && query.payType) {
        param["$and"] = [{ $or: allSearch }, { [orAnd]: payType }];
      } else if (query.payType) {
        param[orAnd] = payType;
      } else if (query.searchText) {
        param["$or"] = allSearch;
      }
    }

    const lorryReceipts = await LorryReceipt.find(param)
      .sort("-createdAt")
      .skip(start)
      .limit(limit)
      .lean();

    const count = await LorryReceipt.countDocuments(param);
    res.json({
      lorryReceipts,
      count,
    });
  } catch (lrError) {
    return res.status(200).json({
      message: "Error fetching lorry receipts!",
    });
  }
};

// const downloadLRReport = (req, res) => {
//   const query = { active: true };
//   if (req.body.query) {
//     if (req.body.query.branch) {
//       query.branch = req.body.query.branch;
//     }
//     if (req.body.query.from) {
//       const date = new Date(req.body.query.from);
//       const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//       const newDate = new Date(updatedDate).setUTCHours(0, 0, 0, 000);
//       query.date = {
//         ...query.date,
//         $gte: new Date(newDate)?.toISOString(),
//       };
//     }
//     if (req.body.query.to) {
//       const date = new Date(req.body.query.to);
//       const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//       const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
//       query.date = {
//         ...query.date,
//         $lte: new Date(newDate)?.toISOString(),
//       };
//     }
//     if (req.body.query.payType) {
//       query.payType = req.body.query.payType;
//     }

//     let allSearch = "",
//       consignor = "";
//     if (req.body.query.searchText) {
//       const searchText = new RegExp(req.body.query.searchText);
//       let isoDate = req.body.query.searchText;
//       const date = new Date(req.body.query.searchText);
//       if (date instanceof Date && !isNaN(date)) {
//         const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//         const date2 = new Date(updatedDate).toISOString().split("T")[0];
//         if (date2?.split("-")[0]?.length === 4) {
//           isoDate = date2;
//         }
//       }
//       allSearch = [
//         { lrNo: { $regex: searchText, $options: "i" } },
//         {
//           date: { $regex: new RegExp(isoDate), $options: "i" },
//         },
//         { invoiceNo: { $regex: searchText, $options: "i" } },
//         { consignorName: { $regex: searchText, $options: "i" } },
//         { consigneeName: { $regex: searchText, $options: "i" } },
//         { from: { $regex: searchText, $options: "i" } },
//         { to: { $regex: searchText, $options: "i" } },
//         { payType: { $regex: searchText, $options: "i" } },
//         ...(!isNaN(req.body.query.searchText)
//           ? [{ total: parseFloat(req.body.query.searchText) }]
//           : []),
//       ];
//     }
//     if (req.body.query.consignor) {
//       consignor = [
//         { consignor: req.body.query.consignor },
//         { consignee: req.body.query.consignor },
//       ];
//     }
//     if (req.body.query.searchText && req.body.query.consignor) {
//       query["$and"] = [{ $or: allSearch }, { $or: consignor }];
//     } else if (req.body.query.searchText) {
//       query["$or"] = allSearch;
//     } else if (req.body.query.consignor) {
//       query["$or"] = consignor;
//     }
//   }
//   LorryReceipt.find(query)
//     .lean()
//     .sort("-createdAt")
//     .exec((err, data) => {
//       if (err) {
//         return res.status(200).json({ message: err.message });
//       }
//       if (data && data.length) {
//         const updatedData = JSON.parse(JSON.stringify(data));
//         const printData = [];
//         updatedData.forEach(async (lr, index) => {
//           try {
//             const consignor = await Customer.findById(lr.consignor);
//             const consignee = await Customer.findById(lr.consignee);
//             lr.formattedLRNo = lr.lrNo;
//             lr.formattedDate = getFormattedDate(lr.date);
//             lr.consignorName =
//               consignor && consignor.name ? consignor.name : lr.consignor;
//             lr.consigneeName =
//               consignee && consignee.name ? consignee.name : lr.consignee;
//             lr.totalArticles = lr.transactions.reduce(
//               (acc, tr) => acc + tr.articleNo,
//               0
//             );
//             lr.totalWeight = lr.transactions.reduce(
//               (acc, tr) => acc + tr.weight,
//               0
//             );
//             lr.totalChargeWeight = lr.transactions.reduce(
//               (acc, tr) => acc + tr.chargeWeight,
//               0
//             );
//             lr.totalFreight = lr.transactions.reduce(
//               (acc, tr) => acc + tr.freight,
//               0
//             );
//             lr.index = index + 1;
//             printData.push(lr);

//             if (updatedData.length === printData.length) {
//               const workbook = exportLRDataToXlsx(updatedData);
//               res.setHeader(
//                 "Content-Type",
//                 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//               );
//               res.setHeader(
//                 "Content-Disposition",
//                 "attachment; filename=" + "data.xlsx"
//               );
//               return workbook.xlsx.write(res).then(() => {
//                 res.status(200).end();
//               });
//             }
//           } catch (e) { }
//         });
//       }
//     });
// };

const downloadBillReport = async (req, res) => {
  try {
    const { query } = req.body;

    const branch = query.branch || null;
    const consignor = query.consignor || null;
    const fromDate = query.from
      ? new Date(query.from).toISOString().split("T")[0]
      : null;
    const toDate = query.to
      ? new Date(query.to).toISOString().split("T")[0]
      : null;
    const payType = query.payType || null;
    const searchText = query.searchText || null;
    const [results] = await pool.query(
      "CALL getbilllistforreportbydate(?, ?, ?, ?)",
      [fromDate, toDate, consignor, searchText],
    );

    if (results[0].length === 0) {
      return res.status(404).json({ message: "No records found." });
    }
    let allResults = results[0];
    allResults = allResults.reverse().map((item, index) => {
      const formattedBillDate = item.bill_date
        ? new Date(item.bill_date).toISOString().split("T")[0]
        : null;
      return {
        ...item,
        bill_date: formattedBillDate,
        index: index + 1,
      };
    });
    const workbook = exportBillDataToXlsx(allResults);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=data.xlsx");

    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ message: "Error fetching bill data." });
  }
};

const downloadLRReport = async (req, res) => {
  try {
    const { query } = req.body;
    const branch = query.branch || null;
    const consignor = query.consignor || null;
    const fromDate = query.from
      ? new Date(query.from).toISOString().split("T")[0]
      : null;
    const toDate = query.to
      ? new Date(query.to).toISOString().split("T")[0]
      : null;
    const payType = query.payType || null;
    const searchText = query.searchText || null;

    const [results] = await pool.query(
      "CALL getlrlistforreportbydate(?, ?, ?, ?, ?, ?)",
      [branch, fromDate, toDate, payType, searchText, consignor],
    );
    if (results.length > 0) {
      const printData = results[0].reverse().map((lr, index) => ({
        ...lr,
        formattedLRNo: lr.lr_no,
        formattedDate: lr.lr_date,
        totalArticles: lr.no_of_articles,
        index: index + 1,
      }));

      const workbook = exportLRDataToXlsx(printData);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", "attachment; filename=data.xlsx");
      return workbook.xlsx.write(res).then(() => {
        res.status(200).end();
      });
    } else {
      return res.status(404).json({ message: "No records found." });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ message: "Error fetching lorry receipts." });
  }
};

const downloadChallanReport = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.from || !query.to) {
      return res
        .status(400)
        .json({ message: "Both 'from' and 'to' dates are required!" });
    }
    const fromDate = new Date(query.from);
    const toDate = new Date(query.to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid 'from' or 'to' date format." });
    }
    const fromDateFormatted = fromDate.toISOString().split("T")[0];
    const toDateFormatted = toDate.toISOString().split("T")[0];
    const [results] = await pool.query("CALL getlslistforreportbydate(?, ?)", [
      fromDateFormatted,
      toDateFormatted,
    ]);
    if (!results || !results.length || !results[0].length) {
      return res
        .status(404)
        .json({ message: "No records found for the provided date range." });
    }

    let loadingSlips = results[0];
    if (query.owner) {
      loadingSlips = loadingSlips.filter(
        (ls) =>
          ls.vehical_owner_name &&
          ls.vehical_owner_name
            .toLowerCase()
            .includes(query.owner.toLowerCase()),
      );
    }
    if (query.vehicle) {
      loadingSlips = loadingSlips.filter(
        (ls) =>
          ls.vehicleno &&
          ls.vehicleno.toLowerCase().includes(query.vehicle.toLowerCase()),
      );
    }

    if (query.searchText) {
      const trimmedSearchText = query.searchText.trim().toLowerCase();
      loadingSlips = loadingSlips.filter((ls) => {
        return (
          (ls.dc_no && ls.dc_no.toLowerCase().includes(trimmedSearchText)) ||
          (ls.dc_date &&
            getFormattedDate(new Date(ls.dc_date))
              .toLowerCase()
              .includes(trimmedSearchText)) ||
          (ls.hire &&
            ls.hire.toString().toLowerCase().includes(trimmedSearchText)) ||
          (ls.total &&
            ls.total.toString().toLowerCase().includes(trimmedSearchText)) ||
          (ls.total_packages &&
            ls.total_packages
              .toString()
              .toLowerCase()
              .includes(trimmedSearchText)) ||
          (ls.total_wt &&
            ls.total_wt.toString().toLowerCase().includes(trimmedSearchText)) ||
          (ls.vehicleno &&
            ls.vehicleno.toLowerCase().includes(trimmedSearchText)) ||
          (ls.vehical_owner_name &&
            ls.vehical_owner_name.toLowerCase().includes(trimmedSearchText)) ||
          (ls.driver_name &&
            ls.driver_name.toLowerCase().includes(trimmedSearchText)) ||
          (ls.from && ls.from.toLowerCase().includes(trimmedSearchText)) ||
          (ls.adv_amt &&
            ls.adv_amt.toString().toLowerCase().includes(trimmedSearchText)) ||
          (ls.to && ls.to.toLowerCase().includes(trimmedSearchText))
        );
      });
    }

    const count = loadingSlips.length;
    if (count === 0) {
      return res.status(404).json({ message: "No matching records found." });
    }
    const updatedLoadingSlips = loadingSlips.reverse().map((ls, index) => ({
      id: ls.id,
      dc_no: ls.dc_no,
      dc_date: getFormattedDate(new Date(ls.dc_date)),
      hire: ls.hire,
      total: ls.total,
      total_packages: ls.total_packages,
      total_wt: ls.total_wt,
      vehicleno: ls.vehicleno,
      vehical_owner_name: ls.vehical_owner_name,
      driver_name: ls.driver_name,
      from: ls.from,
      advance: ls.adv_amt,
      to: ls.to,
      srNo: index + 1,
    }));
    const workbook = exportLoadingSlipToXlsx(updatedLoadingSlips);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=challan_report.xlsx",
    );
    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        message: "Error fetching lorry receipts. Please try again later.",
      });
  }
};

const downloadPendingLRReport = (req, res) => {
  const query = {
    active: true,
  };
  if (req.body.query) {
    if (req.body.query.branch) {
      query.branch = req.body.query.branch;
    }
    if (req.body.query.consignor) {
      query.consignor = req.body.query.consignor;
    }
    if (req.body.query.consignee) {
      query.consignee = req.body.query.consignee;
    }
    if (req.body.query.from) {
      const date = new Date(req.body.query.from);
      const updatedDate = new Date(date).setDate(date?.getDate() + 1);
      const newDate = new Date(updatedDate).setUTCHours(0, 0, 0, 000);
      query.date = {
        ...query.date,
        $gte: new Date(newDate)?.toISOString(),
      };
    }
    if (req.body.query.to) {
      const date = new Date(req.body.query.to);
      const updatedDate = new Date(date).setDate(date?.getDate() + 1);
      const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
      query.date = {
        ...query.date,
        $lte: new Date(newDate)?.toISOString(),
      };
    }

    if (req.body.query.searchText) {
      const searchText = new RegExp(req.body.query.searchText);
      let isoDate = req.body.query.searchText;
      const date = new Date(req.body.query.searchText);
      if (date instanceof Date && !isNaN(date)) {
        const updatedDate = new Date(date).setDate(date?.getDate() + 1);
        const date2 = new Date(updatedDate).toISOString().split("T")[0];
        if (date2?.split("-")[0]?.length === 4) {
          isoDate = date2;
        }
      }
      query["$and"] = [
        { $or: [{ deliveryDate: null }, { deliveryDate: "" }] },
        {
          $or: [
            { lrNo: { $regex: searchText, $options: "i" } },
            {
              date: { $regex: new RegExp(isoDate), $options: "i" },
            },
            { consignorName: { $regex: searchText, $options: "i" } },
            { consigneeName: { $regex: searchText, $options: "i" } },
            ...(!isNaN(req.body.query.searchText)
              ? [{ total: parseFloat(req.body.query.searchText) }]
              : []),
          ],
        },
      ];
    } else {
      query["$or"] = [{ deliveryDate: null }, { deliveryDate: "" }];
    }
  }
  LorryReceipt.find(query)
    .lean()
    .sort("-createdAt")
    .exec((err, data) => {
      if (err) {
        return res.status(200).json({ message: err.message });
      }
      if (data && data.length) {
        const updatedData = JSON.parse(JSON.stringify(data));
        const printData = [];
        updatedData.forEach(async (lr, index) => {
          try {
            const consignor = await Customer.findById(lr.consignor);
            const consignee = await Customer.findById(lr.consignee);
            lr.formattedLRNo = lr.lrNo;
            lr.formattedDate = getFormattedDate(lr.date);
            lr.consignorName =
              consignor && consignor.name ? consignor.name : lr.consignor;
            lr.consigneeName =
              consignee && consignee.name ? consignee.name : lr.consignee;
            lr.totalArticles = lr.transactions.reduce(
              (acc, tr) => acc + tr.articleNo,
              0,
            );
            lr.totalWeight = lr.transactions.reduce(
              (acc, tr) => acc + tr.weight,
              0,
            );
            lr.totalChargeWeight = lr.transactions.reduce(
              (acc, tr) => acc + tr.chargeWeight,
              0,
            );
            lr.totalFreight = lr.transactions.reduce(
              (acc, tr) => acc + tr.freight,
              0,
            );
            lr.index = index + 1;
            printData.push(lr);

            if (updatedData.length === printData.length) {
              const workbook = exportPendingLRDataToXlsx(updatedData);
              res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              );
              res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "data.xlsx",
              );
              return workbook.xlsx.write(res).then(() => {
                res.status(200).end();
              });
            }
          } catch (e) { }
        });
      }
    });
};

const downloadLoadedLRReport = (req, res) => {
  const query = {
    active: true,
    status: 1,
  };
  if (req.body.query) {
    if (req.body.query.branch) {
      query.branch = req.body.query.branch;
    }
    if (req.body.query.from) {
      const date = new Date(req.body.query.from);
      const updatedDate = new Date(date).setDate(date?.getDate() + 1);
      const newDate = new Date(updatedDate).setUTCHours(0, 0, 0, 000);
      query.date = {
        ...query.date,
        $gte: new Date(newDate)?.toISOString(),
      };
    }
    if (req.body.query.to) {
      const date = new Date(req.body.query.to);
      const updatedDate = new Date(date).setDate(date?.getDate() + 1);
      const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
      query.date = {
        ...query.date,
        $lte: new Date(newDate)?.toISOString(),
      };
    }
    let allSearch = "",
      payType = "",
      orAnd = "$or";

    if (req.body.query.searchText) {
      const searchText = new RegExp(req.body.query.searchText);
      let isoDate = req.body.query.searchText;
      const date = new Date(req.body.query.searchText);
      if (date instanceof Date && !isNaN(date)) {
        const updatedDate = new Date(date).setDate(date?.getDate() + 1);
        const date2 = new Date(updatedDate).toISOString().split("T")[0];
        if (date2?.split("-")[0]?.length === 4) {
          isoDate = date2;
        }
      }
      allSearch = [
        { lrNo: { $regex: searchText, $options: "i" } },
        {
          date: { $regex: new RegExp(isoDate), $options: "i" },
        },
        { consignorName: { $regex: searchText, $options: "i" } },
        { consigneeName: { $regex: searchText, $options: "i" } },
        { from: { $regex: searchText, $options: "i" } },
        { to: { $regex: searchText, $options: "i" } },
        { payType: { $regex: searchText, $options: "i" } },
      ];
    }

    if (req.body.query.payType) {
      if (req.body.query.payType?.toLowerCase() === "open") {
        payType = [{ deliveryDate: null }, { deliveryDate: "" }];
      } else {
        orAnd = "$and";
        payType = [
          { deliveryDate: { $ne: null } },
          { deliveryDate: { $ne: "" } },
        ];
      }
    }

    if (req.body.query.searchText && req.body.query.payType) {
      query["$and"] = [{ $or: allSearch }, { [orAnd]: payType }];
    } else if (req.body.query.payType) {
      query[orAnd] = payType;
    } else if (req.body.query.searchText) {
      query["$or"] = allSearch;
    }
  }
  LorryReceipt.find(query)
    .lean()
    .sort("-createdAt")
    .exec((err, data) => {
      if (err) {
        return res.status(200).json({ message: err.message });
      }
      if (data && data.length) {
        const updatedData = JSON.parse(JSON.stringify(data));
        const printData = [];
        updatedData.forEach(async (lr, index) => {
          try {
            const consignor = await Customer.findById(lr.consignor);
            const consignee = await Customer.findById(lr.consignee);
            lr.formattedLRNo = lr.lrNo;
            lr.formattedDate = getFormattedDate(lr.date);
            lr.consignorName =
              consignor && consignor.name ? consignor.name : lr.consignor;
            lr.consigneeName =
              consignee && consignee.name ? consignee.name : lr.consignee;
            lr.totalArticles = lr.transactions.reduce(
              (acc, tr) => acc + tr.articleNo,
              0,
            );
            lr.totalWeight = lr.transactions.reduce(
              (acc, tr) => acc + tr.weight,
              0,
            );
            lr.totalChargeWeight = lr.transactions.reduce(
              (acc, tr) => acc + tr.chargeWeight,
              0,
            );
            lr.totalFreight = lr.transactions.reduce(
              (acc, tr) => acc + tr.freight,
              0,
            );
            lr.index = index + 1;
            printData.push(lr);

            if (updatedData.length === printData.length) {
              const workbook = exportLoadedLRDataToXlsx(updatedData);
              res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              );
              res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "data.xlsx",
              );
              return workbook.xlsx.write(res).then(() => {
                res.status(200).end();
              });
            }
          } catch (e) { }
        });
      }
    });
};

const getAllLRAck = async (req, res) => {
  try {
    let query = {
      active: true,
      $or: [{ deliveryDate: null }, { deliveryDate: "" }],
    };
    if (req.body.branch) {
      query = { ...query, branch: req.body.branch };
    }
    if (req.body.search) {
      query = {
        ...query,
        lrNo: {
          $regex: new RegExp(req.body.search),
          $options: "i",
        },
      };
    }
    const lorryReceipts = await LorryReceipt.find(query)
      .sort("-createdAt")
      .limit(1000)
      .lean();
    return res.json(lorryReceipts);
  } catch (lrError) {
    return res.status(200).json({
      message: "Error fetching lorry receipts!",
    });
  }
};

const getLRAck = async (req, res) => {
  try {
    let query = {
      active: true,
      $or: [{ deliveryDate: null }, { deliveryDate: "" }],
    };
    if (req.params.lrNo) {
      query = {
        ...query,
        lrNo: req.params.lrNo,
      };
    }
    const lorryReceipts = await LorryReceipt.findOne(query).lean();
    const params = {
      lrList: {
        $elemMatch: {
          _id: lorryReceipts?._id?.toString(),
        },
      },
    };
    const loadingSlip = await LoadingSlip.findOne(params).lean();
    return res.json({
      ...(lorryReceipts || {}),
      lsNo: loadingSlip?.lsNo || "",
    });
  } catch (lrError) {
    return res.status(200).json({
      message: "Error fetching lorry receipts!",
    });
  }
};

const getChallanAck = (req, res) => {
  const _id = req.params.id;
  const query = {
    lrList: {
      $elemMatch: {
        _id,
      },
    },
  };
  LoadingSlip.findOne(query).exec((lrError, lorryReceipts) => {
    if (lrError) {
      return res.status(200).json({
        message: "Error fetching lorry receipts!",
      });
    } else {
      return res.json(lorryReceipts);
    }
  });
};

const addFONum = (req, res) => {
  if (!req.body._id) {
    return res.status(200).json({ message: "Lorry receipt ID is required!" });
  }

  try {
    LorryReceipt.findByIdAndUpdate(
      req.body._id,
      {
        $set: {
          foNum: req.body.foNum,
          updatedBy: req.body.updatedBy,
        },
      },
      { new: true },
      (error, data) => {
        if (error) {
          res.status(200).json({ message: error.message });
        } else {
          res.json(data);
        }
      },
    );
  } catch (e) {
    return res.status(200).json({ message: e.message });
  }
};

// const getLoadingSlipForReport = async (req, res, next) => {
//   try {
//     const { pagination, query } = req.body;
//     const { page = 1, limit = 100 } = pagination || {};
//     const start = (page - 1) * limit;

//     if (!pagination.page || !pagination.limit) {
//       return res.status(200).json({ message: "pagination is required!" });
//     }

//     const param = { active: true };
//     if (query) {
//       if (query.branch) {
//         param.branch = query.branch;
//       }
//       if (query.from) {
//         const date = new Date(query.from);
//         const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//         const newDate = new Date(updatedDate).setUTCHours(0, 0, 0, 000);
//         param.date = {
//           ...param.date,
//           $gte: new Date(newDate)?.toISOString(),
//         };
//       }
//       if (query.to) {
//         const date = new Date(query.to);
//         const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//         const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
//         param.date = {
//           ...param.date,
//           $lte: new Date(newDate)?.toISOString(),
//         };
//       }
//       if (query.lrNo) {
//         param.lrList = {
//           $elemMatch: {
//             lrNo: new RegExp(query.lrNo?.toUpperCase()),
//           },
//         };
//       }
//       if (query.owner) {
//         param.vehicleOwner = {
//           $regex: new RegExp(query.owner),
//           $options: "i",
//         };
//       }
//       if (query.vehicle) {
//         param.vehicleNo = {
//           $regex: new RegExp(query.vehicle),
//           $options: "i",
//         };
//       }
//       if (query.searchText) {
//         const searchText = new RegExp(query.searchText);
//         let isoDate = query.searchText;
//         const date = new Date(query.searchText);
//         if (date instanceof Date && !isNaN(date)) {
//           const updatedDate = new Date(date).setDate(date?.getDate() + 1);
//           const date2 = new Date(updatedDate).toISOString().split("T")[0];
//           if (date2?.split("-")[0]?.length === 4) {
//             isoDate = date2;
//           }
//         }
//         param["$or"] = [
//           { lsNo: { $regex: searchText, $options: "i" } },
//           {
//             date: { $regex: new RegExp(isoDate), $options: "i" },
//           },
//           { vehicleOwner: { $regex: searchText, $options: "i" } },
//           { vehicleNo: { $regex: searchText, $options: "i" } },
//           ...(!isNaN(query.searchText)
//             ? [
//               { advance: parseFloat(query.searchText) },
//               { rent: parseFloat(query.searchText) },
//               { totalPayable: parseFloat(query.searchText) },
//             ]
//             : []),
//         ];
//       }
//     }

//     const loadingSlips = await LoadingSlip.aggregate([
//       { $match: param },
//       { $sort: { createdAt: -1 } },
//       { $skip: start },
//       { $limit: limit },
//       {
//         $addFields: {
//           list: {
//             $map: {
//               input: "$lrList",
//               as: "lrObj",
//               in: "$$lrObj.lrNo",
//             },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "lorryReceipt",
//           localField: "list",
//           foreignField: "lrNo",
//           as: "lorryReceipts",
//         },
//       },
//       {
//         $unset: ["list", "lrList", "supplierPayments"],
//       },
//       { $sort: { createdAt: -1 } },
//     ]);
//     const updatedLS = loadingSlips.map((ls, index) => {
//       return {
//         _id: ls._id,
//         date: getFormattedDate(new Date(ls.date)),
//         formattedLSNo: (ls.lsNo + "").padStart?.(6, "0"),
//         totalHamali: ls.lorryReceipts.reduce(
//           (total, lr) => total + lr.hamali,
//           0
//         ),
//         srNo: index + 1,
//         vehicleOwner: ls.vehicleOwner,
//         vehicleNo: ls.vehicleNo,
//         totalFreight: ls.totalFreight,
//         advance: ls.advance,
//         rent: ls.rent,
//         totalPayable: ls.totalPayable,
//       };
//     });
//     if (query.isPrint) {
// const workbook = exportLoadingSlipToXlsx(updatedLS);
//       res.setHeader(
//         "Content-Type",
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//       );
//       res.setHeader(
//         "Content-Disposition",
//         "attachment; filename=" + "data.xlsx"
//       );
//       return workbook.xlsx.write(res).then(() => {
//         res.status(200).end();
//       });
//     } else {
//       const count = await LoadingSlip.countDocuments(param);
//       res.json({
//         loadingSlips: updatedLS,
//         count,
//       });
//     }
//   } catch (lsError) {
//     return res.status(200).json({
//       message: "Error fetching lorry receipt challans!",
//     });
//   }
// };

const getLoadingSlipForReport = async (req, res, next) => {
  try {
    const { pagination, query } = req.body;
    const { page = 1, limit = 100 } = pagination || {};
    const start = (page - 1) * limit;

    // Validate required parameters
    if (!query || !query.from || !query.to) {
      return res
        .status(200)
        .json({ message: "Both From And To Dates Are Required!" });
    }

    const fromDate = query.from;
    const toDate = query.to;
    const [results] = await pool.query("CALL getlslistforreportbydate(?, ?)", [
      fromDate,
      toDate,
    ]);

    let loadingSlips = results[0];
    if (query.branch) {
      const branchFilter = query.branch;
      loadingSlips = loadingSlips.filter((ls) => ls.branch === branchFilter);
    }
    if (query.owner) {
      const trimmedOwner = query.owner.trim().toLowerCase();
      loadingSlips = loadingSlips.filter(
        (ls) =>
          ls.vehical_owner_name &&
          ls.vehical_owner_name.toLowerCase().includes(trimmedOwner),
      );
    }

    if (query.vehicle) {
      const trimmedVehicle = query.vehicle.trim().toLowerCase();
      loadingSlips = loadingSlips.filter(
        (ls) =>
          ls.vehicleno && ls.vehicleno.toLowerCase().includes(trimmedVehicle),
      );
    }
    if (query.searchText) {
      const trimmedSearchText = query.searchText.trim().toLowerCase();
      loadingSlips = loadingSlips.filter((ls) => {
        return (
          (ls.dc_no && ls.dc_no.toLowerCase().includes(trimmedSearchText)) ||
          (ls.dc_date &&
            getFormattedDate(new Date(ls.dc_date))
              .toLowerCase()
              .includes(trimmedSearchText)) ||
          (ls.hire &&
            ls.hire.toString().toLowerCase().includes(trimmedSearchText)) ||
          (ls.total &&
            ls.total.toString().toLowerCase().includes(trimmedSearchText)) ||
          (ls.total_packages &&
            ls.total_packages
              .toString()
              .toLowerCase()
              .includes(trimmedSearchText)) ||
          (ls.total_wt &&
            ls.total_wt.toString().toLowerCase().includes(trimmedSearchText)) ||
          (ls.vehicleno &&
            ls.vehicleno.toLowerCase().includes(trimmedSearchText)) ||
          (ls.vehical_owner_name &&
            ls.vehical_owner_name.toLowerCase().includes(trimmedSearchText)) ||
          (ls.driver_name &&
            ls.driver_name.toLowerCase().includes(trimmedSearchText)) ||
          (ls.from && ls.from.toLowerCase().includes(trimmedSearchText)) ||
          (ls.adv_amt &&
            ls.adv_amt.toString().toLowerCase().includes(trimmedSearchText)) ||
          (ls.to && ls.to.toLowerCase().includes(trimmedSearchText))
        );
      });
    }
    const count = loadingSlips.length;
    const paginatedResults = loadingSlips.slice(start, start + limit);
    const updatedLoadingSlips = paginatedResults.map((ls, index) => ({
      id: ls.id,
      dc_no: ls.dc_no,
      dc_date: getFormattedDate(new Date(ls.dc_date)),
      hire: ls.hire,
      total: ls.total,
      total_packages: ls.total_packages,
      total_wt: ls.total_wt,
      vehicleno: ls.vehicleno,
      vehical_owner_name: ls.vehical_owner_name,
      driver_name: ls.driver_name,
      from: ls.from,
      advance: ls.adv_amt,
      to: ls.to,
      srNo: start + index + 1,
    }));
    res.json({
      loadingSlips: updatedLoadingSlips,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error fetching loading slips!",
    });
  }
};

const getChallanForReport = async (req, res, next) => {
  try {
    const { pagination, query } = req.body;
    const { page = 1, limit = 100 } = pagination || {};
    const start = (page - 1) * limit;

    if (!pagination.page || !pagination.limit) {
      return res.status(200).json({ message: "pagination is required!" });
    }

    const param = { active: true };
    if (query) {
      if (query.branch) {
        param.branch = query.branch;
      }
      if (query.from) {
        const date = new Date(query.from);
        const updatedDate = new Date(date).setDate(date?.getDate() + 1);
        const newDate = new Date(updatedDate).setUTCHours(0, 0, 0, 000);
        param.date = {
          ...param.date,
          $gte: new Date(newDate)?.toISOString(),
        };
      }
      if (query.to) {
        const date = new Date(query.to);
        const updatedDate = new Date(date).setDate(date?.getDate() + 1);
        const newDate = new Date(updatedDate).setUTCHours(23, 59, 59, 999);
        param.date = {
          ...param.date,
          $lte: new Date(newDate)?.toISOString(),
        };
      }
      if (query.lrNo) {
        param.lrList = {
          $elemMatch: {
            lrNo: new RegExp(query.lrNo?.toUpperCase()),
          },
        };
      }
    }

    const loadingSlips = await LoadingSlip.aggregate([
      {
        $addFields: {
          list: {
            $map: {
              input: "$lrList",
              as: "lrObj",
              in: "$$lrObj.lrNo",
            },
          },
        },
      },
      {
        $lookup: {
          from: "lorryReceipt",
          localField: "list",
          foreignField: "lrNo",
          as: "lorryReceipts",
        },
      },
      { $match: param },
      { $sort: { createdAt: -1 } },
      { $skip: start },
      { $limit: limit },
      {
        $unset: ["list", "lrList", "supplierPayments"],
      },
      { $sort: { createdAt: -1 } },
    ]);
    let returnList = [];
    let srNo = 1;
    loadingSlips.map((ls) => {
      ls.date = getFormattedDate(new Date(ls.date));
      ls.formattedLSNo = (ls.lsNo + "").padStart?.(6, "0");
      ls.lorryReceipts?.forEach?.((element) => {
        let noOfArticle = 0,
          totalWeight = 0;
        element.transactions.every((article) => {
          noOfArticle += article.articleNo;
          totalWeight += article.weight;
        });

        if (
          query.consignor === element.consignor ||
          query.consignor === element.consignee ||
          !query.consignor
        ) {
          returnList = [
            ...returnList,
            {
              _id: element._id,
              srNo: srNo,
              formattedLSNo: ls.formattedLSNo,
              from: element.from,
              generatedFrom: element.from,
              date: ls.date,
              vehicleNo: ls.vehicleNo,
              to: element.to,
              total: element.total,
              lrNo: element.lrNo,
              consignorName: element.consignorName,
              consigneeName: element.consigneeName,
              noOfArticle,
              totalWeight,
              payType: element.payType,
            },
          ];
          srNo += 1;
        }
      });
      return ls;
    });
    if (query.isPrint) {
      const workbook = exportLRChallanDataToXlsx(returnList);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "data.xlsx",
      );
      return workbook.xlsx.write(res).then(() => {
        res.status(200).end();
      });
    } else {
      const count = await LoadingSlip.countDocuments(param);
      res.json({
        loadingSlips: returnList,
        count,
      });
    }
  } catch (lsError) {
    return res.status(200).json({
      message: "Error fetching lorry receipt challans!",
    });
  }
};

module.exports = {
  getLorryReceipts,
  getLorryReceiptsFO,
  getLorryReceiptsWithCount,
  getRateMasterForLR,
  getLRAckWithCount,
  getAllLorryReceiptsWithCount,
  getLorryReceiptsByConsignor,
  addLorryReceipt,
  removeLorryReceipt,
  viewLorryReceipt,
  getLorryReceipt,
  updateLorryReceipt,
  updateLorryReceiptAck,
  removeLorryReceiptAck,
  getLoadingSlips,
  addLoadingSlip,
  removeLoadingSlip,
  getLoadingSlip,
  updateLoadingSlip,
  printLoadingSlip,
  getMoneyTransfers,
  addMoneyTransfer,
  removeMoneyTransfer,
  updateMoneyTransfer,
  getMoneyTransfer,
  getPettyTransactions,
  addPettyTransaction,
  getPettyCashBalance,
  getPettyTransactionsByDate,
  getLoadingSlipsById,
  getLorryReceiptsByDate,
  getBills,
  getBillRegisterReport,
  downloadBillReport,
  getBillsByCustomer,
  addBill,
  removeBill,
  getBill,
  printBill,
  updateBill,
  updateBills,
  getPaymentCollectionHistory,
  recordPaymentCollectionForBill,
  updatePaymentCollection,
  getLastLR,
  getLoadingSlipsBySupplier,
  saveSupplierPayments,
  saveSupplierBill,
  getSupplierBills,
  updateSupplierBills,
  updateLorryReceiptAckByLRNo,
  getQuotations,
  getQuotation,
  addQuotation,
  updateQuotation,
  removeQuotation,
  viewQuotation,
  viewPaymentCollection,
  getLorryReceiptsForReport,
  getPendingLorryReceiptForReport,
  downloadPendingLRReport,
  getLoadedLorryReceiptForReport,
  getClientLorryReceiptsWithCount,
  downloadLoadedLRReport,
  getChallanForReport,
  downloadLRReport,
  downloadChallanReport,
  getAllLRAck,
  addFONum,
  getLoadingSlipForReport,
  getLorryReceiptsForLS,
  getChallanAck,
  exportToExcelBill,
  getLRAck,
  exportToExcelBills,
  exportToExcelChallans,
  exportToExcelLorryReceipt,
  updateMultiLorryReceiptAck,
  exportUnacknowledged,
  getlrdetailsforloadsheet,
  getLorryMasterListForBillUpdate,
  uploadMiddleware,
  getUploadedExcels,
  uploadExcelFile,
  downloadExcelFile,
  deleteExcelFile,
  uploadWordMiddleware,
  getUploadedWords,
  uploadWordFile,
  downloadWordFile,
  deleteWordFile,
};

// const exportLRDataToXlsx = (data) => {
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet("Lorry receipts");

//   worksheet.columns = [
//     { header: "Sr. No.", key: "index", width: 15 },
//     { header: "L.R. Note No.", key: "formattedLRNo", width: 20 },
//     { header: "Consign Date", key: "lr_date", width: 15 },
//     { header: "Invoice no", key: "InvoiceNo", width: 45 },
//     { header: "Consignor Name", key: "consignor", width: 30 },
//     { header: "Consignee Name", key: "consignee", width: 30 },
//     { header: "From", key: "from_loc", width: 30 },
//     { header: "To", key: "to_loc", width: 30 },
//     { header: "Payment Mode", key: "pay_type", width: 15 },
//     { header: "Total Qty", key: "no_of_articles", width: 15 },
//     { header: "Grand Total", key: "total", width: 15 },
//     { header: "Total weight", key: "weight", width: 15 },
//   ];
//   worksheet.addRows(data);
//   return workbook;
// };

const exportLRDataToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Lorry receipts");

  worksheet.columns = [
    { header: "Sr. No.", key: "index", width: 10 },
    { header: "L.R. Note No.", key: "formattedLRNo", width: 20 },
    { header: "Consign Date", key: "lr_date", width: 15 },
    { header: "Invoice No", key: "InvoiceNo", width: 45 },
    { header: "Consignor Name", key: "consignor", width: 30 },
    { header: "Consignee Name", key: "consignee", width: 30 },
    { header: "From", key: "from_loc", width: 20 },
    { header: "To", key: "to_loc", width: 20 },
    { header: "Payment Mode", key: "pay_type", width: 15 },
    { header: "Total Qty", key: "no_of_articles", width: 10 },
    { header: "Grand Total", key: "total", width: 15 },
    { header: "Total Weight", key: "weight", width: 15 },
    { header: "Status", key: "status", width: 15 }, // Added
  ];

  // Style the header row
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
  });

  // Add rows with weight parsed as float to avoid string issues
  data.forEach((row) => {
    worksheet.addRow({
      ...row,
      weight: parseFloat(row.weight) || 0, // Ensure numeric
    });
  });

  // Right-align numeric columns
  ["no_of_articles", "total", "weight"].forEach((key) => {
    worksheet.getColumn(key).alignment = { horizontal: "right" };
  });

  return workbook;
};

const exportBillDataToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Lorry receipts");

  worksheet.columns = [
    { header: "Sr. No.", key: "index", width: 15 },
    { header: "Bill no.", key: "bill_no_full", width: 20 },
    { header: "Bill Date", key: "bill_date", width: 15 },
    { header: "Customer Name", key: "customer_name", width: 45 },
    { header: "Grand Total", key: "total_amount", width: 30 },
  ];
  worksheet.addRows(data);
  return workbook;
};

const exportLoadedLRDataToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Lorry receipts");
  worksheet.columns = [
    {
      header: "Sr. No.",
      key: "index",
      width: 10,
    },
    {
      header: "Consign No",
      key: "formattedLRNo",
      width: 20,
    },
    {
      header: "Consign Date",
      key: "formattedDate",
      width: 20,
    },
    {
      header: "Consignor Name",
      key: "consignorName",
      width: 30,
    },
    {
      header: "From",
      key: "from",
      width: 20,
    },
    {
      header: "Consignee Name",
      key: "consigneeName",
      width: 30,
    },
    {
      header: "To",
      key: "to",
      width: 20,
    },
    {
      header: "Payment Mode",
      key: "payType",
      width: 25,
    },
  ];
  worksheet.addRows(data);
  return workbook;
};

const exportPendingLRDataToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pending LR");

  worksheet.columns = [
    { header: "Sr. No.", key: "index", width: 15 },
    { header: "Consign No", key: "formattedLRNo", width: 20 },
    { header: "Consign Date", key: "formattedDate", width: 15 },
    { header: "Consignor Name", key: "consignorName", width: 30 },
    { header: "Consignee Name", key: "consigneeName", width: 30 },
    { header: "No of Articles", key: "totalArticles", width: 15 },
    { header: "Weight", key: "totalWeight", width: 15 },
  ];
  worksheet.addRows(data);
  return workbook;
};

const exportLoadingSlipToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Loading Tripsheet");

  worksheet.columns = [
    { header: "Sr. no", key: "srNo", width: 15 },
    { header: "LTS no.", key: "dc_no", width: 15 },
    { header: "Date", key: "dc_date", width: 15 },
    { header: "Owner Name", key: "vehical_owner_name", width: 20 },
    { header: "Vehicle no", key: "vehicleno", width: 20 },
    { header: "Hire Rs", key: "hire", width: 15 },
    { header: "Advance Rs", key: "advance", width: 15 },
    // { header: "Hamali", key: "totalHamali", width: 15 },
    // { header: "Commision", key: "rent", width: 15 },
    { header: "Total", key: "total", width: 15 },
  ];
  worksheet.addRows(data);
  return workbook;
};

const exportLRChallanDataToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Challan Register");

  worksheet.columns = [
    { header: "Sr No.", key: "srNo", width: 15 },
    { header: "Challan No", key: "formattedLSNo", width: 15 },
    { header: "Challan Generated From", key: "generatedFrom", width: 15 },
    { header: "Date", key: "date", width: 15 },
    { header: "Vehicle no", key: "vehicleNo", width: 20 },
    { header: "From", key: "from", width: 20 },
    { header: "To", key: "to", width: 20 },
    { header: "Total Amount", key: "total", width: 15 },
    { header: "LR No", key: "lrNo", width: 15 },
    { header: "Consignor", key: "consignorName", width: 30 },
    { header: "Consignee", key: "consigneeName", width: 30 },
    { header: "No. of Article", key: "noOfArticle", width: 15 },
    { header: "Weight", key: "totalWeight", width: 15 },
    { header: "Status", key: "payType", width: 15 },
  ];
  worksheet.addRows(data);
  return workbook;
};

const exportBillToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Bill");

  worksheet.columns = [
    { header: "Sr. No.", key: "srNo", width: 10 },
    { header: "Date", key: "formattedDate", width: 15 },
    { header: "LR No", key: "formattedLRNo", width: 15 },
    { header: "Station", key: "to", width: 30 },
    { header: "Invoice No.", key: "invoiceNo", width: 40 },
    { header: "Article", key: "article", width: 20 },
    { header: "FO Num", key: "foNum", width: 20 },
    { header: "Weight", key: "weight", width: 15 },
    { header: "No. of Article", key: "articleNo", width: 15 },
    { header: "Rate", key: "rate", width: 15 },
    { header: "LR Charge", key: "lrCharges", width: 15 },
    { header: "Hamali", key: "hamali", width: 15 },
    { header: "Delivery Charges", key: "deliveryCharges", width: 15 },
    { header: "Amount", key: "total", width: 15 },
  ];
  worksheet.addRows(data);
  return workbook;
};

const exportBillsToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Bills");

  worksheet.columns = [
    { header: "Sr. No.", key: "srNo", width: 10 },
    { header: "Bill No", key: "bill_no", width: 15 },
    { header: "Date", key: "bill_date", width: 15 },
    { header: "Customer", key: "customer", width: 30 },
    { header: "Bill Amount", key: "grandTotal", width: 20 },
  ];
  worksheet.addRows(data);
  return workbook;
};

const exportChallanToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Challans");

  worksheet.columns = [
    { header: "Sr. No.", key: "srNo", width: 10 },
    { header: "dcNo", key: "dcNo", width: 15 },
    { header: "Date", key: "formattedDate", width: 15 },
    { header: "Vehicle No", key: "vehicleNumber", width: 30 },
    { header: "From", key: "fromLoc", width: 40 },
    { header: "To", key: "toLoc", width: 40 },
    { header: "Hire Amount", key: "hire", width: 20 },
    { header: "Balance", key: "total", width: 20 },
  ];
  worksheet.addRows(data);
  return workbook;
};

const exportLorryReceiptToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("LRs");

  worksheet.columns = [
    { header: "Sr. No.", key: "srNo", width: 10 },
    { header: "LR No", key: "lr_no", width: 15 },
    { header: "Date", key: "formattedDate", width: 15 },
    { header: "Invoice No", key: "InvoiceNo", width: 15 },
    { header: "Consignor", key: "consigner_name", width: 30 },
    { header: "From", key: "loc_from_name", width: 40 },
    { header: "Consignee", key: "consignee_name", width: 30 },
    { header: "To", key: "loc_to_name", width: 40 },
    { header: "Pay Type", key: "pay_type", width: 20 },
    { header: "Grand Total", key: "total", width: 20 },
  ];
  worksheet.addRows(data);
  return workbook;
};

const exportUnacknowledgedToXlsx = (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("LRs");

  worksheet.columns = [
    { header: "Sr. No.", key: "srNo", width: 10 },
    { header: "LR No", key: "lrNo", width: 15 },
    { header: "Date", key: "formattedDate", width: 15 },
    { header: "Vehicle No", key: "vehicleNo", width: 15 },
    { header: "Consignor", key: "consignorName", width: 30 },
    { header: "From", key: "from", width: 40 },
    { header: "Consignee", key: "consigneeName", width: 30 },
    { header: "To", key: "to", width: 40 },
    { header: "No. of Article", key: "noOfArticle", width: 40 },
    { header: "Pay Type", key: "payType", width: 20 },
    { header: "Grand Total", key: "total", width: 20 },
  ];
  worksheet.addRows(data);
  return workbook;
};

const getFormattedDate = (date) => {
  const day = new Date(date)?.getDate();
  const month = new Date(date)?.getMonth() + 1;
  const year = new Date(date)?.getFullYear();
  return `${("0" + day).slice(-2)}-${("0" + month).slice(-2)}-${year}`;
};

const getFormattedDate2 = (date) => {
  const day = new Date(date)?.getDate();
  const month = new Date(date)?.getMonth() + 1;
  const year = new Date(date)?.getFullYear();
  return `${("0" + day).slice(-2)}-${("0" + month).slice(-2)}-${(
    year + ""
  ).slice(-2)}`;
};

// prefix 0 to a number
const pad = (num, size) => {
  if (typeof num === "number" && typeof size === "number") {
    let stringNum = num?.toString();
    while (stringNum.length < size) stringNum = "0" + stringNum;
    return stringNum;
  }
  return false;
};

const getWordNumber = (num) => {
  const [rupee, paise] = (num || 0)?.toFixed(2).split(".");
  if (parseInt(paise || 0)) {
    return `${titleCase(numWords(+rupee))} Rupees And ${titleCase(
      numWords(+paise),
    )} Paise only`;
  }
  return `${titleCase(numWords(num))} Rupees only`;
};

const titleCase = (str) => {
  str = str?.toLowerCase().split(" ");
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i]?.charAt(0)?.toUpperCase() + str[i]?.slice(1);
  }
  return str.join(" ");
};

const base64_encode = (file) => {
  return "data:image/gif;base64," + fs.readFileSync(file, "base64");
};

const getFormattedDateString = (receivedDate) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const date = new Date(receivedDate);
  const day = date?.getDate();
  const formattedDay = ("0" + day).slice(-2);
  const month = date?.getMonth();
  const year = date?.getFullYear();

  return `${formattedDay} ${monthNames[month]} ${year}`;
};
const getRegex = (str = "") => `^${str}$`;

const convertDateFormat = (date = new Date()) => {
  const day = new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return day;
};
