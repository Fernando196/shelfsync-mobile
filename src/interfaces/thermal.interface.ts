export interface IThermalTicketProduct {
  id: string;
  code: number;
  name: string;
  qty: number;
  location: string;
}

export interface IThermalPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  product: IThermalTicketProduct;
  onGoToPrinterSetup?: () => void;
}
