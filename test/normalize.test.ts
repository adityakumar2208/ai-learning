import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalize } from '../src/normalize.ts';
import { validate } from '../src/schema.ts';

const markdown = await readFile('input/data-model.md', 'utf8');
const schema = JSON.parse(await readFile('metadata/model.schema.json', 'utf8'));
test('supplied source is preserved with exact line provenance and no invented physical objects', () => {
  const model = normalize(markdown);
  assert.deepEqual(validate(schema, model), []);
  assert.equal(model.facts.filter(f => f.kind === 'business-entity').length, 16);
  assert.deepEqual(model.physicalObjects, []);
  assert.equal(model.readiness.physical, false);
  const lines = markdown.split(/\r?\n/);
  for (const fact of model.facts) {
    const origin = lines.slice(fact.source.line - 1, fact.source.endLine).join('\n');
    assert.ok(origin.includes(fact.text));
  }
});
test('repeated extraction is deterministic and unrelated additions preserve entity IDs', () => {
  const model = normalize(markdown);
  assert.deepEqual(normalize(markdown), model);
  const ids = (m: ReturnType<typeof normalize>) => m.facts.filter(f => f.kind === 'business-entity').map(f => f.id);
  assert.deepEqual(ids(normalize(markdown + '\n## Notes\nAdditional source text.\n')), ids(model));
});
test('schema rejects fabricated readiness, missing provenance, and unknown properties', () => {
  for (const mutate of [
    (m: any) => { m.readiness.physical = true; },
    (m: any) => { delete m.facts[0].source; },
    (m: any) => { m.invented = 'table'; },
    (m: any) => { m.physicalObjects.push({ name: 'invented' }); }
  ]) {
    const model = normalize(markdown); mutate(model);
    assert.ok(validate(schema, model).length > 0);
  }
});
test('unrecognized and duplicate entities fail closed', () => {
  assert.throws(() => normalize('# No physical specification'), /adapter/);
  assert.throws(() => normalize(markdown.replace('| **Supplier**', '| **Organization**')), /Duplicate/);
});
