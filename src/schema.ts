import Ajv2020, { type AnySchema } from 'ajv/dist/2020.js';

export function validate(schema: AnySchema, value: unknown): string[] {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const isValid = ajv.compile(schema);
  if (isValid(value)) return [];
  return (isValid.errors ?? []).map((error) =>
    `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`,
  );
}
