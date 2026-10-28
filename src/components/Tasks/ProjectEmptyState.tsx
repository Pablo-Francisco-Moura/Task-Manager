import { useTranslation } from "react-i18next";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";

interface IProps {
  canManageProjects: boolean;
  onAddProject: () => void;
}

export function ProjectEmptyState({ canManageProjects, onAddProject }: IProps) {
  const { t } = useTranslation();

  return (
    <div className="empty-state">
      <span className="empty-state-mark" aria-hidden="true">
        <FolderOpenOutlinedIcon />
      </span>
      <h3>
        {canManageProjects ? t("project.empty") : t("project.noneAvailable")}
      </h3>
      {canManageProjects ? (
        <button type="button" className="text-action" onClick={onAddProject}>
          {t("project.add")}
        </button>
      ) : null}
    </div>
  );
}
