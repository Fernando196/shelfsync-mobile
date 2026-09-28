import { ICategory } from '../interfaces/category.interface';
import { listCategories } from '../services/categories.service';
import { readJSON, STORAGE_KEYS, writeJSON } from './storage';

export async function getCategories() {
  return (await readJSON<ICategory[]>(STORAGE_KEYS.categories)) ?? [];
}

export async function refreshCategories(): Promise<ICategory[]> {
  try {
    const categories = await listCategories({ 'filters[active][eq]': true });
    await writeJSON(STORAGE_KEYS.categories, categories);
    return categories;
  } catch (err) {
    console.warn('No se pudo actualizar categories', err);
    return getCategories();
  }
}
