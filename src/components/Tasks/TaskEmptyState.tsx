import { useTranslation } from "react-i18next";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";

interface IProps {
  hasTasks: boolean;
}

export function TaskEmptyState({ hasTasks }: IProps) {
  const { t } = useTranslation();

  return hasTasks ? (
    <div className="empty-state">
      <h3>{t("task.noMatches")}</h3>
    </div>
  ) : (
    <div className="empty-state task-empty-state">
      <span className="empty-state-mark" aria-hidden="true">
        <ChecklistOutlinedIcon />
      </span>
      <h3>{t("task.empty")}</h3>
    </div>
  );
}
