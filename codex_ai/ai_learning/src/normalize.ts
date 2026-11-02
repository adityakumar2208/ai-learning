import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validate } from './schema-validator.ts';

export function normalize(markdown: string) {
  const facts: any[] = [];
  const entities: any[] = [];
  const sections: any[] = [];
  const ambiguities: string[] = [];
  let section = 'Document';
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ids = new Set<string>();
  markdown.split(/\r?\n/).forEach((text, index) => {
    const heading = /^#{1,6}\s+(.+)$/.exec(text);
    if (heading) { section = heading[1]; sections.push({ title: section, line: index + 1 }); return; }
    if (!text.trim()) return;
    const source = { file: 'input/data-model.md', section, line: index + 1, text };
    const id = 'fact:' + createHash('sha256').update(section + '\n' + text).digest('hex').slice(0, 24);
    if (!ids.has(id)) { facts.push({ id, status: 'explicit', source }); ids.add(id); }
    // Recognize the documented entity-table dialect; preserve all other content as source facts.
    const row = /^\|\s*\*\*(.+?)\*\*\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/.exec(text);
    if (row) {
      const entityId = 'business:' + slug(row[1]);
      if (entities.some(e => e.id === entityId)) ambiguities.push(`Duplicate entity identifier ${entityId} at line ${index + 1}.`);
      entities.push({ id: entityId, name: row[1], description: row[2], attributeCandidates: row[3].split(',').map(s => s.trim()), sourceFactId: id, status: 'proposed-in-source' });
    }
  });
  if (!entities.length) ambiguities.push('No recognized entity table: normalization requires review of the source dialect.');
  for (const entity of entities) ambiguities.push(`${entity.name}: physical table/column names, complete column definitions, types, nullability, primary keys, foreign keys and constraint details require explicit specification (source ${entity.sourceFactId}).`);
  ambiguities.push('Narrative attributes are candidate business attributes, not approved physical columns. Commas and slash-separated terms require review.');
  ambiguities.push('Relationships are preserved verbatim; foreign-key placement, optionality and complete cardinalities are not fully specified.');
  ambiguities.push('Lifecycle states are illustrative and policy-dependent; do not generate a closed enumeration or transition constraints.');
  ambiguities.push('Invoice total, open balance, approval duration and payment amount lack complete approved currency, status, grain and aggregation rules.');
  ambiguities.push('Ownership and sensitivity guidance lacks an exhaustive per-object classification or enforceable access policy.');
  ambiguities.push('No ontology namespace owner, versioning policy, approved synonyms, class hierarchy or representative instance dataset is specified.');
  ambiguities.push('Execution strategy names Phases 5 and 6, but only Phases 0–4 are defined. MCP transport, authentication and deployment requirements are unspecified.');
  return { version: '1', source: { file: 'input/data-model.md', sha256: createHash('sha256').update(markdown).digest('hex') }, sections, facts, entities, physicalTables: [], physicalReady: false, ambiguities };
}

export function build() {
  const markdown = readFileSync('input/data-model.md', 'utf8');
  const model = normalize(markdown);
  const schema = JSON.parse(readFileSync('metadata/model.schema.json', 'utf8'));
  const errors = validate(schema, model);
  if (errors.length) throw new Error(errors.join('\n'));
  for (const dir of ['metadata', 'reports']) mkdirSync(dir, { recursive: true });
  writeFileSync('metadata/model.json', JSON.stringify(model, null, 2) + '\n');
  writeFileSync('reports/ambiguities.md', '# Unresolved source definitions\n\n' + model.ambiguities.map((s, i) => `${i + 1}. ${s}`).join('\n') + '\n');
  writeFileSync('reports/phase-0.md', `# Phase 0 validation\n\nJSON Schema validation: PASS using the offline supported-vocabulary validator.\n\n${model.entities.length} source-proposed business entities and ${model.facts.length} explicit source fragments retained with section, line and text provenance. Source SHA-256: ${model.source.sha256}.\n\nNo physical tables are approved. Physical readiness: BLOCKED. See ambiguities.md. Raw source fragments preserve rules, relationships, enumerations, ownership and sensitivity guidance; these are not yet typed or approved executable definitions.\n`);
  return model;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build();
