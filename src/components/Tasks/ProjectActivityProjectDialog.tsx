"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface IProps {
  projectName: string;
  description: string | null;
  open: boolean;
  onClose: () => void;
}

export function ProjectActivityProjectDialog({
  projectName,
  description,
  open,
  onClose,
}: IProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <>
        <DialogTitle>{t("project.details.title")}</DialogTitle>
        <DialogContent>
          <Typography>
            <Typography component="span" fontWeight={600}>
              {t("project.details.project")}:
            </Typography>{" "}
            {projectName}
          </Typography>
          {description !== null ? (
            <Typography sx={{ mt: 1 }}>
              <Typography component="span" fontWeight={600}>
                {t("project.details.description")}:
              </Typography>{" "}
              {description || t("activity.emptyValue")}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("common.close")}</Button>
        </DialogActions>
      </>
    </Dialog>
  );
}
