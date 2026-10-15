import { useTranslation } from "react-i18next";
import { normalizeTaskPriority } from "@/utils/taskPriority";
import type { TaskPriority } from "@prisma/client";
import styles from "./TaskPriorityBadge.module.css";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";

const priorityIcons = {
  low: ArrowDownwardIcon,
  normal: HorizontalRuleIcon,
  high: PriorityHighIcon,
} satisfies Record<TaskPriority, typeof ArrowDownwardIcon>;

interface IProps {
  priority?: TaskPriority | null;
}

export function TaskPriorityBadge({ priority }: IProps) {
  const { t } = useTranslation();
  const normalizedPriority = normalizeTaskPriority(priority);
  const PriorityIcon = priorityIcons[normalizedPriority];

  return (
    <span className={styles.badge} data-priority={normalizedPriority}>
      <PriorityIcon aria-hidden="true" fontSize="inherit" />
      {t(`task.priority.${normalizedPriority}`)}
    </span>
  );
}
