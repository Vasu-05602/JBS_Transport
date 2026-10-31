-- ==============================================================================
-- Migration: Add Payment Collection History Module
-- File: backend/database/migrations/add_payment_collection_history.sql
-- Created: 2026-10-20
-- Target Database: jbs_db (MySQL)
-- Description:
--   1. Reuses existing payment_collection and pay_coll_details tables.
--   2. Adds performance indexes on foreign keys (bill_id, pay_coll_id).
--   3. Creates stored procedure `getpaymentcollectionhistorybybillid` to retrieve
--      record-wise payment collection history associated with a specific bill.
--   4. Creates stored procedure `updatepaymentcollectionrecord` to allow editing
--      individual payment collection records (Receiving Amount, TDS, Payment Mode,
--      Receiving Date) with validation and security checks.
-- Prerequisites:
--   - MySQL 5.7+ or 8.0+
--   - Existing tables `payment_collection`, `pay_coll_details`, `bills`, `branch`
-- Execution:
--   mysql -u <user> -p jbs_db < backend/database/migrations/add_payment_collection_history.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Performance Indexes for Payment Collection Details & Header
-- ------------------------------------------------------------------------------

-- Add index on pay_coll_details.bill_id if not present
SET @exist := (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'pay_coll_details' 
      AND index_name = 'idx_pcd_bill_id'
);
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `pay_coll_details` ADD INDEX `idx_pcd_bill_id` (`bill_id`)', 
    'SELECT "Index idx_pcd_bill_id already exists"'
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on pay_coll_details.pay_coll_id if not present
SET @exist := (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'pay_coll_details' 
      AND index_name = 'idx_pcd_pay_coll_id'
);
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `pay_coll_details` ADD INDEX `idx_pcd_pay_coll_id` (`pay_coll_id`)', 
    'SELECT "Index idx_pcd_pay_coll_id already exists"'
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on payment_collection.customer_id if not present
SET @exist := (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'payment_collection' 
      AND index_name = 'idx_pc_customer_id'
);
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `payment_collection` ADD INDEX `idx_pc_customer_id` (`customer_id`)', 
    'SELECT "Index idx_pc_customer_id already exists"'
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on payment_collection.date if not present
SET @exist := (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'payment_collection' 
      AND index_name = 'idx_pc_date'
);
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `payment_collection` ADD INDEX `idx_pc_date` (`date`)', 
    'SELECT "Index idx_pc_date already exists"'
);
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 2. Stored Procedure: getpaymentcollectionhistorybybillid
-- Retrieves payment collection history for a given bill ID.
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `getpaymentcollectionhistorybybillid`;

DELIMITER //
CREATE DEFINER=`jbstrans`@`localhost` PROCEDURE `getpaymentcollectionhistorybybillid`(
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

-- ------------------------------------------------------------------------------
-- 3. Stored Procedure: updatepaymentcollectionrecord
-- Securely updates a payment collection detail record and its associated header.
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `updatepaymentcollectionrecord`;

DELIMITER //
CREATE DEFINER=`jbstrans`@`localhost` PROCEDURE `updatepaymentcollectionrecord`(
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
