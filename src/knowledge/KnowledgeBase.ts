import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { DataFactory, Parser, Store } from 'n3';
import { QueryEngine } from '@comunica/query-sparql';
import { stableId } from '../normalize.ts';
import { validate } from '../schema.ts';

type SourceFact = {
  id: string;
  kind: string;
  name: string;
  text: string;
  status: string;
  source: { section: string; line: number; endLine: number };
};

type Catalog = {
  facts: SourceFact[];
  physicalObjects: Array<{ name: string }>;
  readiness: { physical: boolean; reason: string };
};

const graphFiles = [
  'ontology/business.ttl',
  'ontology/technical-metadata.ttl',
  'ontology/mappings.ttl',
  'ontology/shapes.ttl',
] as const;

const approvedQueries = {
  'metadata-overview': 'SELECT ?graph ?subject ?predicate ?object WHERE { GRAPH ?graph { ?subject ?predicate ?object } } LIMIT 100',
  'ontology-classes': 'SELECT ?graph ?class ?label WHERE { GRAPH ?graph { ?class a <http://www.w3.org/2002/07/owl#Class> ; <http://www.w3.org/2000/01/rdf-schema#label> ?label } } LIMIT 100',
} as const;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

export class KnowledgeBase {
  private readonly root: string;
  private readonly catalog: Catalog;
  private readonly rdfStore = new Store();
  private rdfReady = false;

  private constructor(root: string, catalog: Catalog) {
    this.root = root;
    this.catalog = catalog;
  }

  static async open(root = process.cwd()): Promise<KnowledgeBase> {
    const schema = JSON.parse(await readFile(path.join(root, 'metadata/model.schema.json'), 'utf8'));
    const rawCatalog: unknown = JSON.parse(await readFile(path.join(root, 'metadata/model.json'), 'utf8'));
    const errors = validate(schema, rawCatalog);
    if (errors.length) throw new Error(`Metadata failed JSON Schema validation:\n${errors.join('\n')}`);
    const catalog = rawCatalog as Catalog;
    const knowledgeBase = new KnowledgeBase(root, catalog);
    await knowledgeBase.loadValidatedGraphs();
    return knowledgeBase;
  }

  search(term: string): SourceFact[] {
    const normalized = term.trim().toLocaleLowerCase();
    if (!normalized) throw new Error('Search term must not be empty.');
    return this.catalog.facts
      .filter((fact) => `${fact.name}\n${fact.text}`.toLocaleLowerCase().includes(normalized))
      .slice(0, 30);
  }

  entity(name: string): { entity: SourceFact | undefined; attributes: SourceFact[] } {
    const normalized = name.trim().toLocaleLowerCase();
    if (!normalized) throw new Error('Entity name must not be empty.');
    const entity = this.catalog.facts.find(
      (fact) => fact.kind === 'business-entity' && fact.name.toLocaleLowerCase() === normalized,
    );
    const attributes = this.catalog.facts.filter(
      (fact) => fact.kind === 'attribute-candidates' && fact.name.toLocaleLowerCase() === normalized,
    );
    return { entity, attributes };
  }

  relationshipAssertions(term?: string): SourceFact[] {
    const normalized = term?.trim().toLocaleLowerCase();
    return this.catalog.facts.filter(
      (fact) =>
        fact.kind === 'source-assertion' &&
        fact.source.section.toLocaleLowerCase() === 'relationships' &&
        (!normalized || fact.text.toLocaleLowerCase().includes(normalized)),
    );
  }

  metricCandidates(): SourceFact[] {
    const metricSource = this.catalog.facts.find(
      (fact) =>
        fact.kind === 'source-assertion' &&
        /Define measures such as\s+(.+?)\s+with explicit/i.test(fact.text),
    );
    if (!metricSource) return [];
    const list = /Define measures such as\s+(.+?)\s+with explicit/i.exec(metricSource.text)?.[1];
    if (!list) return [];
    return list
      .replace(/,\s*and\s+/gi, ', ')
      .replace(/\s+and\s+/gi, ', ')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({
        id: stableId('metric-candidate', name),
        kind: 'metric-candidate',
        name,
        text: name,
        status: 'unapproved-candidate',
        source: metricSource.source,
      }));
  }

  physicalSchemaStatus(): { status: 'blocked'; reason: string; physicalObjects: number } {
    return {
      status: 'blocked',
      reason: this.catalog.readiness.reason,
      physicalObjects: this.catalog.physicalObjects.length,
    };
  }

  semanticLineageStatus(): { status: 'blocked'; reason: string } {
    return {
      status: 'blocked',
      reason: 'Semantic-to-physical lineage is unavailable until a validated physical schema and approved semantic mappings exist.',
    };
  }

  async approvedSparql(queryId: keyof typeof approvedQueries): Promise<string[]> {
    if (!this.rdfReady) {
      throw new Error('SPARQL queries are unavailable: the gated ontology and mapping Turtle files have not been generated.');
    }
    const engine = new QueryEngine();
    const results = await engine.queryBindings(approvedQueries[queryId], { sources: [this.rdfStore] });
    const rows: string[] = [];
    for await (const binding of results) rows.push(binding.toString());
    return rows;
  }

  async ontologyClasses(): Promise<string[]> {
    return this.approvedSparql('ontology-classes');
  }

  private async loadValidatedGraphs(): Promise<void> {
    const validationReport = path.join(this.root, 'reports/ontology-validation.md');
    if (!(await fileExists(validationReport))) return;
    const reportText = await readFile(validationReport, 'utf8');
    if (!/^\*\*Status: PASS\*\*$/m.test(reportText)) return;

    const paths = await Promise.all(
      graphFiles.map(async (relativePath) => ({
        relativePath,
        fullPath: path.join(this.root, relativePath),
        exists: await fileExists(path.join(this.root, relativePath)),
      })),
    );
    if (paths.some((item) => !item.exists)) return;

    const parser = new Parser({ format: 'text/turtle' });
    for (const item of paths) {
      const turtle = await readFile(item.fullPath, 'utf8');
      const graphName = path.basename(item.relativePath, '.ttl');
      const graph = DataFactory.namedNode(`urn:ap-kb:v1:graph:${graphName}`);
      this.rdfStore.addQuads(
        parser.parse(turtle).map((quad) =>
          DataFactory.quad(quad.subject, quad.predicate, quad.object, graph),
        ),
      );
    }
    this.rdfReady = true;
  }
}
