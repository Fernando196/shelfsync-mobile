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
