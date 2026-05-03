import { Schema } from 'express-validator/lib/middlewares/schema';

type OpenApiObject = Record<string, unknown>;

type ValidationRule = Record<string, any>;

function normalizeEnumOptions(options: unknown): unknown[] | undefined {
  if (!Array.isArray(options)) return undefined;
  if (options.length === 1 && Array.isArray(options[0])) return options[0];
  return options;
}

function inferSchema(rule: ValidationRule): OpenApiObject {
  if (rule.isBoolean) return { type: 'boolean' };
  if (rule.isInt) {
    const options = rule.isInt.options ?? {};
    return {
      type: 'integer',
      ...(typeof options.min === 'number' ? { minimum: options.min } : {}),
      ...(typeof options.max === 'number' ? { maximum: options.max } : {})
    };
  }
  if (rule.isFloat) return { type: 'number' };
  if (rule.isISO8601) return { type: 'string', format: 'date-time' };
  if (rule.isArray) return { type: 'array', items: { type: 'string' } };
  if (rule.isObject) return { type: 'object' };

  const enumOptions = normalizeEnumOptions(rule.isIn?.options);
  if (enumOptions?.length) {
    return {
      type: enumOptions.every((value) => typeof value === 'number') ? 'number' : 'string',
      enum: enumOptions
    };
  }

  return { type: 'string' };
}

function isOptional(rule: ValidationRule): boolean {
  if (rule.optional === true) return true;
  if (typeof rule.optional === 'object') return true;
  return false;
}

function isSupportedField(name: string, rule: ValidationRule): boolean {
  if (!Array.isArray(rule.in)) return false;
  if (!rule.in.some((location) => location === 'query' || location === 'params')) return false;
  if (name.includes('*')) return false;
  if (name.includes('[') || name.includes(']')) return false;
  if (name.includes('.')) return false;
  return true;
}

function parameterKey(parameter: OpenApiObject): string {
  return `${parameter.in}:${parameter.name}`;
}

function isBodyField(rule: ValidationRule): boolean {
  return Array.isArray(rule.in) && rule.in.includes('body');
}

function ensureObjectSchema(schema: OpenApiObject): void {
  if (!schema.type) schema.type = 'object';
  if (!schema.properties) schema.properties = {};
}

function ensureArrayItems(schema: OpenApiObject): OpenApiObject {
  if (!schema.type) schema.type = 'array';
  if (schema.type !== 'array') schema.type = 'array';
  if (!schema.items || typeof schema.items !== 'object') schema.items = {};
  return schema.items as OpenApiObject;
}

function propertyRequiredContainer(schema: OpenApiObject): string[] {
  if (!schema.required) schema.required = [];
  return schema.required as string[];
}

function addRequired(schema: OpenApiObject, propertyName: string): void {
  const required = propertyRequiredContainer(schema);
  if (!required.includes(propertyName)) required.push(propertyName);
}

function assignPath(target: OpenApiObject, path: string, rule: ValidationRule): void {
  const segments = path.split('.');
  let current = target;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const next = segments[i + 1];
    const isLast = i === segments.length - 1;

    if (segment === '*') {
      current = ensureArrayItems(current);
      if (!isLast) {
        if (next !== '*') ensureObjectSchema(current);
      }
      continue;
    }

    ensureObjectSchema(current);
    const properties = current.properties as Record<string, OpenApiObject>;

    if (!properties[segment]) {
      properties[segment] = {};
    }

    if (isLast) {
      properties[segment] = {
        ...properties[segment],
        ...inferSchema(rule)
      };

      if (!isOptional(rule)) {
        addRequired(current, segment);
      }
    } else {
      if (next === '*') {
        properties[segment].type = 'array';
        if (!properties[segment].items || typeof properties[segment].items !== 'object') {
          properties[segment].items = {};
        }
        current = properties[segment];
      } else {
        ensureObjectSchema(properties[segment]);
        current = properties[segment];
      }
    }
  }
}

export function parametersFromValidationSchemas(...schemas: Array<Schema | undefined>): OpenApiObject[] {
  const parameters = new Map<string, OpenApiObject>();

  for (const schema of schemas) {
    if (!schema) continue;

    for (const [name, rawRule] of Object.entries(schema)) {
      const rule = rawRule as ValidationRule;
      if (!isSupportedField(name, rule)) continue;

      const location = rule.in.find((value: string) => value === 'query' || value === 'params');
      if (!location) continue;

      const parameter: OpenApiObject = {
        name,
        in: location == 'params' ? 'path' : location,
        required: location === 'params' ? true : !isOptional(rule),
        schema: inferSchema(rule)
      };

      parameters.set(parameterKey(parameter), parameter);
    }
  }

  return [...parameters.values()];
}

export function bodySchemaFromValidationSchemas(...schemas: Array<Schema | undefined>): OpenApiObject | null {
  const root: OpenApiObject = {
    type: 'object',
    properties: {}
  };

  let hasBodyFields = false;

  for (const schema of schemas) {
    if (!schema) continue;

    for (const [name, rawRule] of Object.entries(schema)) {
      const rule = rawRule as ValidationRule;
      if (!isBodyField(rule)) continue;
      if (name.includes('[') || name.includes(']')) continue;

      hasBodyFields = true;
      assignPath(root, name, rule);
    }
  }

  return hasBodyFields ? root : null;
}

export function jsonRequestBodyFromValidationSchemas(...schemas: Array<Schema | undefined>): OpenApiObject | null {
  const schema = bodySchemaFromValidationSchemas(...schemas);
  if (!schema) return null;

  return {
    required: true,
    content: {
      'application/json': {
        schema
      }
    }
  };
}
