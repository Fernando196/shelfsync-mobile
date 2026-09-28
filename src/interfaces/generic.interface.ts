export interface IAuditable {
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  createdBy?: {
    fullName: string;
  } | null;
  updtedBy?: {
    fullName: string;
  } | null;
}

export interface QueryFilters {
  [name: string]: string | Array<number> | Array<string> | number | boolean | null;
}
