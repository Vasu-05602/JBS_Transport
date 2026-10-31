-- ==============================================================================
-- Migration: Add Customer City Field to Quotation Table
-- File: customer_city_quotation_migration.sql
-- Project: JBS Transport ERP
-- Date: October 2026
--
-- Target Database: MySQL (5.7+, 8.0+) / MariaDB (10.4+)
-- Target Table:    `quotation`
-- Target Column:   `customer_city` (VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL)
-- Position:        Immediately after `customer` column
--
-- Purpose:
--   Persists the customer's city for quotations in the quotation master table.
--   Enables explicit city storage per quotation while maintaining full backward
--   compatibility with existing records where city may be null or derived.
--
-- Execution Instructions (Manual DBA Step - DO NOT auto-run on production):
--   1. Connect to your MySQL/MariaDB server via command line or GUI (e.g. MySQL Workbench, HeidiSQL, SQLyog):
--        mysql -u <username> -p -h <host> <database_name> < customer_city_quotation_migration.sql
--      Example:
--        mysql -u root -p jbs_db < customer_city_quotation_migration.sql
--   2. Review the output status message confirming column creation or existence.
--   3. Verify with:
--        DESCRIBE quotation;
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Safe, Idempotent Column Addition for MySQL 5.7+ / 8.0+ / MariaDB
--    Checks `information_schema.COLUMNS` to prevent duplicate-column errors.
-- ------------------------------------------------------------------------------

SET @dbname := DATABASE();

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE table_schema = @dbname
      AND table_name = 'quotation'
      AND column_name = 'customer_city'
);

SET @sqlstmt := IF(
    @col_exists = 0,
    'ALTER TABLE `quotation` ADD COLUMN `customer_city` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL AFTER `customer`',
    'SELECT "INFO: Column customer_city already exists on table quotation. No changes made." AS `status`'
);

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 2. Verification Query
-- ------------------------------------------------------------------------------
SELECT
    COLUMN_NAME,
    ORDINAL_POSITION,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLLATION_NAME
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE()
  AND table_name = 'quotation'
  AND column_name = 'customer_city';

SELECT '>>> customer_city_quotation_migration.sql executed successfully.' AS `migration_status`;
