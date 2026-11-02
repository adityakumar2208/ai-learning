# Unresolved source definitions

1. Organization: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:9bfac0b66db09d1bf7abdcf1).
2. Supplier: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:484268df9aafef3a788011ae).
3. SupplierLocation: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:4e4bed8baca79f2c34a09adf).
4. Invoice: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:01e7772c9c71619eabdb5020).
5. InvoiceLine: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:32c92e4f0a1fca8d20202e00).
6. Document: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:3bd33691f1f382b659a00314).
7. ExtractionRun: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:c168edef733107b1ac9887e0).
8. ExtractedField: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:0113c53e8e5ed9b584c681a8).
9. PurchaseOrder: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:a73d6cbc66fb08e346d83454).
10. PurchaseOrderLine: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:135d8840b60f17e91e850936).
11. Receipt: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:00b992ecc500131286994695).
12. Approval: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:97299513edee5e9f790b1d40).
13. Payment: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:11848edc7c9eed60cb295137).
14. PaymentAllocation: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:a3583b7135b6ab41395a15db).
15. JournalEntry: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:6496df68d6ae1fa43816dcf6).
16. AuditEvent: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source fact:9e2b5ad7f7d46e92435d9c44).
17. Narrative attributes are candidate business attributes, not approved physical columns. Commas and slash-separated terms require review.
18. Relationships are preserved verbatim; foreign-key placement, optionality and complete cardinalities are not fully specified.
19. Lifecycle states are illustrative and policy-dependent; do not generate a closed enumeration or transition constraints.
20. Invoice total, open balance, approval duration and payment amount lack complete approved currency, status, grain and aggregation rules.
21. Ownership and sensitivity guidance lacks an exhaustive per-object classification or enforceable access policy.
22. No ontology namespace owner, versioning policy, approved synonyms, class hierarchy or representative instance dataset is specified.
23. Execution strategy names Phases 5 and 6, but only Phases 0–4 are defined. MCP transport, authentication and deployment requirements are unspecified.
