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
  title?: string;
  isLoading?: boolean;
  relatedItems?: string[];
  relatedItemsLabel?: string;
}

export function ConfirmDialog({
  open,
  isLoading = false,
  description,
  title,
  relatedItems = [],
  relatedItemsLabel,
  onClose,
  onConfirm,
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
      <div>
        <DialogTitle sx={{ color: "var(--foreground)" }}>
          {title ?? t("common.confirm")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "var(--muted)" }}>
            {description}
          </DialogContentText>
          {relatedItems.length > 0 && relatedItemsLabel && (
            <>
              <Button
                type="button"
                onClick={() => setShowRelatedItems((visible) => !visible)}
                aria-expanded={showRelatedItems}
                variant="outlined"
                size="small"
                sx={{
                  mt: 1,
                  color: "var(--brand)",
                  backgroundColor: "var(--brand-soft)",
                  borderColor: "var(--brand)",
                  borderRadius: 1.5,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "var(--brand-soft)",
                    borderColor: "var(--accent)",
                  },
                }}
              >
                {showRelatedItems
                  ? t("project.hideTasks")
                  : `${t("project.viewTasks")} (${relatedItems.length})`}
              </Button>
              <Collapse in={showRelatedItems}>
                <div aria-label={relatedItemsLabel}>
                  <Typography
                    sx={{ mt: 1, color: "var(--foreground)", fontWeight: 600 }}
                    variant="body2"
                    component="p"
                  >
                    {relatedItemsLabel}
                  </Typography>
                  <List dense disablePadding>
                    {relatedItems.map((item, index) => (
                      <ListItem
                        key={`${index}-${item}`}
                        disableGutters
                        sx={{
                          mt: 0.75,
                          px: 1.25,
                          py: 0.75,
                          border: "1px solid var(--line)",
                          borderRadius: 1,
                          backgroundColor: "var(--background)",
                        }}
                      >
                        <ListItemText
                          sx={{ color: "var(--foreground)" }}
                          primary={t("project.taskWillBeDeleted", {
                            name: item,
                          })}
                        />
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
            sx={{ color: "var(--brand)" }}
            ref={cancelButtonRef}
            color="primary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? t("common.deleting") : t("common.confirm")}
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
}
