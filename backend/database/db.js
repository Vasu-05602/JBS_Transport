require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "password",
  database: process.env.DB_NAME || "jbs_db",
  connectionLimit: process.env.DB_CONNECTION_LIMIT ? Number(process.env.DB_CONNECTION_LIMIT) : 10,
  multipleStatements: true,
  waitForConnections: true,
  queueLimit: 0,
});

module.exports = pool;
