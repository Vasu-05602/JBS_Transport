# Pro-Level Database Change Audit & Production Migration Plan — JBS Transport ERP

**Target System:** JBS Transport Management System (ERP)  
**Database Technology:** MySQL (InnoDB) / MariaDB (Compatible with 5.7+, 8.0+, MariaDB 10.4+)  
**Evaluation Date:** October 21, 2026  
**Auditor:** Senior Database Engineer & Production Migration Specialist  
**Status:** Audit Complete — Production Ready  

---

## 1. Executive Summary

This audit establishes the definitive, evidence-based inventory of database changes across the JBS Transport ERP codebase. The objective is to allow the operations team and Database Administrators (DBAs) to safely replicate all necessary database objects into the production environment without service interruption, data loss, or guesswork.

### Core Audit Findings at a Glance

1. **Payment Collection Feature Requires Zero Table Schema Changes:**  
   The recent partial-payment collection implementation reuses the pre-existing `payment_collection`, `pay_coll_details`, and `bills` tables. **No new columns, data type changes, or constraint alterations were made to these tables.**
2. **Two New Stored Procedures and Four Performance Indexes Required for Payment Collections:**  
   - Two new stored procedures (`getpaymentcollectionhistorybybillid` and `updatepaymentcollectionrecord`) were authored in `database/migrations/add_payment_collection_history.sql` to retrieve payment receipts by bill ID and safely edit individual collection records while recalculating header totals.
   - Four non-unique performance indexes were created on foreign key and query filter columns in `pay_coll_details` (`bill_id`, `pay_coll_id`) and `payment_collection` (`customer_id`, `date`).
3. **Three Additional Base Tables Created for Other Features:**  
   Forensic comparison between the baseline dump (`dump_jbstrans_db_20260702094639.sql`) and the live development database revealed three newly created tables:
   - `uploaded_words`: Required by the Word Document Upload & Reporting module (`wordParser.js`).
   - `quotation`: Required by the active Quotation Master module (`transactions-controller.js`).
   - `quotation_station`: Required by Quotation rate details with a cascading foreign key to `quotation`.
4. **Three Existing Stored Procedures Updated:**  
   - `getbilldetailsbyid`: Updated on October 20, 2026, to aggregate article descriptions and quantities via `GROUP_CONCAT` and handle MySQL `ONLY_FULL_GROUP_BY` SQL mode.
   - `lorrymasterlistforbill` and `lorrymasterlistforbillbydate`: Updated on October 19, 2026, to filter out already-billed Lorry Receipts (`lm.id NOT IN (SELECT DISTINCT bd.lr_id FROM bill_details bd JOIN bills b_tbl ON bd.bill_id = b_tbl.id)`).
5. **No Data Seeding Required:**  
   No configuration rows, mandatory seed records, or system dictionaries need to be injected into production.
6. **Significant Application-Layer Architectural Safeguards:**  
   The financial integrity rules (strict overpayment prevention against `grandTotal`, cent-precision integer arithmetic to prevent IEEE-754 floating-point inaccuracies, and transactional pessimistic concurrency locks via `SELECT ... FOR UPDATE`) are implemented entirely at the application layer in `transactions-controller.js`.

---

## 2. Complete Database Change Inventory & Classification

Every finding has been verified against the actual repository source files, SQL backups, and live database schema metadata (`information_schema`).

| ID | Object Name | Object Type | Category | Source File | Status in Production | Mandatory for Deploy? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | `getpaymentcollectionhistorybybillid` | Stored Procedure | **A. Required DB Change** | `database/migrations/add_payment_collection_history.sql` | Missing | **Yes** (Bill History UI) |
| **F-02** | `updatepaymentcollectionrecord` | Stored Procedure | **A. Required DB Change** | `database/migrations/add_payment_collection_history.sql` | Missing | **Yes** (Payment Edit UI) |
| **F-03** | `idx_pcd_bill_id` | Index | **A. Required DB Change** | `database/migrations/add_payment_collection_history.sql` | Missing | **Yes** (Query Performance) |
| **F-04** | `idx_pcd_pay_coll_id` | Index | **A. Required DB Change** | `database/migrations/add_payment_collection_history.sql` | Missing | **Yes** (Join Performance) |
| **F-05** | `idx_pc_customer_id` | Index | **A. Required DB Change** | `database/migrations/add_payment_collection_history.sql` | Missing | **Yes** (Ledger Performance) |
| **F-06** | `idx_pc_date` | Index | **A. Required DB Change** | `database/migrations/add_payment_collection_history.sql` | Missing | **Yes** (Report Performance) |
| **F-07** | `uploaded_words` | Base Table | **A. Required DB Change** | `backend/controller/transactions-controller.js:791` | Missing | **Yes** (Word Uploads) |
| **F-08** | `quotation` | Base Table | **A. Required DB Change** | `backend/controller/transactions-controller.js:7423` | Verify Prod | **Yes** (Quotation Module) |
| **F-09** | `quotation_station` | Base Table | **A. Required DB Change** | `backend/controller/transactions-controller.js:7452` | Verify Prod | **Yes** (Quotation Details) |
| **F-10** | `getbilldetailsbyid` | Stored Procedure | **A. Required DB Change** | `information_schema.ROUTINES` (Oct 20, 2026) | Existing (Older) | **Yes** (Bill Editing) |
| **F-11** | `lorrymasterlistforbill` | Stored Procedure | **A. Required DB Change** | `information_schema.ROUTINES` (Oct 19, 2026) | Existing (Older) | **Recommended** (Bill LR Exclusion) |
| **F-12** | `lorrymasterlistforbillbydate` | Stored Procedure | **A. Required DB Change** | `information_schema.ROUTINES` (Oct 19, 2026) | Existing (Older) | **Recommended** (Bill LR Exclusion) |
| **F-13** | `payment_collection` | Base Table | **B. Existing Reused** | `dump_jbstrans_db_20260702094639.sql:1249` | Existing | **No Schema Change** |
| **F-14** | `pay_coll_details` | Base Table | **B. Existing Reused** | `dump_jbstrans_db_20260702094639.sql:1222` | Existing | **No Schema Change** |
| **F-15** | `bills` | Base Table | **B. Existing Reused** | `dump_jbstrans_db_20260702094639.sql:199` | Existing | **No Schema Change** |
| **F-16** | `branch` | Base Table | **B. Existing Reused** | `dump_jbstrans_db_20260702094639.sql:249` | Existing | **No Schema Change** |
| **F-17** | `recordPaymentCollectionForBill` | Logic / Endpoint | **D. Application-Only** | `backend/controller/transactions-controller.js:8161` | N/A | **No DB Change** |
| **F-18** | Pessimistic Lock (`FOR UPDATE`) | Concurrency Logic | **D. Application-Only** | `backend/controller/transactions-controller.js:8219` | N/A | **No DB Change** |
| **F-19** | Cent-Precision Validation | Financial Logic | **D. Application-Only** | `backend/controller/transactions-controller.js:8150` | N/A | **No DB Change** |
| **F-20** | PDF Engine Migration (pdfmake) | Document Engine | **D. Application-Only** | `backend/services/pdf/` | N/A | **No DB Change** |

---

## 3. Detailed Before-versus-After Comparison

### 3.1 Payment Collection Schema Objects

#### Table: `payment_collection`
- **Verified Historical State (Dump July 2026):**
  ```sql
  CREATE TABLE `payment_collection` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `date` varchar(45) DEFAULT NULL,
    `type` varchar(45) DEFAULT NULL,
    `customer_id` varchar(45) DEFAULT NULL,
    `receive` varchar(45) DEFAULT NULL,
    `party_ded` varchar(45) DEFAULT NULL,
    `tds_ded` varchar(45) DEFAULT NULL,
    `pay_mode` varchar(45) DEFAULT NULL,
    `bank_name` varchar(512) DEFAULT NULL,
    `cheque_rtgs_no` varchar(45) DEFAULT NULL,
    `cheque_rtgs_date` varchar(45) DEFAULT NULL,
    `branch` varchar(45) DEFAULT NULL,
    `user_id` varchar(45) DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  ```
- **Verified Current State (October 2026):**  
  **Identical columns, types, nullability, and engine.**  
  **Difference:** Two secondary indexes added: `idx_pc_customer_id` (`customer_id`) and `idx_pc_date` (`date`).

#### Table: `pay_coll_details`
- **Verified Historical State (Dump July 2026):**
  ```sql
  CREATE TABLE `pay_coll_details` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `pay_coll_id` varchar(45) DEFAULT NULL,
    `bill_id` varchar(45) DEFAULT NULL,
    `received` varchar(45) DEFAULT NULL,
    `party_ded` varchar(45) DEFAULT NULL,
    `tds_ded` varchar(45) DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  ```
- **Verified Current State (October 2026):**  
  **Identical columns, types, nullability, and engine.**  
  **Difference:** Two secondary indexes added: `idx_pcd_bill_id` (`bill_id`) and `idx_pcd_pay_coll_id` (`pay_coll_id`).

#### Table: `bills`
- **Verified Historical State (Dump July 2026):**  
  Contains 28 columns (`id`, `bill_no`, `bill_date`, `bill_type`, `customer_id`, `tot_freight`, `tot_hamali`, `service_ch`, `delivery_ch`, `other_ch`, `demurage`, `tds`, `tot_tax`, `tot_amount`, `remarks`, `fileloc`, `branch`, `user_id`, `cc_charge`, `insurance`, `docket`, `localFreight`, `cgst`, `cgstPercent`, `sgst`, `sgstPercent`, `grandTotal`, `freight`).
- **Verified Current State (October 2026):**  
  **100% Identical.** Zero schema modifications.

---

### 3.2 Non-Payment Feature Tables (Discovered During Audit)

#### Table: `uploaded_words`
- **Previous State:** Did not exist in the database.
- **Current State:** Required by the Word document reporting feature.
- **DDL:**
  ```sql
  CREATE TABLE `uploaded_words` (
    `id` int NOT NULL AUTO_INCREMENT,
    `label` varchar(255) DEFAULT NULL,
    `original_filename` varchar(255) NOT NULL,
    `saved_filename` varchar(255) NOT NULL,
    `file_path` varchar(500) NOT NULL,
    `file_size` bigint NOT NULL DEFAULT '0',
    `word_count` int NOT NULL DEFAULT '0',
    `paragraph_count` int NOT NULL DEFAULT '0',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `label` (`label`)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
  ```

#### Tables: `quotation` and `quotation_station`
- **Previous State:** Did not exist in July 2026 dump (previously handled by legacy MongoDB models in `backend/models/Quotation.js`).
- **Current State:** Replaced with relational MySQL tables in active Express REST endpoints.
- **DDL:** Master-detail relationship with cascading delete (`ON DELETE CASCADE`) on `quotation_station.quotation_id`.

---

## 4. Verification of Stored Procedures & Dependencies

### Specific Verification of Payment Collection Objects

1. `payment_collection`: **CONFIRMED EXISTING.** Table exists in production baseline. No DDL required.
2. `pay_coll_details`: **CONFIRMED EXISTING.** Table exists in production baseline. No DDL required.
3. `bills`: **CONFIRMED EXISTING.** Table exists in production baseline. No DDL required.
4. `getpaymentcollectionhistorybybillid`: **CONFIRMED NEW.** Must be deployed to production.
5. `updatepaymentcollectionrecord`: **CONFIRMED NEW.** Must be deployed to production.

### Operational Relationship Diagram

```mermaid
graph TD
    UI[Frontend: PaymentCollectionHistoryCard.jsx] -->|GET /getPaymentCollectionHistory/:billId| SP1[SP: getpaymentcollectionhistorybybillid]
    UI -->|PUT /updatePaymentCollection/:id| SP2[SP: updatepaymentcollectionrecord]
    UI -->|POST /recordPaymentCollectionForBill| CTRL[transactionsCtrl.recordPaymentCollectionForBill]
    
    SP1 -->|INNER JOIN| PCD[pay_coll_details (indexed: idx_pcd_bill_id)]
    SP1 -->|INNER JOIN| PC[payment_collection]
    SP1 -->|INNER JOIN| B[bills]
    
    SP2 -->|1. UPDATE received, tds_ded| PCD
    SP2 -->|2. SUM & UPDATE receive, tds_ded, mode| PC
    
    CTRL -->|1. SELECT ... FOR UPDATE (Pessimistic Lock)| B
    CTRL -->|2. SELECT received, tds_ded (Validate Sum <= GrandTotal)| PCD
    CTRL -->|3. INSERT header| PC
    CTRL -->|4. INSERT detail| PCD
```

---

## 5. Pre-Migration Verification Checklist (Read-Only SQL)

Execute these diagnostic queries against your target production database prior to applying any changes. None of these queries modify any data.

```sql
-- =============================================================================
-- PRE-MIGRATION READ-ONLY DIAGNOSTIC SCRIPT
-- Run this on Production to assess baseline status
-- =============================================================================

-- 1. Check existing tables
SELECT 
    TABLE_NAME, 
    ENGINE, 
    TABLE_ROWS, 
    CREATE_TIME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('payment_collection', 'pay_coll_details', 'bills', 'uploaded_words', 'quotation', 'quotation_station');

-- 2. Check existing indexes on payment tables
SELECT 
    TABLE_NAME, 
    INDEX_NAME, 
    COLUMN_NAME, 
    NON_UNIQUE 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('payment_collection', 'pay_coll_details')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- 3. Check existing stored procedures
SELECT 
    ROUTINE_NAME, 
    ROUTINE_TYPE, 
    DEFINER, 
    CREATED, 
    LAST_ALTERED 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
  AND ROUTINE_NAME IN (
      'getpaymentcollectionhistorybybillid',
      'updatepaymentcollectionrecord',
      'getbilldetailsbyid',
      'lorrymasterlistforbill',
      'lorrymasterlistforbillbydate'
  );

-- 4. Check MySQL engine version and current sql_mode
SELECT VERSION() AS mysql_version, @@sql_mode AS current_sql_mode;
```

---

## 6. Production-Ready SQL Migration Plan

The complete executable SQL migration has been packaged in a standalone file: [production_database_migration.sql](file:///c:/Users/giriv/OneDrive%20-%20Avotech%20systems%20pvt%20ltd/JBS-Transport-main/production_database_migration.sql).

### Change 1: Performance Indexes (Safe, Non-Blocking, Idempotent)

```sql
-- 1. pay_coll_details.bill_id
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pay_coll_details' AND index_name = 'idx_pcd_bill_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `pay_coll_details` ADD INDEX `idx_pcd_bill_id` (`bill_id`)', 'SELECT "Index idx_pcd_bill_id exists"');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. pay_coll_details.pay_coll_id
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pay_coll_details' AND index_name = 'idx_pcd_pay_coll_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `pay_coll_details` ADD INDEX `idx_pcd_pay_coll_id` (`pay_coll_id`)', 'SELECT "Index idx_pcd_pay_coll_id exists"');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. payment_collection.customer_id
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payment_collection' AND index_name = 'idx_pc_customer_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `payment_collection` ADD INDEX `idx_pc_customer_id` (`customer_id`)', 'SELECT "Index idx_pc_customer_id exists"');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. payment_collection.date
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payment_collection' AND index_name = 'idx_pc_date');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `payment_collection` ADD INDEX `idx_pc_date` (`date`)', 'SELECT "Index idx_pc_date exists"');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
```

### Change 2: Stored Procedures (Idempotent Replacement)

Both stored procedures use `DROP PROCEDURE IF EXISTS` followed by standard `CREATE PROCEDURE`. Notice that `DEFINER` clauses have been decoupled from local usernames (`jbstrans@localhost` or `root@localhost`) to use standard invocation rights, eliminating permission errors on production.

---

## 7. Post-Migration Verification Checklist

After running the migration script, run this verification query to confirm complete, healthy installation:

```sql
-- =============================================================================
-- POST-MIGRATION VERIFICATION SCRIPT
-- =============================================================================

-- 1. Confirm all 4 indexes are active
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND INDEX_NAME IN ('idx_pcd_bill_id', 'idx_pcd_pay_coll_id', 'idx_pc_customer_id', 'idx_pc_date');

-- 2. Confirm all required procedures exist and have valid definers
SELECT ROUTINE_NAME, ROUTINE_TYPE, DEFINER, CREATED 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
  AND ROUTINE_NAME IN (
      'getpaymentcollectionhistorybybillid',
      'updatepaymentcollectionrecord',
      'getbilldetailsbyid',
      'lorrymasterlistforbill',
      'lorrymasterlistforbillbydate'
  );

-- 3. Functional smoke test: Test getpaymentcollectionhistorybybillid with dummy bill ID 0
CALL getpaymentcollectionhistorybybillid('0');

-- 4. Functional smoke test: Test updatepaymentcollectionrecord with dummy ID
CALL updatepaymentcollectionrecord(0, '0', '0.00', '0.00', 'Cash', '2026-10-21', NULL, NULL, @status, @msg);
SELECT @status AS test_status, @msg AS test_message;
-- Expected output: test_status = 404, test_message = 'Payment collection record not found for this bill'
```

---

## 8. Backup and Rollback Recommendations

### 8.1 Pre-Migration Backup Strategy

Before applying the migration in production:
1. Perform a full logical schema and routine dump:
   ```bash
   mysqldump -u <user> -p --routines --triggers --no-data jbs_db > pre_migration_schema_routines_backup.sql
   ```
2. Take a full snapshot of the affected tables:
   ```bash
   mysqldump -u <user> -p jbs_db payment_collection pay_coll_details bills > pre_migration_payment_tables_backup.sql
   ```

### 8.2 Production Rollback Script

If a rollback is required, run the following safe script to revert the newly introduced indexes, tables, and procedures. Existing records in `payment_collection` and `pay_coll_details` will remain untouched.

```sql
-- =============================================================================
-- EMERGENCY ROLLBACK SCRIPT (IF NEEDED)
-- =============================================================================
USE `jbs_db`;

-- Drop new procedures
DROP PROCEDURE IF EXISTS `getpaymentcollectionhistorybybillid`;
DROP PROCEDURE IF EXISTS `updatepaymentcollectionrecord`;

-- Drop performance indexes if rollback is desired
ALTER TABLE `pay_coll_details` DROP INDEX `idx_pcd_bill_id`;
ALTER TABLE `pay_coll_details` DROP INDEX `idx_pcd_pay_coll_id`;
ALTER TABLE `payment_collection` DROP INDEX `idx_pc_customer_id`;
ALTER TABLE `payment_collection` DROP INDEX `idx_pc_date`;

-- Note: DO NOT drop uploaded_words, quotation, or quotation_station if users have created records in them!
```

---

## 9. Risks, Dependencies, and Technical Nuances

### 9.1 Data Types: VARCHAR vs DECIMAL
- **Finding:** In `bills`, `tot_amount` and `grandTotal` are stored as `varchar(255)` / `varchar(45)` rather than standard `DECIMAL(12,2)`. Similarly, in `pay_coll_details`, `received` and `tds_ded` are stored as `varchar(45)`.
- **Engineering Assessment:** Altering these existing column types to `DECIMAL` in a live production database with thousands of records poses severe lock contention risks, implicit data truncation risks, and application breakdown where code expects string responses.
- **Resolution:** The team properly implemented floating-point protection **at the application layer** (`toCents()` integer cents conversion and `CAST(... AS DECIMAL(12,2))` inside SQL queries). **Do NOT execute `ALTER TABLE ... MODIFY received DECIMAL` in production.** Reusing existing VARCHAR storage with application-level cent arithmetic is safe and avoids table locks.

### 9.2 MySQL `ONLY_FULL_GROUP_BY` Mode
- In MySQL 8.0+, `ONLY_FULL_GROUP_BY` is enabled by default. Stored procedures like `getbilldetailsbyid` aggregate some columns with `GROUP_CONCAT` while grouping on `lm.id, bd.id`. The updated procedure includes:
  ```sql
  SET sql_mode = (SELECT REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', ''));
  ```
  This is essential in production to avoid error `1055 (42000): Expression #4 of SELECT list is not in GROUP BY clause`.

### 9.3 `DEFINER` User Rights
- Migrations created locally with `DEFINER=\`root\`@\`localhost\`` or `DEFINER=\`jbstrans\`@\`localhost\`` will fail on production if the executing database user does not have `SUPER` or `SET_USER_ID` privileges, or if the production hostname differs.
- The production migration script uses standard `CREATE PROCEDURE` without a hardcoded `DEFINER`, which automatically binds to `CURRENT_USER`.

---

## 10. Final Deployment Checklist

- [ ] **Step 1:** Run Pre-Migration Diagnostic Queries (Section 5) on the target production database to verify existing tables and routines.
- [ ] **Step 2:** Generate logical backup of production schema and routines (`mysqldump --routines --no-data`).
- [ ] **Step 3:** Apply [production_database_migration.sql](file:///c:/Users/giriv/OneDrive%20-%20Avotech%20systems%20pvt%20ltd/JBS-Transport-main/production_database_migration.sql) during maintenance window or low-traffic period.
- [ ] **Step 4:** Run Post-Migration Verification Queries (Section 7) to ensure healthy execution of smoke test procedures.
- [ ] **Step 5:** Deploy updated Node.js backend (`transactions-controller.js`, `transactions-routes.js`).
- [ ] **Step 6:** Deploy updated React frontend bundle (`PaymentCollectionHistoryCard.jsx`, `BillEdit.jsx`).
- [ ] **Step 7:** Perform end-to-end verification in UI:
  - Open an existing bill in Bill Edit.
  - Verify that the "Payment Collection History" card loads previous receipts without error.
  - Record a partial payment and verify that outstanding balance decrements accurately.
  - Edit a payment record and verify that header total updates correctly.
