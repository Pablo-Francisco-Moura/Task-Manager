"use client";

import {
  Box,
  Alert,
  Stack,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { api } from "@/lib/axios";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { MemberCard } from "./MemberCard";
import { SearchField } from "@/components/SearchField";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { WorkspaceInviteDialog } from "@/components/Notifications/WorkspaceInviteDialog";
import { MemberManagementDialogs } from "./MemberManagementDialogs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TypeWorkspaceMember, TypeWorkspaceRoster } from "@/types";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";

export function MembersScreen() {
  const { t } = useTranslation();
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
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
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
        {data ? (
          <Typography
            component="p"
            aria-live="polite"
            sx={{
              m: 0,
              gap: 1,
              color: "text.secondary",
              display: "flex",
              fontSize: "0.85rem",
              alignItems: "center",
            }}
          >
            <Box
              component="span"
              sx={{
                color: "var(--brand-text)",
                height: "1.6rem",
                display: "inline-grid",
                minWidth: "1.6rem",
                placeItems: "center",
                background: "var(--brand-soft)",
                fontWeight: 800,
                borderRadius: "5px",
              }}
            >
              {data.members.length}
            </Box>
            {t(
              data.members.length === 1
                ? "members.count.singular"
                : "members.count.plural",
            )}
          </Typography>
        ) : null}
        {canManage && activeWorkspaceId ? (
          <Button
            variant="contained"
            startIcon={<GroupAddOutlinedIcon />}
            onClick={() => setIsInviteDialogOpen(true)}
          >
            {t("notifications.manageInvites")}
          </Button>
        ) : null}
      </div>

      <WorkspaceInviteDialog
        open={isInviteDialogOpen}
        workspaceId={activeWorkspaceId}
        onClose={() => setIsInviteDialogOpen(false)}
      />

      <SearchField
        label={t("members.search")}
        value={search}
        onChange={setSearch}
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
        <Stack spacing={1.5}>
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.userId}
              member={member}
              canManage={canManage}
              onManageProjects={openProjectDialog}
              onRemove={(selectedMember) => {
                setMutationError(null);
                setMemberToRemove(selectedMember);
              }}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
          {normalizedSearch ? t("members.noMatches") : t("members.empty")}
        </Typography>
      )}

      <MemberManagementDialogs
        projects={data?.projects ?? []}
        memberToEdit={memberToEdit}
        memberToRemove={memberToRemove}
        selectedProjectIds={selectedProjectIds}
        mutationError={mutationError}
        isSavingProjects={saveProjectsMutation.isPending}
        isRemovingMember={removeMemberMutation.isPending}
        onCloseEdit={() => setMemberToEdit(null)}
        onCloseRemove={() => setMemberToRemove(null)}
        onSaveProjects={() => saveProjectsMutation.mutate()}
        onRemoveMember={() => removeMemberMutation.mutate()}
        onSelectedProjectIdsChange={setSelectedProjectIds}
      />
    </section>
  );
}
