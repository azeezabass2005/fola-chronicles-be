/**
 * Common TypeScript types and interfaces
 */

/**
 * Generic update data type
 */
export type UpdateData<T> = Partial<T> & Record<string, unknown>;

/**
 * Sort order type
 */
export type SortOrder = 1 | -1;

/**
 * Sort options type
 */
export type SortOptions = Record<string, SortOrder>;

/**
 * Generic query filters
 */
export type QueryFilters = Record<string, unknown>;

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: SortOptions;
  populate?: string[];
}

/**
 * Search options
 */
export interface SearchOptions extends PaginationOptions {
  useTextSearch?: boolean;
}

/**
 * Token verification result
 */
export interface TokenVerificationResult {
  data: {
    userId: string;
    email: string;
    role?: number;
    username: string;
  };
  iat: number;
  exp: number;
}

/**
 * Sanitized update data for posts
 */
export interface SanitizedPostUpdateData {
  title?: string;
  description?: string;
  content?: string;
  [key: string]: unknown;
}
