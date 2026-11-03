# Product Truth: Cenvora

## Purpose & Mechanism
Cenvora is a comprehensive, production-grade business operating system and ERP tailored specifically for Indian SMEs, enterprises, traders, manufacturers, and service providers. It simplifies complex business management—invoicing, inventory tracking, GST compliance (GSTR-1, GSTR-3B, e-Way bills), double-entry financial ledger accounting, purchase order lifecycles, and HRMS payroll management—into an intuitive, bulletproof, and tactile platform.

## Primary Users & Operating Scenes
1. **Business Owners & Managing Directors**: High-level daily overview of revenue, pending receivables, sales trends, cash-flow liquidity, and business health KPIs.
2. **Accountants & Tax Professionals**: Rapid transaction entry, reconciliation, debit/credit journal vouchers, trial balance auditing, GST filings, and batch approvals. High-density, keyboard-driven operation.
3. **Inventory & Warehouse Managers**: Stock tracking across multiple godowns/warehouses, batch splitting, barcode scanning, stock journals, wastage reporting, and dispatch challans.
4. **Sales & Procurement Executives**: Generating quotations, converting quotes to sales orders, creating delivery challans, issuing tax invoices, recording vendor purchases, and tracking payment receipts.
5. **HR & Payroll Administrators**: Employee records, salary revisions, monthly payroll processing, attendance logs, and statutory deductions.

## Core Workflows
- **Sales & Trade**: Quotation → Sales Order → Delivery Challan → Tax Invoice → Payment Receipt / Credit Note.
- **Procurement**: Purchase Order → Purchase Bill → Vendor Payment / Debit Note.
- **Inventory & Logistics**: Item Cataloging → Multi-Warehouse Stock Adjustments → Batch/Lot Tracking → Stock Journal Reconciliations.
- **Financial Accounting**: Double-entry Journal Entries → General Ledger Accounts → Real-Time Trial Balance → P&L and Balance Sheet Reports.
- **Tax & Compliance**: GSTIN validation, HSN/SAC classification, CGST/SGST/IGST computation, reverse charge handling, and export reporting.
- **Human Resources**: Employee Lifecycle → Attendance & Leaves → Payroll Run → Payslip Generation.

## Platform & Tech Stack
- **Architecture**: Single Page Web Application with Progressive Web App (PWA) capabilities.
- **Frontend Stack**: React 19, Vite, Tailwind CSS, TanStack Query v5, Heroicons, Framer Motion.
- **Backend Architecture**: Django REST Framework (DRF), PostgreSQL, Redis queueing.
- **Target Environments**: Modern Desktop Browsers (Chrome, Edge, Safari, Firefox), Tablet POS, and Mobile Web/PWA.

## Business & Compliance Constraints
- **Zero Calculation Error Tolerance**: Financial round-offs, line-item tax calculations, and discount deductions must match statutory Indian accounting rules.
- **Transaction Safety**: Double-submission prevention, immutable finalized accounting ledgers, and draft recovery against accidental window closures or token expiration.
- **Audit Traceability**: Every deletion, adjustment, or invoice state change must preserve audit logs.

## Voice & Non-Negotiables
- **Authoritative & Trustworthy**: No playful gamification, no gimmicky animations. Cenvora handles people's real money and tax liabilities.
- **Direct & Uncluttered**: Information is presented with crystal clarity. Status is always unmistakable.
- **Speed & Continuity**: Zero layout shift during typing; fast keyboard traversal across form inputs (`Tab`, `Enter`, `Cmd+K`).
