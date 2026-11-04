"use client";

import {
  Stack,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface IProps {
  open: boolean;
  username: string | null;
  displayName: string;
  onClose: () => void;
}

export function UserInfoDialog({
  open,
  username,
  displayName,
  onClose,
}: IProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("notifications.personDetails")}</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography variant="h6">{displayName}</Typography>
          {username ? (
            <Typography color="text.secondary">@{username}</Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
