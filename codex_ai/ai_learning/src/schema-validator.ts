// Small offline validator for the exact JSON Schema vocabulary used by model.schema.json.
// Reject unsupported keywords so schema expansion cannot silently weaken validation.
export function validate(schema: any, value: any, path = '$'): string[] {
  const errors: string[] = [];
  const supported = new Set(['$schema', 'title', 'type', 'required', 'properties', 'additionalProperties', 'items', 'enum', 'minLength', 'minimum']);
  for (const key of Object.keys(schema)) if (!supported.has(key)) errors.push(`${path}: unsupported schema keyword ${key}`);
  const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  if (schema.type && !(schema.type === 'integer' ? Number.isInteger(value) : type === schema.type)) return [...errors, `${path}: expected ${schema.type}`];
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: invalid enum value`);
  if (schema.minLength && value.length < schema.minLength) errors.push(`${path}: too short`);
  if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: below minimum`);
  if (type === 'object') {
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${path}.${key}: required`);
    for (const [key, child] of Object.entries(value)) {
      if (schema.properties?.[key]) errors.push(...validate(schema.properties[key], child, `${path}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${path}.${key}: unexpected property`);
    }
  }
  if (type === 'array' && schema.items) value.forEach((child: any, index: number) => errors.push(...validate(schema.items, child, `${path}[${index}]`)));
  return errors;
}
