import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { KnowledgeBase } from '../knowledge/KnowledgeBase.ts';

const knowledgeBase = await KnowledgeBase.open();
const server = new McpServer({ name: 'ap-metadata-knowledge-base', version: '0.1.0' });

server.tool(
  'search_business_terms',
  'Search source-grounded business metadata; each result includes Markdown provenance.',
  { term: z.string().min(1) },
  async ({ term }) => ({
    content: [{ type: 'text', text: JSON.stringify(knowledgeBase.search(term), null, 2) }],
  }),
);

server.tool(
  'get_business_entity',
  'Look up a documented business entity and its descriptive attribute candidates.',
  { name: z.string().min(1) },
  async ({ name }) => {
    const result = knowledgeBase.entity(name);
    if (!result.entity) {
      return { isError: true, content: [{ type: 'text', text: `No documented entity named "${name}".` }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
);

server.tool(
  'get_relationship_assertions',
  'Retrieve relationship prose from the source without inventing formal cardinalities.',
  { term: z.string().optional() },
  async ({ term }) => ({
    content: [{ type: 'text', text: JSON.stringify(knowledgeBase.relationshipAssertions(term), null, 2) }],
  }),
);

server.tool(
  'get_physical_schema',
  'Report physical-schema availability and any source-derived blocking reason.',
  {},
  async () => ({
    content: [{ type: 'text', text: JSON.stringify(knowledgeBase.physicalSchemaStatus(), null, 2) }],
  }),
);

server.tool(
  'get_metric_candidates',
  'List source-mentioned metric candidates as unapproved; no formulas or aggregations are inferred.',
  {},
  async () => ({
    content: [{
      type: 'text',
      text: JSON.stringify({
        approvalStatus: 'unapproved-candidate',
        sourceAssertions: knowledgeBase.metricCandidates(),
      }, null, 2),
    }],
  }),
);

server.tool(
  'get_semantic_lineage',
  'Report whether a validated semantic-to-physical mapping is available.',
  {},
  async () => ({
    content: [{ type: 'text', text: JSON.stringify(knowledgeBase.semanticLineageStatus(), null, 2) }],
  }),
);

server.tool(
  'lookup_ontology_classes',
  'List labeled OWL classes from the local ontology graph when the ontology gate has passed.',
  {},
  async () => {
    try {
      const rows = await knowledgeBase.ontologyClasses();
      return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: 'text', text: message }] };
    }
  },
);

server.tool(
  'query_approved_sparql',
  'Run one of the fixed, read-only SPARQL queries against local Turtle metadata after the ontology gate passes.',
  { queryId: z.enum(['metadata-overview', 'ontology-classes']) },
  async ({ queryId }) => {
    try {
      const rows = await knowledgeBase.approvedSparql(queryId);
      return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: 'text', text: message }] };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
