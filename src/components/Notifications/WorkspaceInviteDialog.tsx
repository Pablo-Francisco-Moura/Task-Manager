"use client";

import { accountWorkspaceRequest } from "@/lib/accountWorkspaceApi";
import {
  Box,
  Stack,
  Alert,
  Button,
  Dialog,
  Divider,
  Checkbox,
  Accordion,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControlLabel,
  AccordionDetails,
  CircularProgress,
  AccordionSummary,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { AccountWorkspaceRequestError } from "@/lib/accountWorkspaceApi";
import type {
  TypeProjectOption,
  TypeSentWorkspaceInvite,
  TypeWorkspaceInviteTarget,
  TypeCreateWorkspaceInviteResponse,
} from "@/types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";

interface IProps {
  open: boolean;
  workspaceId: string | null;
  onClose: () => void;
}

export function WorkspaceInviteDialog({ open, workspaceId, onClose }: IProps) {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState("");
  const [targetUser, setTargetUser] =
    useState<TypeWorkspaceInviteTarget | null>(null);
  const [step, setStep] = useState(0);
  const [projects, setProjects] = useState<TypeProjectOption[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [sentInvites, setSentInvites] = useState<TypeSentWorkspaceInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUpUser, setIsLookingUpUser] = useState(false);
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
      accountWorkspaceRequest<{ invites: TypeSentWorkspaceInvite[] }>(
        `/api/session/workspace/${workspaceId}/invites`,
      ),
    ])
      .then(([projectsResult, invitesResult]) => {
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
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [open, workspaceId, t]);

  useEffect(() => {
    if (!open) return;
    setUsername("");
    setTargetUser(null);
    setStep(0);
    setSelectedProjectIds([]);
    setError(null);
    setSuccess(null);
  }, [open, workspaceId]);

  const reloadInvites = async () => {
    if (!workspaceId) return;
    const payload = await accountWorkspaceRequest<{
      invites: TypeSentWorkspaceInvite[];
    }>(`/api/session/workspace/${workspaceId}/invites`);
    setSentInvites(
      payload.invites.filter((invite) => invite.status === "pending"),
    );
  };

  const findInviteTarget = async () => {
    if (!workspaceId || !username.trim()) return;
    setIsLookingUpUser(true);
    setError(null);
    setSuccess(null);
    try {
      const target = await accountWorkspaceRequest<TypeWorkspaceInviteTarget>(
        `/api/session/workspace/${workspaceId}/invite-target?username=${encodeURIComponent(
          username.trim(),
        )}`,
      );
      setTargetUser(target);
      setStep(1);
    } catch (requestError) {
      setError(
        requestError instanceof AccountWorkspaceRequestError
          ? requestError.status === 404
            ? t("notifications.userNotFound")
            : requestError.status === 409
              ? t("notifications.userCannotInvite")
              : t("notifications.userLookupError")
          : t("notifications.userLookupError"),
      );
    } finally {
      setIsLookingUpUser(false);
    }
  };

  const sendInvite = async () => {
    if (!workspaceId || !targetUser) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response =
        await accountWorkspaceRequest<TypeCreateWorkspaceInviteResponse>(
          `/api/session/workspace/${workspaceId}/invite`,
          {
            method: "POST",
            body: JSON.stringify({
              username: targetUser.username,
              projectIds: selectedProjectIds,
            }),
          },
        );
      setUsername("");
      setTargetUser(null);
      setStep(0);
      setSelectedProjectIds([]);
      await reloadInvites();
      setSuccess(
        response.updatedExisting
          ? t("notifications.inviteUpdated")
          : t("notifications.inviteSuccess"),
      );
    } catch (requestError) {
      setError(
        requestError instanceof AccountWorkspaceRequestError &&
          requestError.code === "ACTIVE_INVITE_EXISTS"
          ? t("notifications.activeInviteExists")
          : requestError instanceof Error
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

  const steps = [t("notifications.stepUser"), t("notifications.stepProjects")];

  return (
    <Dialog
      open={open}
      onClose={() => !isSubmitting && onClose()}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{t("notifications.manageTitle")}</DialogTitle>
      <DialogContent>
        <Box
          role="group"
          aria-label={t("notifications.stepProgress", {
            current: step + 1,
            total: steps.length,
          })}
          sx={{ display: "flex", gap: "4px", mb: 2, mt: 1 }}
        >
          {steps.map((label, index) => (
            <Box
              component="button"
              type="button"
              key={label}
              aria-current={index === step ? "step" : undefined}
              disabled={index > (targetUser ? 1 : step)}
              onClick={() => {
                if (index <= (targetUser ? 1 : step)) {
                  setStep(index);
                  setError(null);
                }
              }}
              sx={{
                position: "relative",
                flex: 1,
                minWidth: 0,
                height: 32,
                p: 0,
                border: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor:
                  index <= step ? "primary.main" : "action.disabledBackground",
                color: index <= step ? "primary.contrastText" : "text.disabled",
                font: "inherit",
                cursor:
                  index <= (targetUser ? 1 : step) ? "pointer" : "default",
                clipPath:
                  index === 0
                    ? "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)"
                    : "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)",
                pl: index === 0 ? 0 : 1,
                pr: 1,
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "text.primary",
                  outlineOffset: -2,
                },
                "&:disabled": {
                  color:
                    index <= step ? "primary.contrastText" : "text.disabled",
                },
              }}
            >
              <Typography variant="caption" fontWeight={600} noWrap>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        {step === 1 && projectsError ? (
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
        {step === 0 ? (
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("notifications.username")}
            helperText={t("notifications.usernameHint")}
            value={username}
            disabled={isLookingUpUser}
            onChange={(event) => {
              setUsername(event.target.value);
              setTargetUser(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void findInviteTarget();
            }}
          />
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t("notifications.invitingUser", {
                name: targetUser?.displayName,
                username: targetUser?.username,
              })}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>
              {t("notifications.chooseProjects")}
            </Typography>
            {targetUser?.hasActiveInvite ? (
              <Alert severity="info" sx={{ mb: 1 }}>
                {t("notifications.activeInviteNoNewProjects")}
              </Alert>
            ) : null}
            {isLoading ? (
              <CircularProgress size={20} />
            ) : projectsError ? null : projects.length ? (
              <Stack>
                {projects.map((project) => (
                  <Box key={project.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            selectedProjectIds.includes(project.id) ||
                            targetUser?.activeInviteProjectIds.includes(
                              project.id,
                            ) === true
                          }
                          disabled={targetUser?.activeInviteProjectIds.includes(
                            project.id,
                          )}
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
                    {targetUser?.activeInviteProjectIds.includes(project.id) ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ ml: 4 }}
                      >
                        {t("notifications.activeProjectInvite")}
                      </Typography>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("notifications.noProjects")}
              </Typography>
            )}
          </>
        )}
        <Divider sx={{ my: 2 }} />
        <Accordion disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              {t("notifications.sent")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
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
                      <Typography variant="body2" component="div">
                        <Box component="span" fontWeight={600}>
                          {t("notifications.projectsLabel")}{" "}
                        </Box>
                        {invite.projects.length
                          ? invite.projects.map(({ name }) => name).join(", ")
                          : t("notifications.noInvitedProjects")}
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {invite.targetUser.displayName}
                        {invite.targetUser.username
                          ? ` (@${invite.targetUser.username})`
                          : ""}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {new Intl.DateTimeFormat(i18n.language, {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(invite.createdAt))}
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
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        {step === 0 ? (
          <Button
            variant="contained"
            onClick={() => void findInviteTarget()}
            disabled={isLookingUpUser || !username.trim()}
          >
            {isLookingUpUser ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("notifications.continue")
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={() => {
                setStep(0);
                setError(null);
              }}
              disabled={isSubmitting}
            >
              {t("notifications.back")}
            </Button>
            <Button
              variant="contained"
              startIcon={<GroupAddOutlinedIcon />}
              onClick={() => void sendInvite()}
              disabled={
                isSubmitting ||
                isLoading ||
                !targetUser ||
                (targetUser.hasActiveInvite && selectedProjectIds.length === 0)
              }
            >
              {isSubmitting ? t("common.saving") : t("notifications.send")}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
