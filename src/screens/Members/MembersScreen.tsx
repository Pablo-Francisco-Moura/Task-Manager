"use client";

import { api } from "@/lib/axios";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useProjectStore } from "@/store/projectStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

type TypeMemberProject = { id: number; name: string };
type TypeWorkspaceMember = {
  userId: string;
  isCurrentUser: boolean;
  displayName: string;
  username: string | null;
  role: "owner" | "member";
  joinedAt: string;
  projects: TypeMemberProject[];
};
type TypeWorkspaceRoster = {
  projects: TypeMemberProject[];
  members: TypeWorkspaceMember[];
};

export function MembersScreen() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const activeWorkspaceId = useProjectStore((state) => state.activeWorkspaceId);
  const workspaceRole = useProjectStore((state) => state.workspaceRole);
  const showFeedback = useFeedbackStore((state) => state.showFeedback);
  const [search, setSearch] = useState("");
  const [memberToEdit, setMemberToEdit] = useState<TypeWorkspaceMember | null>(
    null,
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [memberToRemove, setMemberToRemove] =
    useState<TypeWorkspaceMember | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const canManage = workspaceRole === "owner";
  const queryKey = [QUERY_KEYS.MEMBERS, activeWorkspaceId];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    enabled: activeWorkspaceId !== null,
    queryFn: async () => {
      const response = await api.get<TypeWorkspaceRoster>(
        `/session/workspace/${activeWorkspaceId}/members`,
      );
      return response.data;
    },
  });

  const invalidateMemberData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] }),
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] }),
    ]);
  };

  const saveProjectsMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkspaceId || !memberToEdit) return;
      await api.put(
        `/session/workspace/${activeWorkspaceId}/members/${memberToEdit.userId}/projects`,
        { projectIds: selectedProjectIds },
      );
    },
    onSuccess: async () => {
      await invalidateMemberData();
      setMemberToEdit(null);
      showFeedback(t("members.projectsUpdated"));
    },
    onError: () => setMutationError(t("members.updateError")),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkspaceId || !memberToRemove) return;
      await api.delete(
        `/session/workspace/${activeWorkspaceId}/members/${memberToRemove.userId}`,
      );
    },
    onSuccess: async () => {
      await invalidateMemberData();
      setMemberToRemove(null);
      showFeedback(t("members.memberRemoved"));
    },
    onError: () => setMutationError(t("members.removeError")),
  });

  const normalizedSearch = search.trim().toLowerCase();
  const filteredMembers = (data?.members ?? []).filter((member) =>
    `${member.displayName} ${member.username ?? ""} ${member.projects
      .map((project) => project.name)
      .join(" ")}`
      .toLowerCase()
      .includes(normalizedSearch),
  );

  const openProjectDialog = (member: TypeWorkspaceMember) => {
    setMutationError(null);
    setSelectedProjectIds(member.projects.map((project) => project.id));
    setMemberToEdit(member);
  };

  return (
    <section className="screen-content">
      <div className="screen-heading">
        <div>
          <p className="screen-eyebrow">{t("account.workspaceLabel")}</p>
          <h2 className="screen-title">{t("members.title")}</h2>
        </div>
        {data ? (
          <Typography variant="body2" color="text.secondary">
            {t(
              data.members.length === 1
                ? "members.countSingular"
                : "members.countPlural",
              { count: data.members.length },
            )}
          </Typography>
        ) : null}
      </div>

      <TextField
        size="small"
        label={t("members.search")}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ mb: 2, width: { xs: "100%", sm: 360 } }}
      />

      {isLoading ? (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 3 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">{t("members.loading")}</Typography>
        </Stack>
      ) : isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          }
        >
          {t("members.loadError")}
        </Alert>
      ) : filteredMembers.length ? (
        <Stack
          divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}
        >
          {filteredMembers.map((member) => (
            <Stack
              key={member.userId}
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "flex-start" }}
              sx={{ py: 2 }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <GroupOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {member.displayName}
                  </Typography>
                  {member.isCurrentUser ? (
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={t("members.you")}
                    />
                  ) : null}
                  <Chip
                    size="small"
                    variant="outlined"
                    label={t(`account.role.${member.role}`)}
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 3.5 }}
                >
                  {member.username ? `@${member.username} · ` : ""}
                  {t("members.joined", {
                    date: new Intl.DateTimeFormat(i18n.language, {
                      dateStyle: "medium",
                    }).format(new Date(member.joinedAt)),
                  })}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.75}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ mt: 1, ml: 3.5 }}
                >
                  {member.role === "owner" ? (
                    <Typography variant="caption" color="text.secondary">
                      {t("members.allProjects")}
                    </Typography>
                  ) : member.projects.length ? (
                    member.projects.map((project) => (
                      <Chip
                        key={project.id}
                        size="small"
                        label={project.name}
                      />
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {t("members.noProjects")}
                    </Typography>
                  )}
                </Stack>
              </Box>
              {canManage && member.role === "member" ? (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title={t("members.manageProjects")}>
                    <IconButton
                      aria-label={`${t("members.manageProjects")}: ${member.displayName}`}
                      onClick={() => openProjectDialog(member)}
                    >
                      <EditOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("members.remove")}>
                    <IconButton
                      color="error"
                      aria-label={`${t("members.remove")}: ${member.displayName}`}
                      onClick={() => {
                        setMutationError(null);
                        setMemberToRemove(member);
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ) : null}
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
          {normalizedSearch ? t("members.noMatches") : t("members.empty")}
        </Typography>
      )}

      <Dialog
        open={memberToEdit !== null}
        onClose={() => setMemberToEdit(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {t("members.manageTitle", { name: memberToEdit?.displayName ?? "" })}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t("members.manageDescription")}
          </Typography>
          {mutationError ? (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {mutationError}
            </Alert>
          ) : null}
          <FormGroup>
            {(data?.projects ?? []).map((project) => (
              <FormControlLabel
                key={project.id}
                label={project.name}
                control={
                  <Checkbox
                    checked={selectedProjectIds.includes(project.id)}
                    onChange={(event) => {
                      setSelectedProjectIds((current) =>
                        event.target.checked
                          ? [...current, project.id]
                          : current.filter((id) => id !== project.id),
                      );
                    }}
                  />
                }
              />
            ))}
            {!data?.projects.length ? (
              <Typography variant="body2" color="text.secondary">
                {t("members.noProjects")}
              </Typography>
            ) : null}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberToEdit(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={saveProjectsMutation.isPending}
            onClick={() => saveProjectsMutation.mutate()}
          >
            {saveProjectsMutation.isPending
              ? t("common.saving")
              : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={memberToRemove !== null}
        onClose={() => setMemberToRemove(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("members.removeTitle")}</DialogTitle>
        <DialogContent>
          {mutationError ? (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {mutationError}
            </Alert>
          ) : null}
          <Typography variant="body2">
            {t("members.removeConfirm", {
              name: memberToRemove?.displayName ?? "",
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberToRemove(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={removeMemberMutation.isPending}
            onClick={() => removeMemberMutation.mutate()}
          >
            {removeMemberMutation.isPending
              ? t("common.saving")
              : t("members.remove")}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
