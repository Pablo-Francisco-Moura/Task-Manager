"use client";

import {
  Stack,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TypeProjectActivityTask } from "@/types";

interface IProps {
  task: TypeProjectActivityTask | null;
  taskName: string;
  open: boolean;
  onClose: () => void;
}

export function ProjectActivityTaskDialog({
  task,
  taskName,
  open,
  onClose,
}: IProps) {
  const { t, i18n } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <>
        <DialogTitle>
          {task ? t("task.details.title") : taskName}
        </DialogTitle>
        <DialogContent>
          {task ? (
            <Stack spacing={1}>
              <Typography>
                <Typography component="span" fontWeight={600}>
                  {t("task.details.task")}:
                </Typography>{" "}
                {task.name}
              </Typography>
              <Typography>
                <Typography component="span" fontWeight={600}>
                  {t("task.details.status")}:
                </Typography>{" "}
                {t(
                  `task.status.${task.status === "in_progress" ? "inProgress" : task.status}`,
                )}
              </Typography>
              <Typography>
                <Typography component="span" fontWeight={600}>
                  {t("task.details.priority")}:
                </Typography>{" "}
                {t(`task.priority.${task.priority}`)}
              </Typography>
              {task.description ? (
                <Typography>
                  <Typography component="span" fontWeight={600}>
                    {t("task.details.description")}:
                  </Typography>{" "}
                  {task.description}
                </Typography>
              ) : null}
              {task.dueAt || task.dueDate ? (
                <Typography>
                  <Typography component="span" fontWeight={600}>
                    {t("task.dueDate.label")}:
                  </Typography>{" "}
                  {new Intl.DateTimeFormat(i18n.language, {
                    dateStyle: "medium",
                    ...(task.dueAt ? { timeStyle: "short" as const } : {}),
                  }).format(
                    task.dueAt
                      ? new Date(task.dueAt)
                      : new Date(`${task.dueDate?.slice(0, 10)}T12:00:00`),
                  )}
                </Typography>
              ) : null}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("activity.taskDetailsUnavailable")}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("common.close")}</Button>
        </DialogActions>
      </>
    </Dialog>
  );
}
