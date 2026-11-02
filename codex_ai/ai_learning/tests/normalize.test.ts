import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalize } from '../src/normalize.ts';
import { validate } from '../src/schema-validator.ts';
const source = readFileSync('input/data-model.md', 'utf8');
test('source has traceable proposed entities without invented physical schema', () => {
  const model = normalize(source);
  assert.equal(model.entities.length, 16);
  assert.deepEqual(model.physicalTables, []);
  assert.equal(model.physicalReady, false);
  for (const entity of model.entities) assert.ok(model.facts.find(f => f.id === entity.sourceFactId));
  for (const fact of model.facts) assert.equal(source.split(/\r?\n/)[fact.source.line - 1], fact.source.text);
});
test('identifiers survive unrelated line insertion and output is deterministic', () => {
  assert.deepEqual(normalize(source), normalize(source));
  assert.deepEqual(normalize(source).entities.map(e => e.id), normalize('\n' + source).entities.map(e => e.id));
});
test('schema rejects malformed metadata and unsupported validation vocabulary', () => {
  const schema = JSON.parse(readFileSync('metadata/model.schema.json', 'utf8'));
  assert.deepEqual(validate(schema, normalize(source)), []);
  const broken = normalize(source); delete (broken as any).source;
  assert.ok(validate(schema, broken).length);
  assert.ok(validate({ type: 'string', pattern: 'x' }, 'x').length);
});
