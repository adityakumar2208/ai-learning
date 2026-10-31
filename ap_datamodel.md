# AP Automation Data Model

## Purpose and scope

This document describes a **reference data model** for accounts payable (AP) automation: capturing supplier invoices, validating them against purchasing and receipt records, routing approvals, and recording payments and accounting outcomes. The workspace currently contains an architecture diagram that names a data model, semantic model, ontology, and knowledge graph, but no AP-specific implementation or schema. The entities below are therefore a proposed domain model, not a description of existing application tables.

The model separates business records from files, extracted values, workflow history, and integration events. This supports traceability from an original invoice through review and payment.

## Core entities

| Entity | Purpose | Important attributes |
|---|---|---|
| **Organization** | Tenant or legal entity that owns AP records. | `organization_id`, legal name, base currency, locale |
| **Supplier** | Supplier master record used to identify and pay an invoice issuer. | `supplier_id`, organization, name, normalized tax identifiers, status, default payment terms |
| **SupplierLocation** | Supplier remit-to, ordering, or tax location. | `location_id`, `supplier_id`, address, remit-to details, currency |
| **Invoice** | AP document header and current business state. | `invoice_id`, organization, supplier, invoice number, invoice date, due date, currency, subtotal, tax, shipping, total, status, source document |
| **InvoiceLine** | Goods or services billed on an invoice. | `line_id`, `invoice_id`, description, quantity, unit price, line amount, tax, purchase-order line reference, accounting dimensions |
| **Document** | Original file or supporting evidence, stored separately from business data. | `document_id`, storage reference, file name, media type, checksum, upload time, source |
| **ExtractionRun** | Record of an OCR or AI extraction attempt. | `run_id`, `document_id`, model/version, started/completed time, outcome |
| **ExtractedField** | A captured value with provenance and review status. | `field_id`, `run_id`, field name, raw and normalized values, page/location, confidence, reviewer decision |
| **PurchaseOrder** | Authorized purchase commitment, where applicable. | `po_id`, organization, supplier, PO number, currency, status, total |
| **PurchaseOrderLine** | Item or service authorized on a PO. | `po_line_id`, `po_id`, description, quantity, unit price, amount, accounting dimensions |
| **Receipt** | Evidence that ordered goods or services were received. | `receipt_id`, `po_line_id`, received quantity or amount, received date, reference |
| **Approval** | Approval policy result or decision for an invoice. | `approval_id`, `invoice_id`, approver, step, decision, decision time, comments |
| **Payment** | Payment instruction and its lifecycle. | `payment_id`, organization, payment date, currency, amount, method, reference, status |
| **PaymentAllocation** | Amount of a payment applied to an invoice. | `payment_id`, `invoice_id`, applied amount |
| **JournalEntry** | Posted accounting result, often synchronized with a general ledger. | `entry_id`, invoice or payment reference, accounting period, external reference, posting status |
| **AuditEvent** | Append-only record of important changes and actions. | `event_id`, entity type and ID, actor, action, timestamp, changed fields, correlation ID |

## Relationships

- An **Organization** owns suppliers, invoices, purchase orders, approvals, payments, and accounting records. Tenant-owned records should carry an organization identifier.
- A **Supplier** can have multiple locations and invoices. An invoice belongs to one supplier and may reference a supplier location.
- An **Invoice** has one or more invoice lines and may be supported by multiple documents. A document can have multiple extraction runs; each run can yield multiple extracted fields.
- An invoice line can optionally reference a purchase-order line. A PO can have multiple lines, and a PO line can have multiple receipts.
- An invoice can have multiple approval decisions and can be paid by one or more payments. A payment can cover multiple invoices, represented by payment allocations.
- An invoice or payment can be associated with one or more journal entries, depending on accounting and posting policy.
- Audit events reference the affected business entity without replacing its current state.

## Invoice lifecycle

A typical lifecycle is:

`received → extracting → needs_review → validated → pending_approval → approved → scheduled_for_payment → partially_paid / paid`

An invoice may instead move to `rejected`, `on_hold`, or `void`. Exact states and transition rules depend on the organization's policy. Record transitions and decisions in workflow/audit history; do not rely only on a mutable status field to explain how a record reached its current state.

## Validation and matching

1. **Supplier identification:** Match supplier details from the invoice to an active supplier record. Preserve the observed value and the selected supplier link for review.
2. **Duplicate detection:** Check likely duplicates using organization, supplier, normalized invoice number, invoice date, currency, and amount. Treat this as a review signal rather than assuming any one field is globally unique.
3. **Arithmetic checks:** Verify line extensions and compare the sum of lines, taxes, and charges with the invoice header total, allowing only configured rounding tolerances.
4. **PO matching:** When a PO exists, compare supplier, currency, quantities, prices, and amounts between invoice lines and PO lines.
5. **Receipt matching:** Where receiving is required, compare invoiced quantities or amounts with recorded receipts. Capture exceptions and tolerances explicitly.
6. **Accounting and policy checks:** Validate tax treatment, accounting dimensions, approval thresholds, and payment terms before approval or posting.

Store match outcomes and exceptions with the invoice or line, including the rule, compared values, tolerance, and result. This makes automated decisions explainable and reviewable.

## Data integrity and operational guidance

- Use stable internal IDs; keep supplier invoice numbers and external PO/payment references as business identifiers, not database primary keys.
- Scope uniqueness and duplicate checks to the organization and supplier as appropriate. Normalize identifiers for comparison while retaining the original document value.
- Use decimal types for monetary amounts and an explicit ISO currency code. Never combine amounts in different currencies without recording the conversion rate, date, and source.
- Keep extracted values, normalized values, confidence, source document location, and human corrections distinct. A corrected value should not erase the original extraction.
- Preserve the original invoice file and its checksum. Restrict access to documents and sensitive supplier, tax, bank, and payment data according to role and retention policy.
- Record who or what changed business data, when it changed, and why. Use idempotency or external references for integrations to avoid duplicate imports, postings, or payments.
- Store payment credentials or bank account details only in an appropriately protected payment/vendor system; reference them by a secure token where possible.

## Semantic model and ontology mapping

For analytics or an AI-facing semantic layer, expose consistent business concepts such as **Supplier**, **Invoice**, **Invoice Line**, **Purchase Order**, **Receipt**, **Approval**, and **Payment** with their relationships and canonical meanings. Define measures such as invoice total, open balance, approval duration, and payment amount with explicit currency and status rules. Preserve links back to source records and documents so that summaries, search, or knowledge-graph relationships can be grounded and audited.
