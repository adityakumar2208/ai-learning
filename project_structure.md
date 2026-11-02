# Project structure and usage

This document explains the repository layout, the source-to-knowledge-base workflow, and the current state of each phase.

## Repository layout

```text
ai-learning/
├── input/
│   └── data-model.md
├── metadata/
│   ├── model.json
│   └── model.schema.json
├── src/
│   ├── cli.ts
│   ├── normalize.ts
│   ├── schema.ts
│   ├── knowledge/
│   │   └── KnowledgeBase.ts
│   └── mcp/
│       └── server.ts
├── test/
│   ├── knowledge.test.ts
│   └── normalize.test.ts
├── reports/
│   ├── ambiguities.md
│   ├── implementation-plan.md
│   ├── ontology-validation.md
│   ├── schema-validation.md
│   └── semantic-validation.md
├── ap_datamodel.md
├── architecture.excalidraw
├── package.json
├── tsconfig.json
└── README.md
```

## Source data model

- [`input/data-model.md`](input/data-model.md) is the pipeline's authoritative Markdown input. It was copied from [`ap_datamodel.md`](ap_datamodel.md), which remains in the repository as the original source file.
- The source describes a **proposed AP reference business model**, not an existing database schema. Its entity attributes are descriptive; they are not complete physical column definitions.
- Update the input Markdown when the specification changes, then rerun Phase 0. Review the regenerated metadata and ambiguity report rather than hand-editing generated facts.
- [`architecture.excalidraw`](architecture.excalidraw) is the architecture diagram. It is not parsed as schema input.

## Normalized metadata

- [`metadata/model.json`](metadata/model.json) is generated from the Markdown. It contains source-grounded business entities, attribute candidates, prose assertions, stable identifiers, source section and line references, a SHA-256 source digest, and a physical-readiness gate.
- [`metadata/model.schema.json`](metadata/model.schema.json) defines the JSON Schema 2020-12 contract. It requires source provenance and keeps physical objects empty while the physical gate is blocked.
- Treat `metadata/model.json` as generated output. The Markdown is authoritative; do not make manual changes to the JSON as a substitute for updating the source.

## TypeScript modules

- [`src/normalize.ts`](src/normalize.ts) parses the documented entity-table format and preserves other Markdown content as source assertions. It deliberately does not convert descriptive attributes or relationship prose into columns or foreign keys.
- [`src/schema.ts`](src/schema.ts) validates normalized values with Ajv against the JSON Schema.
- [`src/cli.ts`](src/cli.ts) is the command-line entry point. It normalizes and writes the model and ambiguity report, checks reproducibility, and stops physical, semantic, and ontology generation when their prerequisites are absent.
- [`src/knowledge/KnowledgeBase.ts`](src/knowledge/KnowledgeBase.ts) loads the validated metadata catalog and provides business-term search, entity lookup, source relationship assertions, metric candidates, and gated RDF/SPARQL access.
- [`src/mcp/server.ts`](src/mcp/server.ts) publishes metadata discovery tools over the MCP stdio transport. It does not import business records. Metric results are unapproved candidates, and SPARQL is restricted to fixed query IDs.

## Reports and tests

- [`reports/ambiguities.md`](reports/ambiguities.md) records unresolved source details and why they block downstream generation.
- [`reports/implementation-plan.md`](reports/implementation-plan.md) describes the phase order, gates, and safe continuation criteria.
- [`reports/schema-validation.md`](reports/schema-validation.md), [`reports/semantic-validation.md`](reports/semantic-validation.md), and [`reports/ontology-validation.md`](reports/ontology-validation.md) record the current status of their respective gates.
- [`test/normalize.test.ts`](test/normalize.test.ts) tests source extraction, provenance, stable identifiers, and fail-closed behavior.
- [`test/knowledge.test.ts`](test/knowledge.test.ts) tests metadata lookup and verifies SPARQL remains unavailable until the ontology gate passes.

## Package and TypeScript configuration

- [`package.json`](package.json) defines scripts and pinned top-level Node.js dependencies: Ajv, Liquibase-independent metadata libraries, N3, Comunica, the SHACL validator, YAML, and the MCP SDK.
- [`tsconfig.json`](tsconfig.json) enables strict TypeScript checking and Node's native TypeScript import conventions.
- [`.gitignore`](.gitignore) excludes installed dependencies, environment files, and coverage output.
- [`README.md`](README.md) provides the short setup and phase overview.

## Run the available workflow

Use Node.js 24.3 or later and npm. From the repository root:

```powershell
npm install
npm run phase0
npm test
npm run validate
```

`npm run phase0` regenerates `metadata/model.json` and `reports/ambiguities.md`. `npm test` runs the focused tests. `npm run validate` checks the stored model against the current source, its schema, and deterministic normalization. The repository currently has no lockfile, so `npm install` resolves the pinned top-level dependencies and creates one.

The following commands are deliberately gated until approved upstream artifacts exist:

```powershell
npm run phase1
npm run semantic
npm run ontology
```

Phase 1 reports the missing physical specification and does not create or apply a migration. Phases 2 and 3 similarly stop rather than generating unsupported Cube or ontology artifacts.

To start the metadata-only MCP server after installing dependencies:

```powershell
npm run mcp
```

The server uses stdio for MCP communication. Configure it as an stdio MCP server in the client that will consume it. It can answer metadata questions without PostgreSQL; it does not load confidential records or execute arbitrary SPARQL.

## How Liquibase fits into this project

Liquibase manages **physical database changesets**; it does not directly convert this descriptive Markdown or the current `metadata/model.json` into a safe, approved database schema.

The intended pipeline is:

```text
input/data-model.md
        │
        ▼
Phase 0: metadata/model.json + JSON Schema validation
        │  physical gate must pass first
        ▼
approved physical metadata
        │
        ▼
Liquibase changelogs → validate → updateSQL → isolated PostgreSQL integration test
```

The physical metadata must first be approved and specify, at minimum:

- Physical table and column names.
- PostgreSQL data types and nullability.
- Primary keys and exact foreign-key columns.
- Relationship cardinality and optionality.
- Approved unique/check constraints and justified indexes.
- Schema naming and ownership decisions.

The source Markdown does not currently define these details. They are listed in [`reports/ambiguities.md`](reports/ambiguities.md); choosing them requires a domain-owner decision, not an automatic conversion.

Once that input is approved, the planned Liquibase artifacts are:

```text
database/
├── changelog/
│   ├── db.changelog-master.yaml
│   └── changes/
└── schema.sql
```

Those paths are **planned outputs and do not exist yet**. A future generator should produce versioned, reviewable changesets from approved physical metadata, add them to the master changelog, and produce a PostgreSQL schema snapshot. It should not execute changes against any external environment.

For a future **local-only** PostgreSQL validation, after the changelog has actually been generated and PostgreSQL plus the Liquibase PostgreSQL JDBC driver are installed, the usual review sequence is:

```powershell
liquibase --changelog-file=database/changelog/db.changelog-master.yaml validate
liquibase --changelog-file=database/changelog/db.changelog-master.yaml updateSQL
```

Supply a local JDBC URL and credentials through a protected local configuration or environment variables according to your Liquibase installation. Review the generated SQL, then run migrations only against a disposable, isolated local test database as part of the integration test. `updateSQL` previews SQL; it does not apply the changes. Do not point these commands at production or another external environment without explicit authorization.

At present, there is no Liquibase changelog, no generated `schema.sql`, and no PostgreSQL integration test because the physical-model gate is blocked. Installing Liquibase alone does not resolve missing schema decisions.

## Later semantic and ontology layers

- **Cube semantic model (Phase 2):** will map approved business concepts to validated physical tables and columns. Measures require owner-approved formulas, grain, currency handling, and status rules; joins require approved cardinalities and fan-out review. Outputs belong under `semantic/cube/`, with glossary, physical mappings, and a validation report. These generated artifacts do not exist yet.
- **Business ontology (Phase 3):** will keep business concepts separate from technical schema metadata and mappings. N3.js will parse/serialize Turtle; SHACL will validate applicable shapes against representative data. OWL statements must reflect approved business rules, not be inferred just from table names. Outputs belong under `ontology/`, with a validation report. These generated artifacts do not exist yet.
- **Knowledge base (Phase 4):** Comunica will query local RDF graphs after the ontology validation gate passes. The current service supports source metadata discovery; graph-backed SPARQL remains disabled until all required Turtle artifacts are present and the ontology validation report records a pass.

## Current limitations

The source does not define physical column types, nullability, keys, exact foreign-key relationships, approved metric formulas, complete join cardinalities, or formal ontology axioms. Do not interpret descriptive attribute names or candidate measures as approval to create a schema or business definition. Local validation also requires Node.js and npm; Liquibase/PostgreSQL checks additionally require the corresponding local tools and an isolated test database.
