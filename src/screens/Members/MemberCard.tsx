import {
  Box,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TypeWorkspaceMember } from "@/types";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";

interface IProps {
  member: TypeWorkspaceMember;
  canManage: boolean;
  onRemove: (member: TypeWorkspaceMember) => void;
  onManageProjects: (member: TypeWorkspaceMember) => void;
}

export function MemberCard({
  member,
  canManage,
  onRemove,
  onManageProjects,
}: IProps) {
  const { t, i18n } = useTranslation();

  return (
    <Box
      component="article"
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        backgroundColor: "background.paper",
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
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
          <Stack
            sx={{ mt: 0.5 }}
            spacing={0.5}
            direction="row"
            alignItems="center"
          >
            <AlternateEmailIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {member.username ? `@${member.username}` : ""}
              {member.username ? " · " : ""}
              {t("members.joined", {
                date: new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: "medium",
                }).format(new Date(member.joinedAt)),
              })}
            </Typography>
          </Stack>
          <Stack
            sx={{ mt: 1 }}
            spacing={0.75}
            flexWrap="wrap"
            direction="row"
            useFlexGap
            alignItems="center"
          >
            <FolderOpenOutlinedIcon fontSize="small" color="action" />
            {member.role === "owner" ? (
              <Typography variant="caption" color="text.secondary">
                {t("members.allProjects")}
              </Typography>
            ) : member.projects.length ? (
              member.projects.map((project) => (
                <Chip key={project.id} size="small" label={project.name} />
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
                onClick={() => onManageProjects(member)}
              >
                <EditOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("members.remove")}>
              <IconButton
                color="error"
                aria-label={`${t("members.remove")}: ${member.displayName}`}
                onClick={() => onRemove(member)}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
