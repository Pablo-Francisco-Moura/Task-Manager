"use client";

import { accountWorkspaceRequest } from "@/lib/accountWorkspaceApi";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

type TypeProjectOption = { id: number; name: string };
type TypeSentInvite = {
  id: number;
  status: string;
  projectIds: number[];
  expiresAt: string;
  targetUser: { username: string | null; displayName: string };
};

interface IProps {
  open: boolean;
  workspaceId: string | null;
  onClose: () => void;
}

export function WorkspaceInviteDialog({ open, workspaceId, onClose }: IProps) {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState("");
  const [projects, setProjects] = useState<TypeProjectOption[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [sentInvites, setSentInvites] = useState<TypeSentInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workingInviteId, setWorkingInviteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !workspaceId) return;

    let isCurrent = true;
    setIsLoading(true);
    const getRequestError = (reason: unknown) =>
      reason instanceof Error ? reason.message : t("notifications.loadError");

    void Promise.allSettled([
      accountWorkspaceRequest<TypeProjectOption[]>("/api/project"),
      accountWorkspaceRequest<{ invites: TypeSentInvite[] }>(
        `/api/session/workspace/${workspaceId}/invites`,
      ),
    ]).then(([projectsResult, invitesResult]) => {
      if (!isCurrent) return;

      if (projectsResult.status === "fulfilled") {
        setProjects(projectsResult.value);
        setProjectsError(null);
      } else {
        setProjectsError(getRequestError(projectsResult.reason));
      }

      if (invitesResult.status === "fulfilled") {
        setSentInvites(
          invitesResult.value.invites.filter(
            (invite) => invite.status === "pending",
          ),
        );
        setInvitesError(null);
      } else {
        setInvitesError(getRequestError(invitesResult.reason));
      }
    }).finally(() => {
      if (isCurrent) setIsLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [open, workspaceId, t]);

  const reloadInvites = async () => {
    if (!workspaceId) return;
    const payload = await accountWorkspaceRequest<{
      invites: TypeSentInvite[];
    }>(`/api/session/workspace/${workspaceId}/invites`);
    setSentInvites(
      payload.invites.filter((invite) => invite.status === "pending"),
    );
  };

  const sendInvite = async () => {
    if (!workspaceId || !username.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await accountWorkspaceRequest(
        `/api/session/workspace/${workspaceId}/invite`,
        {
          method: "POST",
          body: JSON.stringify({
            username: username.trim(),
            projectIds: selectedProjectIds,
          }),
        },
      );
      setUsername("");
      setSelectedProjectIds([]);
      await reloadInvites();
      setSuccess(t("notifications.inviteSuccess"));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("notifications.inviteError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const revokeInvite = async (inviteId: number) => {
    setWorkingInviteId(inviteId);
    setError(null);
    try {
      await accountWorkspaceRequest(
        `/api/session/workspace/invites/${inviteId}`,
        {
          method: "DELETE",
        },
      );
      setSentInvites((current) =>
        current.filter((invite) => invite.id !== inviteId),
      );
    } catch {
      setError(t("notifications.revokeError"));
    } finally {
      setWorkingInviteId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !isSubmitting && onClose()}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{t("notifications.manageTitle")}</DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        {projectsError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t("notifications.projectsLoadError", { error: projectsError })}
          </Alert>
        ) : null}
        {invitesError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t("notifications.invitesLoadError", { error: invitesError })}
          </Alert>
        ) : null}
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        ) : null}
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={t("notifications.username")}
          helperText={t("notifications.usernameHint")}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void sendInvite();
          }}
        />
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>
          {t("notifications.chooseProjects")}
        </Typography>
        {isLoading ? (
          <CircularProgress size={20} />
        ) : projectsError ? null : projects.length ? (
          <Stack>
            {projects.map((project) => (
              <FormControlLabel
                key={project.id}
                control={
                  <Checkbox
                    checked={selectedProjectIds.includes(project.id)}
                    onChange={(event) =>
                      setSelectedProjectIds((current) =>
                        event.target.checked
                          ? [...current, project.id]
                          : current.filter((id) => id !== project.id),
                      )
                    }
                  />
                }
                label={project.name}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t("notifications.noProjects")}
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("notifications.sent")}
        </Typography>
        {isLoading ? (
          <CircularProgress size={20} />
        ) : invitesError ? null : sentInvites.length ? (
          <Stack divider={<Divider flexItem />}>
            {sentInvites.map((invite) => (
              <Stack
                key={invite.id}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ py: 1 }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {invite.targetUser.displayName} (@
                    {invite.targetUser.username})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("notifications.projects", {
                      count: invite.projectIds.length,
                    })}
                    {" · "}
                    {t("notifications.expires", {
                      date: new Intl.DateTimeFormat(i18n.language).format(
                        new Date(invite.expiresAt),
                      ),
                    })}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  aria-label={t("notifications.revoke")}
                  title={t("notifications.revoke")}
                  disabled={workingInviteId === invite.id}
                  onClick={() => void revokeInvite(invite.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t("notifications.noSentInvites")}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          startIcon={<GroupAddOutlinedIcon />}
          onClick={() => void sendInvite()}
          disabled={isSubmitting || !username.trim() || isLoading}
        >
          {isSubmitting ? t("common.saving") : t("notifications.send")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
