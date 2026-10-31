

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const pool = require('./database/db');
const engines = require("consolidate");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/public", express.static("public"));
app.use("/bills", express.static("bills"));
app.engine("html", engines.mustache);
app.set("view engine", "html");

// Environment-aware CORS configuration
const defaultOrigins = [
  "https://erp.jbstranspune.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];
const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [];
const allowedOrigins = Array.from(
  new Set([...defaultOrigins, ...envOrigins].map((o) => o.replace(/\/$/, "")))
);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.indexOf(cleanOrigin) !== -1 || process.env.CORS_ORIGIN === "*") {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin not allowed: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const userRoutes = require("./routes/user-routes");
const masterRoutes = require("./routes/master-routes");
const transactionRoutes = require("./routes/transactions-routes");
app.use("/api/user", userRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/transactions", transactionRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'server is working' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);
  if (res.headersSent) {
    return next(err);
  }
  const isProduction = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    message: isProduction ? "An internal server error occurred" : (err.message || "Internal Server Error"),
    status: false,
  });
});

const port = process.env.PORT || 4800;

const server = app.listen(port, () => {
  server.timeout = 180000; // 3 minutes in milliseconds
  console.log(`Connected to port ${port}`);
});

// Graceful process shutdown handling
const handleShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      await pool.end();
      console.log("Database connection pool closed.");
      process.exit(0);
    } catch (poolErr) {
      console.error("Error closing database pool:", poolErr);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Graceful shutdown timed out after 10 seconds. Forcing process exit.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception thrown:", error);
});