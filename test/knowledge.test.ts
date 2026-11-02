import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KnowledgeBase } from '../src/knowledge/KnowledgeBase.ts';

test('metadata discovery is source-grounded and physical lookup reports its gate', async () => {
  const knowledgeBase = await KnowledgeBase.open();
  const invoice = knowledgeBase.entity('Invoice');
  assert.equal(invoice.entity?.name, 'Invoice');
  assert.ok(invoice.attributes.some((fact) => fact.text.includes('invoice_id')));
  assert.ok(knowledgeBase.search('duplicate').every((fact) => fact.source.line > 0));
  assert.equal(knowledgeBase.physicalSchemaStatus().status, 'blocked');
  assert.deepEqual(
    knowledgeBase.metricCandidates().map((candidate) => candidate.name),
    ['invoice total', 'open balance', 'approval duration', 'payment amount'],
  );
});

test('approved SPARQL fails explicitly until all validated Turtle graphs exist', async () => {
  const knowledgeBase = await KnowledgeBase.open();
  await assert.rejects(
    knowledgeBase.approvedSparql('metadata-overview'),
    /gated ontology and mapping Turtle files have not been generated/,
  );
});
