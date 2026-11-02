# Implementation plan and phase status

## Source-derived plan

The authoritative input is `input/data-model.md`, copied from the supplied `ap_datamodel.md`. Its entities are explicitly a proposed reference domain model, not an existing database design.

1. **Phase 0 — Parse and normalize:** extract business concepts, descriptive attributes, prose relationship assertions, lifecycle, matching rules, operational guidance, metric candidates, and Markdown line provenance. Validate `metadata/model.json` against `metadata/model.schema.json`; emit ambiguity findings.
2. **Phase 1 — Physical model:** require typed, nullability-defined column metadata and approved key/constraint definitions before generating Liquibase. Validate changelogs and generated SQL with Liquibase, then run isolated PostgreSQL integration tests. No external deployment.
3. **Phase 2 — Semantic model:** only consume a Phase 1 validated physical model; require approved grains, currency/status rules, and join cardinalities for Cube measures and joins.
4. **Phase 3 — Ontology:** only consume validated semantic/physical metadata and approved business relationships. Serialize with N3; validate Turtle, mappings, and applicable SHACL data.
5. **Phase 4 — Knowledge base:** load only validated local RDF graphs and expose metadata-only queries without business-record imports.
6. **Phase 5 — MCP discovery:** expose bounded metadata discovery tools and approved SPARQL queries through the knowledge-base service.
7. **Phase 6 — Operations:** document deterministic generation, local-only validation, dependency/tool requirements, and CI checks.

Phases 5–6 are implementation conventions because the request does not define their deliverables. They are not represented as source facts.

## Current gate results

| Phase | Result | Evidence |
|---|---|---|
| 0 | Implemented; runtime validation pending | TypeScript normalizer, JSON Schema, generated metadata, and source-linked ambiguity report |
| 1 | Blocked by source detail and unavailable tooling | No physical types/nullability/keys; Liquibase, PostgreSQL client, and Node.js are not installed |
| 2 | Correctly gated | No validated physical model or approved metric formulas/join cardinalities |
| 3 | Correctly gated | No validated semantic layer or approved formal business relationship contract |
| 4 | Service implementation scaffolded; data loading gated | No validated RDF artifacts; no confidential instance data is loaded |
| 5 | Implemented as a metadata MCP service scaffold | Tools use an empty/local metadata graph and report unavailable artifacts explicitly |
| 6 | Documented | Local-only commands and no production deployment path |

## Safe continuation criteria

Supply a formally approved physical schema (table/column names, database types, nullability, keys, constraints, indexes, and exact relationships), semantic metric definitions (grain, currency and status policies), and approved business ontology concepts/relations. Then install the declared Node.js dependencies, Liquibase, and isolated PostgreSQL test service and rerun the gates in order.
