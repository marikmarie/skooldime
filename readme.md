# 📄 MASTER SYSTEM ARCHITECTURE BLUEPRINT: EduTechMoney
**Document Version:** 1.0 (Final Comprehensive)
**Project Name:** EduTechMoney (Digital Pocket Money & Micro-Loan System)
**Target Market:** Ugandan Educational Ecosystem (Primary, Secondary, Tertiary)
**Deployment Phases:** Phase 1 (Core FinTech & POS) | Phase 1.5 (Micro-Loans)

---

## 1. INFRASTRUCTURE & TECHNOLOGY STACK
Strict adherence to this stack is required for security and performance.
*   **Server Environment:** Linux (Ubuntu 22.04+), Apache/Nginx.
*   **Backend Language:** PHP 8.2+ (Strict Object-Oriented, Type-Hinted).
*   **Database Engine:** MySQL 8.0+ / MariaDB 10.6+ (InnoDB engine is mandatory for ACID compliance and Row-Level Locking).
*   **Frontend Framework:** Tailwind (Mobile-first, SCSS customized).
*   **Frontend Interactivity:** react jQuery 3.7+, `jquery-confirm` v3.3+ (for all modals/alerts), Select2 (for dynamic POS dropdowns).
*   **Encryption Libraries:** OpenSSL (Backend), CryptoJS v4.1+ (Frontend).
*   **Background Tasks:** Linux Cron Jobs (for Gateway Polling, Credit Scoring, Dormancy Sweeps).

---

## 2. USER ROLES & PERMISSIONS MATRIX
A single `users` table manages authentication. Access to routes is governed by a strict Middleware/Session check.

1.  **Super Admin (God Mode):**
    *   *Access:* Global dashboard, platform-wide revenue, all audit logs.
    *   *Powers:* Create Business Admins, toggle Global Features (Loans), set global platform commission %.
2.  **Business Admin (Franchise Level):**
    *   *Access:* Regional dashboard.
    *   *Powers:* Create Schools and Agents within their region, configure `vendor_school_link` commission matrices.
3.  **Agent (Field Operations):**
    *   *Access:* Field dashboard (Mobile-optimized).
    *   *Powers:* CRUD operations for Parents, Students, Vendors. Cannot alter commissions. Cannot unlock parent-student links without Parent OTP/Approval.
4.  **School Admin (Institutional Level):**
    *   *Access:* School-specific dashboard.
    *   *Powers:* View internal student spend analytics, manage staff, authorize Tier-1 PIN resets (via Parent OTP).
5.  **Vendor (Merchant Level):**
    *   *Access:* POS Interface & Merchant Dashboard.
    *   *Powers:* Process sales, view Z-Reports, initiate withdrawals. 
6.  **Parent / Guardian (Funder Level):**
    *   *Access:* Parent Portal.
    *   *Powers:* (Primary) View full ledger, analytics, reset child PIN, fund wallet, configure No-PIN limits. (Secondary) Only fund wallet.
7.  **Student (End-User):**
    *   *Access:* No web login. Authenticates purely via Physical Static QR Card + 4-Digit PIN at POS.
8.  **Staff / Teacher (Expandable):**
    *   *Access:* Staff Portal.
    *   *Powers:* Receive salary/allowances to wallet, spend at POS, apply for Micro-Loans.

---

## 3. CORE BUSINESS ALGORITHMS & WORKFLOWS

### 3.1 Identity Management & Bulk Upsert Engine
To handle schools with 2,000+ students, Agents/Admins use an intelligent CSV bulk-upload engine.
*   **Data Keys:** 
    *   Students = `school_id` + `admission_number`
    *   Parents = `phone_number` + `nin_number`
*   **Algorithm Execution:**
    1. System parses CSV row.
    2. Checks if Parent Phone exists. If TRUE -> `UPDATE` profile. If FALSE -> `INSERT` new Parent.
    3. Checks if Student Admission No. exists for that School. If TRUE -> `UPDATE` class/details. If FALSE -> `INSERT` new Student, generate `qr_hash`.
    4. Creates record in `parent_student_link` with `is_confirmed = 0`.
    5. Triggers SMS to Parent: *"EduTechMoney: You have been linked to [Student Name]. Log in to confirm."*

### 3.2 Wallet Lifecycle, KYC Limits & Offboarding
Wallets are strictly regulated to comply with local financial laws.
*   **KYC Tiering:**
    *   *Tier 1 (Basic):* Parent provides only Phone Name. Max Wallet Balance: 500,000 UGX.
    *   *Tier 2 (Verified):* Parent provides validated NIN. Max Wallet Balance: 5,000,000 UGX.
*   **Graduation / Dormancy Workflow:**
    *   Upon student graduation, Parent UI unlocks "Transfer to Sibling" or "Withdraw to MoMo" options.
    *   *Dormancy Cron:* A daily script checks `last_transaction_date`. If > 365 days, wallet `status` changes to `DORMANT`. Funds are automatically transferred to the `PLATFORM_ESCROW` wallet to prevent database calculation bloat.

### 3.3 Dynamic POS & Auto-Saving Catalog Workflow
Designed for 5-second checkout times during school breaks.
*   **UI Initialization:** POS queries `vendor_catalog` for top 6 items by `usage_count`. Renders them as massive "Tap Buttons".
*   **Input Handling:** Vendor clicks `[Chapati: 1000]` OR types "Notebook" + "2000" and toggles `[📦 Product]`.
*   **Scan Phase:** POS scans Student QR. Sends to PHP. PHP returns Photo and `no_pin_limit`.
*   **Authorization Phase:**
    *   If total < `no_pin_limit`: Proceeds instantly.
    *   If total > `no_pin_limit`: `jquery-confirm` keypad appears. Student enters 4-digit PIN.
*   **Execution Phase:** PHP verifies PIN, deducts money, executes commission splits, and saves "Notebook" to catalog for future use.

### 3.4 EOD Reconciliation & Time-Bound Refunds
*   **Refund Logic:** Vendor clicks "Transaction History" -> "Refund". System checks `created_at`. If > 24 hours, button is disabled. If < 24 hours, prompts for Vendor Master PIN.
*   **Z-Report Logic:** Vendor clicks "Close Register". Enters Master PIN. System tallies all `SUCCESS` transactions since the last register close. Archives the shift and outputs a read-only receipt (Total Sales, Refunds, Net).

---

## 4. DATABASE INTEGRITY & TRANSACTIONAL ENGINE

### 4.1 The Ledger Logic (Unified Wallets)
A single `wallets` table handles everyone (`owner_type`: 'STUDENT', 'VENDOR', 'SCHOOL', 'PLATFORM', 'STAFF').
*   **ACID Compliance:** All financial movements must be wrapped in `try { $pdo->beginTransaction(); ... $pdo->commit(); } catch { $pdo->rollBack(); }`.
*   **Row-Level Locking:** To prevent double-spending, wallets are locked during reads: `SELECT balance FROM wallets WHERE id = ? FOR UPDATE`.

### 4.2 Dynamic Commission Matrix (`vendor_school_link`)
The backend dynamically splits funds upon purchase.
*   *Example Setup:* Vendor = INDEPENDENT. Platform Fee = 1%. School Fee = 0%. Vendor = 99%.
*   *Execution (10,000 UGX):*
    1. Deduct 10,000 from Student.
    2. Credit 9,900 to Vendor Wallet.
    3. Credit 100 to Platform Wallet.
    4. Write 3 immutable records to the `transactions` table linked by a single `reference_code` (e.g., `TXN-ABC-123`).

---

## 5. IRONCLAD SECURITY ARCHITECTURE

### 5.1 Application-Level Payload Encryption (E2E)
Prevents API manipulation via Browser Network Tabs.
*   **Handshake:** Upon login, PHP sets `$_SESSION['aes_key']` and `$_SESSION['aes_iv']`. Passes them to frontend via encrypted `<meta>` tags.
*   **Outbound (JS -> PHP):** All AJAX requests must use a custom `secureAjax()` wrapper. It uses CryptoJS to encrypt the JSON object. Network tab shows: `payload: "U2FsdGVkX19..."`
*   **Inbound (PHP -> JS):** PHP decrypts, processes, and encrypts the response. CryptoJS decrypts it for the UI.
*   **Anti-Replay:** Payload must include `timestamp: Date.now()`. PHP rejects if timestamp is > 30 seconds old.

### 5.2 Access Control & Authentication
*   **Password Hashing:** Passwords must be hashed using `password_hash()` with `PASSWORD_BCRYPT` or `PASSWORD_ARGON2I`. MD5/SHA1 are strictly forbidden.
*   **Brute-Force Protection:** 5 failed web logins trigger a 15-minute account and IP ban.
*   **Vendor Device Binding:** Vendor POS logins map to a specific Browser Fingerprint / Cookie. Logging into a new device forces an SMS OTP challenge to the Vendor's phone.
*   **Session Management:** 15-minute idle timeout. Sessions are bound to `User-Agent`.

### 5.3 Data Privacy & Auditing (Compliance)
*   **Data Masking:** Only Super/Business Admins see raw data. Schools and Agents see masked data (`+256 77X XXX X12`, `NIN: CM89XXXXXX21`) in their UI tables to prevent mass data theft.
*   **Immutable Audit Logs:** Any change to settings, relationships, or profiles is written to `audit_logs` containing: `user_id`, `action`, `ip_address`, and JSON formats of `old_values` & `new_values`. Specifically tracks School Transfers and Guardian Changes.

---

## 6. COLLECTO GATEWAY INTEGRATION (API POLLING)
**Strict Rule: No Webhooks.** All payment verifications are Server-Initiated Polling.

*   **Money IN (Deposits):**
    1. Parent initiates via UI. PHP creates `transactions` row as `PENDING`.
    2. PHP triggers Collecto API (Collecto Push to MoMo).
    3. UI loader polls PHP every 5 seconds. PHP polls Collecto.
    4. On `SUCCESS`, PHP applies an **Idempotent Lock** (verifies transaction is still `PENDING`), updates status, and credits wallet.
*   **Money OUT (Withdrawals):**
    1. Vendor initiates. PHP **pre-deducts** wallet balance instantly (preventing double withdrawal).
    2. PHP sends Payout API request to Collecto.
    3. Cron Job polls Collecto. If failed (e.g., wrong MoMo number), PHP automatically refunds the Vendor's wallet.
*   **The Orphan Sweeper:** A 5-minute Cron Job `SELECT`s all `PENDING` transactions older than 3 minutes and queries Collecto directly to resolve abandoned sessions. All notifications (SMS) are dispatched natively by Collecto.

---

## 7. EXPANDABLE MODULE: MICRO-LOANS & CREDIT (Phase 1.5)
Governed by a master configuration: `GLOBAL_LOANS_ENABLED = TRUE/FALSE`.

*   **Loan Products Configuration:** Admins define products in `loan_products` (e.g., "Vendor Restock", "Staff Salary Advance"). Variables: Min/Max Amount, Interest Rate (Flat/Amortized), Duration (Days), Target Role.
*   **Credit Scoring Engine:** An automated Cron Job calculates scores.
    *   *Vendors:* Scored on 30-day POS transaction volume.
    *   *Staff:* Scored on HR/School salary inputs.
    *   *Parents:* Scored on historical deposit frequencies.
*   **Disbursement & Auto-Repayment:** 
    *   Approved loans disburse instantly to the internal `wallets`.
    *   *Auto-Sweep Logic:* Vendors with active loans have X% of their daily POS receipts automatically diverted to the `PLATFORM` wallet until the principal + interest is cleared.

---

## 8. FRONTEND UI/UX & COMPONENT STANDARDS
Developers must strictly adhere to the following UI patterns to maintain a uniform, professional experience:
1.  **Responsiveness:** The system is "Mobile-First". Agent, Vendor, and Parent dashboards must work perfectly on 360px width screens (standard cheap Androids).
2.  **Modals & Alerts (`jquery-confirm`):** Native `alert()` or `confirm()` are strictly banned.
    *   *Success:* Green theme, auto-close after 3 seconds.
    *   *Destructive (Delete/Refund):* Red theme, requires explicitly typing "CONFIRM" or a Master PIN.
    *   *Information:* Blue theme.
3.  **Data Tables:** Use DataTables.js with server-side processing for any list exceeding 500 rows (e.g., Student Lists, Ledgers) to prevent browser crashing.
4.  **Loaders:** Every AJAX request must trigger a visual UI block (e.g., overlay spinner) to prevent double-clicking buttons (especially "Pay" or "Submit").

---
**END OF TRD.**
*This architecture ensures EduTechMoney is highly scalable, mathematically immune to double-spending, legally compliant with Ugandan data protection laws, and optimized for high-speed school environments.*
