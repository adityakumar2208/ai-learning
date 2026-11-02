# Metadata-driven knowledge base

This repository currently implements a partial Phase 0 ingestion foundation. It is not a completed knowledge base or MCP server.

`ap_datamodel.md` is the supplied source. `input/data-model.md` is its byte-for-byte working copy. The source describes a proposed business model, not an approved physical schema. Edit the input deliberately and rerun normalization; keep the original for comparison.

Requires Node.js >=22.18 with native TypeScript stripping. There are no runtime dependencies for the current foundation. Commands can run directly without npm:

```powershell
node src/normalize.ts
node --test tests/normalize.test.ts
node src/pipeline.ts
```

The pipeline intentionally exits nonzero at the physical gate. The initial JSON Schema deliberately accepts only non-ready metadata; changing a flag cannot approve a physical schema. The offline validator supports only the schema vocabulary used here and rejects unsupported keywords.

Read [the implementation plan](reports/implementation-plan.md), [ambiguities](reports/ambiguities.md) and [validation status](reports/validation-status.md).

Normalization preserves every nonempty source fragment, proposed entity descriptions and candidate attribute phrases. Narrative rules, relationships, classifications and metrics remain source fragments, not structured executable definitions. No SQL, Cube YAML, RDF, SHACL or MCP behavior is implemented or validated yet. No external database was contacted and no business records were imported.
