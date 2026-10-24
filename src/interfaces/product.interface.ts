export interface IProductCardData {
  name: string;
  code?: string;
  qty: number;
  location: string;
  thumbnailUri?: string;
  // Precio de venta; sin precio no se muestra.
  price?: number | null;
}
