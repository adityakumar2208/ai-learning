# Implementation plan and gates

## Source inspection

The authoritative supplied document is ap_datamodel.md, copied unchanged to input/data-model.md. It describes 16 proposed business entities with narrative attributes. It does not supply complete SQL column definitions or approved metric logic. Source-proposed definitions retain that status; explicit source text is not approval to invent implementation details.

## Ordered implementation

0. Complete normalization: current foundation captures source fragments and business entity candidates with deterministic IDs, source hash, sections and line references. Extend structured extraction for relationships, rules, enumerations, ownership, sensitivity and metric candidates. Resolve or explicitly block unsupported constructs. Validate the expanded JSON Schema and provenance/reference integrity.
1. Physical model: obtain explicit table and column identifiers, SQL types, nullability, keys, constraints and approved relationship mappings. Generate deterministic Liquibase changes, rollback strategy and SQL documentation. Require Liquibase validate/updateSQL and isolated PostgreSQL migration, repeat-apply and rollback integration checks. Do not generate Phase 2 until these pass.
2. Semantic model: generate native Cube YAML from validated physical mappings. Require approved dimensions, aggregation/grain/currency/status rules and join cardinalities; detect fan-out. Use Cube's actual compiler and representative query execution. Catalog synonyms and access annotations separately. Block unresolved definitions.
3. Ontology: generate business classes and justified properties separately from technical metadata using N3.js. Use an approved versioned IRI policy. Generate provenance/mapping graphs and SHACL shapes. Validate RDF syntax, references, cross-layer coverage and SHACL against explicitly nonconfidential fixtures, including negative fixtures. Do not claim reasoning or OWL consistency without an actual reasoner.
4. Knowledge base: use Comunica and RDF/JS named graphs for business, technical, semantic, provenance/mapping and optional instances. Implement lookup, traversal, term search, metrics, lineage and approved SPARQL queries. Keep metadata queries independent of PostgreSQL. Add expected-result query tests.
5–6. Undefined in the supplied request. Resolve scope before assigning deliverables. The requested MCP discovery interface must expose traceable answers with source citations, enforce read-only query policy and be tested through the actual MCP SDK/protocol. Transport, authentication and packaging remain undecided.

Each future phase must write a report listing changed artifacts, real validation commands, results, unresolved assumptions and source lineage. Artifacts must remain deterministic. No external migrations or confidential data imports are authorized.
