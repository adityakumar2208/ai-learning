# AP metadata knowledge base

This repository starts from [`input/data-model.md`](input/data-model.md), a proposed AP reference model. It does **not** describe an existing physical database. The pipeline preserves source provenance and stops before generating unsupported schema, Cube, or ontology artifacts.

## Requirements

- Node.js 24.3 or later (native TypeScript type stripping)
- npm
- Liquibase and PostgreSQL are required only after approved physical metadata is supplied

Install the exact top-level dependencies with `npm install`, then run:

```text
npm run phase0
npm test
npm run validate
npm run phase1
```

Phase 0 writes the deterministic normalized model to `metadata/model.json` and source-derived blockers to `reports/ambiguities.md`. `npm run validate` checks the JSON Schema, Markdown source hash, provenance, and deterministic normalization. Phase 1 is expected to stop with a clear blocker until explicit physical table/column types, nullability, keys, constraints, and relationship details are approved. No migration is applied by these commands.

The MCP service can expose source-grounded business metadata without a database connection:

```text
npm run mcp
```

It does not load confidential records. The physical-schema and semantic-lineage tools report blockers, metric results are explicitly unapproved candidates, and SPARQL is disabled until all locally validated Turtle graphs exist. SPARQL is restricted to fixed read-only query IDs; arbitrary query text is not accepted.

## Phase gates

| Phase | Current state |
|---|---|
| 0 — Markdown normalization | Implemented; validate locally with Node.js |
| 1 — Liquibase/PostgreSQL physical model | Blocked by missing source definitions and local tools |
| 2 — Cube semantic model | Blocked until Phase 1 and approved metric/join rules |
| 3 — RDF/OWL/SHACL ontology | Blocked until physical and semantic gates pass |
| 4 — Comunica knowledge base | Source metadata tools available; RDF graph queries gated |
| 5 — MCP discovery | Metadata-only MCP server implemented |
| 6 — Operations | Local-only workflow documented; production deployment is out of scope |

The requested specification defines Phases 0–4; Phases 5–6 above are delivery conventions for the requested MCP and operational workflow.