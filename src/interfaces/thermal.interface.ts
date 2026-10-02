export interface ThermalTicketProduct {
  id: string;
  code: number;
  name: string;
  qty: number;
  location: string;
}

export interface ThermalPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  product: ThermalTicketProduct;
  onGoToPrinterSetup?: () => void;
}
