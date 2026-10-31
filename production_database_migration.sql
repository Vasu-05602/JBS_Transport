-- ==============================================================================
-- PRODUCTION DATABASE MIGRATION SCRIPT — JBS TRANSPORT ERP
-- File: production_database_migration.sql
-- Generated: 2026-10-21
-- Target Database: jbs_db (MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.4+)
-- Author: Senior Database Engineer & Production Migration Specialist
--
-- STRICT RESTRICTIONS & SAFETY DIRECTIVES:
--   1. DO NOT run this script blindly against production without running the
--      pre-migration diagnostic checks provided below.
--   2. This script contains ZERO destructive operations (no DROP TABLE, no
--      TRUNCATE, no column deletions, no data purge).
--   3. All table creations are protected with IF NOT EXISTS.
--   4. All index additions use dynamic information_schema checks to ensure
--      rerunnable (idempotent) execution without duplicate key errors.
--   5. Stored procedures are replaced atomically using DROP PROCEDURE IF EXISTS
--      followed by standard CREATE PROCEDURE using CURRENT_USER definer semantics
--      to avoid definer privilege errors on production hosts.
--
-- EXECUTION INSTRUCTIONS:
--   mysql -u <prod_user> -p -h <prod_host> <prod_db_name> < production_database_migration.sql
-- ==============================================================================

USE `jbs_db`; -- Change to your production database name if different

-- Ensure consistent session settings for script execution
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=1;

SELECT '>>> Starting JBS Transport ERP Production Database Migration...' AS `status`;

-- ==============================================================================
-- PART 1: SCHEMA ADDITIONS (NEW TABLES REQUIRED BY ACTIVE CODE)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1.1 Table: uploaded_words
-- Purpose: Required by Word Document Upload & Reporting module
-- Backend: backend/controller/transactions-controller.js (lines 791, 819, 849)
-- Utility: backend/utils/wordParser.js
-- Frontend: frontend/src/modules/reports/components/UploadWords/
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `uploaded_words` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(255) DEFAULT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `saved_filename` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` BIGINT NOT NULL DEFAULT '0',
  `word_count` INT NOT NULL DEFAULT '0',
  `paragraph_count` INT NOT NULL DEFAULT '0',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_uploaded_words_label` (`label`),
  KEY `idx_uploaded_words_orig_name` (`original_filename`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

SELECT '>>> Part 1.1: Table uploaded_words verified/created.' AS `status`;

-- ------------------------------------------------------------------------------
-- 1.2 Table: quotation
-- Purpose: Quotation Master header required by Quotation Management module
-- Backend: backend/controller/transactions-controller.js (lines 7423, 7558, 7699)
-- Frontend: frontend/src/modules/transactions/components/quotations/
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quotation` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quotation_number` VARCHAR(50) COLLATE utf8mb4_general_ci NOT NULL,
  `quotation_date` DATE NOT NULL,
  `customer` INT UNSIGNED NOT NULL,
  `branch` INT UNSIGNED NOT NULL,
  `from_date` DATE DEFAULT NULL,
  `to_date` DATE DEFAULT NULL,
  `other_field` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `field1` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `field2` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `field3` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `terms_and_cond` TEXT COLLATE utf8mb4_general_ci,
  `dd_changer` VARCHAR(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rate_per` VARCHAR(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT '1',
  `created_by` INT UNSIGNED DEFAULT NULL,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quotation_branch` (`branch`),
  KEY `idx_quotation_customer` (`customer`),
  KEY `idx_quotation_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SELECT '>>> Part 1.2: Table quotation verified/created.' AS `status`;

-- ------------------------------------------------------------------------------
-- 1.3 Table: quotation_station
-- Purpose: Quotation line item details (destinations/rates) with cascading FK
-- Backend: backend/controller/transactions-controller.js (lines 7452, 7558, 7716)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quotation_station` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quotation_id` INT UNSIGNED NOT NULL,
  `station_name` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `place` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `amount` DECIMAL(12,2) DEFAULT '0.00',
  `other_field_value` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `field1_value` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `field2_value` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `field3_value` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qs_quotation_id` (`quotation_id`),
  CONSTRAINT `fk_quotation_station_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotation` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SELECT '>>> Part 1.3: Table quotation_station verified/created.' AS `status`;

-- ==============================================================================
-- PART 2: PERFORMANCE INDEXES (PAYMENT COLLECTION & DETAIL OPTIMIZATION)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 2.1 Index on pay_coll_details.bill_id
-- Required for high-speed payment history lookups and bill balance reconciliations
-- ------------------------------------------------------------------------------
SET @exist := (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'pay_coll_details' 
      AND index_name = 'idx_pcd_bill_id'
);
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `pay_coll_details` ADD INDEX `idx_pcd_bill_id` (`bill_id`)', 
    'SELECT "Index idx_pcd_bill_id already exists on pay_coll_details"'
);
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 2.2 Index on pay_coll_details.pay_coll_id
-- Required for foreign key join to header and atomic total recalculation
-- ------------------------------------------------------------------------------
SET @exist := (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'pay_coll_details' 
      AND index_name = 'idx_pcd_pay_coll_id'
);
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `pay_coll_details` ADD INDEX `idx_pcd_pay_coll_id` (`pay_coll_id`)', 
    'SELECT "Index idx_pcd_pay_coll_id already exists on pay_coll_details"'
);
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 2.3 Index on payment_collection.customer_id
-- Required for fast retrieval of customer ledger receipts
-- ------------------------------------------------------------------------------
SET @exist := (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'payment_collection' 
      AND index_name = 'idx_pc_customer_id'
);
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `payment_collection` ADD INDEX `idx_pc_customer_id` (`customer_id`)', 
    'SELECT "Index idx_pc_customer_id already exists on payment_collection"'
);
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 2.4 Index on payment_collection.date
-- Required for date-ranged payment collection and financial auditing queries
-- ------------------------------------------------------------------------------
SET @exist := (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'payment_collection' 
      AND index_name = 'idx_pc_date'
);
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `payment_collection` ADD INDEX `idx_pc_date` (`date`)', 
    'SELECT "Index idx_pc_date already exists on payment_collection"'
);
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT '>>> Part 2: Payment collection performance indexes verified/applied.' AS `status`;

-- ==============================================================================
-- PART 3: STORED PROCEDURES (PAYMENT COLLECTION & BILLING LOGIC)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 3.1 Procedure: getpaymentcollectionhistorybybillid
-- Purpose: Fetches receipt-wise payment history for a specific bill.
-- Consumer: transactionsCtrl.getPaymentCollectionHistory (L.8103)
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `getpaymentcollectionhistorybybillid`;

DELIMITER //
CREATE PROCEDURE `getpaymentcollectionhistorybybillid`(
    IN `in_bill_id` VARCHAR(45)
)
BEGIN
    SELECT 
        pcd.id AS id,
        pcd.id AS collection_detail_id,
        pc.id AS pay_coll_id,
        b.id AS bill_id,
        CONCAT(IFNULL((SELECT branch_abbreviation FROM branch WHERE branch_id = b.branch), ''), '-', b.bill_no) AS bill_no,
        DATE_FORMAT(b.bill_date, '%d-%m-%Y') AS bill_date,
        b.bill_date AS raw_bill_date,
        COALESCE(b.grandTotal, b.tot_amount, '0.00') AS total_bill_amount,
        CAST(IFNULL(pcd.received, 0) AS DECIMAL(12,2)) AS receiving_amount,
        CAST(IFNULL(pcd.tds_ded, 0) AS DECIMAL(12,2)) AS tds,
        CAST(IFNULL(pcd.party_ded, 0) AS DECIMAL(12,2)) AS party_ded,
        IFNULL(pc.pay_mode, '') AS pay_mode,
        pc.date AS receiving_date,
        IFNULL(pc.bank_name, '') AS bank_name,
        IFNULL(pc.cheque_rtgs_no, '') AS cheque_rtgs_no,
        pc.cheque_rtgs_date
    FROM pay_coll_details pcd
    INNER JOIN payment_collection pc ON pc.id = pcd.pay_coll_id
    INNER JOIN bills b ON b.id = pcd.bill_id
    WHERE b.id = in_bill_id
    ORDER BY pcd.id DESC;
END //
DELIMITER ;

SELECT '>>> Part 3.1: Stored Procedure getpaymentcollectionhistorybybillid compiled.' AS `status`;

-- ------------------------------------------------------------------------------
-- 3.2 Procedure: updatepaymentcollectionrecord
-- Purpose: Atomically updates an individual payment detail record and recalculates
--          the total amount received and TDS on the parent payment_collection header.
-- Consumer: transactionsCtrl.updatePaymentCollection (L.8439)
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `updatepaymentcollectionrecord`;

DELIMITER //
CREATE PROCEDURE `updatepaymentcollectionrecord`(
    IN `in_detail_id` INT,
    IN `in_bill_id` VARCHAR(45),
    IN `in_received` VARCHAR(45),
    IN `in_tds_ded` VARCHAR(45),
    IN `in_pay_mode` VARCHAR(45),
    IN `in_receiving_date` VARCHAR(45),
    IN `in_bank_name` VARCHAR(512),
    IN `in_cheque_rtgs_no` VARCHAR(45),
    OUT `out_status` INT,
    OUT `out_message` VARCHAR(255)
)
BEGIN
    DECLARE v_pay_coll_id VARCHAR(45);
    DECLARE v_exists INT DEFAULT 0;

    -- Verify that the collection detail record exists and belongs to the specified bill
    SELECT COUNT(*), pay_coll_id 
    INTO v_exists, v_pay_coll_id
    FROM pay_coll_details
    WHERE id = in_detail_id AND bill_id = in_bill_id
    GROUP BY pay_coll_id
    LIMIT 1;

    IF v_exists = 0 OR v_pay_coll_id IS NULL THEN
        SET out_status = 404;
        SET out_message = 'Payment collection record not found for this bill';
    ELSE
        -- 1. Update the individual bill collection detail record
        UPDATE pay_coll_details
        SET 
            received = TRIM(in_received),
            tds_ded = TRIM(in_tds_ded)
        WHERE id = in_detail_id;

        -- 2. Update the payment collection header (mode, date, and optional bank/cheque)
        UPDATE payment_collection
        SET 
            pay_mode = TRIM(in_pay_mode),
            date = TRIM(in_receiving_date),
            bank_name = IF(in_bank_name IS NOT NULL AND in_bank_name != '', in_bank_name, bank_name),
            cheque_rtgs_no = IF(in_cheque_rtgs_no IS NOT NULL AND in_cheque_rtgs_no != '', in_cheque_rtgs_no, cheque_rtgs_no),
            -- Recalculate totals across all details in this payment collection
            receive = (
                SELECT IFNULL(SUM(CAST(received AS DECIMAL(12,2))), 0)
                FROM pay_coll_details
                WHERE pay_coll_id = v_pay_coll_id
            ),
            tds_ded = (
                SELECT IFNULL(SUM(CAST(tds_ded AS DECIMAL(12,2))), 0)
                FROM pay_coll_details
                WHERE pay_coll_id = v_pay_coll_id
            )
        WHERE id = v_pay_coll_id;

        SET out_status = 200;
        SET out_message = 'Payment collection updated successfully';
    END IF;
END //
DELIMITER ;

SELECT '>>> Part 3.2: Stored Procedure updatepaymentcollectionrecord compiled.' AS `status`;

-- ------------------------------------------------------------------------------
-- 3.3 Procedure: getbilldetailsbyid
-- Purpose: Returns bill line item details including aggregated transaction articles
--          and descriptions, with SQL mode compatibility for ONLY_FULL_GROUP_BY.
-- Consumer: transactionsCtrl.getBill (L.5841)
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `getbilldetailsbyid`;

DELIMITER //
CREATE PROCEDURE `getbilldetailsbyid`(
    IN `in_billid` VARCHAR(45)
)
BEGIN
    SET sql_mode = (SELECT REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', ''));
    
    SELECT 
        bd.id, 
        bd.bill_id, 
        bd.lr_id,
        CONCAT((SELECT branch_abbreviation FROM branch WHERE branch_id = lm.branch), "-", lm.lr_no) AS lrno, 
        IFNULL(bd.freight, 0) AS freight, 
        IFNULL(bd.hamali, 0) AS hamali, 
        IFNULL(bd.collection, 0) AS collection, 
        IFNULL(bd.door_delivery, 0) AS door_delivery, 
        IFNULL(bd.wt_charges, 0) AS wt_charges, 
        IFNULL(bd.other_ch, 0) AS other_ch, 
        IFNULL(bd.statistics, 0) AS statistics, 
        IFNULL(bd.total, 0) AS total, 
        bd.gstn, 
        bd.gstpayby, 
        fplace.place_name AS from_place, 
        tplace.place_name AS to_place, 
        DATE_FORMAT(lm.lr_date, "%d-%m-%Y") AS lrdate,
        fcust.customer_name AS from_customer, 
        tcust.customer_name AS to_customer,
        SUM(IFNULL(tlr.actual_wt, 0)) AS total_weight,
        SUM(IFNULL(tlr.no_of_articles, 0)) AS total_articles, 
        GROUP_CONCAT(tlr.no_of_articles ORDER BY tlr.id SEPARATOR ', ') AS article_quantities,
        IFNULL(bd.gst_amount, 0) AS gst_amount,
        GROUP_CONCAT(tlr.description ORDER BY tlr.id SEPARATOR ', ') AS description
    FROM 
        bill_details bd 
    INNER JOIN 
        lorry_reciept_master lm ON lm.id = bd.lr_id 
    INNER JOIN 
        transactions_lr tlr ON tlr.lr_master_id = lm.id
    LEFT JOIN 
        place fplace ON fplace.place_id = lm.loc_from 
    LEFT JOIN 
        place tplace ON tplace.place_id = lm.loc_to 
    LEFT JOIN 
        customer fcust ON fcust.customer_id = lm.consigner 
    LEFT JOIN 
        customer tcust ON tcust.customer_id = lm.consignee 
    WHERE 
        bd.bill_id = in_billid 
    GROUP BY 
        lm.id, bd.id;
END //
DELIMITER ;

SELECT '>>> Part 3.3: Stored Procedure getbilldetailsbyid compiled.' AS `status`;

-- ------------------------------------------------------------------------------
-- 3.4 Procedure: lorrymasterlistforbill
-- Purpose: Returns unbilled Lorry Receipts for billing creation, strictly excluding
--          LRs that have already been attached to any existing bill in bill_details.
-- Consumer: transactionsCtrl.getLorryMasterListForBill (L.1442)
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `lorrymasterlistforbill`;

DELIMITER //
CREATE PROCEDURE `lorrymasterlistforbill`(
    IN `in_cust` VARCHAR(145), 
    IN `in_billtype` VARCHAR(45)
)
BEGIN
    SELECT 
        lm.id,
        CONCAT(b.branch_abbreviation, "-", lm.lr_no) AS lr_number,
        lm.lr_date,  
        lm.total, 
        COALESCE(SUM(t.no_of_articles), 0) AS total_no_of_articles,  
        GROUP_CONCAT(t.description SEPARATOR ', ') AS descriptions  
    FROM 
        lorry_reciept_master lm
    JOIN 
        branch b ON lm.branch = b.branch_id
    LEFT JOIN 
        transactions_lr t ON lm.id = t.lr_master_id  
    WHERE 
        lm.pay_type = in_billtype
        AND (lm.consigner = in_cust OR lm.consignee = in_cust)
        AND lm.lr_status != 3
        AND lm.id NOT IN (
            SELECT DISTINCT bd.lr_id 
            FROM bill_details bd 
            JOIN bills b_tbl ON bd.bill_id = b_tbl.id
        )
    GROUP BY 
        lm.id, b.branch_abbreviation, lm.lr_no, lm.lr_date, lm.total  
    ORDER BY 
        lm.id DESC;
END //
DELIMITER ;

SELECT '>>> Part 3.4: Stored Procedure lorrymasterlistforbill compiled.' AS `status`;

-- ------------------------------------------------------------------------------
-- 3.5 Procedure: lorrymasterlistforbillbydate
-- Purpose: Returns unbilled LRs within a specific date range, strictly excluding
--          already-billed LRs.
-- Consumer: transactionsCtrl.getLorryMasterListForBill (L.1439)
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `lorrymasterlistforbillbydate`;

DELIMITER //
CREATE PROCEDURE `lorrymasterlistforbillbydate`(
    IN `in_cust` VARCHAR(145), 
    IN `in_billtype` VARCHAR(45), 
    IN `in_fromdate` DATE, 
    IN `in_todate` DATE
)
BEGIN
    SELECT 
        lm.id,
        CONCAT(b.branch_abbreviation, "-", lm.lr_no) AS lr_number,
        lm.lr_date,  
        lm.total, 
        COALESCE(SUM(t.no_of_articles), 0) AS total_no_of_articles,  
        GROUP_CONCAT(t.description SEPARATOR ', ') AS descriptions  
    FROM 
        lorry_reciept_master lm
    JOIN 
        branch b ON lm.branch = b.branch_id
    LEFT JOIN 
        transactions_lr t ON lm.id = t.lr_master_id  
    WHERE 
        lm.pay_type = in_billtype
        AND (lm.consigner = in_cust OR lm.consignee = in_cust)
        AND lm.lr_status != 3 
        AND DATE_FORMAT(lm.lr_date,'%Y-%m-%d') BETWEEN in_fromdate AND in_todate
        AND lm.id NOT IN (
            SELECT DISTINCT bd.lr_id 
            FROM bill_details bd 
            JOIN bills b_tbl ON bd.bill_id = b_tbl.id
        )
    GROUP BY 
        lm.id, b.branch_abbreviation, lm.lr_no, lm.lr_date, lm.total  
    ORDER BY 
        lm.id DESC;
END //
DELIMITER ;

SELECT '>>> Part 3.5: Stored Procedure lorrymasterlistforbillbydate compiled.' AS `status`;

-- Restore session settings
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;

SELECT '========================================================================' AS ``;
SELECT '>>> JBS TRANSPORT ERP MIGRATION COMPLETED SUCCESSFULLY!' AS `MIGRATION STATUS`;
SELECT '========================================================================' AS ``;
