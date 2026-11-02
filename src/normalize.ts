import { createHash } from 'node:crypto';

export type Fact = { id: string; kind: string; name: string; text: string; status: string; source: { section: string; line: number; endLine: number } };
export const stableId = (kind: string, name: string) => `urn:kb:v1:${kind}:${encodeURIComponent(name.normalize('NFC').trim().toLowerCase())}`;

// This adapter recognizes the supplied entity-table format. Everything else remains
// a source assertion, rather than being guessed into physical columns or FK rules.
export function normalize(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let section = 'Document';
  let entityTable = false;
  const facts: Fact[] = [];
  let paragraph: string[] = [];
  let start = 0;
  const flush = () => {
    if (!paragraph.length) return;
    const text = paragraph.join('\n');
    facts.push({ id: stableId('assertion', `${section}:${text}`), kind: 'source-assertion', name: section, text, status: 'explicit-source', source: { section, line: start + 1, endLine: start + paragraph.length } });
    paragraph = [];
  };
  lines.forEach((line, i) => {
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      const headingText = heading[2];
      if (!headingText) throw new Error(`Invalid Markdown heading at line ${i + 1}`);
      section = headingText;
      entityTable = false;
      return;
    }
    if (/^\|\s*Entity\s*\|\s*Purpose\s*\|\s*Important attributes\s*\|\s*$/.test(line)) { flush(); entityTable = true; return; }
    if (entityTable && /^\|[\s:|-]+\|$/.test(line)) return;
    if (entityTable && line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.length !== 3) throw new Error(`Unsupported entity row at line ${i + 1}`);
      const [nameCell, description, attributes] = cells;
      if (!nameCell || !description || !attributes) throw new Error(`Incomplete entity row at line ${i + 1}`);
      const name = nameCell.replace(/\*\*/g, '');
      facts.push({ id: stableId('business-entity', name), kind: 'business-entity', name, text: description, status: 'source-proposal', source: { section, line: i + 1, endLine: i + 1 } });
      facts.push({ id: stableId('attribute-candidates', name), kind: 'attribute-candidates', name, text: attributes, status: 'source-proposal', source: { section, line: i + 1, endLine: i + 1 } });
      return;
    }
    if (!line.trim()) { flush(); entityTable = false; return; }
    if (!paragraph.length) start = i;
    paragraph.push(line);
  });
  flush();
  const ids = facts.map(f => f.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate source facts or entity identifiers; resolve before normalization');
  if (!facts.some(f => f.kind === 'business-entity')) throw new Error('No recognized entity table; a source adapter is required');
  return {
    version: '1.0.0', source: { path: 'input/data-model.md', sha256: createHash('sha256').update(markdown).digest('hex') },
    facts, physicalObjects: [], readiness: { physical: false, reason: 'Source describes proposed business entities, not explicit physical tables, typed columns, nullability, and keys.' }
  };
}
