"use client";

import {
  Box,
  Alert,
  Badge,
  Stack,
  Button,
  Dialog,
  Popover,
  Divider,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  accountWorkspaceRequest,
  getProjectActivityUnreadCount,
} from "@/lib/accountWorkspaceApi";
import type { TypeWorkspaceInviteFeedItem } from "@/types";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import { UserInfoDialog } from "./UserInfoDialog";
import { useMainStore } from "@/store/mainStore";
import { useProjectStore } from "@/store/projectStore";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useQueries } from "@tanstack/react-query";
import type {
  TypeProjectActivityNotification,
  TypeProjectOption,
} from "@/types";
import { getWorkspaceMemberColor } from "@/utils/workspaceMemberColors";

interface IProps {
  enabled: boolean;
  language: "pt" | "en";
  onInviteAccepted: () => void;
}

export function WorkspaceInviteBell({
  enabled,
  language,
  onInviteAccepted,
}: IProps) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [invites, setInvites] = useState<TypeWorkspaceInviteFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workingInviteId, setWorkingInviteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsInvite, setDetailsInvite] =
    useState<TypeWorkspaceInviteFeedItem | null>(null);
  const [detailsType, setDetailsType] = useState<"person" | "workspace">(
    "person",
  );
  const [activityProjects, setActivityProjects] = useState<TypeProjectOption[]>(
    [],
  );
  const [activityError, setActivityError] = useState<string | null>(null);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<
    TypeProjectActivityNotification[]
  >([]);

  useEffect(() => {
    if (!enabled) {
      setInvites([]);
      setActivityProjects([]);
      setError(null);
      setActivityError(null);
      setRecentActivities([]);
      setIsLoading(false);
      setIsActivityLoading(false);
      return;
    }

    let isCurrent = true;
    const refreshInvites = async () => {
      try {
        const payload = await accountWorkspaceRequest<{
          invites: TypeWorkspaceInviteFeedItem[];
        }>("/api/session/workspace/invites");
        if (isCurrent) {
          setInvites(payload.invites);
          setError(null);
        }
      } catch {
        if (isCurrent) setError(t("notifications.loadError"));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };
    const refreshActivity = async () => {
      setIsActivityLoading(true);
      try {
        const [projects, notifications] = await Promise.all([
          accountWorkspaceRequest<TypeProjectOption[]>("/api/project"),
          accountWorkspaceRequest<TypeProjectActivityNotification[]>(
            "/api/project/activity/notifications",
          ),
        ]);
        if (isCurrent) {
          setActivityProjects(projects);
          setRecentActivities(notifications);
          setActivityError(null);
        }
      } catch {
        if (isCurrent) setActivityError(t("activity.unreadLoadError"));
      } finally {
        if (isCurrent) setIsActivityLoading(false);
      }
    };

    setIsLoading(true);
    void refreshInvites();
    void refreshActivity();
    const refreshNotifications = () => {
      void refreshInvites();
      void refreshActivity();
    };
    const intervalId = window.setInterval(refreshNotifications, 10_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshNotifications();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [enabled, t]);

  const pendingInvites = invites.filter(
    (invite) => invite.status === "pending",
  );
  const unreadProjectQueries = useQueries({
    queries: activityProjects.map((project) => ({
      queryKey: [QUERY_KEYS.ACTIVITY_UNREAD, project.id],
      queryFn: () => getProjectActivityUnreadCount(project.id),
      enabled,
      refetchInterval: 10_000,
      refetchOnWindowFocus: true,
    })),
  });
  const unreadProjects = activityProjects.flatMap((project, index) => {
    const unreadCount = unreadProjectQueries[index]?.data ?? 0;
    return unreadCount > 0 ? [{ ...project, unreadCount }] : [];
  });
  const isUnreadProjectsLoading = unreadProjectQueries.some(
    (query) => query.isLoading,
  );
  const unreadInviteCount = pendingInvites.filter(
    (invite) => !invite.readAt,
  ).length;
  const unreadActivityCount = unreadProjects.reduce(
    (total, project) => total + project.unreadCount,
    0,
  );
  const unreadCount = unreadInviteCount + unreadActivityCount;
  const openDetails = (
    invite: TypeWorkspaceInviteFeedItem,
    type: "person" | "workspace",
  ) => {
    setDetailsInvite(invite);
    setDetailsType(type);
  };
  const closeDetails = () => setDetailsInvite(null);

  if (!enabled) return null;

  const updateInvite = async (
    inviteId: number,
    action: "accept" | "decline" | "read",
  ) => {
    setWorkingInviteId(inviteId);
    setError(null);
    try {
      if (action === "read") {
        const payload = await accountWorkspaceRequest<{ readAt: string }>(
          `/api/session/workspace/invites/${inviteId}/read`,
          { method: "PATCH" },
        );
        setInvites((current) =>
          current.map((invite) =>
            invite.id === inviteId
              ? { ...invite, readAt: payload.readAt }
              : invite,
          ),
        );
      } else {
        await accountWorkspaceRequest(
          `/api/session/workspace/invites/${inviteId}/${action}`,
          { method: "POST" },
        );
        setInvites((current) =>
          current.map((invite) =>
            invite.id === inviteId
              ? {
                  ...invite,
                  status: action === "accept" ? "accepted" : "declined",
                }
              : invite,
          ),
        );
        if (action === "accept") onInviteAccepted();
      }
    } catch {
      setError(t(`notifications.${action}Error`));
    } finally {
      setWorkingInviteId(null);
    }
  };

  return (
    <>
      <IconButton
        aria-label={
          unreadCount
            ? t("notifications.totalUnreadCount", { count: unreadCount })
            : t("notifications.open")
        }
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        color={anchor ? "secondary" : "inherit"}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsNoneOutlinedIcon />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: { sx: { width: "min(360px, calc(100vw - 32px))", mt: 1 } },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="subtitle1" fontWeight={700}>
              {t("notifications.title")}
            </Typography>
            {unreadCount > 0 ? (
              <Typography
                variant="caption"
                color="text.secondary"
                aria-live="polite"
              >
                {t("notifications.totalUnreadCount", { count: unreadCount })}
              </Typography>
            ) : null}
          </Stack>
          {error ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          ) : null}
          {activityError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {activityError}
            </Alert>
          ) : null}
          {recentActivities.length ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography variant="subtitle2">
                {t("notifications.recentActivity")}
              </Typography>
              {recentActivities.map((activity) => (
                <Button
                  key={activity.id}
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    useProjectStore
                      .getState()
                      .requestActivityForProject(activity.projectId);
                    useMainStore.getState().setSelectedTab("task");
                    setAnchor(null);
                  }}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    textAlign: "left",
                    py: 1,
                  }}
                >
                  <Stack spacing={0.25} sx={{ width: "100%", minWidth: 0 }}>
                    <Typography variant="body2" component="span">
                      <Box
                        component="span"
                        sx={{
                          color: getWorkspaceMemberColor(
                            activity.actorColorIndex,
                          ),
                          fontWeight: 700,
                        }}
                      >
                        {activity.actorName}
                      </Box>{" "}
                      {activity.type === "comment"
                        ? t("activity.commentNotification")
                        : t(`activity.${activity.type}Verb`)}{" "}
                      {activity.type !== "comment" &&
                      activity.type !== "comment_deleted" ? (
                        <Box
                          component="span"
                          sx={{ color: "secondary.main", fontWeight: 600 }}
                        >
                          {activity.taskName ??
                            (typeof activity.details?.memberName === "string"
                              ? activity.details.memberName
                              : "")}
                        </Box>
                      ) : null}
                    </Typography>
                    {activity.type === "comment" && !activity.isDeleted ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {activity.content}
                      </Typography>
                    ) : null}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                    >
                      {activity.projectName}
                      {" · "}
                      {new Intl.DateTimeFormat(language, {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(activity.createdAt))}
                    </Typography>
                  </Stack>
                </Button>
              ))}
            </Stack>
          ) : null}
          {(isLoading || isActivityLoading || isUnreadProjectsLoading) &&
          pendingInvites.length === 0 &&
          recentActivities.length === 0 ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ py: 3 }}
            >
              <CircularProgress size={18} />
              <Typography variant="body2">
                {t("notifications.loading")}
              </Typography>
            </Stack>
          ) : (pendingInvites.length === 0 && recentActivities.length === 0) &&
            (activityProjects.length === 0 ||
              (!isActivityLoading && !isUnreadProjectsLoading)) ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
              {t("notifications.empty")}
            </Typography>
          ) : pendingInvites.length ? (
            <Stack spacing={1.5}>
              {pendingInvites.map((invite) => (
                <Box
                  key={invite.id}
                  sx={{
                    p: 1.5,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={invite.readAt ? 500 : 700}
                        component="div"
                      >
                        <Box
                          component="button"
                          type="button"
                          onClick={() => openDetails(invite, "person")}
                          aria-haspopup="dialog"
                          sx={{
                            p: 0,
                            border: 0,
                            background: "none",
                            color: "primary.main",
                            font: "inherit",
                            fontWeight: 700,
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {invite.createdBy.displayName ||
                            invite.createdBy.username}
                        </Box>{" "}
                        {t("notifications.inviteToWorkspace")}{" "}
                        <Box
                          component="button"
                          type="button"
                          onClick={() => openDetails(invite, "workspace")}
                          aria-haspopup="dialog"
                          sx={{
                            p: 0,
                            border: 0,
                            background: "none",
                            color: "secondary.main",
                            font: "inherit",
                            fontWeight: 700,
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {invite.workspace.name}
                        </Box>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("notifications.projects", {
                          count: invite.projectIds.length,
                        })}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {new Intl.DateTimeFormat(language, {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(invite.createdAt))}
                      </Typography>
                    </Box>
                    {!invite.readAt ? (
                      <IconButton
                        size="small"
                        aria-label={t("notifications.markRead")}
                        title={t("notifications.markRead")}
                        disabled={workingInviteId === invite.id}
                        onClick={() => void updateInvite(invite.id, "read")}
                      >
                        <DoneOutlinedIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckOutlinedIcon />}
                      disabled={workingInviteId === invite.id}
                      onClick={() => void updateInvite(invite.id, "accept")}
                    >
                      {t("notifications.accept")}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      startIcon={<CloseOutlinedIcon />}
                      disabled={workingInviteId === invite.id}
                      onClick={() => void updateInvite(invite.id, "decline")}
                    >
                      {t("notifications.decline")}
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : null}
        </Box>
      </Popover>
      <UserInfoDialog
        open={detailsInvite !== null && detailsType === "person"}
        displayName={detailsInvite?.createdBy.displayName ?? ""}
        username={detailsInvite?.createdBy.username ?? null}
        onClose={closeDetails}
      />
      <Dialog
        open={detailsInvite !== null && detailsType === "workspace"}
        onClose={closeDetails}
        fullWidth
        maxWidth="xs"
      >
        {detailsInvite ? (
          <>
            <DialogTitle>
              {t("notifications.workspaceTitle", {
                name: detailsInvite.workspace.name,
              })}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={1}>
                <Typography variant="body2">
                  {t("notifications.workspaceCreated", {
                    date: new Intl.DateTimeFormat(language, {
                      dateStyle: "medium",
                    }).format(new Date(detailsInvite.workspace.createdAt)),
                  })}
                </Typography>
                <Divider />
                <Typography variant="subtitle2">
                  {t("notifications.invitedProjects")}
                </Typography>
                {detailsInvite.projects.length ? (
                  <Stack component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {detailsInvite.projects.map((project) => (
                      <Typography component="li" key={project.id}>
                        {project.name}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    {t("notifications.noInvitedProjects")}
                  </Typography>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDetails}>{t("common.close")}</Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </>
  );
}
