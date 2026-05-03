import { Language } from '@api-messages/api-messages';
import { QueryFilters, QueryPagination } from '@core/repositories/base-repository';
import { Request } from 'express';
import { Service } from 'typedi';

@Service()
export class BaseController {
  /**
   * Returns a single value from a query/header value that may come as an array.
   *
   * Express query parameters can be received as arrays when the same parameter
   * is sent multiple times.
   */
  protected getSingleValue<T>(value: T | T[] | undefined): T | undefined {
    if (Array.isArray(value)) return value[0];

    return value;
  }

  /**
   * Parses a boolean-like value.
   *
   * Supported values:
   * - true
   * - false
   * - "true"
   * - "false"
   */
  parseBoolean(value: string | boolean | Array<string | boolean> | undefined): boolean | undefined {
    value = this.getSingleValue(value);

    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;

    return undefined;
  }

  /**
   * Parses a numeric value.
   *
   * Returns undefined when the value is empty or cannot be converted to a valid number.
   */
  parseNumber(value: string | number | Array<string | number> | undefined): number | undefined {
    value = this.getSingleValue(value);

    if (!value) return undefined;

    const parsed = Number(value);

    return Number.isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Parses a date value.
   *
   * Accepts string, number, or Date values.
   * Returns undefined when the value cannot be converted to a valid Date.
   */
  parseDate(value: string | number | Date | Array<string | number | Date> | undefined): Date | undefined {
    value = this.getSingleValue(value);

    if (value === undefined) return undefined;
    if (value instanceof Date) return value;

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  /**
   * Parses a comma-separated string or array into a string array.
   *
   * Example:
   * "createdBy,updatedBy" -> ["createdBy", "updatedBy"]
   */
  parseArray(value: string | undefined | Array<string>): string[] | undefined {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return Array.isArray(value) ? value : [];
  }

  /**
   * Extracts the default filters supported by list endpoints.
   */
  getDefaultFilters(req: Request): QueryFilters {
    return {
      textSearch: req.query.textSearch as string,
      isStrictSearch: this.parseBoolean(req.query.isStrictSearch as string),
      language: (req.headers.language ?? Language.Spanish) as Language
    };
  }

  /**
   * Extracts the default pagination and sorting options from the request query.
   */
  getDefaultPaginatorOptions(req: Request): QueryPagination {
    return {
      limit: this.parseNumber(req.query.limit as string),
      offset: this.parseNumber(req.query.offset as string),
      orderBy: req.query.orderBy as string,
      order: req.query.order as 'asc' | 'desc'
    };
  }
}
