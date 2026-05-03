import { Language } from '@api-messages/api-messages';
import { QueryFilters, QueryPagination } from '@repositories/base-repository';
import { Request } from 'express';
import { Service } from 'typedi';

@Service()
export class BaseController {
  protected getSingleValue<T>(value: T | T[] | undefined): T | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
  }

  /**
   * @summary Parse string to boolean
   */
  parseBoolean(value: string | boolean | Array<string | boolean> | undefined): boolean | undefined {
    value = this.getSingleValue(value);
    if (value == undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  /**
   * @summary Parse string to number
   */
  parseNumber(value: string | number | Array<string | number> | undefined): number | undefined {
    value = this.getSingleValue(value);
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  /**
   * @summary Parse value to Date
   */
  parseDate(value: string | number | Date | Array<string | number | Date> | undefined): Date | undefined {
    value = this.getSingleValue(value);
    if (value == undefined) return undefined;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  /**
   * @summary Parse to array
   */
  parseArray(value: string | undefined | Array<string>): string[] | undefined {
    if (typeof value === 'string') return value.split(',').map((v) => v.trim());
    return Array.isArray(value) ? value : [];
  }

  /**
   * @summary Get textSearch and language filter
   */
  getDefaultFilters(req: Request): QueryFilters {
    return {
      textSearch: req.query.textSearch as string,
      isStrictSearch: this.parseBoolean(req.query.isStrictSearch as string),
      language: (req.headers.language ?? Language.Spanish) as Language
    };
  }
  /**
   * @summary Get default paginator options
   */
  getDefaultPaginatorOptions(req: Request): QueryPagination {
    return <QueryPagination>{
      limit: this.parseNumber(req.query.limit as string),
      offset: this.parseNumber(req.query.offset as string),
      orderBy: req.query.orderBy as string,
      order: req.query.order as 'asc' | 'desc'
    };
  }
}
