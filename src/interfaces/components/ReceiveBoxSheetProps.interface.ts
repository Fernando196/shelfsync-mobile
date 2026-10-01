import { IProductLookup } from '../productLookup.interface';

export interface IReceiveBoxSheetProps {
  product: IProductLookup;
  onClose: () => void;
}
