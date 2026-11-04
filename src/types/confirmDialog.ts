import type { ReactNode } from "react";

export interface TypeConfirmDialogProps {
  open: boolean;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  content?: ReactNode;
  isLoading?: boolean;
  relatedItems?: string[];
  relatedItemsLabel?: string;
}
