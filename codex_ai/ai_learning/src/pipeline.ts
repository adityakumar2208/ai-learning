import { build } from './normalize.ts';
const model = build();
if (!model.physicalReady) {
  console.error('Phase 0 representation validated. Phase 1 BLOCKED: authoritative physical definitions are missing. See reports/ambiguities.md. No downstream artifacts generated.');
  process.exitCode = 2;
} else {
  throw new Error('Physical generation is not implemented; approval flags alone cannot bypass validation gates.');
}
