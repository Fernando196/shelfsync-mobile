import { request } from '../api/http';
import { ICategory, IUpsertCategoryInput } from '../interfaces/category.interface';
import { QueryFilters } from '../interfaces/generic.interface';
import { transformQueryParams } from '../lib/queryParams';

export function listCategories(filters?: QueryFilters): Promise<ICategory[]> {
  return request(`/categories?${transformQueryParams(filters)}`);
}

export function createCategory(category: IUpsertCategoryInput): Promise<ICategory> {
  return request(`/categories`, { method: 'POST', body: JSON.stringify(category) });
}
