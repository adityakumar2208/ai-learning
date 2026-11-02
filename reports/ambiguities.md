# Ambiguities and blockers

This file is generated deterministically by `npm run phase0`. It will be populated from the normalized source with Markdown line references after Phase 0 runs.

## Known source blockers

- The supplied specification is a proposed reference business model, not an existing physical schema ([input/data-model.md](../input/data-model.md), line 5).
- Physical column types, nullability, primary/foreign keys, constraints, and indexes are not defined; attributes are descriptive only ([input/data-model.md](../input/data-model.md), lines 13–28 and 61–62).
- Relationship statements do not consistently define optionality, exact cardinality, or foreign-key columns ([input/data-model.md](../input/data-model.md), lines 32–38).
- Lifecycle values are illustrative and policy-dependent; they are not an approved enum or transition contract ([input/data-model.md](../input/data-model.md), lines 44–46).
- Metric names are candidates without approved grain, formula, currency, status, or aggregation rules ([input/data-model.md](../input/data-model.md), line 71).
- Sensitivity and access restrictions are described broadly, not mapped to individual fields or roles ([input/data-model.md](../input/data-model.md), lines 65–67).
- The requested Phases 5 and 6 have no specified deliverables; the implementation plan treats them as MCP discovery and operational packaging.

No schema, metric logic, join, OWL axiom, or SHACL constraint may be generated from these unresolved points.
