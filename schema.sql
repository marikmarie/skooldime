-- ==========================================
-- SKOOLDIME - UGYATIP_DB DATABASE SCHEMA
-- Target DB Dialect: MySQL / MariaDB
-- Configured for Host: localhost
-- Database Name: ugyatip_db
-- User Credentials: (Provided in settings: DB Name: ugyatip_db, Pass: 3hjtuytiu)
-- ==========================================

CREATE DATABASE IF NOT EXISTS `ugyatip_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ugyatip_db`;

-- Set timezone to East Africa Time (Uganda)
SET time_zone = '+03:00';

-- Turn off Foreign Key Checks temporarily during setup
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------
-- 1. Table: schools
-- ------------------------------------------
DROP TABLE IF EXISTS `schools`;
CREATE TABLE `schools` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `region` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `commission_rate` DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_school_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 2. Table: parents
-- ------------------------------------------
DROP TABLE IF EXISTS `parents`;
CREATE TABLE `parents` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `nin` VARCHAR(50) DEFAULT NULL,
  `kyc_tier` INT NOT NULL DEFAULT 1, -- 1 = Basic, 2 = Verified (with NIN)
  `wallet_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_parent_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 3. Table: students
-- ------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` VARCHAR(50) NOT NULL,
  `school_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `admission_no` VARCHAR(100) NOT NULL,
  `class` VARCHAR(100) NOT NULL,
  `qr_hash` VARCHAR(100) NOT NULL,
  `pin` VARCHAR(4) NOT NULL DEFAULT '0000',
  `parent_phone` VARCHAR(50) NOT NULL,
  `is_linked` TINYINT(1) NOT NULL DEFAULT 1,
  `avatar_url` VARCHAR(512) DEFAULT NULL,
  `no_pin_limit` DECIMAL(15, 2) NOT NULL DEFAULT 2000.00,
  `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_student_admission` (`admission_no`),
  UNIQUE KEY `idx_student_qr` (`qr_hash`),
  KEY `fk_student_school` (`school_id`),
  KEY `fk_student_parent_phone` (`parent_phone`),
  CONSTRAINT `fk_student_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_student_parent` FOREIGN KEY (`parent_phone`) REFERENCES `parents` (`phone`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 4. Table: vendors
-- ------------------------------------------
DROP TABLE IF EXISTS `vendors`;
CREATE TABLE `vendors` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `school_id` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `type` ENUM('INDEPENDENT', 'CANTEEN', 'BOOKSHOP', 'UNIFORM') NOT NULL DEFAULT 'CANTEEN',
  `commission_rate` DECIMAL(5, 2) NOT NULL DEFAULT 99.00, -- split kept by vendor (e.g. 99% to vendor, 1% commission fee)
  `device_bound` TINYINT(1) NOT NULL DEFAULT 1,
  `fingerprint` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_vendor_school` (`school_id`),
  CONSTRAINT `fk_vendor_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 5. Table: users
-- ------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'BUSINESS_ADMIN', 'AGENT', 'SCHOOL_ADMIN', 'VENDOR', 'PARENT', 'STUDENT', 'STAFF') NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `nin` VARCHAR(50) DEFAULT NULL,
  `school_id` VARCHAR(50) DEFAULT NULL,
  `vendor_id` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_username` (`username`),
  KEY `fk_user_school` (`school_id`),
  KEY `fk_user_vendor` (`vendor_id`),
  CONSTRAINT `fk_user_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_user_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 6. Table: wallets
-- ------------------------------------------
DROP TABLE IF EXISTS `wallets`;
CREATE TABLE `wallets` (
  `id` VARCHAR(50) NOT NULL, -- usually derived from parent_id or student_id etc.
  `owner_id` VARCHAR(50) NOT NULL,
  `owner_type` ENUM('STUDENT', 'VENDOR', 'SCHOOL', 'PLATFORM', 'STAFF', 'PARENT') NOT NULL,
  `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('ACTIVE', 'DORMANT', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `last_transaction_date` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_wallet_owner` (`owner_id`, `owner_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 7. Table: transactions
-- ------------------------------------------
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` VARCHAR(50) NOT NULL,
  `reference_code` VARCHAR(100) NOT NULL,
  `sender_wallet_id` VARCHAR(50) NOT NULL,
  `receiver_wallet_id` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `fee` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `type` ENUM('DEPOSIT', 'WITHDRAWAL', 'SPEND', 'LOAN_DISBURSE', 'LOAN_REPAY', 'REFUND', 'COMMISSION_SPLIT') NOT NULL,
  `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
  `description` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tx_ref` (`reference_code`),
  KEY `idx_tx_sender` (`sender_wallet_id`),
  KEY `idx_tx_receiver` (`receiver_wallet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 8. Table: loan_products
-- ------------------------------------------
DROP TABLE IF EXISTS `loan_products`;
CREATE TABLE `loan_products` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `min_amount` DECIMAL(15, 2) NOT NULL,
  `max_amount` DECIMAL(15, 2) NOT NULL,
  `interest_rate` DECIMAL(5, 2) NOT NULL, -- flat rate percentage, e.g. 5.00 for 5%
  `duration_days` INT NOT NULL,
  `target_role` ENUM('VENDOR', 'STAFF', 'PARENT') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 9. Table: loans
-- ------------------------------------------
DROP TABLE IF EXISTS `loans`;
CREATE TABLE `loans` (
  `id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(50) NOT NULL,
  `borrower_id` VARCHAR(50) NOT NULL,
  `borrower_type` ENUM('VENDOR', 'STAFF', 'PARENT') NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `interest` DECIMAL(15, 2) NOT NULL,
  `total_repayable` DECIMAL(15, 2) NOT NULL,
  `amount_paid` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('ACTIVE', 'PAID', 'DEFAULTED') NOT NULL DEFAULT 'ACTIVE',
  `due_date` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_loan_product` (`product_id`),
  CONSTRAINT `fk_loan_product` FOREIGN KEY (`product_id`) REFERENCES `loan_products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 10. Table: staff
-- ------------------------------------------
DROP TABLE IF EXISTS `staff`;
CREATE TABLE `staff` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('TEACHER', 'WARDEN', 'BURSAR') NOT NULL DEFAULT 'TEACHER',
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `status` ENUM('ACTIVE', 'SUSPENDED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_staff_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 11. Table: catalog_items
-- ------------------------------------------
DROP TABLE IF EXISTS `catalog_items`;
CREATE TABLE `catalog_items` (
  `id` VARCHAR(50) NOT NULL,
  `vendor_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(15, 2) NOT NULL,
  `usage_count` INT NOT NULL DEFAULT 0,
  `category` ENUM('FOOD', 'STATIONERY', 'CLOTHING', 'OTHER') NOT NULL DEFAULT 'FOOD',
  PRIMARY KEY (`id`),
  KEY `fk_catalog_vendor` (`vendor_id`),
  CONSTRAINT `fk_catalog_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 12. Table: credit_scores
-- ------------------------------------------
DROP TABLE IF EXISTS `credit_scores`;
CREATE TABLE `credit_scores` (
  `id` VARCHAR(50) NOT NULL,
  `owner_id` VARCHAR(50) NOT NULL,
  `score` INT NOT NULL DEFAULT 0,
  `tx_count_30_days` INT NOT NULL DEFAULT 0,
  `deposit_frequency` INT NOT NULL DEFAULT 0,
  `repayment_history` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_credit_score_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 13. Table: audit_logs
-- ------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(50) NOT NULL,
  `old_values` TEXT DEFAULT NULL,
  `new_values` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- SEED INITIAL SYSTEM DATA (From db.json)
-- ==========================================

-- 1. Seed Schools
INSERT INTO `schools` (`id`, `name`, `region`, `code`, `commission_rate`) VALUES
('S1', 'Kampala Parents Primary', 'Central', 'KPS', 1.00),
('S2', 'Nakasero Model School', 'Central', 'NMS', 1.20),
('S3', 'Gayaza High School', 'Central', 'GHS', 0.80);

-- 2. Seed Parents
INSERT INTO `parents` (`id`, `name`, `phone`, `nin`, `kyc_tier`, `wallet_balance`) VALUES
('P_1782409334151_06a', 'David Mugisha', '+256779998811', 'CM91122334A23', 2, 0.00),
('P_1782409334160_2eb', 'Moses Mukasa', '+256772444555', 'CM89021102A12', 2, 0.00),
('P_1782409334160_5b2', 'Justine Namara', '+256782555444', 'CF90088112C45', 2, 0.00);

-- 3. Seed Students
INSERT INTO `students` (`id`, `school_id`, `name`, `admission_no`, `class`, `qr_hash`, `pin`, `parent_phone`, `is_linked`, `avatar_url`, `no_pin_limit`, `balance`) VALUES
('ST_1782409334159_fb2b', 'S1', 'Joan Kembabazi', 'KPS-2026-009', 'Primary 6', 'ST_QR_6CFD15', '0000', '+256779998811', 1, '', 2000.00, 0.00),
('ST_1782409334160_b4b2', 'S1', 'Timothy Mukasa', 'KPS-2026-010', 'Primary 4', 'ST_QR_D434A1', '0000', '+256772444555', 1, 'https://photos.google.com/photo/AF1QipNdBfSUF8wZyuylfizlEBzFBROh3k-sa1GMUl3u', 2000.00, 0.00),
('ST_1782409334160_440d', 'S1', 'Angella Namara', 'GHS-2026-102', 'Senior 2', 'ST_QR_A0C8C5', '0000', '+256782555444', 1, '', 2000.00, 0.00);

-- 4. Seed Vendors
INSERT INTO `vendors` (`id`, `name`, `school_id`, `phone`, `type`, `commission_rate`, `device_bound`, `fingerprint`) VALUES
('V1', 'Mama Betty Canteen', 'S1', '+256700000005', 'CANTEEN', 98.50, 1, NULL),
('V2', 'Elite Bookshop', 'S1', '+256700000101', 'BOOKSHOP', 98.00, 1, NULL),
('V3', 'Nakasero Snacks', 'S2', '+256700000202', 'CANTEEN', 99.00, 1, NULL);

-- 5. Seed Users
INSERT INTO `users` (`id`, `username`, `role`, `name`, `phone`, `email`, `nin`, `school_id`, `vendor_id`) VALUES
('U1', 'superadmin', 'SUPER_ADMIN', 'Alinda Robert (HQ)', '+256700000001', NULL, NULL, NULL, NULL),
('U2', 'central_admin', 'BUSINESS_ADMIN', 'Nakimbugwe Stella', '+256700000002', NULL, NULL, NULL, NULL),
('U3', 'agent_peter', 'AGENT', 'Peter Ssekabira', '+256700000003', NULL, NULL, NULL, NULL),
('U4', 'kps_bursar', 'SCHOOL_ADMIN', 'Kato Charles (Bursar)', '+256700000004', NULL, NULL, 'S1', NULL),
('U5', 'kps_canteen', 'VENDOR', 'Mama Betty Canteen', '+256700000005', NULL, NULL, 'S1', 'V1'),
('U6', 'moses_parent', 'PARENT', 'Moses Mukasa', '+256772444555', NULL, NULL, NULL, NULL);

-- 6. Seed Wallets
INSERT INTO `wallets` (`id`, `owner_id`, `owner_type`, `balance`, `status`, `last_transaction_date`) VALUES
('W_P_1782409334151_06a', 'P_1782409334151_06a', 'PARENT', 0.00, 'ACTIVE', '2026-06-25 17:42:14'),
('W_ST_1782409334159_fb2b', 'ST_1782409334159_fb2b', 'STUDENT', 0.00, 'ACTIVE', '2026-06-25 17:42:14'),
('W_P_1782409334160_2eb', 'P_1782409334160_2eb', 'PARENT', 0.00, 'ACTIVE', '2026-06-25 17:42:14'),
('W_ST_1782409334160_b4b2', 'ST_1782409334160_b4b2', 'STUDENT', 0.00, 'ACTIVE', '2026-06-25 17:42:14'),
('W_P_1782409334160_5b2', 'P_1782409334160_5b2', 'PARENT', 0.00, 'ACTIVE', '2026-06-25 17:42:14'),
('W_ST_1782409334160_440d', 'ST_1782409334160_440d', 'STUDENT', 0.00, 'ACTIVE', '2026-06-25 17:42:14');

-- 7. Seed Loan Products
INSERT INTO `loan_products` (`id`, `name`, `description`, `min_amount`, `max_amount`, `interest_rate`, `duration_days`, `target_role`) VALUES
('lp1', 'School Fees Advance', 'Urgent funding to cover school fees with quick repayment terms.', 50000.00, 500000.00, 5.00, 30, 'PARENT'),
('lp2', 'Merchant Inventory Capital', 'Stock finance for registered canteens and bookstores.', 100000.00, 1000000.00, 3.00, 15, 'VENDOR'),
('lp3', 'Staff Salary Advance', 'Emergency salary loan for registered teachers and administration.', 50000.00, 300000.00, 4.00, 30, 'STAFF');

-- 8. Seed Staff
INSERT INTO `staff` (`id`, `name`, `role`, `email`, `phone`, `status`) VALUES
('STF1', 'Nalwanga Florence', 'TEACHER', 'florence@kps.ac.ug', '+256771122334', 'ACTIVE'),
('STF2', 'Otim Douglas', 'WARDEN', 'douglas@kps.ac.ug', '+256781234567', 'ACTIVE'),
('STF3', 'Kato Charles', 'BURSAR', 'charles@kps.ac.ug', '+256700000004', 'ACTIVE');

-- 9. Seed Credit Scores
INSERT INTO `credit_scores` (`id`, `owner_id`, `score`, `tx_count_30_days`, `deposit_frequency`, `repayment_history`) VALUES
('cs_1782416383092', 'P1', 62, 0, 5, 'Standard automatic system profile assessment'),
('cs_1782466526524', 'V1', 78, 120, 0, 'Standard automatic system profile assessment');

-- 10. Seed Catalog Items (Default options for POS)
INSERT INTO `catalog_items` (`id`, `vendor_id`, `name`, `price`, `usage_count`, `category`) VALUES
('C1', 'V1', 'Rolex & Tea Combo', 3500.00, 42, 'FOOD'),
('C2', 'V1', 'Samosa (Pair)', 1500.00, 19, 'FOOD'),
('C3', 'V1', 'Fresh Juice (Passion)', 2000.00, 28, 'FOOD'),
('C4', 'V1', 'Mineral Water (Small)', 1000.00, 33, 'FOOD'),
('C5', 'V1', 'Beef Pilau', 5000.00, 15, 'FOOD'),
('C6', 'V1', 'Mathematics Graph Book', 3000.00, 8, 'STATIONERY'),
('C7', 'V1', 'Blue Gel Pen (Speed)', 800.00, 52, 'STATIONERY'),
('C8', 'V1', 'Skooldime Branded Ruler', 1200.00, 12, 'STATIONERY');

-- 11. Seed Audit Logs
INSERT INTO `audit_logs` (`id`, `user_id`, `user_name`, `role`, `action`, `ip_address`, `old_values`, `new_values`, `created_at`) VALUES
('a_1782412684031_5fa7', 'SYSTEM', 'System Daemon', 'SUPER_ADMIN', 'DATABASE_HARD_RESET', '::1', NULL, NULL, '2026-06-25 18:38:04'),
('a_1782409334262_a5b8', 'u_agent', 'Peter Ssekabira', 'AGENT', 'BULK_CSV_STUDENT_IMPORT', '::1', NULL, '{"addedStudentsCount":3}', '2026-06-25 17:42:14');
