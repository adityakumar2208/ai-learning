import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { normalize } from './normalize.ts';
import { validate } from './schema.ts';

const command = process.argv[2] ?? '';
if (!['normalize', 'validate', 'physical', 'semantic', 'ontology'].includes(command)) {
  throw new Error('Usage: node src/cli.ts normalize|validate|physical|semantic|ontology');
}
const source = await readFile('input/data-model.md', 'utf8');
const expected = normalize(source);
const schema = JSON.parse(await readFile('metadata/model.schema.json', 'utf8'));
const errors = validate(schema, expected);
if (errors.length) throw new Error(errors.join('\n'));
if (command === 'normalize') {
  await mkdir('metadata', { recursive: true });
  await mkdir('reports', { recursive: true });
  const sectionRange = (section: string): string => {
    const sectionFacts = expected.facts.filter((fact) => fact.source.section === section);
    if (sectionFacts.length === 0) throw new Error(`Missing provenance for source section "${section}".`);
    const lines = sectionFacts.map((fact) => fact.source.line);
    return `lines ${Math.min(...lines)}–${Math.max(...lines)}`;
  };
  const ambiguityReport = [
    '# Ambiguities and blockers',
    '',
    `Source: \`${expected.source.path}\` (SHA-256 \`${expected.source.sha256}\`).`,
    '',
    '## Phase 1 — physical model is blocked',
    '',
    `- The source describes a proposed business model, not an existing physical schema (Purpose and scope, line 5).`,
    `- Important attributes are descriptive, with no typed columns, nullability, keys, constraints, or indexes specified (Core entities, ${sectionRange('Core entities')}; Data integrity and operational guidance, ${sectionRange('Data integrity and operational guidance')}).`,
    `- Relationship statements remain source prose; exact cardinality and foreign-key columns are not consistently specified (Relationships, ${sectionRange('Relationships')}).`,
    `- Lifecycle values and transition rules are policy-dependent, not approved enumerations (Invoice lifecycle, ${sectionRange('Invoice lifecycle')}).`,
    '',
    '## Phase 2 — semantic model is blocked',
    '',
    `- There is no validated physical model or complete join cardinality (Relationships, ${sectionRange('Relationships')}).`,
    `- Metric names are candidates only; formulas, grain, currency, and status rules are not specified (Semantic model and ontology mapping, ${sectionRange('Semantic model and ontology mapping')}).`,
    '',
    '## Phases 3–4 — ontology and knowledge base are blocked',
    '',
    `- Business relationship prose has not been formalized into approved ontology axioms (Relationships, ${sectionRange('Relationships')}).`,
    '- No semantic/physical mappings exist; no SHACL constraints or instance data are generated.',
    '',
    '## Workflow detail',
    '',
    '- The request specifies Phases 0–4 only; Phases 5 and 6 are treated as MCP discovery and operational packaging.',
    '- No production deployment or confidential record import is performed.',
    '',
    '## Source facts',
    '',
    ...expected.facts
      .filter((fact) => fact.kind === 'business-entity')
      .map((fact) => `- ${fact.name} — ${fact.source.section}, line ${fact.source.line}.`),
    '',
  ].join('\n');
  await Promise.all([
    writeFile('metadata/model.json', JSON.stringify(expected, null, 2) + '\n'),
    writeFile('reports/ambiguities.md', ambiguityReport),
  ]);
  console.log(`Phase 0: ${expected.facts.length} source-grounded facts validated and written. Physical readiness: blocked.`);
} else {
  const stored = JSON.parse(await readFile('metadata/model.json', 'utf8'));
  const storedErrors = validate(schema, stored);
  if (storedErrors.length) throw new Error(storedErrors.join('\n'));
  if (JSON.stringify(stored) !== JSON.stringify(expected)) throw new Error('Metadata does not match source. Run normalize and review changes.');
  const digest = createHash('sha256').update(await readFile('input/data-model.md')).digest('hex');
  if (digest !== stored.source.sha256) throw new Error('Source hash mismatch; rerun Phase 0 and review the regenerated metadata.');
  if (command === 'physical') throw new Error(`Phase 1 BLOCKED: ${stored.readiness.reason} See reports/ambiguities.md. No artifacts generated.`);
  if (command === 'semantic') throw new Error('Phase 2 BLOCKED: Phase 1 has not produced a validated physical model. No Cube definitions generated.');
  if (command === 'ontology') throw new Error('Phase 3 BLOCKED: validated physical and semantic models are prerequisites. No ontology artifacts generated.');
  console.log('Phase 0 schema, source hash, provenance and deterministic regeneration: PASS.');
}
