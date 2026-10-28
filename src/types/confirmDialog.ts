export interface TypeConfirmDialogProps {
  open: boolean;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  isLoading?: boolean;
  relatedItems?: string[];
  relatedItemsLabel?: string;
}
