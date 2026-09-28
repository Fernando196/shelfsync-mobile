import { QueryFilters } from '../interfaces/generic.interface';

export const transformQueryParams = (filters?: QueryFilters) => {
  return filters
    ? Object.entries(filters)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(String(key))}=${encodeURIComponent(String(value))}`,
        )
        .join('&')
        .toString()
    : '';
};
