import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import List from "@mui/material/List";
import React from "react";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import DialogTitle from "@mui/material/DialogTitle";
import ListItemText from "@mui/material/ListItemText";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";

interface IProps {
  open: boolean;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  relatedItems?: string[];
  relatedItemsLabel?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  description,
  isLoading = false,
  relatedItems = [],
  relatedItemsLabel,
}: IProps) {
  const { t } = useTranslation();
  const [showRelatedItems, setShowRelatedItems] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) setShowRelatedItems(false);
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      slotProps={{
        transition: {
          onEntered: () => cancelButtonRef.current?.focus(),
        },
      }}
    >
      <div className="dark:bg-gray-600">
        <DialogTitle className="dark:text-white">
          {t("confirmDelete")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="dark:text-white">
            {description}
          </DialogContentText>
          {relatedItems.length > 0 && relatedItemsLabel && (
            <>
              <Button
                type="button"
                onClick={() => setShowRelatedItems((visible) => !visible)}
                aria-expanded={showRelatedItems}
                sx={{ mt: 1, px: 0, textTransform: "none" }}
              >
                {showRelatedItems
                  ? t("hideRelatedItems")
                  : `${t("viewRelatedItems")} (${relatedItems.length})`}
              </Button>
              <Collapse in={showRelatedItems}>
                <div aria-label={relatedItemsLabel}>
                  <Typography
                    component="p"
                    variant="body2"
                    sx={{ mt: 1, fontWeight: 600 }}
                  >
                    {relatedItemsLabel}
                  </Typography>
                  <List dense disablePadding>
                    {relatedItems.map((item, index) => (
                      <ListItem key={`${index}-${item}`} disableGutters>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </div>
              </Collapse>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            className="dark:text-blue-400"
            onClick={onClose}
            color="primary"
            disabled={isLoading}
            ref={cancelButtonRef}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? t("deleting") : t("confirm")}
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
}
