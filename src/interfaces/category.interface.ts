import { IAuditable } from './generic.interface';

export interface ICategory extends IAuditable {
  id: string;
  name: string;
  active: boolean;
}

export interface ICategoryItem {
  id: string;
  name: string;
}

export interface IUpsertCategoryInput {
  id?: string;
  name: string;
  active?: boolean;
}
