"use client";

import { accountWorkspaceRequest } from "@/lib/accountWorkspaceApi";
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

type TypeWorkspaceInvite = {
  id: number;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  projectIds: number[];
  readAt: string | null;
  createdAt: string;
  workspace: { name: string };
  createdBy: { displayName: string; username: string | null };
};

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
  const [invites, setInvites] = useState<TypeWorkspaceInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workingInviteId, setWorkingInviteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setInvites([]);
      return;
    }

    let isCurrent = true;
    const refreshInvites = async () => {
      try {
        const payload = await accountWorkspaceRequest<{
          invites: TypeWorkspaceInvite[];
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

    setIsLoading(true);
    void refreshInvites();
    const intervalId = window.setInterval(() => void refreshInvites(), 10_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshInvites();
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
  const unreadCount = pendingInvites.filter((invite) => !invite.readAt).length;

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
            ? t("notifications.unreadCount", { count: unreadCount })
            : t("notifications.open")
        }
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        color="inherit"
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
                {t("notifications.unreadCount", { count: unreadCount })}
              </Typography>
            ) : null}
          </Stack>
          {error ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          ) : null}
          {isLoading && pendingInvites.length === 0 ? (
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
          ) : pendingInvites.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
              {t("notifications.empty")}
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />}>
              {pendingInvites.map((invite) => (
                <Box key={invite.id} sx={{ py: 1.5 }}>
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={invite.readAt ? 500 : 700}
                      >
                        {t("notifications.inviteFrom", {
                          name:
                            invite.createdBy.displayName ||
                            invite.createdBy.username,
                          workspace: invite.workspace.name,
                        })}
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
                        {new Intl.DateTimeFormat(language).format(
                          new Date(invite.createdAt),
                        )}
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
          )}
        </Box>
      </Popover>
    </>
  );
}
