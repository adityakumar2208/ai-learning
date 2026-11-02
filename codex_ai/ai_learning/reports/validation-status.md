# Validation status

## Current artifacts

Created package.json, src/normalize.ts, src/schema-validator.ts, src/pipeline.ts, tests/normalize.test.ts, input/data-model.md, metadata/model.schema.json, metadata/create-schema.mjs, metadata/model.json, reports/phase-0.md, reports/ambiguities.md, reports/implementation-plan.md and README.md.

## Executed checks

- node src/normalize.ts: PASS. Current IR passes its JSON Schema using the offline supported-vocabulary validator.
- node --test tests/normalize.test.ts: PASS, 3 tests. Checks provenance line accuracy, 16 source entity candidates, no invented tables, stable entity IDs, repeat normalization, malformed metadata rejection and unsupported schema vocabulary rejection.
- node src/pipeline.ts: expected BLOCKED status before physical generation; nonzero exit. The execution wrapper may report 1 although the Node program sets exitCode 2.
- Docker engine probe: FAIL, local engine pipe unavailable.
- Executable discovery: node and Docker found; npm, Liquibase, Java and psql not found on PATH.

## Limits

Phase 0 is partial: structured relationship/rule/metric extraction, general Markdown dialect handling and complete reference validation remain unimplemented. Source fragments preserve those definitions without interpreting them. Current tests are not migration, semantic, ontology, SHACL, Comunica or MCP tests. Phases 1–4 are blocked and unimplemented. Phases 5–6 have no supplied definition.

The source must specify physical details before safe schema generation. Missing toolchains independently prevent real integration validation. No generated downstream artifacts are claimed to pass validation.
