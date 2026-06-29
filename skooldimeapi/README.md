# EduTechMoney Modular PHP API (`skooldimeapi`)

Welcome to your newly modularized, object-oriented PHP API! Instead of maintaining all endpoints in a single monolithic `api.php` file, this directory contains separate, cleanly designed classes for each service domain.

---

## 📁 Folder Structure

*   **`Database.php`**: Encapsulates all JSON load/save operations, file checks, unique reference generation (`TXN-`, `REF-`), and audit logs.
*   **`AuthController.php`**: Manages credentials login, system health metrics, and database resets.
*   **`StudentController.php`**: Manages student, school, parent registries, bulk student uploads, PIN resets, budgets, and pocket money transfers.
*   **`POSController.php`**: HandlesPoint of Sale scanning, checkouts with commissions splits, manager refunds, dynamic payment QR codes, and status polling.
*   **`CollectoController.php`**: Simulates MTN/Airtel Mobile Money deposit Collecto pushes, deposit status polling, and payout withdrawals.
*   **`LoansController.php`**: Oversees the loan credit engine, credit scoring, borrow limits, disbursements, and repayments.
*   **`index.php`**: The main Front Controller (Router) that dispatches incoming requests to the respective class controllers.
*   **`.htaccess`**: Automatic URL rewrite rules for Apache servers (WinSCP/cPanel) to enable clean URLs without needing `index.php` in the path.
*   **`db.json`**: Self-contained data persistence file.
*   **`db.template.json`**: Immutable backup used for system resets.

---

## 🚀 How to Deploy on WinSCP

1.  **Open WinSCP** and connect to your server.
2.  Navigate to your public root folder (typically `public_html/skooldime/` or `public_html/`).
3.  Upload the **entire `skooldimeapi` folder** to that location.
4.  Make sure you also upload the **`.htaccess`** file from the root directory to your web server's root directory (or the parent directory of `skooldimeapi`).

---

## 🔗 Solving the "Not Found" (404) Error

If you call `https://mariam.cissytech.com/api/parents` and get a "Not Found" error, it means the web server doesn't know how to translate `/api/...` to your PHP files. 

We have provided **two ways** to resolve this perfectly:

### Method A: With Apache Rewriting (Recommended)
Make sure the `.htaccess` file is uploaded to your server. Under the hood, this line in `.htaccess` forwards `/api/` requests straight into the new modular API:
```apache
RewriteRule ^api/(.*)$ skooldimeapi/index.php [QSA,L]
```
With this, you can call **`https://mariam.cissytech.com/api/parents`** and it will work instantly!

### Method B: Fallback Direct URLs (No Rewriting Required)
If your server has URL rewriting disabled, you can bypass it completely by referencing the router file explicitly in your URLs:
*   **Query String Route**: `https://mariam.cissytech.com/skooldimeapi/index.php?route=/api/parents`
*   **Path Route**: `https://mariam.cissytech.com/skooldimeapi/index.php/api/parents`

The modular router is built to handle all of these formats automatically!

---

## 🔍 How to Verify the API is Working

After uploading via WinSCP, open your web browser or Postman and visit the health check endpoint:

`https://mariam.cissytech.com/api/health`
*(or `https://mariam.cissytech.com/skooldimeapi/index.php/api/health`)*

If working, it will return:
```json
{
  "status": "healthy",
  "platform": "EduTechMoney",
  "timestamp": "2026-06-26T12:00:00+00:00"
}
```

---

## 🛠️ Diagnostics & Troubleshooting
*   **File Permissions**: Ensure that `db.json` has **Write permissions** enabled (e.g. `chmod 664` or `775` in WinSCP) so the API can save data and transactions.
*   **PHP Version**: The classes are fully compatible with PHP 7.4, 8.0, 8.1, 8.2, and 8.3+.
