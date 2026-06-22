MASTER SYSTEM ARCHITECTURE BLUEPRINT: EduTechMoney
Document Version: 2.0 (Next.js / Tailwind / MUI Revision)
Project Name: EduTechMoney (Digital Pocket Money & Micro-Loan System)
Target Market: Ugandan Educational Ecosystem (Primary, Secondary, Tertiary)
Deployment Phases: Phase 1 (Core FinTech & POS) | Phase 1.5 (Micro-Loans)

1. INFRASTRUCTURE & TECHNOLOGY STACK
This revision updates the platform from the legacy PHP/Bootstrap/jQuery stack to a modern React-based frontend.

Server Environment: Linux (Ubuntu 22.04+), or any Node.js-compatible host.
Frontend Framework: Next.js 16 with React 19 and TypeScript.
Styling: Tailwind CSS v4 for utility-first layout plus Material UI v9 for reusable UI components.
Component Library: Material UI for cards, buttons, chips, dialogs, and forms.
Backend/API: Next.js API routes or external Node.js services. MySQL 8.0+ / MariaDB 10.6+ remain recommended.
Auth & Transport: HTTPS, secure cookies or JWT, and API routes for server-side authorization.
Background Jobs: scheduled Node cron jobs or hosted scheduler instead of Linux cron scripts.

2. USER ROLES & PERMISSIONS MATRIX
The business role definitions are unchanged; the new frontend renders role-specific screens and secure API access.

Super Admin (God Mode):
Access: Global dashboard, platform-wide revenue, and audit logs.
Powers: Create Business Admins, toggle global features, and manage commission rules.
Business Admin (Franchise Level):
Access: Regional dashboard.
Powers: Manage schools, agents, and commission matrices.
Agent (Field Operations):
Access: Mobile-first field dashboard.
Powers: CRUD parents, students, and vendors; manage approvals and CSV uploads.
School Admin (Institutional Level):
Access: School dashboard.
Powers: View spend analytics, manage staff, approve PIN resets.
Vendor (Merchant Level):
Access: Vendor POS and merchant dashboard.
Powers: Process sales, review Z-reports, initiate withdrawals.
Parent / Guardian (Funder Level):
Access: Parent portal.
Powers: View ledger, fund wallets, reset child PIN, configure spending limits.
Student (End-User):
Access: No web login. Authenticates using physical QR + PIN at POS.
Staff / Teacher (Expandable):
Access: Staff portal.
Powers: Manage salary/allowances, spend at POS, request loans.

3. CORE BUSINESS ALGORITHMS & WORKFLOWS
The core workflows remain in business logic while the frontend uses modern routes and reusable components.

3.1 Identity Management & Bulk Upsert Engine
This is still the same onboarding workflow for parent/student data.
Data Keys:
Students = school_id + admission_number
Parents = phone_number + nin_number
Algorithm Execution:
1. Parse CSV row.
2. If Parent phone exists, update profile; otherwise insert new parent.
3. If student admission number exists, update details; otherwise insert new student and generate qr_hash.
4. Create parent_student_link with is_confirmed = 0.
5. Notify parent to confirm the link.

3.2 Wallet Lifecycle, KYC Limits & Offboarding
Wallet rules and dormancy logic remain the same.
KYC Tiering:
Tier 1: Phone name only, max balance 500,000 UGX.
Tier 2: Verified NIN, max balance 5,000,000 UGX.
Graduation / Dormancy:
After graduation, parent UI allows transfer to sibling or withdrawal to MoMo.
A scheduled job identifies dormant wallets older than 365 days and moves funds to PLATFORM_ESCROW.

3.3 Dynamic POS & Auto-Saving Catalog Workflow
Vendor POS is now a responsive Material UI screen with quick product cards.
UI Initialization: display top products and quick checkout options.
Input Handling: tap a product or enter a custom item.
Scan Phase: vendor scans student QR and calls a secure API for student info.
Authorization Phase:
If total <= no_pin_limit: complete without PIN.
If total > no_pin_limit: prompt for PIN via secure dialog.
Execution Phase: backend verifies PIN, deducts funds, applies commission splits, and saves product for future use.

3.4 EOD Reconciliation & Time-Bound Refunds
Refund Logic: refunds are allowed within 24 hours, with secure confirmation.
Z-Report Logic: vendor can close register and review total sales, refunds, and net totals.

4. DATABASE INTEGRITY & TRANSACTIONAL ENGINE
4.1 Unified Wallet Ledger
A unified wallets table still tracks all balances by owner_type.
ACID Compliance: use transactional database operations for all financial changes.
Row-Level Locking: use FOR UPDATE or equivalent to prevent race conditions.

4.2 Commission Matrix
The commission split model remains identical.
Example Setup:
Vendor = INDEPENDENT. Platform fee = 1%. School fee = 0%. Vendor receives 99%.
Execution (10,000 UGX):
Deduct 10,000 from student.
Credit 9,900 to vendor.
Credit 100 to platform.
Write immutable transaction records linked by a reference code.

5. SECURITY ARCHITECTURE
5.1 API and Transport Security
Move encryption responsibilities to backend API security.
Use HTTPS for all data transport.
Protect frontend routes with authenticated API calls.

5.2 Access Control & Authentication
Hash passwords with bcrypt/argon2 on the backend.
Enforce failed login throttling and account lockout policies.
Vendor device binding can be implemented through secure session tokens and device metadata.
Session management should enforce idle timeouts and absolute expiration.

5.3 Data Privacy & Auditing
Mask sensitive fields for non-admin roles.
Store audit logs for configuration changes, user access, and financial actions.

6. PAYMENT & GATEWAY POLLING
The gateway integration remains server-side and asynchronous.
Money IN (Deposits):
Parent starts deposit from UI.
Backend creates pending transaction and calls gateway.
Frontend polls status through a secure API endpoint.
Successful payments are completed idempotently by backend.
Money OUT (Withdrawals):
Vendor requests payout.
Backend pre-deducts wallet funds and sends payout request.
Scheduled jobs poll gateway status and resolve pending transactions.
The Orphan Sweeper rechecks stale pending items and reconciles failed sessions.

7. MICRO-LOANS & CREDIT (Phase 1.5)
This module remains expandable with configurable loan products.
Loan product config: min/max amount, interest model, duration, and target role.
Credit scoring uses transaction volume and repayment behavior.
Approved loans disburse to wallets and can auto-repay from future receipts.

8. FRONTEND UI/UX & COMPONENT STANDARDS
The frontend now uses Tailwind + Material UI for a clean, responsive experience.
Responsiveness: mobile-first design for phones and tablets.
Dialogs & Notifications: use MUI dialogs and snackbars, not browser alerts.
Success states: green, auto-dismissed feedback.
Destructive actions: red confirmations with explicit user consent.
Large tables: paginate or virtualize large datasets for performance.
Loaders: show visual loading states for all API operations.

9. IMPLEMENTED SAMPLE SCREENS
The current app includes the following sample pages:
- Home: links to dashboard, vendor, and parent sample screens.
- Dashboard: analytics cards, parent wallet preview, vendor product summary, and recent transaction feed.
- Vendor POS: sample checkout flow with quick product cards and student approval.
- Parent Portal: wallet balance, linked children, and recent activity.

10. SAMPLE DATA
Sample frontend data lives in src/lib/sampleData.ts.
It includes dashboard metrics, vendor product catalog, transaction history, and parent/student wallet summaries.

This scope document now matches the new Next.js/Tailwind/MUI architecture and sample UI screens implemented in the current project.
