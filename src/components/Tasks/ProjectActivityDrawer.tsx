"use client";

import {
  Box,
  Alert,
  Stack,
  Button,
  Drawer,
  Divider,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { api } from "@/lib/axios";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { ProjectActivityItem } from "./ProjectActivityItem";
import { useActivityFormatters } from "./useActivityFormatters";
import { getWorkspaceMemberColor } from "@/utils/workspaceMemberColors";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { TypeProjectActivity } from "@/types";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

interface IProps {
  open: boolean;
  projectId: number | null;
  onClose: () => void;
}

export function ProjectActivityDrawer({ open, projectId, onClose }: IProps) {
  const { t } = useTranslation();
  const { formatDate, getActivityDetails, getTaskMovementDetails } =
    useActivityFormatters();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [editingActivity, setEditingActivity] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] =
    useState<TypeProjectActivity | null>(null);
  const activityListRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
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
  const latestActivityId = activities.reduce(
    (latestId, activity) => Math.max(latestId, activity.id),
    0,
  );

  useEffect(() => {
    if (
      !open ||
      projectId === null ||
      isLoading ||
      isError ||
      latestActivityId === 0
    ) {
      return;
    }

    let isCurrent = true;
    const markAsRead = async () => {
      try {
        await api.post(`/project/${projectId}/activity/read`, {
          activityId: latestActivityId,
        });
        if (isCurrent) {
          await queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ACTIVITY_UNREAD, projectId],
          });
        }
      } catch {
        if (isCurrent) setError(t("activity.markReadError"));
      }
    };
    void markAsRead();

    return () => {
      isCurrent = false;
    };
  }, [
    isError,
    isLoading,
    latestActivityId,
    open,
    projectId,
    queryClient,
    t,
  ]);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (isLoading) return;

    const list = activityListRef.current;
    if (!list) return;

    const isOpening = !wasOpenRef.current;
    const distanceFromBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight;
    if (isOpening || distanceFromBottom < 80) {
      list.scrollTop = list.scrollHeight;
    }
    wasOpenRef.current = true;
  }, [activities.length, isLoading, open]);

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
    if (!projectId) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`/project/${projectId}/activity/${activityId}`);
      setCommentToDelete(null);
      await refreshActivity();
    } catch {
      setError(t("activity.deleteError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: "min(440px, 100vw)" } },
        transition: {
          onEntered: () => {
            const list = activityListRef.current;
            if (list) list.scrollTop = list.scrollHeight;
          },
        },
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <ConfirmDialog
          open={commentToDelete !== null}
          title={t("activity.confirmDeleteTitle")}
          description={t("activity.confirmDelete")}
          content={
            commentToDelete ? (
              <Box
                sx={{
                  mt: 2,
                  ml: commentToDelete.isOwn ? "auto" : 0,
                  width: "fit-content",
                  maxWidth: "100%",
                  minWidth: 120,
                  px: 1.5,
                  py: 1,
                  borderRadius: commentToDelete.isOwn
                    ? "12px 12px 3px 12px"
                    : "12px 12px 12px 3px",
                  bgcolor: commentToDelete.isOwn
                    ? "primary.light"
                    : "background.paper",
                  border: 1,
                  borderColor: commentToDelete.isOwn
                    ? "transparent"
                    : "divider",
                }}
              >
                <Stack spacing={0.5}>
                  <Stack
                    direction="row"
                    alignItems="baseline"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        color: getWorkspaceMemberColor(
                          commentToDelete.actorColorIndex,
                        ),
                      }}
                    >
                      {commentToDelete.actorName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      whiteSpace="nowrap"
                    >
                      {formatDate(commentToDelete.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                  >
                    {commentToDelete.content}
                  </Typography>
                </Stack>
              </Box>
            ) : null
          }
          isLoading={isSaving}
          onClose={() => setCommentToDelete(null)}
          onConfirm={() => {
            if (commentToDelete) {
              void deleteComment(commentToDelete.id);
            }
          }}
        />
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
          ref={activityListRef}
          sx={{ flex: 1, overflowY: "auto", px: 2, py: 1 }}
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
              <ProjectActivityItem
                key={activity.id}
                activity={activity}
                editingActivity={editingActivity}
                editingContent={editingContent}
                isSaving={isSaving}
                formatDate={formatDate}
                getActivityDetails={getActivityDetails}
                getTaskMovementDetails={getTaskMovementDetails}
                onEditStart={(item) => {
                  setEditingActivity(item.id);
                  setEditingContent(item.content ?? "");
                }}
                onEditContentChange={setEditingContent}
                onEditSave={(id) => void saveEdit(id)}
                onEditCancel={() => setEditingActivity(null)}
                onDelete={(activityId) => {
                  const activityToDelete = activities.find(
                    (activity) => activity.id === activityId,
                  );
                  if (activityToDelete) setCommentToDelete(activityToDelete);
                }}
              />
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
