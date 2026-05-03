import { Schema } from 'express-validator/lib/middlewares/schema';

type OpenApiObject = Record<string, unknown>;

type ValidationRule = Record<string, any>;

/**
 * Normalizes `isIn` options from express-validator.
 *
 * express-validator usually defines enum values as:
 *
 * {
 *   isIn: {
 *     options: [['A', 'B']]
 *   }
 * }
 *
 * OpenAPI expects:
 *
 * ['A', 'B']
 */
function normalizeEnumOptions(options: unknown): unknown[] | undefined {
  if (!Array.isArray(options)) return undefined;
  if (options.length === 1 && Array.isArray(options[0])) return options[0];
  return options;
}

/**
 * Extracts validator options regardless of whether express-validator provides
 * them as an object or as the first item of an options array.
 *
 * Examples:
 *
 * {
 *   isInt: {
 *     options: { min: 1, max: 10 }
 *   }
 * }
 *
 * {
 *   isInt: {
 *     options: [{ min: 1, max: 10 }]
 *   }
 * }
 */
function getValidatorOptions(rule: ValidationRule, validatorName: string): Record<string, any> {
  const validator = rule[validatorName];
  const options = validator?.options;

  if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'object') {
    return options[0];
  }

  if (options && typeof options === 'object' && !Array.isArray(options)) {
    return options;
  }

  return {};
}

/**
 * Infers a basic OpenAPI schema from an express-validator rule.
 *
 * This helper intentionally supports the common validators used by the
 * skeleton routes. If new validators are added in the future, they can be
 * mapped here without touching the OpenAPI builder.
 */
function inferSchema(rule: ValidationRule): OpenApiObject {
  if (rule.isBoolean) {
    return { type: 'boolean' };
  }

  if (rule.isInt) {
    const options = getValidatorOptions(rule, 'isInt');

    return {
      type: 'integer',
      ...(typeof options.min === 'number' ? { minimum: options.min } : {}),
      ...(typeof options.max === 'number' ? { maximum: options.max } : {})
    };
  }

  if (rule.isFloat) {
    const options = getValidatorOptions(rule, 'isFloat');

    return {
      type: 'number',
      ...(typeof options.min === 'number' ? { minimum: options.min } : {}),
      ...(typeof options.max === 'number' ? { maximum: options.max } : {})
    };
  }

  if (rule.isISO8601) {
    return { type: 'string', format: 'date-time' };
  }

  if (rule.isUUID) {
    return { type: 'string', format: 'uuid' };
  }

  if (rule.isArray) {
    return { type: 'array', items: { type: 'string' } };
  }

  if (rule.isObject) {
    return { type: 'object' };
  }

  const enumOptions = normalizeEnumOptions(rule.isIn?.options);

  if (enumOptions?.length) {
    const enumType = enumOptions.every((value) => typeof value === 'number') ? 'number' : 'string';

    return {
      type: enumType,
      enum: enumOptions
    };
  }

  const stringLengthOptions = getValidatorOptions(rule, 'isLength');

  return {
    type: 'string',
    ...(typeof stringLengthOptions.min === 'number' ? { minLength: stringLengthOptions.min } : {}),
    ...(typeof stringLengthOptions.max === 'number' ? { maxLength: stringLengthOptions.max } : {})
  };
}

/**
 * Checks whether a validation rule is optional.
 *
 * express-validator supports both:
 *
 * optional: true
 * optional: { options: { nullable: true } }
 */
function isOptional(rule: ValidationRule): boolean {
  if (rule.optional === true) return true;
  if (typeof rule.optional === 'object') return true;
  return false;
}

/**
 * Determines whether a schema field can be converted into an OpenAPI
 * parameter.
 *
 * Only simple query and route params are supported here.
 *
 * Unsupported examples:
 * - filters.*
 * - filters[name]
 * - user.name
 *
 * Nested body fields are handled separately by `assignPath`.
 */
function isSupportedParameterField(name: string, rule: ValidationRule): boolean {
  if (!Array.isArray(rule.in)) return false;
  if (!rule.in.some((location) => location === 'query' || location === 'params')) return false;
  if (name.includes('*')) return false;
  if (name.includes('[') || name.includes(']')) return false;
  if (name.includes('.')) return false;
  return true;
}

/**
 * Builds a stable deduplication key for OpenAPI parameters.
 */
function parameterKey(parameter: OpenApiObject): string {
  return `${parameter.in}:${parameter.name}`;
}

/**
 * Checks whether a validation rule belongs to the request body.
 */
function isBodyField(rule: ValidationRule): boolean {
  return Array.isArray(rule.in) && rule.in.includes('body');
}

/**
 * Ensures that a schema node is an OpenAPI object schema.
 */
function ensureObjectSchema(schema: OpenApiObject): void {
  if (!schema.type) schema.type = 'object';
  if (!schema.properties) schema.properties = {};
}

/**
 * Ensures that a schema node is an OpenAPI array schema and returns its
 * `items` schema.
 *
 * This is used to support body fields such as:
 *
 * tags.*
 * addresses.*.street
 */
function ensureArrayItems(schema: OpenApiObject): OpenApiObject {
  if (!schema.type) schema.type = 'array';
  if (schema.type !== 'array') schema.type = 'array';

  if (!schema.items || typeof schema.items !== 'object') {
    schema.items = {};
  }

  return schema.items as OpenApiObject;
}

/**
 * Returns the `required` array for an object schema, creating it if needed.
 */
function propertyRequiredContainer(schema: OpenApiObject): string[] {
  if (!schema.required) schema.required = [];
  return schema.required as string[];
}

/**
 * Marks a property as required if it is not already present in the schema.
 */
function addRequired(schema: OpenApiObject, propertyName: string): void {
  const required = propertyRequiredContainer(schema);
  if (!required.includes(propertyName)) required.push(propertyName);
}

/**
 * Assigns a field schema into a nested OpenAPI object tree.
 *
 * Supported examples:
 *
 * name
 * address.street
 * tags.*
 * addresses.*.street
 *
 * This allows express-validator body schemas to be converted into request
 * body schemas automatically.
 */
function assignPath(target: OpenApiObject, path: string, rule: ValidationRule): void {
  const segments = path.split('.');
  let current = target;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const next = segments[i + 1];
    const isLast = i === segments.length - 1;

    if (segment === '*') {
      current = ensureArrayItems(current);

      if (!isLast && next !== '*') {
        ensureObjectSchema(current);
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

      continue;
    }

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

/**
 * Converts one or more express-validator schemas into OpenAPI parameters.
 *
 * This is intended for:
 *
 * - query parameters
 * - path parameters
 *
 * Body fields are ignored here and handled by `bodySchemaFromValidationSchemas`.
 */
export function parametersFromValidationSchemas(...schemas: Array<Schema | undefined>): OpenApiObject[] {
  const parameters = new Map<string, OpenApiObject>();

  for (const schema of schemas) {
    if (!schema) continue;

    for (const [name, rawRule] of Object.entries(schema)) {
      const rule = rawRule as ValidationRule;

      if (!isSupportedParameterField(name, rule)) continue;

      const location = rule.in.find((value: string) => value === 'query' || value === 'params');
      if (!location) continue;

      const parameter: OpenApiObject = {
        name,
        in: location === 'params' ? 'path' : location,
        required: location === 'params' ? true : !isOptional(rule),
        schema: inferSchema(rule)
      };

      parameters.set(parameterKey(parameter), parameter);
    }
  }

  return [...parameters.values()];
}

/**
 * Converts express-validator body fields into an OpenAPI object schema.
 *
 * The function supports simple and nested body paths:
 *
 * - name
 * - address.street
 * - tags.*
 * - addresses.*.street
 */
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

/**
 * Wraps the generated body schema into a standard OpenAPI JSON request body.
 */
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
