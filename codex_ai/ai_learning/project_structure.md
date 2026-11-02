# Project structure and usage

This project is intended to turn a Markdown data model into a physical database model, a Cube semantic model, and a queryable business ontology. Currently, only a partial Markdown normalization foundation is implemented. Database generation, Cube, RDF, SHACL, Comunica and MCP are planned work.

## How the layers connect

```text
input/data-model.md                 Authoritative working specification
        |
        v
metadata/model.json                Normalized source facts and entity candidates
        |                          Gate: validated, complete physical definitions
        v
[planned] database/                Liquibase migrations and physical schema
        |                          Gate: real local migration tests pass
        v
[planned] semantic/                Cube definitions, glossary and mappings
        |                          Gate: Cube compilation and query tests pass
        v
[planned] ontology/                Business ontology, technical graphs and SHACL
        |                          Gate: RDF, mapping and SHACL checks pass
        v
[planned] knowledge base + MCP      Metadata discovery and traceable queries
```

The arrows describe the required implementation order. They do not mean the current program generates all these layers.

## Existing folders and files

```text
ai_learning/
|-- ap_datamodel.md
|-- architecture.excalidraw
|-- README.md
|-- project_structure.md
|-- package.json
|-- .gitignore
|-- input/
|   `-- data-model.md
|-- metadata/
|   |-- create-schema.mjs
|   |-- model.schema.json
|   `-- model.json
|-- src/
|   |-- normalize.ts
|   |-- schema-validator.ts
|   `-- pipeline.ts
|-- tests/
|   `-- normalize.test.ts
`-- reports/
    |-- implementation-plan.md
    |-- ambiguities.md
    |-- phase-0.md
    `-- validation-status.md
```

| File or folder | Purpose | How to use it |
|---|---|---|
| `ap_datamodel.md` | Original supplied AP business model. It describes proposed entities, attributes, relationships and operational guidance. | Keep as the original reference. The program does not read it directly. |
| `architecture.excalidraw` | Existing architecture diagram asset. | Open in a compatible Excalidraw editor. It is not parsed by the pipeline. |
| `input/data-model.md` | Working Markdown specification read by the normalizer. Initially copied byte-for-byte from the original. | Edit this file deliberately when refining the specification, then regenerate metadata. It is the runtime source of truth. |
| `metadata/` | Machine-readable intermediate representation and its structural contract. | Inspect the generated model here; do not use it as a Liquibase changelog. |
| `metadata/model.json` | Generated source hash, section inventory, source facts, proposed business entities, physical-readiness flag and ambiguities. | Use for inspecting extracted information and tracing entities to the Markdown. Regeneration overwrites this file. |
| `metadata/model.schema.json` | JSON Schema describing the current intermediate representation. | Used during normalization to reject structurally invalid metadata. Its current contract accepts only a non-ready physical model. |
| `metadata/create-schema.mjs` | Helper that writes `model.schema.json`. | If you change the schema definition in this helper, run `node metadata/create-schema.mjs`, then rerun normalization and tests. Keep the helper and generated schema aligned. |
| `src/normalize.ts` | Reads the working Markdown, extracts the documented entity-table format, preserves source fragments and validates the result. | Run `node src/normalize.ts` from the repository root. It writes metadata and Phase 0 reports. |
| `src/schema-validator.ts` | Offline validator for the JSON Schema vocabulary used by this project. | Imported by normalization and tests. It rejects unsupported keywords; it is not a general-purpose implementation of every JSON Schema feature. |
| `src/pipeline.ts` | Current entry point for enforcing the first generation gate. | Run `node src/pipeline.ts`. It builds metadata and deliberately stops before physical generation. |
| `tests/normalize.test.ts` | Tests entity extraction, source line provenance, deterministic output, stable entity identifiers and validation rejection. | Run `node --test tests/normalize.test.ts`. These are not database or ontology integration tests. |
| `reports/implementation-plan.md` | Ordered roadmap and the acceptance gates for future phases. | Read before implementing a downstream layer. |
| `reports/ambiguities.md` | Generated list of unresolved source definitions and requirements. | Use as the checklist for enriching the authoritative specification. Regeneration overwrites it; put lasting decisions in the source or a separate decision record. |
| `reports/phase-0.md` | Generated summary of the latest normalization run. | Check source hash, entity/fact counts and current physical-readiness status. |
| `reports/validation-status.md` | Manually maintained record of checks performed, missing dependencies and implementation limits. | Update when additional checks or phases are actually completed. It is not automatically refreshed by the pipeline. |
| `package.json` | Node.js requirements and convenience script definitions. | Requires Node.js 22.18 or later. npm is optional for the current direct Node commands. |
| `.gitignore` | Excludes dependencies, environment secrets and coverage output from version control. | Keep credentials out of tracked files. |
| `README.md` | Short introduction and current execution commands. | Start here for a quick overview. |

## Where is the data model?

There are three distinct meanings of data model in this project:

1. **Business specification:** `input/data-model.md`. This is the editable source describing the AP domain.
2. **Normalized intermediate model:** `metadata/model.json`. This is generated from the source and validated against `metadata/model.schema.json`.
3. **Physical database model:** not implemented yet. It will live under `database/` after the specification supplies enough approved physical detail.

The current metadata contains:

| Field | Meaning |
|---|---|
| `version` | Version of this intermediate representation. |
| `source` | Input file path and SHA-256 hash of its contents. |
| `sections` | Markdown headings and their line numbers. |
| `facts` | Nonempty source fragments, each with an identifier, section, line number and original text. |
| `entities` | Business entity candidates, descriptions, candidate attribute phrases and a reference to their source fact. |
| `physicalTables` | Empty in the current implementation: no approved physical schema has been extracted. |
| `physicalReady` | Always false under the current schema and normalizer. |
| `ambiguities` | Missing definitions and other unresolved requirements. |

`facts[].status = explicit` means the text appears in the supplied source. It does not mean every statement is an approved implementation rule. Entity status is separately recorded as `proposed-in-source`.

Entity identifiers derive from normalized entity names. Fact identifiers derive from the section and source text. Moving an entity down by inserting unrelated lines does not change its entity identifier; renaming it can. Source line numbers locate the fact in the exact input version recorded by the source hash.

The parser currently recognizes the supplied business-entity table format. Relationships, lifecycle guidance, metrics, ownership and sensitivity are preserved as text fragments. They are not yet normalized into structured, executable definitions. Changing the Markdown to a different table dialect may require parser changes.

## Using the model with Liquibase

**You cannot pass `metadata/model.json` or the Markdown directly to Liquibase.** A generator must first translate approved physical metadata into Liquibase changesets. That generator does not exist yet.

Before implementing it, document the following explicitly in the source:

- Target database and schema, table names and column names.
- Complete database-specific column types, including monetary precision and scale.
- Nullability, defaults and primary keys.
- Foreign-key endpoints, relationship optionality and cardinality.
- Approved unique/check constraints and justified indexes.
- Migration and rollback expectations.

The normalizer and its JSON Schema must then be extended to represent and validate those definitions. Adding more prose alone does not make the current parser understand physical column definitions. Setting `physicalReady` manually also does not enable generation: the schema rejects it, and the pipeline has no physical generator.

The planned physical outputs are:

```text
[planned] database/
|-- changelog/
|   |-- db.changelog-master.yaml    Entry point that includes ordered changes
|   `-- changes/                   Versioned Liquibase changesets
`-- schema.sql                     SQL representation for review

[planned] reports/schema-validation.md
```

Once implemented, the local workflow should be:

1. Regenerate and validate complete physical metadata.
2. Generate deterministic Liquibase changelogs with source mappings.
3. Install/configure Liquibase and an isolated local PostgreSQL database.
4. Run Liquibase validation and SQL preview (`validate` and `updateSQL`, as required by the project specification).
5. Review the SQL, then apply migrations only to the isolated local database.
6. Test the resulting schema, repeat application and rollback behavior.
7. Record the actual results before generating the semantic model.

There is currently no Liquibase configuration, JDBC connection setup, PostgreSQL container configuration or migration integration harness. Do not try to run the planned changelog path yet. The initial environment check found no Liquibase/Java/psql on PATH, and Docker's engine was unavailable; recheck these when starting Phase 1.

## Planned semantic layer: Cube

After physical validation, the semantic generator will read validated physical metadata and mappings. It should not invent tables from business entity names.

| Planned artifact | Purpose |
|---|---|
| `semantic/cube/` | Native Cube YAML definitions for approved entities, dimensions, time dimensions, measures and joins. |
| `semantic/business-glossary.yaml` | Human-facing terms, descriptions and explicitly supported synonyms. |
| `semantic/physical-mappings.yaml` | Links from semantic objects to approved physical tables and columns. |
| `reports/semantic-validation.md` | Actual Cube compilation and representative query results, plus unresolved joins or fan-out risks. |

To use this layer, a future implementation must configure Cube, compile its generated definitions and query approved sample data. Parsing YAML alone is insufficient. Metrics need explicit grain, aggregation, currency and status rules before approval. None of these artifacts or runtime integrations currently exists.

## Planned ontology layer: RDF, OWL and SHACL

Ontology generation follows the validated semantic layer. It should express business concepts separately from database implementation details.

| Planned artifact | Purpose |
|---|---|
| `ontology/business.ttl` | Business classes, meaningful relationships, labels and justified OWL/RDFS statements. |
| `ontology/technical-metadata.ttl` | Technical descriptions of physical schema objects. |
| `ontology/mappings.ttl` | Business-to-semantic-to-physical links and source provenance. |
| `ontology/shapes.ttl` | SHACL structural and data-quality constraints supported by the specification. |
| `reports/ontology-validation.md` | Turtle parsing, reference integrity, mapping completeness and real SHACL validation results. |

N3.js is the required RDF parser/serializer. A SHACL engine and approved representative RDF fixtures are still needed. Stable versioned ontology IRIs must be agreed before generation. Valid Turtle does not establish business correctness, and SHACL checks do not establish OWL logical consistency.

These files and dependencies are not implemented or installed by this repository yet.

## Planned knowledge base and MCP access

The intended knowledge base will load RDF into local RDF/JS-compatible storage and use Comunica for SPARQL. Separate named graphs will distinguish business ontology, technical schema, semantic metadata, mappings/provenance and optional business instances.

Its intended query methods include entity lookup, relationship traversal, business-term search, physical-schema lookup, metric lookup, semantic-to-physical lineage, ontology-class lookup and approved SPARQL querying. Metadata-only questions should work without connecting to PostgreSQL.

An MCP interface will expose these discovery functions to clients and return traceable answers with source references. No query-service module path, MCP server, transport, authentication setup or client configuration exists yet. There is currently no server command to start. Confidential business records must not be imported automatically.

The original request refers to Phases 5 and 6 without defining them. Their scope remains an open requirement; the implementation plan does not assume invented phase definitions.

## What you can run today

Run from the repository root:

```powershell
# Regenerate metadata, ambiguity report and Phase 0 summary.
node src/normalize.ts

# Verify the current normalization behavior.
node --test tests/normalize.test.ts

# Exercise the generation gate; this intentionally stops before Phase 1.
node src/pipeline.ts
```

With npm installed, the corresponding convenience commands are `npm run build:metadata`, `npm test` and `npm run pipeline`.

A successful normalization run means the current intermediate representation satisfies its structural contract. It does not mean the source contains enough information for a database schema. The next implementation step is to complete structured normalization and resolve the physical specification gaps in `reports/ambiguities.md`.
