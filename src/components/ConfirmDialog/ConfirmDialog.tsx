import { useTranslation } from "react-i18next";
import React from "react";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";

interface ConfirmDialogProps {
  open: boolean;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  description,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="dark:bg-gray-600">
        <DialogTitle className="dark:text-white">
          {t("confirmDelete")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="dark:text-white">
            {description}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            className="dark:text-blue-400"
            onClick={onClose}
            color="primary"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            {t("confirm")}
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
}
