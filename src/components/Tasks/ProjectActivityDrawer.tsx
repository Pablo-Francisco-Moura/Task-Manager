"use client";

import {
  Box,
  Alert,
  Stack,
  Button,
  Drawer,
  Divider,
  Tooltip,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { api } from "@/lib/axios";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

type TypeProjectActivity = {
  id: number;
  actorId: string;
  actorName: string;
  type:
    | "task_created"
    | "task_updated"
    | "task_moved"
    | "task_deleted"
    | "comment";
  taskName: string | null;
  content: string | null;
  isDeleted: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
};

interface IProps {
  open: boolean;
  projectId: number | null;
  onClose: () => void;
}

export function ProjectActivityDrawer({ open, projectId, onClose }: IProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [editingActivity, setEditingActivity] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryKey = [QUERY_KEYS.ACTIVITY, projectId];

  const {
    data: activities = [],
    isLoading,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get<TypeProjectActivity[]>(
        `/project/${projectId}/activity`,
      );
      return response.data;
    },
    enabled: open && projectId !== null,
    refetchInterval: open ? 10_000 : false,
    refetchOnWindowFocus: true,
  });

  const refreshActivity = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  const submitComment = async () => {
    if (!projectId || !comment.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.post(`/project/${projectId}/comments`, {
        content: comment.trim(),
      });
      setComment("");
      await refreshActivity();
    } catch {
      setError(t("activity.loadError"));
    } finally {
      setIsSaving(false);
    }
  };

  const saveEdit = async (activityId: number) => {
    if (!projectId || !editingContent.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.patch(`/project/${projectId}/activity/${activityId}`, {
        content: editingContent.trim(),
      });
      setEditingActivity(null);
      setEditingContent("");
      await refreshActivity();
    } catch {
      setError(t("activity.loadError"));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteComment = async (activityId: number) => {
    if (!projectId || !window.confirm(t("activity.confirmDelete"))) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`/project/${projectId}/activity/${activityId}`);
      await refreshActivity();
    } catch {
      setError(t("activity.loadError"));
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: "min(440px, 100vw)" } } }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5 }}
        >
          <Typography variant="h6" fontSize="1.1rem" fontWeight={700}>
            {t("activity.title")}
          </Typography>
          <IconButton aria-label={t("common.close")} onClick={onClose}>
            <CloseOutlinedIcon />
          </IconButton>
        </Stack>
        <Divider />
        {error || isError ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error ?? t("activity.loadError")}
          </Alert>
        ) : null}
        <Stack
          divider={<Divider flexItem />}
          sx={{ flex: 1, overflowY: "auto", px: 2 }}
        >
          {isLoading ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress size={24} />
            </Stack>
          ) : isError ? (
            <Stack spacing={1} sx={{ py: 2 }}>
              <Typography variant="body2" color="error">
                {t("activity.loadError")}
              </Typography>
              {queryError instanceof Error ? (
                <Typography variant="caption" color="text.secondary">
                  {queryError.message}
                </Typography>
              ) : null}
              <Button
                size="small"
                onClick={() => void refetch()}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("common.retry")}
              </Button>
            </Stack>
          ) : activities.length ? (
            activities.map((activity) => (
              <Box key={activity.id} sx={{ py: 1.5 }}>
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {activity.type === "comment" ? (
                      <>
                        <Typography variant="body2" fontWeight={700}>
                          {activity.actorName}
                        </Typography>
                        {editingActivity === activity.id ? (
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            size="small"
                            value={editingContent}
                            onChange={(event) =>
                              setEditingContent(event.target.value)
                            }
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{ whiteSpace: "pre-wrap" }}
                          >
                            {activity.isDeleted
                              ? t("activity.commentDeleted")
                              : activity.content}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2">
                        {t(`activity.${activity.type}`, {
                          actor: activity.actorName,
                          task: activity.taskName ?? "",
                        })}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(activity.createdAt)}
                    </Typography>
                  </Box>
                  {activity.type === "comment" && !activity.isDeleted ? (
                    <Stack direction="row" spacing={0.25}>
                      {activity.canEdit && editingActivity !== activity.id ? (
                        <Tooltip title={t("activity.edit")}>
                          <IconButton
                            size="small"
                            aria-label={t("activity.edit")}
                            onClick={() => {
                              setEditingActivity(activity.id);
                              setEditingContent(activity.content ?? "");
                            }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      {activity.canDelete ? (
                        <Tooltip title={t("activity.delete")}>
                          <IconButton
                            size="small"
                            aria-label={t("activity.delete")}
                            disabled={isSaving}
                            onClick={() => void deleteComment(activity.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Stack>
                  ) : null}
                  {editingActivity === activity.id ? (
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        disabled={isSaving || !editingContent.trim()}
                        onClick={() => void saveEdit(activity.id)}
                      >
                        {t("activity.save")}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setEditingActivity(null)}
                      >
                        {t("activity.cancel")}
                      </Button>
                    </Stack>
                  ) : null}
                </Stack>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
              {t("activity.empty")}
            </Typography>
          )}
        </Stack>
        <Divider />
        <Stack spacing={1} sx={{ p: 2 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            placeholder={t("activity.commentPlaceholder")}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            inputProps={{ maxLength: 2000 }}
            disabled={isError}
          />
          <Button
            variant="contained"
            onClick={() => void submitComment()}
            disabled={isSaving || isError || !comment.trim()}
            sx={{ alignSelf: "flex-end" }}
          >
            {isSaving ? t("common.saving") : t("activity.send")}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
