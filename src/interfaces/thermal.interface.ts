export interface ThermalTicketProduct {
  id: string;
  sku: string;
  name: string;
  qty: number | string;
  location: string;
}

export interface ThermalPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  product: ThermalTicketProduct;
  onGoToPrinterSetup?: () => void;
}
