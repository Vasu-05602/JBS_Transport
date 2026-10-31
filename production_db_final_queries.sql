-- ==============================================================================
-- FINAL PRODUCTION DATABASE QUERIES — JBS TRANSPORT ERP
-- File: production_db_final_queries.sql
-- Target Database: jbs_db (MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.4+)
-- Description:
--   Contains ONLY the necessary NEW or UPDATED tables, performance indexes,
--   stored procedures, and database-level validation triggers.
--   Preserves existing production records and excludes all unchanged objects.
--
-- EXECUTION ORDER:
--   STEP 1: New Base Tables (uploaded_words, quotation, quotation_station)
--   STEP 2: Performance Indexes (pay_coll_details, payment_collection)
--   STEP 3: Stored Procedures (Payment Collection & Billing)
--   STEP 4: Financial Integrity Triggers (Absolute Grand Total Enforcement)
-- ==============================================================================

USE `jbs_db`;

-- ==============================================================================
-- STEP 1: NEW BASE TABLES
-- ==============================================================================

-- 1.1 Word Document Upload & Reporting Table
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

-- 1.2 Quotation Master Header Table
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

-- 1.3 Quotation Rate Line Items Table
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

-- ==============================================================================
-- STEP 2: PERFORMANCE & FOREIGN KEY INDEXES (IDEMPOTENT)
-- ==============================================================================

-- 2.1 Index on pay_coll_details.bill_id
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
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.2 Index on pay_coll_details.pay_coll_id
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
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.3 Index on payment_collection.customer_id
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
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.4 Index on payment_collection.date
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
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ==============================================================================
-- STEP 3: STORED PROCEDURES
-- ==============================================================================

-- 3.1 Procedure: getpaymentcollectionhistorybybillid
-- Retrieves receipt-wise payment history for a given bill ID.
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

-- 3.2 Procedure: updatepaymentcollectionrecord
-- Concurrency-safe procedure to edit an individual payment collection receipt.
-- Serializes concurrent edits with pessimistic locking (SELECT ... FOR UPDATE on bills)
-- and strictly validates that (other_settled + revised_settlement) <= Grand Total.
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
    DECLARE v_bill_grand_total DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_other_settled DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_new_settlement DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_num_received DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_num_tds DECIMAL(12,2) DEFAULT 0.00;

    -- 1. Concurrency Control: Lock the bill row for update to serialize concurrent transactions
    SELECT CAST(COALESCE(NULLIF(grandTotal, ''), NULLIF(tot_amount, ''), '0') AS DECIMAL(12,2))
    INTO v_bill_grand_total
    FROM bills
    WHERE id = in_bill_id
    FOR UPDATE;

    IF v_bill_grand_total IS NULL THEN
        SET out_status = 404;
        SET out_message = 'Bill not found';
    ELSE
        -- 2. Verify payment detail record exists and is bound to the target bill
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
            -- 3. Parse and validate incoming numeric amounts
            SET v_num_received = CAST(IFNULL(NULLIF(TRIM(in_received), ''), '0') AS DECIMAL(12,2));
            SET v_num_tds = CAST(IFNULL(NULLIF(TRIM(in_tds_ded), ''), '0') AS DECIMAL(12,2));
            SET v_new_settlement = v_num_received + v_num_tds;

            IF v_num_received < 0 OR v_num_tds < 0 THEN
                SET out_status = 400;
                SET out_message = 'Receiving amount and TDS cannot be negative';
            ELSE
                -- 4. Calculate total settled on this bill by all OTHER receipts (excluding this detail record)
                SELECT IFNULL(SUM(
                    CAST(IFNULL(NULLIF(TRIM(received), ''), '0') AS DECIMAL(12,2)) + 
                    CAST(IFNULL(NULLIF(TRIM(tds_ded), ''), '0') AS DECIMAL(12,2))
                ), 0.00)
                INTO v_other_settled
                FROM pay_coll_details
                WHERE bill_id = in_bill_id AND id != in_detail_id;

                -- 5. Absolute Limit Enforcement: (Other Settled + Revised Settlement) <= Grand Total
                IF (v_other_settled + v_new_settlement) > v_bill_grand_total THEN
                    SET out_status = 400;
                    SET out_message = CONCAT(
                        'Cumulative settlement exceeds Grand Total. Max permitted for this record: ', 
                        CAST(GREATEST(0.00, v_bill_grand_total - v_other_settled) AS CHAR)
                    );
                ELSE
                    -- 6. Update individual bill payment detail record
                    UPDATE pay_coll_details
                    SET 
                        received = TRIM(in_received),
                        tds_ded = TRIM(in_tds_ded)
                    WHERE id = in_detail_id;

                    -- 7. Update parent payment_collection header and recalculate aggregate totals
                    UPDATE payment_collection
                    SET 
                        pay_mode = TRIM(in_pay_mode),
                        date = TRIM(in_receiving_date),
                        bank_name = IF(in_bank_name IS NOT NULL AND in_bank_name != '', in_bank_name, bank_name),
                        cheque_rtgs_no = IF(in_cheque_rtgs_no IS NOT NULL AND in_cheque_rtgs_no != '', in_cheque_rtgs_no, cheque_rtgs_no),
                        receive = (
                            SELECT IFNULL(SUM(CAST(IFNULL(NULLIF(TRIM(received), ''), '0') AS DECIMAL(12,2))), 0.00)
                            FROM pay_coll_details
                            WHERE pay_coll_id = v_pay_coll_id
                        ),
                        tds_ded = (
                            SELECT IFNULL(SUM(CAST(IFNULL(NULLIF(TRIM(tds_ded), ''), '0') AS DECIMAL(12,2))), 0.00)
                            FROM pay_coll_details
                            WHERE pay_coll_id = v_pay_coll_id
                        )
                    WHERE id = v_pay_coll_id;

                    SET out_status = 200;
                    SET out_message = 'Payment collection updated successfully';
                END IF;
            END IF;
        END IF;
    END IF;
END //
DELIMITER ;

-- 3.3 Procedure: getbilldetailsbyid
-- Returns bill details with concatenated article quantities/descriptions and SQL mode compatibility.
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

-- 3.4 Procedure: lorrymasterlistforbill
-- Returns unbilled LRs for bill creation, strictly excluding already-billed LRs.
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

-- 3.5 Procedure: lorrymasterlistforbillbydate
-- Returns unbilled LRs within date range, strictly excluding already-billed LRs.
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

-- ==============================================================================
-- STEP 4: FINANCIAL INTEGRITY TRIGGERS (ABSOLUTE GRAND TOTAL ENFORCEMENT)
-- ==============================================================================

-- 4.1 Trigger on pay_coll_details (BEFORE INSERT)
-- Enforces at the database storage engine level that any newly inserted receipt
-- cannot cause cumulative settlement (Received + TDS) to exceed the bill Grand Total.
DROP TRIGGER IF EXISTS `trg_pay_coll_details_validate_insert`;

DELIMITER //
CREATE TRIGGER `trg_pay_coll_details_validate_insert`
BEFORE INSERT ON `pay_coll_details`
FOR EACH ROW
BEGIN
    DECLARE v_grand_total DECIMAL(12,2) DEFAULT NULL;
    DECLARE v_current_settled DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_new_settlement DECIMAL(12,2) DEFAULT 0.00;

    IF NEW.bill_id IS NOT NULL AND TRIM(NEW.bill_id) != '' THEN
        -- Fetch bill Grand Total
        SELECT CAST(COALESCE(NULLIF(grandTotal, ''), NULLIF(tot_amount, ''), '0') AS DECIMAL(12,2))
        INTO v_grand_total
        FROM bills
        WHERE id = NEW.bill_id;

        IF v_grand_total IS NOT NULL AND v_grand_total > 0.00 THEN
            -- Calculate currently settled amount on this bill
            SELECT IFNULL(SUM(
                CAST(IFNULL(NULLIF(TRIM(received), ''), '0') AS DECIMAL(12,2)) + 
                CAST(IFNULL(NULLIF(TRIM(tds_ded), ''), '0') AS DECIMAL(12,2))
            ), 0.00)
            INTO v_current_settled
            FROM pay_coll_details
            WHERE bill_id = NEW.bill_id;

            -- Calculate incoming settlement
            SET v_new_settlement = CAST(IFNULL(NULLIF(TRIM(NEW.received), ''), '0') AS DECIMAL(12,2)) + 
                                   CAST(IFNULL(NULLIF(TRIM(NEW.tds_ded), ''), '0') AS DECIMAL(12,2));

            -- Reject insert if cumulative settlement exceeds Grand Total
            IF (v_current_settled + v_new_settlement) > v_grand_total THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Payment rejected: Cumulative settlement (Receiving Amount + TDS) exceeds bill Grand Total.';
            END IF;
        END IF;
    END IF;
END //
DELIMITER ;

-- 4.2 Trigger on pay_coll_details (BEFORE UPDATE)
-- Enforces that any direct UPDATE on pay_coll_details cannot exceed the bill Grand Total.
DROP TRIGGER IF EXISTS `trg_pay_coll_details_validate_update`;

DELIMITER //
CREATE TRIGGER `trg_pay_coll_details_validate_update`
BEFORE UPDATE ON `pay_coll_details`
FOR EACH ROW
BEGIN
    DECLARE v_grand_total DECIMAL(12,2) DEFAULT NULL;
    DECLARE v_other_settled DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_new_settlement DECIMAL(12,2) DEFAULT 0.00;

    IF NEW.bill_id IS NOT NULL AND TRIM(NEW.bill_id) != '' THEN
        SELECT CAST(COALESCE(NULLIF(grandTotal, ''), NULLIF(tot_amount, ''), '0') AS DECIMAL(12,2))
        INTO v_grand_total
        FROM bills
        WHERE id = NEW.bill_id;

        IF v_grand_total IS NOT NULL AND v_grand_total > 0.00 THEN
            -- Calculate settled amount excluding the record being updated
            SELECT IFNULL(SUM(
                CAST(IFNULL(NULLIF(TRIM(received), ''), '0') AS DECIMAL(12,2)) + 
                CAST(IFNULL(NULLIF(TRIM(tds_ded), ''), '0') AS DECIMAL(12,2))
            ), 0.00)
            INTO v_other_settled
            FROM pay_coll_details
            WHERE bill_id = NEW.bill_id AND id != OLD.id;

            SET v_new_settlement = CAST(IFNULL(NULLIF(TRIM(NEW.received), ''), '0') AS DECIMAL(12,2)) + 
                                   CAST(IFNULL(NULLIF(TRIM(NEW.tds_ded), ''), '0') AS DECIMAL(12,2));

            IF (v_other_settled + v_new_settlement) > v_grand_total THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Payment update rejected: Cumulative settlement (Receiving Amount + TDS) exceeds bill Grand Total.';
            END IF;
        END IF;
    END IF;
END //
DELIMITER ;
